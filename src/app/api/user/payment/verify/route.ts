import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { logger } from "@/lib/logger";
import { getRequestUserId } from "@/lib/apiAuth";
import { getActiveGymPaymentMethod } from "@/lib/invoiceUtils";
import { isRedsysTestMerchant } from "@/lib/redsys";

export async function GET(req: Request) {
  try {
    const requestUserId = await getRequestUserId(req);

    if (!requestUserId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");
    const mock = searchParams.get("mock") === "true" || searchParams.get("mock_redsys") === "true";
    const queryPlanId = searchParams.get("planId");
    const isStripeConnect = searchParams.get("stripe_connect") === "true";
    const queryMethodId = searchParams.get("methodId");

    // Obtener datos del cliente actual con su estado de suscripción
    const user = await prisma.user.findUnique({
      where: { id: requestUserId },
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
      select: { name: true },
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
    // (nunca para pagos simulados: la página stripe-mock también genera un session_id falso
    // para poder reutilizar este mismo flujo de verificación, por eso se comprueba `mock` aquí)
    if (sessionId && !mock) {
      let stripe: Stripe;
      let stripeSession: Stripe.Checkout.Session;

      const platformSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!platformSecretKey) {
        return NextResponse.json(
          { message: "Claves de plataforma no configuradas en el servidor para verificar pagos Connect." },
          { status: 400 }
        );
      }
      if (!queryMethodId) {
        return NextResponse.json(
          { message: "Falta el identificador del método de pago utilizado." },
          { status: 400 }
        );
      }

      const gymPaymentMethod = await prisma.gymPaymentMethod.findUnique({ where: { id: queryMethodId } });
      if (!gymPaymentMethod || gymPaymentMethod.gymId !== user.gymId || gymPaymentMethod.gateway !== "STRIPE" || !gymPaymentMethod.stripeAccountId) {
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
          stripeAccount: gymPaymentMethod.stripeAccountId,
        }
      );

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
            const retrieveOptions = isStripeConnect ? { stripeAccount: gymPaymentMethod.stripeAccountId! } : undefined;
            const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId, undefined, retrieveOptions);
            if (paymentMethod.card) {
              cardLast4 = paymentMethod.card.last4;
              cardBrand = paymentMethod.card.brand;
            }
          } catch (e: any) {
            logger.warn(`No se pudieron cargar detalles específicos del método de pago: ${e.message || e}`);
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
      const payment = await prisma.$transaction(async (tx) => {
        let invoiceNumber = null;
        if (user.gymId) {
          const { generateNextInvoiceNumber } = await import("@/lib/invoiceUtils");
          invoiceNumber = await generateNextInvoiceNumber(tx, user.gymId);
        }

        const pRecord = await tx.paymentRecord.create({
          data: {
            userId: user.id,
            amount: finalAmount,
            description: `${finalPlanName} - Stripe Connect (Ref: ${sessionId})`,
            planId: resolvedPlanId,
            date: new Date(),
            invoiceNumber,
            paymentMethodId: gymPaymentMethod.id,
          },
        });

        await tx.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: "ACTIVE",
            subscriptionEndDate: newEndDate,
            ...(resolvedPlanId && { planId: resolvedPlanId }),
          },
        });

        return pRecord;
      });

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
          invoiceNumber: payment.invoiceNumber,
        },
      });
    }

    // ─── CASO 2: VERIFICACIÓN SIMULADA (MOCK) ───
    if (mock) {
      // Restringir verificación simulada en producción con pasarelas de pago configuradas.
      // Estas condiciones deben reflejar exactamente las que usa POST /api/user/payment para
      // decidir si generar una sesión real o caer al checkout simulado — si no coinciden, un
      // gimnasio con un método "activo" pero sin STRIPE_SECRET_KEY en el servidor (o con clave
      // Redsys de prueba) queda atrapado: la creación cae a mock, pero la verificación lo rechaza.
      const activeMethod = await prisma.gymPaymentMethod.findFirst({
        where: { gymId: user.gymId, isActive: true },
      });
      const hasRealStripe =
        activeMethod?.gateway === "STRIPE" &&
        !!activeMethod.stripeConnected &&
        !!activeMethod.stripeAccountId &&
        !!process.env.STRIPE_SECRET_KEY;
      const hasRealRedsys = !!(
        activeMethod?.gateway === "REDSYS" &&
        activeMethod.redsysFuc?.trim() &&
        activeMethod.redsysClave?.trim() &&
        activeMethod.redsysClave.trim().toLowerCase() !== "mock" &&
        !isRedsysTestMerchant(activeMethod.redsysFuc)
      );
      const hasRealCredentials = hasRealStripe || hasRealRedsys;

      if (process.env.NODE_ENV === "production" && hasRealCredentials) {
        logger.warn(`Intento de pago simulado bloqueado en producción para el usuario ${user.id} (gimnasio: ${gym.name})`);
        return NextResponse.json(
          { message: "Los pagos simulados están deshabilitados en producción con pasarela de pago activa." },
          { status: 400 }
        );
      }

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
          logger.info(`[Verify] Pago simulado duplicado detectado para Ref: ${mockOrderId}. Evitando doble extensión.`);
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
      const payment = await prisma.$transaction(async (tx) => {
        let invoiceNumber = null;
        if (user.gymId) {
          const { generateNextInvoiceNumber } = await import("@/lib/invoiceUtils");
          invoiceNumber = await generateNextInvoiceNumber(tx, user.gymId);
        }

        const pRecord = await tx.paymentRecord.create({
          data: {
            userId: user.id,
            amount: finalAmount,
            description: `${finalPlanName} - Pago Simulado en Cuenta Conectada${mockOrderId ? ` (Ref: ${mockOrderId})` : ""}`,
            planId: resolvedPlanId,
            date: new Date(),
            invoiceNumber,
            paymentMethodId: activeMethod?.id,
          },
        });

        await tx.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: "ACTIVE",
            subscriptionEndDate: newEndDate,
            ...(resolvedPlanId && { planId: resolvedPlanId }),
          },
        });

        return pRecord;
      });

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
          invoiceNumber: payment.invoiceNumber,
        },
      });
    }

    return NextResponse.json(
      { message: "Parámetros de verificación inválidos o ausentes." },
      { status: 400 }
    );
  } catch (error: any) {
    logger.error(`Error in verification GET route: ${error.message || error}`);
    return NextResponse.json(
      { error: "Error interno del servidor al verificar el pago" },
      { status: 500 }
    );
  }
}
