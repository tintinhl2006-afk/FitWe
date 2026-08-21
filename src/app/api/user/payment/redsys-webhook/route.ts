import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCallbackSignature } from "@/lib/redsys";
import { computePlanGrant } from "@/lib/planUtils";

export async function POST(req: Request) {
  try {
    console.log("📥 Recibiendo notificación asíncrona de TPV Redsys...");
    
    // Redsys envía los datos codificados en formato application/x-www-form-urlencoded
    const bodyText = await req.text();
    const params = new URLSearchParams(bodyText);
    
    const merchantParametersB64 = params.get("Ds_MerchantParameters") || "";
    const signatureReceived = params.get("Ds_Signature") || "";

    if (!merchantParametersB64 || !signatureReceived) {
      console.error("❌ Parámetros Ds_MerchantParameters o Ds_Signature ausentes.");
      return new Response("Missing parameters", { status: 400 });
    }

    // Decodificar los parámetros para extraer el pedido y la metadata del comercio
    const decodedParametersJSON = Buffer.from(merchantParametersB64, "base64").toString("utf8");
    const decodedParams = JSON.parse(decodedParametersJSON);

    const amountCents = decodedParams.Ds_Amount;
    const order = decodedParams.Ds_Order;
    const responseCode = parseInt(decodedParams.Ds_Response, 10);
    const merchantDataStr = decodedParams.Ds_MerchantData;

    console.log(`📦 Procesando pedido TPV Redsys: ${order}. Código de respuesta banco: ${responseCode}`);

    if (!merchantDataStr) {
      console.error("❌ Parámetro Ds_MerchantData ausente. No se puede vincular el pago al socio.");
      return new Response("Missing merchant data", { status: 400 });
    }

    // Extraer datos de vinculación
    const { userId, planId, gymId, paymentMethodId } = JSON.parse(decodeURIComponent(merchantDataStr));

    if (!userId || !gymId || !paymentMethodId) {
      console.error("❌ Datos de socio, gimnasio o método de pago inválidos en merchant data.");
      return new Response("Invalid merchant data", { status: 400 });
    }

    // Buscar el método de pago Redsys que se usó para iniciar este cobro
    const gymPaymentMethod = await prisma.gymPaymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    if (!gymPaymentMethod || gymPaymentMethod.gymId !== gymId || gymPaymentMethod.gateway !== "REDSYS" || !gymPaymentMethod.redsysClave) {
      console.error("❌ Método de pago Redsys no encontrado o sin clave configurada.");
      return new Response("Gym payment credentials not found", { status: 400 });
    }

    const gym = await prisma.user.findUnique({ where: { id: gymId }, select: { name: true } });
    if (!gym) {
      console.error("❌ Gimnasio no encontrado.");
      return new Response("Gym not found", { status: 400 });
    }

    // VERIFICACIÓN CRIPTOGRÁFICA DE LA FIRMA
    const isSignatureValid = verifyCallbackSignature({
      merchantParametersB64,
      signatureReceived,
      order,
      redsysClave: gymPaymentMethod.redsysClave.trim(),
    });

    if (!isSignatureValid) {
      console.error("❌ VALIDACIÓN FALLIDA: La firma digital recibida no coincide.");
      return new Response("Invalid signature", { status: 400 });
    }

    console.log("✅ FIRMA CRIPTOGRÁFICA VÁLIDA. Redsys autenticado con éxito.");

    // COMPROBACIÓN DE RESPUESTA DE LA ENTIDAD BANCARIA
    // Los códigos entre 0000 y 0099 indican transacción autorizada con éxito
    const isAuthorized = responseCode >= 0 && responseCode <= 99;

    if (!isAuthorized) {
      console.log(`⚠️ Transacción rechazada por el banco (Código de error: ${responseCode}).`);
      return new Response("Transaction declined by issuer bank", { status: 200 }); // Retornar 200 a Redsys para confirmar recepción
    }

    // Evitar procesamiento duplicado
    const existingPayment = await prisma.paymentRecord.findFirst({
      where: {
        userId: userId,
        description: {
          contains: order,
        },
      },
    });

    if (existingPayment) {
      console.log("⚠️ Transacción ya procesada anteriormente. Evitando doble recarga.");
      return new Response("Payment already processed", { status: 200 });
    }

    // Cargar datos de la suscripción del cliente
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionEndDate: true, subscriptionStatus: true, creditsRemaining: true },
    });

    if (!user) {
      console.error("❌ Socio no encontrado en la base de datos.");
      return new Response("User not found", { status: 404 });
    }

    // Resolver plan de suscripción
    let finalAmount = parseFloat(amountCents) / 100;
    let finalPlanName = "Cuota mensual";
    let finalDurationDays = 30;
    let finalVatRate = 21;
    let resolvedPlanId: string | null = null;
    let resolvedPlan: Awaited<ReturnType<typeof prisma.subscriptionPlan.findUnique>> = null;

    if (planId) {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });
      if (plan) {
        finalAmount = plan.price;
        finalPlanName = plan.name;
        finalDurationDays = plan.durationDays;
        finalVatRate = plan.vatRate;
        resolvedPlanId = plan.id;
        resolvedPlan = plan;
      }
    }

    // Calcular la concesión (fecha o créditos, según el tipo de tarifa)
    const grant = computePlanGrant(
      resolvedPlan ?? { billingType: "DURATION", durationDays: finalDurationDays },
      user
    );

    // Guardar transacción y activar en caliente la suscripción en Neon Postgres
    await prisma.$transaction(async (tx) => {
      let invoiceNumber = null;
      if (gymId) {
        const { generateNextInvoiceNumber } = await import("@/lib/invoiceUtils");
        invoiceNumber = await generateNextInvoiceNumber(tx, gymId);
      }

      await tx.paymentRecord.create({
        data: {
          userId: userId,
          amount: finalAmount,
          description: `${finalPlanName} - TPV Virtual Redsys (Pedido: ${order})`,
          planId: resolvedPlanId,
          vatRate: finalVatRate,
          source: "ONLINE",
          date: new Date(),
          invoiceNumber,
          paymentMethodId: gymPaymentMethod.id,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: "ACTIVE",
          ...grant,
          ...(resolvedPlanId && { planId: resolvedPlanId }),
        },
      });
    });

    console.log(`🎉 Membresía del socio en ${gym.name} renovada con éxito vía Redsys.`);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ Error grave en webhook de Redsys:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
