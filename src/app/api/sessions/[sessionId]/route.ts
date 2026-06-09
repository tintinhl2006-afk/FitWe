import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { sessionId } = await params;

    const workoutSession = await prisma.workoutSession.findUnique({
      where: { id: sessionId, userId: session.user.id },
      include: {
        workoutSets: {
          include: {
            exercise: true,
          },
          orderBy: { id: "asc" }, // Mantiene el orden de creacion
        },
        routine: {
          include: {
            exercises: true,
          },
        },
      },
    });

    if (!workoutSession) {
      return NextResponse.json(
        { message: "Sesión no encontrada" },
        { status: 404 }
      );
    }

    // Obtener los exerciseIds únicos de esta sesión
    const uniqueExerciseIds = [...new Set(workoutSession.workoutSets.map(s => s.exerciseId))];
    
    // Crear mapa de historiales y records históricos
    const exerciseHistoryMap: Record<string, { weight: number, reps: number }[]> = {};
    const exerciseAllTimeRecordsMap: Record<string, { maxWeight: number, max1RM: number, maxVolume: number }> = {};

    await Promise.all(
      uniqueExerciseIds.map(async (exerciseId) => {
        // Buscar la última sesión válida para este ejercicio
        const lastSessionSet = await prisma.workoutSet.findFirst({
          where: {
            exerciseId,
            isCompleted: true,
            sessionId: { not: sessionId }, // Excluir la actual
            session: { userId: session.user.id }
          },
          orderBy: { session: { startTime: 'desc' } },
          select: { sessionId: true }
        });

        if (lastSessionSet) {
          // Obtener los sets de esa última sesión
          const historicalSets = await prisma.workoutSet.findMany({
            where: {
              sessionId: lastSessionSet.sessionId,
              exerciseId,
              isCompleted: true,
            },
            orderBy: { id: 'asc' },
            select: { weight: true, reps: true }
          });
          exerciseHistoryMap[exerciseId] = historicalSets;
        } else {
          exerciseHistoryMap[exerciseId] = [];
        }

        // Obtener todos los sets completados históricos de este ejercicio para calcular récords personales
        const allCompletedSets = await prisma.workoutSet.findMany({
          where: {
            exerciseId,
            isCompleted: true,
            sessionId: { not: sessionId },
            session: { userId: session.user.id }
          },
          select: { weight: true, reps: true }
        });

        let maxWeight = 0;
        let max1RM = 0;
        let maxVolume = 0;

        allCompletedSets.forEach(set => {
          if (set.weight > maxWeight) maxWeight = set.weight;
          
          const volume = set.weight * set.reps;
          if (volume > maxVolume) maxVolume = volume;

          const oneRepMax = set.reps === 0 ? 0 : (set.reps === 1 ? set.weight : set.weight * (1 + set.reps / 30));
          if (oneRepMax > max1RM) max1RM = oneRepMax;
        });

        exerciseAllTimeRecordsMap[exerciseId] = { maxWeight, max1RM: Math.round(max1RM * 10) / 10, maxVolume };
      })
    );

    return NextResponse.json({
      ...workoutSession,
      exerciseHistoryMap,
      exerciseAllTimeRecordsMap
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { sessionId } = await params;
    const body = await req.json();
    const { endTime } = body;

    const workoutSession = await prisma.workoutSession.findUnique({
      where: { id: sessionId, userId: session.user.id },
    });

    if (!workoutSession) {
      return NextResponse.json(
        { message: "Sesión no encontrada" },
        { status: 404 }
      );
    }

    const updatedSession = await prisma.workoutSession.update({
      where: { id: sessionId },
      data: { endTime: new Date(endTime) },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("Error ending session:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
