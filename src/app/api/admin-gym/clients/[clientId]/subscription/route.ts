import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNow } from "@/lib/timeUtils";
import { computePlanGrant } from "@/lib/planUtils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { clientId } = await params;
    const payments = await prisma.paymentRecord.findMany({
      where: { userId: clientId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { clientId } = await params;
    const body = await req.json();
    const { action, planId } = body;

    const client = await prisma.user.findFirst({
      where: { id: clientId, gymId: session.user.id },
    });

    if (!client) {
      return NextResponse.json({ message: "Cliente no encontrado" }, { status: 404 });
    }

    // Desactivar acceso: solo cambia el estado, no genera ningún cargo.
    if (action === "deactivate") {
      const updatedUser = await prisma.user.update({
        where: { id: clientId },
        data: { subscriptionStatus: "INACTIVE", sessionVersion: { increment: 1 } },
      });
      return NextResponse.json(updatedUser);
    }

    // Asignar tarifa (pago en efectivo/manual): el admin elige explícitamente una de las
    // tarifas ya dadas de alta por el gimnasio, se aplica exactamente igual que si el
    // cliente la hubiera pagado online (misma lógica de fecha/créditos vía computePlanGrant),
    // y se genera la factura correspondiente.
    if (!planId) {
      return NextResponse.json({ message: "Selecciona una tarifa para asignar" }, { status: 400 });
    }

    const plan = await prisma.subscriptionPlan.findFirst({
      where: { id: planId, gymId: session.user.id },
    });

    if (!plan) {
      return NextResponse.json({ message: "Tarifa no encontrada" }, { status: 404 });
    }

    const now = await getNow();
    const grant = computePlanGrant(plan, {
      subscriptionEndDate: client.subscriptionEndDate,
      subscriptionStatus: client.subscriptionStatus,
      creditsRemaining: client.creditsRemaining,
    });

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: clientId },
        data: {
          subscriptionStatus: "ACTIVE",
          planId: plan.id,
          ...grant,
          sessionVersion: { increment: 1 },
        },
      });

      const { generateNextInvoiceNumber, getActiveGymPaymentMethod } = await import("@/lib/invoiceUtils");
      const activeMethod = await getActiveGymPaymentMethod(tx, session.user.id);
      const invoiceNumber = await generateNextInvoiceNumber(tx, session.user.id, activeMethod);

      await tx.paymentRecord.create({
        data: {
          userId: clientId,
          amount: plan.price,
          description: `${plan.name} - Pago en Efectivo`,
          vatRate: plan.vatRate,
          source: "CASH",
          planId: plan.id,
          date: now,
          invoiceNumber,
          paymentMethodId: activeMethod?.id,
        },
      });

      return user;
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
