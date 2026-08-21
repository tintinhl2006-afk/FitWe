import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const plans = await prisma.subscriptionPlan.findMany({
      where: { gymId: session.user.id },
      include: { _count: { select: { users: true } } },
      orderBy: { price: "asc" },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      price,
      durationDays,
      description,
      billingType,
      creditsPerCycle,
      creditRechargeMode,
      rechargeIntervalDays,
      creditsNeverExpire,
    } = body;

    if (!name || price === undefined || !durationDays) {
      return NextResponse.json({ message: "Nombre, precio y duración son obligatorios" }, { status: 400 });
    }
    if (Number(price) < 0) {
      return NextResponse.json({ message: "El precio no puede ser negativo" }, { status: 400 });
    }
    if (Number(durationDays) < 1) {
      return NextResponse.json({ message: "La duración debe ser al menos 1 día" }, { status: 400 });
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

    const plan = await prisma.subscriptionPlan.create({
      data: {
        gymId: session.user.id,
        name: name.trim(),
        price: Number(price),
        durationDays: Number(durationDays),
        description: description?.trim() || null,
        billingType: billingType === "CREDITS" ? "CREDITS" : "DURATION",
        ...(billingType === "CREDITS" && {
          creditsPerCycle: Number(creditsPerCycle),
          creditRechargeMode,
          rechargeIntervalDays: creditRechargeMode === "PERIODIC" ? Number(rechargeIntervalDays) : null,
          creditsNeverExpire: creditRechargeMode === "PER_PAYMENT" ? !!creditsNeverExpire : false,
        }),
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Error creating plan:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
