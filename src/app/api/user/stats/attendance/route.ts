import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNow } from "@/lib/timeUtils";
import { getRequestUserId } from "@/lib/apiAuth";

export async function GET(req: Request) {
  try {
    const userId = await getRequestUserId(req);

    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }
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

    // Calculate Weekly Streak (consecutive weeks with at least one check-in)
    let streak = 0;
    if (allSuccessfulLogs.length > 0) {
      const getStartOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday to Monday
        const monday = new Date(d.setDate(diff));
        return monday.toISOString().split("T")[0];
      };

      // Get unique start of week dates (Mondays) for all successful logs
      const uniqueWeeks = Array.from(new Set(
        allSuccessfulLogs.map(log => getStartOfWeek(new Date(log.createdAt)))
      )).sort((a, b) => b.localeCompare(a)); // Sort descending (latest week first)

      const thisWeekStr = getStartOfWeek(now);
      const lastWeekDate = new Date(now);
      lastWeekDate.setDate(lastWeekDate.getDate() - 7);
      const lastWeekStr = getStartOfWeek(lastWeekDate);

      let expectedMonday = new Date(now);

      if (uniqueWeeks[0] === thisWeekStr) {
        streak = 1;
        expectedMonday.setDate(expectedMonday.getDate() - 7);
      } else if (uniqueWeeks[0] === lastWeekStr) {
        streak = 1;
        expectedMonday.setDate(expectedMonday.getDate() - 14);
      } else {
        streak = 0;
      }

      if (streak > 0) {
        for (let i = 1; i < uniqueWeeks.length; i++) {
          const expectedStr = getStartOfWeek(expectedMonday);
          if (uniqueWeeks[i] === expectedStr) {
            streak++;
            expectedMonday.setDate(expectedMonday.getDate() - 7);
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
