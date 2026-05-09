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

    // 1. Total routines
    const routinesCount = await prisma.routine.count({
      where: { userId: session.user.id },
    });

    // 2. Last workout session
    const lastSession = await prisma.workoutSession.findFirst({
      where: { userId: session.user.id },
      orderBy: { startTime: "desc" },
    });

    return NextResponse.json({
      routinesCount,
      lastWorkoutDate: lastSession ? lastSession.startTime : null,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
