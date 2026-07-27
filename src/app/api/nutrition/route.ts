import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

    const entries = await prisma.foodEntry.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    const profile = await prisma.nutritionProfile.findUnique({
      where: { userId }
    });

    return NextResponse.json({ entries, profile });
  } catch (error) {
    console.error("Error fetching nutrition entries:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { name, calories, protein, carbs, fat, date } = body;

    if (!name || calories === undefined || protein === undefined || carbs === undefined || fat === undefined || !date) {
      return NextResponse.json(
        { message: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    const entry = await prisma.foodEntry.create({
      data: {
        name,
        calories: Number(calories),
        protein: Number(protein),
        carbs: Number(carbs),
        fat: Number(fat),
        date: new Date(date),
        userId: session.user.id,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error creating nutrition entry:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
