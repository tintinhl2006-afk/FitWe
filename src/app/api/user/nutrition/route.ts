import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/apiAuth";

export async function GET(req: Request) {
  try {
    const userId = await getRequestUserId(req);

    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateString = searchParams.get("date");

    if (!dateString) {
      return NextResponse.json(
        { message: "Fecha requerida" },
        { status: 400 }
      );
    }

    // Convert date string (YYYY-MM-DD) to a range for that specific day
    const startDate = new Date(dateString);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(dateString);
    endDate.setUTCHours(23, 59, 59, 999);

    const meals = await prisma.mealEntry.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        foodItem: true,
      },
      orderBy: { date: "asc" },
    });

    const profile = await prisma.nutritionProfile.findUnique({
      where: { userId }
    });

    return NextResponse.json({ meals, profile });
  } catch (error) {
    console.error("Error fetching user nutrition data:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
