import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/apiAuth";

export async function POST(req: Request) {
  try {
    const userId = await getRequestUserId(req);
    if (!userId) {
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

    if (Number(quantityGrams) <= 0) {
      return NextResponse.json(
        { message: "La cantidad debe ser mayor que 0" },
        { status: 400 }
      );
    }

    // Verify foodItem belongs to the user or is a global food (userId: null)
    const foodItem = await prisma.foodItem.findFirst({
      where: {
        id: foodItemId,
        OR: [
          { userId },
          { userId: null },
        ],
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
        userId,
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
