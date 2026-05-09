import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "GYM") {
      return NextResponse.json({ message: "Acceso prohibido" }, { status: 403 });
    }

    const { clientId } = await params;
    const gymId = session.user.id;

    // IDOR prevention: only fetch if client belongs to THIS gym
    const client = await prisma.user.findFirst({
      where: {
        id: clientId,
        gymId: gymId,
        role: "USER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        weight: true,
        height: true,
        // Last 5 completed workout sessions
        workoutSessions: {
          where: { endTime: { not: null } },
          orderBy: { startTime: "desc" },
          take: 5,
          select: {
            id: true,
            startTime: true,
            endTime: true,
            routine: {
              select: { name: true },
            },
          },
        },
        // Current routines
        routines: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            createdAt: true,
            _count: {
              select: { exercises: true },
            },
          },
        },
        // Aggregate stats
        _count: {
          select: {
            workoutSessions: {
              where: { endTime: { not: null } },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { message: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Transform for the frontend
    const recentSessions = client.workoutSessions.map((s) => {
      let durationMinutes = 0;
      if (s.endTime && s.startTime) {
        durationMinutes = Math.round(
          (s.endTime.getTime() - s.startTime.getTime()) / 60000
        );
      }
      return {
        id: s.id,
        routineName: s.routine?.name || "Entrenamiento Libre",
        date: s.startTime.toISOString(),
        durationMinutes,
      };
    });

    const routines = client.routines.map((r) => ({
      id: r.id,
      name: r.name,
      createdAt: r.createdAt.toISOString(),
      exerciseCount: r._count.exercises,
    }));

    return NextResponse.json({
      id: client.id,
      name: client.name,
      email: client.email,
      image: client.image,
      weight: client.weight,
      height: client.height,
      createdAt: client.createdAt.toISOString(),
      totalWorkouts: client._count.workoutSessions,
      recentSessions,
      routines,
    });
  } catch (error) {
    console.error("Error fetching client detail:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
