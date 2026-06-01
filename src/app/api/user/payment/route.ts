import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
// @ts-ignore
import { Redsys } from "node-redsys-api";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "USER") {
      return NextResponse.json(
        { message: "Solo los clientes pueden realizar pagos" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { planId, gateway } = body;

    // Detectar y resolver el origen de forma segura (forzando localhost en desarrollo)
    const rawOrigin = req.headers.get("origin") || "";
    const isLocal =
      process.env.NODE_ENV === "development" ||
      rawOrigin.includes("localhost") ||
      rawOrigin.includes("127.0.0.1") ||
      rawOrigin.includes("192.168.");
    const origin = isLocal ? "http://localhost:3000" : rawOrigin;

    // Obtener datos del usuario cliente
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { gymId: true },
    });

    if (!user || !user.gymId) {
      return NextResponse.json(
        { message: "No estás vinculado a ningún gimnasio." },
        { status: 400 }
      );
    }

    // Obtener datos del gimnasio al que está vinculado el cliente
    const gym = await prisma.user.findUnique({
      where: { id: user.gymId },
      select: {
        name: true,
        stripeSecretKey: true,
        stripePublishableKey: true,
        stripeAccountId: true,
        stripeConnected: true,
        redsysFuc: true,
        redsysTerminal: true,
        redsysClave: true,
        redsysEnabled: true,
      },
    });

    if (!gym) {
      return NextResponse.json(
        { message: "El gimnasio al que estás vinculado no existe." },
        { status: 400 }
      );
    }

    let amount = 49.99;
    let durationDays = 30;
    let planName = "Cuota mensual";
    let resolvedPlanId: string | null = null;

    // Si no se proporciona un planId, cargar automáticamente la primera tarifa activa del gimnasio
    let selectedPlanId = planId;
    if (!selectedPlanId) {
      const firstActivePlan = await prisma.subscriptionPlan.findFirst({
        where: { gymId: user.gymId, isActive: true },
        orderBy: { price: "asc" },
      });
      if (firstActivePlan) {
        selectedPlanId = firstActivePlan.id;
      }
    }

    // Si se tiene un planId resuelto, cargar sus propiedades
    if (selectedPlanId) {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: selectedPlanId },
      });

      if (!plan || plan.gymId !== user.gymId || !plan.isActive) {
        return NextResponse.json(
          { message: "Plan no válido o no disponible en este centro." },
          { status: 400 }
        );
      }

      amount = plan.price;
      durationDays = plan.durationDays;
      planName = plan.name;
      resolvedPlanId = plan.id;
    } else {
      // Si el gimnasio no tiene tarifas dadas de alta, retornamos error aclaratorio
      return NextResponse.json(
        { message: "Este centro deportivo no dispone de ninguna tarifa activa para contratar." },
        { status: 400 }
      );
    }

    // ─── PASARELA SELECCIONADA: REDSYS (TPV Virtual) ───
    if (gateway === "redsys") {
      const isRedsysReal = 
        !!gym.redsysEnabled && 
        !!gym.redsysFuc && 
        !!gym.redsysClave && 
        gym.redsysClave.trim().toLowerCase() !== "mock";

      if (isRedsysReal) {
        try {
          const order = `${Date.now().toString().slice(-10)}${Math.floor(10 + Math.random() * 90)}`;
          
          const redsysParams = {
            Ds_Merchant_Amount: Math.round(amount * 100).toString(),
            Ds_Merchant_Order: order,
            Ds_Merchant_MerchantCode: gym.redsysFuc!.trim(),
            Ds_Merchant_Currency: "978",
            Ds_Merchant_Terminal: gym.redsysTerminal?.trim() || "001",
            Ds_Merchant_TransactionType: "0",
            Ds_Merchant_MerchantURL: `${origin}/api/user/payment/redsys-webhook`,
            Ds_Merchant_UrlOK: `${origin}/dashboard/pago/success?mock_redsys=true&planId=${resolvedPlanId || ""}&order=${order}&amount=${amount}`,
            Ds_Merchant_UrlKO: `${origin}/dashboard/pago`,
            Ds_Merchant_MerchantData: JSON.stringify({
              userId: session.user.id,
              planId: resolvedPlanId || "",
              gymId: user.gymId,
            }),
          };

          // @ts-ignore
          const redsys = new Redsys();
          const merchantParameters = redsys.createMerchantParameters(redsysParams);
          const signature = redsys.createMerchantSignature(gym.redsysClave!.trim(), redsysParams);

          const redsysUrl = "https://sis-t.redsys.es:25443/sis/realizarPago";

          return NextResponse.json({
            isRedsysForm: true,
            url: redsysUrl,
            params: {
              Ds_SignatureVersion: "HMAC_SHA256_V1",
              Ds_MerchantParameters: merchantParameters,
              Ds_Signature: signature,
            },
          });
        } catch (redsysError: any) {
          console.error("Error al generar firma Redsys:", redsysError);
          return NextResponse.json(
            { message: `Error del TPV Virtual: ${redsysError.message || "Fallo criptográfico al firmar parámetros."}` },
            { status: 400 }
          );
        }
      } else {
        const mockRedsysUrl = `/dashboard/pago/redsys-mock?amount=${amount}${resolvedPlanId ? `&planId=${resolvedPlanId}` : ""}`;
        return NextResponse.json({ url: mockRedsysUrl });
      }
    }

    // ─── PASARELA SELECCIONADA: STRIPE ───
    
    // A. Stripe Connect
    if (gym.stripeConnected && gym.stripeAccountId) {
      const platformSecretKey = process.env.STRIPE_SECRET_KEY;

      if (platformSecretKey) {
        try {
          const stripe = new Stripe(platformSecretKey, {
            apiVersion: "2023-10-16" as any,
          });

          const stripeSession = await stripe.checkout.sessions.create(
            {
              payment_method_types: ["card"],
              line_items: [
                {
                  price_data: {
                    currency: "eur",
                    product_data: {
                      name: planName,
                      description: `Suscripción para el centro ${gym.name}`,
                    },
                    unit_amount: Math.round(amount * 100),
                  },
                  quantity: 1,
                },
              ],
              mode: "payment",
              success_url: `${origin}/dashboard/pago/success?session_id={CHECKOUT_SESSION_ID}&stripe_connect=true${resolvedPlanId ? `&planId=${resolvedPlanId}` : ""}`,
              cancel_url: `${origin}/dashboard/pago`,
              metadata: {
                userId: session.user.id,
                gymId: user.gymId,
                planId: resolvedPlanId || "",
                amount: amount.toString(),
                durationDays: durationDays.toString(),
                planName: planName,
                stripeConnect: "true",
              },
            },
            {
              stripeAccount: gym.stripeAccountId,
            }
          );

          return NextResponse.json({ url: stripeSession.url }, { status: 200 });
        } catch (stripeError: any) {
          console.error("Error al crear sesión en Stripe Connect:", stripeError);
          return NextResponse.json(
            { message: `Error de pasarela de pago: ${stripeError.message || "No se pudo conectar con Stripe Connect."}` },
            { status: 400 }
          );
        }
      } else {
        const mockStripeUrl = `/dashboard/pago/stripe-mock?amount=${amount}&planName=${encodeURIComponent(planName)}${resolvedPlanId ? `&planId=${resolvedPlanId}` : ""}`;
        return NextResponse.json({ url: mockStripeUrl }, { status: 200 });
      }
    }

    // B. Claves Manuales
    const stripeSecretKey = gym.stripeSecretKey?.trim();
    if (stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey, {
          apiVersion: "2023-10-16" as any,
        });

        const stripeSession = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "eur",
                product_data: {
                  name: planName,
                  description: `Suscripción para el centro ${gym.name}`,
                },
                unit_amount: Math.round(amount * 100),
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${origin}/dashboard/pago/success?session_id={CHECKOUT_SESSION_ID}${resolvedPlanId ? `&planId=${resolvedPlanId}` : ""}`,
          cancel_url: `${origin}/dashboard/pago`,
          metadata: {
            userId: session.user.id,
            gymId: user.gymId,
            planId: resolvedPlanId || "",
            amount: amount.toString(),
            durationDays: durationDays.toString(),
            planName: planName,
          },
        });

        return NextResponse.json({ url: stripeSession.url }, { status: 200 });
      } catch (stripeError: any) {
        console.error("Error al crear la sesión de Stripe manual:", stripeError);
        return NextResponse.json(
          { message: `Error de pasarela de pago: ${stripeError.message || "No se pudo conectar con Stripe."}` },
          { status: 400 }
        );
      }
    }

    // C. Fallback simulado
    const mockStripeUrl = `/dashboard/pago/stripe-mock?amount=${amount}&planName=${encodeURIComponent(planName)}${resolvedPlanId ? `&planId=${resolvedPlanId}` : ""}`;
    return NextResponse.json({ url: mockStripeUrl }, { status: 200 });
  } catch (error) {
    console.error("Error processing payment POST:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al iniciar el pago" },
      { status: 500 }
    );
  }
}
