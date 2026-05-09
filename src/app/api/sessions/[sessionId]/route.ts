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
        routine: true,
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
    
    // Crear mapa de historiales
    const exerciseHistoryMap: Record<string, { weight: number, reps: number }[]> = {};

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
      })
    );

    return NextResponse.json({
      ...workoutSession,
      exerciseHistoryMap
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
