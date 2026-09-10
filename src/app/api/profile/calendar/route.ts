import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/apiAuth";

export async function GET(request: Request) {
  try {
    const userId = await getRequestUserId(request);

    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = Math.min(12, Math.max(1, parseInt(searchParams.get("month") || "", 10) || now.getMonth() + 1));
    const year = parseInt(searchParams.get("year") || "", 10) || now.getFullYear();

    const startOfMonth = new Date(year, month - 1, 1);
    const startOfNextMonth = new Date(year, month, 1);

    const monthlySessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        endTime: { not: null },
        startTime: { gte: startOfMonth, lt: startOfNextMonth },
      },
      select: { startTime: true },
    });

    return NextResponse.json({
      monthlyDates: monthlySessions.map(s => s.startTime.toISOString()),
      month,
      year,
    });
  } catch (error) {
    console.error("Error fetching profile calendar data:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
