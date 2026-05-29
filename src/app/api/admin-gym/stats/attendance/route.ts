import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNow } from "@/lib/timeUtils";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const gymId = session.user.id;
    const now = await getNow();

    // Today boundaries
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 1. Total access logs today
    const totalToday = await prisma.accessLog.count({
      where: {
        gymId,
        createdAt: { gte: startOfToday, lte: endOfToday },
        status: "GRANTED"
      }
    });

    // 2. Denied logs count
    const deniedLogs = await prisma.accessLog.groupBy({
      by: ["reason"],
      where: {
        gymId,
        status: "DENIED"
      },
      _count: { _all: true }
    });

    // 3. Peak hours heatmap (last 30 days)
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs30Days = await prisma.accessLog.findMany({
      where: {
        gymId,
        status: "GRANTED",
        createdAt: { gte: thirtyDaysAgo }
      },
      select: { createdAt: true }
    });

    // Group logs by hour (7:00 to 22:00)
    const hourlyDistribution: Record<number, number> = {};
    for (let h = 7; h <= 22; h++) {
      hourlyDistribution[h] = 0;
    }

    logs30Days.forEach(log => {
      const hour = new Date(log.createdAt).getHours();
      if (hour >= 7 && hour <= 22) {
        hourlyDistribution[hour]++;
      }
    });

    const hourlyData = Object.entries(hourlyDistribution).map(([hour, count]) => ({
      hour: `${String(hour).padStart(2, '0')}:00`,
      visits: count
    }));

    // 4. Weekly history (last 7 days, daily counts)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyLogs = await prisma.accessLog.findMany({
      where: {
        gymId,
        status: "GRANTED",
        createdAt: { gte: sevenDaysAgo }
      },
      select: { createdAt: true }
    });

    const dailyDistribution: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "");
      dailyDistribution[dateStr] = 0;
    }

    weeklyLogs.forEach(log => {
      const dateStr = new Date(log.createdAt).toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "");
      if (dailyDistribution[dateStr] !== undefined) {
        dailyDistribution[dateStr]++;
      }
    });

    const weeklyData = Object.entries(dailyDistribution).map(([day, visits]) => ({
      day: day.charAt(0).toUpperCase() + day.slice(1),
      visits
    }));

    return NextResponse.json({
      totalToday,
      deniedCounts: deniedLogs.map(dl => ({
        reason: dl.reason || "OTHER",
        count: dl._count._all
      })),
      hourlyData,
      weeklyData
    });
  } catch (error) {
    console.error("Error fetching gym attendance stats:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}
