import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/apiAuth";

// PATCH: replace every set of one exercise in a live session with a different exercise
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ sessionId: string; exerciseId: string }> }
) {
  try {
    const userId = await getRequestUserId(req);
    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { sessionId, exerciseId } = await params;
    const body = await req.json();
    const { newExerciseId, notes } = body;

    if (newExerciseId === undefined && notes === undefined) {
      return NextResponse.json({ message: "Nada que actualizar" }, { status: 400 });
    }

    const session = await prisma.workoutSession.findUnique({ where: { id: sessionId, userId } });
    if (!session) {
      return NextResponse.json({ message: "Sesión no encontrada" }, { status: 404 });
    }

    if (newExerciseId !== undefined) {
      const newExercise = await prisma.exercise.findUnique({ where: { id: newExerciseId } });
      if (!newExercise) {
        return NextResponse.json({ message: "Ejercicio no encontrado" }, { status: 404 });
      }
      await prisma.workoutSet.updateMany({
        where: { sessionId, exerciseId },
        data: { exerciseId: newExerciseId },
      });
    }

    if (notes !== undefined) {
      // Notes live on WorkoutSet (no separate "exercise in session" entity), so every
      // set of this exercise carries the same note redundantly; read/write it via any one.
      await prisma.workoutSet.updateMany({
        where: { sessionId, exerciseId: newExerciseId ?? exerciseId },
        data: { notes },
      });
    }

    return NextResponse.json({ message: "Actualizado" });
  } catch (error) {
    console.error("Error replacing exercise in session:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE: remove every set of one exercise from a live session
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ sessionId: string; exerciseId: string }> }
) {
  try {
    const userId = await getRequestUserId(req);
    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { sessionId, exerciseId } = await params;

    const session = await prisma.workoutSession.findUnique({ where: { id: sessionId, userId } });
    if (!session) {
      return NextResponse.json({ message: "Sesión no encontrada" }, { status: 404 });
    }

    await prisma.workoutSet.deleteMany({ where: { sessionId, exerciseId } });

    return NextResponse.json({ message: "Ejercicio eliminado de la sesión" });
  } catch (error) {
    console.error("Error removing exercise from session:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
