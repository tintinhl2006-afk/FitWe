import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNow } from "@/lib/timeUtils";
import { getRequestUserId } from "@/lib/apiAuth";

export async function GET(req: Request) {
  try {
    const userId = await getRequestUserId(req);

    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const routines = await prisma.routine.findMany({
      where: { userId },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(routines);
  } catch (error) {
    console.error("Error fetching routines:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getRequestUserId(req);

    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // Subscription check
    const now = await getNow();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionStatus: true, subscriptionEndDate: true }
    });

    const isExpired = user?.subscriptionEndDate && user.subscriptionEndDate < now;
    if (user?.subscriptionStatus === "INACTIVE" || isExpired) {
      return NextResponse.json({ 
        message: "Suscripción inactiva. No puedes realizar esta acción." 
      }, { status: 403 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { message: "El nombre de la rutina es obligatorio" },
        { status: 400 }
      );
    }

    const routine = await prisma.routine.create({
      data: {
        name,
        userId,
      },
    });

    return NextResponse.json(routine, { status: 201 });
  } catch (error) {
    console.error("Error creating routine:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
