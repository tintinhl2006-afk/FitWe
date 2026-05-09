import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "GYM") {
      return NextResponse.json({ message: "Acceso prohibido" }, { status: 403 });
    }

    const gymId = session.user.id;

    // ── KPI 1: Total clients ──
    const totalClients = await prisma.user.count({
      where: { gymId, role: "USER" },
    });

    // ── KPI 2: Active clients (at least 1 completed session in last 7 days) ──
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const activeClientsResult = await prisma.workoutSession.findMany({
      where: {
        endTime: { not: null },
        startTime: { gte: sevenDaysAgo },
        user: { gymId, role: "USER" },
      },
      select: { userId: true },
      distinct: ["userId"],
    });
    const activeClients = activeClientsResult.length;

    // ── KPI 3: Workouts this month ──
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const monthlyWorkouts = await prisma.workoutSession.count({
      where: {
        endTime: { not: null },
        startTime: { gte: firstDayOfMonth },
        user: { gymId, role: "USER" },
      },
    });

    // ── Weekly activity chart (last 7 days, sessions per day) ──
    const DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
    const weeklyData: { day: string; date: string; sessions: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

      const count = await prisma.workoutSession.count({
        where: {
          endTime: { not: null },
          startTime: { gte: dayStart, lt: dayEnd },
          user: { gymId, role: "USER" },
        },
      });

      weeklyData.push({
        day: DAYS[d.getDay()],
        date: `${d.getDate()}/${d.getMonth() + 1}`,
        sessions: count,
      });
    }

    // ── Latest 5 completed sessions across all clients ──
    const latestSessions = await prisma.workoutSession.findMany({
      where: {
        endTime: { not: null },
        user: { gymId, role: "USER" },
      },
      orderBy: { endTime: "desc" },
      take: 5,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        user: { select: { id: true, name: true, image: true } },
        routine: { select: { name: true } },
      },
    });

    const recentActivity = latestSessions.map((s) => ({
      id: s.id,
      clientId: s.user.id,
      clientName: s.user.name,
      clientImage: s.user.image,
      routineName: s.routine?.name || "Entrenamiento Libre",
      endTime: s.endTime!.toISOString(),
      durationMinutes: Math.round(
        (s.endTime!.getTime() - s.startTime.getTime()) / 60000
      ),
    }));

    return NextResponse.json({
      totalClients,
      activeClients,
      monthlyWorkouts,
      weeklyData,
      recentActivity,
    });
  } catch (error) {
    console.error("Error fetching gym dashboard:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
