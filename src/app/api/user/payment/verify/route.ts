import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");
    const mock = searchParams.get("mock") === "true" || searchParams.get("mock_redsys") === "true";
    const queryPlanId = searchParams.get("planId");
    const isStripeConnect = searchParams.get("stripe_connect") === "true";

    // Obtener datos del cliente actual con su estado de suscripción
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        gymId: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
      },
    });

    if (!user || !user.gymId) {
      return NextResponse.json(
        { message: "Usuario no vinculado a ningún gimnasio" },
        { status: 400 }
      );
    }

    // Obtener los datos del gimnasio
    const gym = await prisma.user.findUnique({
      where: { id: user.gymId },
      select: {
        name: true,
        stripeSecretKey: true,
        stripeAccountId: true,
        stripeConnected: true,
      },
    });

    if (!gym) {
      return NextResponse.json(
        { message: "Gimnasio no encontrado" },
        { status: 400 }
      );
    }

    let finalAmount = 49.99;
    let finalPlanName = "Cuota mensual";
    let finalDurationDays = 30;
    let resolvedPlanId: string | null = null;
    let cardLast4 = "9999";
    let cardBrand = "Visa / Connect";

    // ─── CASO 1: VERIFICACIÓN STRIPE REAL ───
    if (sessionId) {
      let stripe: Stripe;
      let stripeSession: Stripe.Checkout.Session;

      // A. Verificación vía Stripe Connect
      if (isStripeConnect) {
        const platformSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!platformSecretKey) {
          return NextResponse.json(
            { message: "Claves de plataforma no configuradas en el servidor para verificar pagos Connect." },
            { status: 400 }
          );
        }
        if (!gym.stripeAccountId) {
          return NextResponse.json(
            { message: "El gimnasio no dispone de una cuenta de Stripe Connect asociada." },
            { status: 400 }
          );
        }

        stripe = new Stripe(platformSecretKey, {
          apiVersion: "2023-10-16" as any,
        });

        // Recuperar la sesión especificando el header stripeAccount (Direct Charges)
        stripeSession = await stripe.checkout.sessions.retrieve(
          sessionId,
          {
            expand: ["payment_intent"],
          },
          {
            stripeAccount: gym.stripeAccountId,
          }
        );
      }
      // B. Verificación vía Claves Manuales
      else {
        const stripeSecretKey = gym.stripeSecretKey?.trim();
        if (!stripeSecretKey) {
          return NextResponse.json(
            { message: "El gimnasio no tiene Stripe configurado de forma manual." },
            { status: 400 }
          );
        }

        stripe = new Stripe(stripeSecretKey, {
          apiVersion: "2023-10-16" as any,
        });

        stripeSession = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ["payment_intent"],
        });
      }

      if (!stripeSession) {
        return NextResponse.json(
          { message: "No se encontró la sesión de pago en Stripe." },
          { status: 400 }
        );
      }

      if (stripeSession.payment_status !== "paid") {
        return NextResponse.json(
          { message: "La sesión de pago no está marcada como completada." },
          { status: 400 }
        );
      }

      // Evitar procesamiento duplicado
      const existingPayment = await prisma.paymentRecord.findFirst({
        where: {
          userId: user.id,
          description: {
            contains: sessionId,
          },
        },
      });

      if (existingPayment) {
        // El pago ya se procesó, retornamos los detalles directamente
        const resolvedPlan = existingPayment.planId
          ? await prisma.subscriptionPlan.findUnique({ where: { id: existingPayment.planId } })
          : null;

        return NextResponse.json({
          message: "Pago ya verificado anteriormente.",
          payment: {
            id: existingPayment.id,
            amount: existingPayment.amount,
            date: existingPayment.date.toISOString(),
            planName: resolvedPlan?.name || "Cuota mensual",
            cardLast4: "••••",
            cardBrand: "Tarjeta",
            gymName: gym.name,
            endDate: user.subscriptionEndDate?.toISOString(),
          },
        });
      }

      // Extraer datos desde la sesión de Stripe
      finalAmount = stripeSession.amount_total ? stripeSession.amount_total / 100 : finalAmount;
      finalPlanName = stripeSession.metadata?.planName || finalPlanName;
      finalDurationDays = stripeSession.metadata?.durationDays
        ? parseInt(stripeSession.metadata.durationDays, 10)
        : finalDurationDays;
      resolvedPlanId = stripeSession.metadata?.planId || null;

      // Intentar obtener detalles de la tarjeta usada
      const paymentIntent = stripeSession.payment_intent as Stripe.PaymentIntent | null;
      if (paymentIntent && typeof paymentIntent === "object") {
        const paymentMethodId = paymentIntent.payment_method;
        if (typeof paymentMethodId === "string") {
          try {
            const retrieveOptions = isStripeConnect ? { stripeAccount: gym.stripeAccountId! } : undefined;
            const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId, undefined, retrieveOptions);
            if (paymentMethod.card) {
              cardLast4 = paymentMethod.card.last4;
              cardBrand = paymentMethod.card.brand;
            }
          } catch (e) {
            console.warn("No se pudieron cargar detalles específicos del método de pago:", e);
          }
        }
      }

      // Calcular nueva fecha de fin de suscripción extendiéndola elegantemente
      const now = new Date();
      let baseDate = new Date();
      if (
        user.subscriptionEndDate &&
        user.subscriptionEndDate > now &&
        user.subscriptionStatus === "ACTIVE"
      ) {
        baseDate = new Date(user.subscriptionEndDate);
      }
      const newEndDate = new Date(baseDate);
      newEndDate.setDate(newEndDate.getDate() + finalDurationDays);

      // Guardar registro de pago y activar la suscripción en una transacción atómica
      const [payment] = await prisma.$transaction([
        prisma.paymentRecord.create({
          data: {
            userId: user.id,
            amount: finalAmount,
            description: `${finalPlanName} - Stripe ${isStripeConnect ? "Connect" : "Manual"} (Ref: ${sessionId})`,
            planId: resolvedPlanId,
            date: new Date(),
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: "ACTIVE",
            subscriptionEndDate: newEndDate,
            ...(resolvedPlanId && { planId: resolvedPlanId }),
          },
        }),
      ]);

      return NextResponse.json({
        message: "Pago de Stripe verificado y aplicado con éxito.",
        payment: {
          id: payment.id,
          amount: payment.amount,
          date: payment.date.toISOString(),
          planName: finalPlanName,
          cardLast4,
          cardBrand,
          gymName: gym.name,
          endDate: newEndDate.toISOString(),
        },
      });
    }

    // ─── CASO 2: VERIFICACIÓN SIMULADA (MOCK) ───
    if (mock) {
      const mockOrderId = searchParams.get("order") || searchParams.get("session_id");

      if (mockOrderId) {
        // Evitar procesamiento duplicado para pagos simulados
        const existingPayment = await prisma.paymentRecord.findFirst({
          where: {
            userId: user.id,
            description: {
              contains: mockOrderId,
            },
          },
        });

        if (existingPayment) {
          console.log(`[Verify] Pago simulado duplicado detectado para Ref: ${mockOrderId}. Evitando doble extensión.`);
          const resolvedPlan = existingPayment.planId
            ? await prisma.subscriptionPlan.findUnique({ where: { id: existingPayment.planId } })
            : null;

          return NextResponse.json({
            message: "Pago simulado ya verificado anteriormente.",
            payment: {
              id: existingPayment.id,
              amount: existingPayment.amount,
              date: existingPayment.date.toISOString(),
              planName: resolvedPlan?.name || "Cuota mensual",
              cardLast4: "4242",
              cardBrand: "Visa / Test Connect",
              gymName: gym.name,
              endDate: user.subscriptionEndDate?.toISOString(),
            },
          });
        }
      }

      if (queryPlanId) {
        const plan = await prisma.subscriptionPlan.findUnique({
          where: { id: queryPlanId },
        });

        if (plan && plan.gymId === user.gymId && plan.isActive) {
          finalAmount = plan.price;
          finalPlanName = plan.name;
          finalDurationDays = plan.durationDays;
          resolvedPlanId = plan.id;
        }
      }

      // Calcular nueva fecha de fin de suscripción
      const now = new Date();
      let baseDate = new Date();
      if (
        user.subscriptionEndDate &&
        user.subscriptionEndDate > now &&
        user.subscriptionStatus === "ACTIVE"
      ) {
        baseDate = new Date(user.subscriptionEndDate);
      }
      const newEndDate = new Date(baseDate);
      newEndDate.setDate(newEndDate.getDate() + finalDurationDays);

      // Guardar transacción mock con identificador único
      const [payment] = await prisma.$transaction([
        prisma.paymentRecord.create({
          data: {
            userId: user.id,
            amount: finalAmount,
            description: `${finalPlanName} - Pago Simulado en Cuenta Conectada${mockOrderId ? ` (Ref: ${mockOrderId})` : ""}`,
            planId: resolvedPlanId,
            date: new Date(),
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: "ACTIVE",
            subscriptionEndDate: newEndDate,
            ...(resolvedPlanId && { planId: resolvedPlanId }),
          },
        }),
      ]);

      return NextResponse.json({
        message: "Pago simulado procesado y verificado con éxito.",
        payment: {
          id: payment.id,
          amount: payment.amount,
          date: payment.date.toISOString(),
          planName: finalPlanName,
          cardLast4: "4242",
          cardBrand: "Visa / Test Connect",
          gymName: gym.name,
          endDate: newEndDate.toISOString(),
        },
      });
    }

    return NextResponse.json(
      { message: "Parámetros de verificación inválidos o ausentes." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in verification GET route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al verificar el pago" },
      { status: 500 }
    );
  }
}
