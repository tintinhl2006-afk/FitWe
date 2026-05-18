import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNow } from "@/lib/timeUtils";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    // Obtener datos básicos del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, image: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    // Fechas clave
    const now = await getNow();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Entrenamientos últimos 7 días
    const weeklySessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        endTime: { not: null },
        startTime: { gte: sevenDaysAgo },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    let totalWeeklyMinutes = 0;
    const DAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    const weeklyChartDataMap: Record<string, number> = {};

    // Inicializar los últimos 7 días en 0 con etiquetas consistentes
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayStr = DAYS[d.getDay()];
      weeklyChartDataMap[dayStr] = 0;
    }

    weeklySessions.forEach(s => {
      if (s.endTime && s.startTime) {
        const diffMs = s.endTime.getTime() - s.startTime.getTime();
        const mins = Math.round(diffMs / 60000);
        totalWeeklyMinutes += mins;

        // Usar el mismo sistema de etiquetas que el inicializador
        const dayStr = DAYS[s.startTime.getDay()];
        if (weeklyChartDataMap[dayStr] !== undefined) {
          weeklyChartDataMap[dayStr] += mins;
        }
      }
    });

    // Mantener el orden de los últimos 7 días
    const weeklyChartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayStr = DAYS[d.getDay()];
      weeklyChartData.push({
        day: dayStr,
        minutos: weeklyChartDataMap[dayStr]
      });
    }

    // Entrenamientos del mes actual (para calendario)
    const monthlySessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        endTime: { not: null },
        startTime: { gte: firstDayOfMonth },
      },
      select: {
        startTime: true,
      },
    });
    const monthlyDates = monthlySessions.map(s => s.startTime.toISOString());

    let sessionsWhereClause: any = {
      userId,
      endTime: { not: null },
    };

    if (dateParam) {
      const [year, month, day] = dateParam.split("-").map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
      sessionsWhereClause.startTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    // Todos los entrenamientos (o filtrados por fecha)
    const last5SessionsRaw = await prisma.workoutSession.findMany({
      where: sessionsWhereClause,
      orderBy: { startTime: 'desc' },
      include: {
        routine: { select: { name: true } },
        workoutSets: {
          where: { isCompleted: true },
          select: { 
            weight: true, 
            reps: true,
            isCompleted: true,
            exercise: {
              select: {
                name: true,
                muscleGroup: true,
                equipment: true
              }
            }
          },
          orderBy: { id: 'asc' }
        },
      },
    });

    const recentSessions = last5SessionsRaw.map(s => {
      let durationMinutes = 0;
      if (s.endTime && s.startTime) {
        durationMinutes = Math.round((s.endTime.getTime() - s.startTime.getTime()) / 60000);
      }

      const totalVolume = s.workoutSets.reduce((acc, set) => acc + (set.weight * set.reps), 0);

      return {
        id: s.id,
        name: s.routine?.name || "Entrenamiento Libre",
        date: s.startTime.toISOString(),
        durationMinutes,
        totalVolume,
        sets: s.workoutSets,
      };
    });

    return NextResponse.json({
      user,
      stats: {
        totalWeeklyMinutes,
        weeklySessionsCount: weeklySessions.length,
        weeklyChartData,
      },
      monthlyDates,
      recentSessions,
    });
  } catch (error) {
    console.error("Error fetching profile data:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
