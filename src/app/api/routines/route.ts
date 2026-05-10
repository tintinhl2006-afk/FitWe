import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNow } from "@/lib/timeUtils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const routines = await prisma.routine.findMany({
      where: { userId: session.user.id },
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // Subscription check
    const now = await getNow();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
        userId: session.user.id,
      },
    });

    return NextResponse.json(routine, { status: 201 });
  } catch (error) {
    console.error("Error creating routine:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
