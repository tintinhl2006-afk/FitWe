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
    const { name, price, durationDays, description } = body;

    if (!name || price === undefined || !durationDays) {
      return NextResponse.json({ message: "Nombre, precio y duración son obligatorios" }, { status: 400 });
    }
    if (Number(price) < 0) {
      return NextResponse.json({ message: "El precio no puede ser negativo" }, { status: 400 });
    }
    if (Number(durationDays) < 1) {
      return NextResponse.json({ message: "La duración debe ser al menos 1 día" }, { status: 400 });
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        gymId: session.user.id,
        name: name.trim(),
        price: Number(price),
        durationDays: Number(durationDays),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Error creating plan:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
