import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientId: string; sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "GYM") {
      return NextResponse.json({ message: "Acceso prohibido" }, { status: 403 });
    }

    const { clientId, sessionId } = await params;
    const gymId = session.user.id;

    // IDOR barrier 1: verify client belongs to this gym
    const client = await prisma.user.findFirst({
      where: { id: clientId, gymId, role: "USER" },
      select: { id: true, name: true, distanceUnit: true },
    });

    if (!client) {
      return NextResponse.json({ message: "Cliente no encontrado" }, { status: 404 });
    }

    // IDOR barrier 2: verify session belongs to this client
    const workoutSession = await prisma.workoutSession.findFirst({
      where: {
        id: sessionId,
        userId: clientId,
      },
      include: {
        routine: { select: { name: true } },
        workoutSets: {
          orderBy: { id: "asc" },
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                muscleGroup: true,
                equipment: true,
              },
            },
          },
        },
      },
    });

    if (!workoutSession) {
      return NextResponse.json({ message: "Sesión no encontrada" }, { status: 404 });
    }

    // Calculate duration
    let durationMinutes = 0;
    if (workoutSession.endTime && workoutSession.startTime) {
      durationMinutes = Math.round(
        (workoutSession.endTime.getTime() - workoutSession.startTime.getTime()) / 60000
      );
    }

    // Group sets by exercise
    const exerciseMap = new Map<
      string,
      {
        exerciseId: string;
        exerciseName: string;
        muscleGroup: string;
        equipment: string | null;
        sets: { setNumber: number; weight: number; reps: number; isCompleted: boolean }[];
      }
    >();

    let totalVolume = 0;

    workoutSession.workoutSets.forEach((ws) => {
      const key = ws.exercise.id;
      if (!exerciseMap.has(key)) {
        exerciseMap.set(key, {
          exerciseId: ws.exercise.id,
          exerciseName: ws.exercise.name,
          muscleGroup: ws.exercise.muscleGroup,
          equipment: ws.exercise.equipment,
          sets: [],
        });
      }
      const entry = exerciseMap.get(key)!;
      entry.sets.push({
        setNumber: entry.sets.length + 1,
        weight: ws.weight,
        reps: ws.reps,
        isCompleted: ws.isCompleted,
      });

      if (ws.isCompleted && ws.exercise.muscleGroup.toLowerCase() !== 'cardio') {
        totalVolume += ws.weight * ws.reps;
      }
    });

    return NextResponse.json({
      id: workoutSession.id,
      clientName: client.name,
      distanceUnit: client.distanceUnit,
      routineName: workoutSession.routine?.name || "Entrenamiento Libre",
      startTime: workoutSession.startTime.toISOString(),
      endTime: workoutSession.endTime?.toISOString() || null,
      durationMinutes,
      totalVolume: Math.round(totalVolume),
      exercises: Array.from(exerciseMap.values()),
    });
  } catch (error) {
    console.error("Error fetching session detail:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
