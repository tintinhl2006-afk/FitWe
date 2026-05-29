import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNow } from "@/lib/timeUtils";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = await getNow();

    // 1. Total visits
    const totalVisits = await prisma.accessLog.count({
      where: {
        userId,
        status: "GRANTED"
      }
    });

    // 2. Fetch all successful access logs to calculate streak and hourly patterns
    const allSuccessfulLogs = await prisma.accessLog.findMany({
      where: {
        userId,
        status: "GRANTED"
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true }
    });

    // Calculate Streak
    let streak = 0;
    if (allSuccessfulLogs.length > 0) {
      // Get unique dates (YYYY-MM-DD) in local time
      const uniqueDates = Array.from(new Set(
        allSuccessfulLogs.map(log => new Date(log.createdAt).toISOString().split("T")[0])
      ));

      const todayStr = now.toISOString().split("T")[0];
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      // Streak starts either today or yesterday
      let expectedDate = new Date(now);
      if (uniqueDates[0] === todayStr) {
        streak = 1;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else if (uniqueDates[0] === yesterdayStr) {
        streak = 1;
        expectedDate.setDate(expectedDate.getDate() - 2);
      } else {
        streak = 0;
      }

      if (streak > 0) {
        // Loop through subsequent unique dates to see if they are consecutive
        for (let i = 1; i < uniqueDates.length; i++) {
          const expectedStr = expectedDate.toISOString().split("T")[0];
          if (uniqueDates[i] === expectedStr) {
            streak++;
            expectedDate.setDate(expectedDate.getDate() - 1);
          } else {
            break; // Streak broken
          }
        }
      }
    }

    // 3. Hourly patterns (Favorite time)
    const hourlyDistribution: Record<number, number> = {};
    for (let h = 7; h <= 22; h++) {
      hourlyDistribution[h] = 0;
    }

    allSuccessfulLogs.forEach(log => {
      const hour = new Date(log.createdAt).getHours();
      if (hour >= 7 && hour <= 22) {
        hourlyDistribution[hour]++;
      }
    });

    // Find the hour slot with the max visits
    let favoriteHourStr = "N/A";
    let maxVisits = 0;
    Object.entries(hourlyDistribution).forEach(([hour, count]) => {
      if (count > maxVisits) {
        maxVisits = count;
        favoriteHourStr = `${String(hour).padStart(2, '0')}:00`;
      }
    });

    // 4. Last 7 days history
    const dailyDistribution: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "");
      dailyDistribution[dateStr] = 0;
    }

    // Filter logs within last 7 days for the chart
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    allSuccessfulLogs.forEach(log => {
      if (log.createdAt >= sevenDaysAgo) {
        const dateStr = new Date(log.createdAt).toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "");
        if (dailyDistribution[dateStr] !== undefined) {
          dailyDistribution[dateStr]++;
        }
      }
    });

    const weeklyData = Object.entries(dailyDistribution).map(([day, visits]) => ({
      day: day.charAt(0).toUpperCase() + day.slice(1),
      visits
    }));

    return NextResponse.json({
      totalVisits,
      streak,
      favoriteHour: favoriteHourStr,
      weeklyData
    });
  } catch (error) {
    console.error("Error fetching user attendance stats:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}
