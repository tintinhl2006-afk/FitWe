import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFoodCategory } from "@/lib/nutritionUtils";
import { getRequestUserId } from "@/lib/apiAuth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await getRequestUserId(req);
    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { name, brand, calories, protein, carbs, fat, category } = body;

    const existingFood = await prisma.foodItem.findUnique({
      where: { id },
    });

    if (!existingFood) {
      return NextResponse.json({ message: "Alimento no encontrado" }, { status: 404 });
    }

    // Only allow editing foods they created (not global ones or other people's)
    if (existingFood.userId !== userId) {
      return NextResponse.json({ message: "No tienes permiso para editar este alimento" }, { status: 403 });
    }

    const updatedFood = await prisma.foodItem.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingFood.name,
        brand: brand !== undefined ? brand : existingFood.brand,
        category: category ? category : (category === "" ? getFoodCategory(name || existingFood.name) : existingFood.category),
        calories: calories !== undefined ? Number(calories) : existingFood.calories,
        protein: protein !== undefined ? Number(protein) : existingFood.protein,
        carbs: carbs !== undefined ? Number(carbs) : existingFood.carbs,
        fat: fat !== undefined ? Number(fat) : existingFood.fat,
      },
    });

    return NextResponse.json(updatedFood);
  } catch (error) {
    console.error("Error updating food:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
