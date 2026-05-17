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

    const now = await getNow();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Start of week (Monday)
    const weekStart = new Date(now);
    const dayOfWeek = weekStart.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);

    const userId = session.user.id;

    // Parallel queries for performance
    const [
      routinesCount,
      lastSession,
      weekSessions,
      recentSessions,
      totalSessions,
    ] = await Promise.all([
      // 1. Total routines
      prisma.routine.count({
        where: { userId },
      }),

      // 2. Last workout session
      prisma.workoutSession.findFirst({
        where: { userId },
        orderBy: { startTime: "desc" },
      }),

      // 3. Sessions this week (for chart + weekly stats)
      prisma.workoutSession.findMany({
        where: {
          userId,
          startTime: { gte: weekStart },
          endTime: { not: null },
        },
        include: {
          workoutSets: {
            where: { isCompleted: true },
            select: { weight: true, reps: true },
          },
        },
        orderBy: { startTime: "asc" },
      }),

      // 4. Recent 5 sessions for feed
      prisma.workoutSession.findMany({
        where: { userId, endTime: { not: null } },
        orderBy: { startTime: "desc" },
        take: 5,
        include: {
          routine: { select: { name: true } },
          workoutSets: {
            where: { isCompleted: true },
            select: { weight: true, reps: true },
          },
        },
      }),

      // 5. Total all-time sessions
      prisma.workoutSession.count({
        where: { userId, endTime: { not: null } },
      }),
    ]);

    // Calculate weekly volume
    const weeklyVolume = weekSessions.reduce((total, s) => {
      return total + s.workoutSets.reduce((vol, set) => vol + set.weight * set.reps, 0);
    }, 0);

    // Calculate weekly duration
    const weeklyMinutes = weekSessions.reduce((total, s) => {
      if (!s.endTime) return total;
      return total + Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000);
    }, 0);

    // Build weekly chart data (Mon-Sun)
    const dayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const weeklyChart = dayLabels.map((label, i) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + i);
      const dayStr = dayDate.toISOString().split("T")[0];

      const daySessions = weekSessions.filter((s) => {
        return new Date(s.startTime).toISOString().split("T")[0] === dayStr;
      });

      const minutes = daySessions.reduce((sum, s) => {
        if (!s.endTime) return sum;
        return sum + Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000);
      }, 0);

      return { day: label, minutos: minutes, count: daySessions.length };
    });

    // Calculate streak (consecutive days with workouts going backwards from today)
    let streak = 0;
    const checkDate = new Date(now);
    checkDate.setHours(0, 0, 0, 0);
    
    // Check up to 60 days back
    for (let i = 0; i < 60; i++) {
      const dayStr = checkDate.toISOString().split("T")[0];
      const hadWorkout = weekSessions.some(
        (s) => new Date(s.startTime).toISOString().split("T")[0] === dayStr
      ) || (await prisma.workoutSession.count({
        where: {
          userId,
          endTime: { not: null },
          startTime: {
            gte: new Date(dayStr + "T00:00:00Z"),
            lt: new Date(dayStr + "T23:59:59Z"),
          },
        },
      })) > 0;

      if (hadWorkout) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        // Today might not have a workout yet, skip and check yesterday
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      } else {
        break;
      }
    }

    // Format recent sessions
    const formattedRecent = recentSessions.map((s) => {
      const durationMinutes = s.endTime
        ? Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000)
        : 0;
      const volume = s.workoutSets.reduce((v, set) => v + set.weight * set.reps, 0);

      return {
        id: s.id,
        routineName: s.routine?.name || "Entrenamiento",
        date: s.startTime,
        durationMinutes,
        volume,
        setsCount: s.workoutSets.length,
      };
    });

    return NextResponse.json({
      routinesCount,
      lastWorkoutDate: lastSession ? lastSession.startTime : null,
      weeklySessionsCount: weekSessions.length,
      weeklyVolume: Math.round(weeklyVolume),
      weeklyMinutes,
      weeklyChart,
      streak,
      totalSessions,
      recentSessions: formattedRecent,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
