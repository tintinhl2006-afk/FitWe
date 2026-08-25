import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/apiAuth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const userId = await getRequestUserId(req);

    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { sessionId } = await params;
    const body = await req.json();
    const { exerciseId, weight, reps } = body;

    if (!exerciseId) {
      return NextResponse.json(
        { message: "El ID del ejercicio es obligatorio" },
        { status: 400 }
      );
    }

    const session = await prisma.workoutSession.findUnique({
      where: { id: sessionId, userId },
    });

    if (!session) {
      return NextResponse.json(
        { message: "Sesión no encontrada" },
        { status: 404 }
      );
    }

    const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
    if (!exercise) {
      return NextResponse.json(
        { message: "Ejercicio no encontrado" },
        { status: 404 }
      );
    }

    const workoutSet = await prisma.workoutSet.create({
      data: {
        sessionId,
        exerciseId,
        weight: Math.max(0, Number(weight) || 0),
        reps: Math.max(0, Math.round(Number(reps)) || 0),
        isCompleted: false,
      },
      include: { exercise: true },
    });

    return NextResponse.json(workoutSet, { status: 201 });
  } catch (error) {
    console.error("Error adding set to session:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
