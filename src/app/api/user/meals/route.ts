import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { foodItemId, mealType, quantityGrams, date } = body;

    if (!foodItemId || !mealType || quantityGrams === undefined || !date) {
      return NextResponse.json(
        { message: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    // Verify foodItem belongs to the user
    const foodItem = await prisma.foodItem.findFirst({
      where: {
        id: foodItemId,
        userId: session.user.id,
      },
    });

    if (!foodItem) {
      return NextResponse.json(
        { message: "Alimento no encontrado o no autorizado" },
        { status: 404 }
      );
    }

    const mealEntry = await prisma.mealEntry.create({
      data: {
        userId: session.user.id,
        foodItemId,
        mealType,
        quantityGrams: Number(quantityGrams),
        date: new Date(date),
      },
      include: {
        foodItem: true,
      },
    });

    return NextResponse.json(mealEntry, { status: 201 });
  } catch (error) {
    console.error("Error creating meal entry:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
