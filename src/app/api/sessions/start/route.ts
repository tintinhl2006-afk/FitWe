import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { routineId } = body;

    if (!routineId) {
      return NextResponse.json(
        { message: "El ID de la rutina es obligatorio" },
        { status: 400 }
      );
    }

    // Obtener la rutina con sus ejercicios
    const routine = await prisma.routine.findUnique({
      where: { id: routineId, userId: session.user.id },
      include: { exercises: true },
    });

    if (!routine) {
      return NextResponse.json(
        { message: "Rutina no encontrada o no autorizada" },
        { status: 404 }
      );
    }

    // Crear la sesión de entrenamiento
    const workoutSession = await prisma.workoutSession.create({
      data: {
        userId: session.user.id,
        routineId: routine.id,
        // startTime se asigna por defecto a now()
      },
    });

    // Crear los sets iniciales basados en la rutina
    const workoutSetsData = [];
    for (const re of routine.exercises) {
      // @ts-ignore
      const repsListStr = re.repsList as string | null;
      const repsArray = repsListStr
        ? repsListStr.split(",").map((val) => parseInt(val.trim(), 10))
        : [];

      for (let i = 0; i < re.sets; i++) {
        const targetReps =
          repsArray[i] !== undefined && !isNaN(repsArray[i])
            ? repsArray[i]
            : re.reps;

        workoutSetsData.push({
          sessionId: workoutSession.id,
          exerciseId: re.exerciseId,
          weight: re.weight, // peso objetivo
          reps: targetReps, // reps objetivo por serie
          isCompleted: false,
        });
      }
    }

    if (workoutSetsData.length > 0) {
      await prisma.workoutSet.createMany({
        data: workoutSetsData,
      });
    }

    return NextResponse.json(workoutSession, { status: 201 });
  } catch (error) {
    console.error("Error starting workout session:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al iniciar la sesión" },
      { status: 500 }
    );
  }
}
