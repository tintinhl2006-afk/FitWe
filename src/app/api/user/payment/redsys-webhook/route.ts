import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCallbackSignature } from "@/lib/redsys";

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
    const { userId, planId, gymId } = JSON.parse(decodeURIComponent(merchantDataStr));

    if (!userId || !gymId) {
      console.error("❌ Datos de socio o gimnasio inválidos en merchant data.");
      return new Response("Invalid merchant data", { status: 400 });
    }

    // Buscar la clave secreta de Redsys del gimnasio en la base de datos
    const gym = await prisma.user.findUnique({
      where: { id: gymId },
      select: { redsysClave: true, name: true },
    });

    if (!gym || !gym.redsysClave) {
      console.error("❌ Gimnasio no encontrado o sin clave Redsys configurada.");
      return new Response("Gym payment credentials not found", { status: 400 });
    }

    // VERIFICACIÓN CRIPTOGRÁFICA DE LA FIRMA
    const isSignatureValid = verifyCallbackSignature({
      merchantParametersB64,
      signatureReceived,
      order,
      redsysClave: gym.redsysClave.trim(),
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
      select: { subscriptionEndDate: true, subscriptionStatus: true },
    });

    if (!user) {
      console.error("❌ Socio no encontrado en la base de datos.");
      return new Response("User not found", { status: 404 });
    }

    // Resolver plan de suscripción
    let finalAmount = parseFloat(amountCents) / 100;
    let finalPlanName = "Cuota mensual";
    let finalDurationDays = 30;
    let resolvedPlanId: string | null = null;

    if (planId) {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });
      if (plan) {
        finalAmount = plan.price;
        finalPlanName = plan.name;
        finalDurationDays = plan.durationDays;
        resolvedPlanId = plan.id;
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

    // Guardar transacción y activar en caliente la suscripción en Neon Postgres
    await prisma.$transaction([
      prisma.paymentRecord.create({
        data: {
          userId: userId,
          amount: finalAmount,
          description: `${finalPlanName} - TPV Virtual Redsys (Pedido: ${order})`,
          planId: resolvedPlanId,
          date: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: "ACTIVE",
          subscriptionEndDate: newEndDate,
          ...(resolvedPlanId && { planId: resolvedPlanId }),
        },
      }),
    ]);

    console.log(`🎉 Membresía del socio en ${gym.name} renovada con éxito vía Redsys.`);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ Error grave en webhook de Redsys:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
