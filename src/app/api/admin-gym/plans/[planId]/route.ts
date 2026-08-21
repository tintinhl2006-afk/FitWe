import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { planId } = await params;

    // Verify plan belongs to this gym
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      include: { _count: { select: { users: true } } },
    });

    if (!plan || plan.gymId !== session.user.id) {
      return NextResponse.json({ message: "Plan no encontrado" }, { status: 404 });
    }

    // If users are on this plan, deactivate instead of delete
    if (plan._count.users > 0) {
      await prisma.subscriptionPlan.update({
        where: { id: planId },
        data: { isActive: false },
      });
      return NextResponse.json({ message: "Plan desactivado (tiene clientes asociados)" });
    }

    await prisma.subscriptionPlan.delete({ where: { id: planId } });
    return NextResponse.json({ message: "Plan eliminado" });
  } catch (error) {
    console.error("Error deleting plan:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { planId } = await params;
    const body = await req.json();
    const {
      name,
      price,
      durationDays,
      description,
      isActive,
      vatRate,
      billingType,
      creditsPerCycle,
      creditRechargeMode,
      rechargeIntervalDays,
      creditsNeverExpire,
    } = body;

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan || plan.gymId !== session.user.id) {
      return NextResponse.json({ message: "Plan no encontrado" }, { status: 404 });
    }

    if (price !== undefined && Number(price) < 0) {
      return NextResponse.json({ message: "El precio no puede ser negativo" }, { status: 400 });
    }
    if (durationDays !== undefined && Number(durationDays) < 1) {
      return NextResponse.json({ message: "La duración debe ser al menos 1 día" }, { status: 400 });
    }
    if (vatRate !== undefined && (Number(vatRate) < 0 || Number(vatRate) > 100)) {
      return NextResponse.json({ message: "El IVA debe estar entre 0 y 100" }, { status: 400 });
    }
    if (billingType === "CREDITS") {
      if (!creditsPerCycle || Number(creditsPerCycle) < 1) {
        return NextResponse.json({ message: "El número de créditos debe ser al menos 1" }, { status: 400 });
      }
      if (creditRechargeMode !== "PER_PAYMENT" && creditRechargeMode !== "PERIODIC") {
        return NextResponse.json({ message: "Selecciona el modo de recarga de créditos" }, { status: 400 });
      }
      if (creditRechargeMode === "PERIODIC" && (!rechargeIntervalDays || Number(rechargeIntervalDays) < 1)) {
        return NextResponse.json({ message: "El intervalo de recarga debe ser al menos 1 día" }, { status: 400 });
      }
    }

    const updated = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(price !== undefined && { price: Number(price) }),
        ...(durationDays !== undefined && { durationDays: Number(durationDays) }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(vatRate !== undefined && { vatRate: Number(vatRate) }),
        ...(billingType !== undefined && {
          billingType: billingType === "CREDITS" ? "CREDITS" : "DURATION",
          creditsPerCycle: billingType === "CREDITS" ? Number(creditsPerCycle) : null,
          creditRechargeMode: billingType === "CREDITS" ? creditRechargeMode : null,
          rechargeIntervalDays: billingType === "CREDITS" && creditRechargeMode === "PERIODIC" ? Number(rechargeIntervalDays) : null,
          creditsNeverExpire: billingType === "CREDITS" && creditRechargeMode === "PER_PAYMENT" ? !!creditsNeverExpire : false,
        }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
