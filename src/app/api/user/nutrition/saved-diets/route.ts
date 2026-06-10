import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Retrieve all saved diets for the authenticated user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const savedDiets = await prisma.savedDiet.findMany({
      where: { userId: session.user.id },
      include: {
        items: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(savedDiets);
  } catch (error) {
    console.error("Error fetching saved diets:", error);
    return NextResponse.json({ error: "Error al obtener las dietas guardadas" }, { status: 500 });
  }
}

// POST: Save a new named diet template
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { name, items } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ message: "El nombre de la dieta es requerido" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: "La dieta debe contener al menos un alimento" }, { status: 400 });
    }

    const savedDiet = await prisma.$transaction(async (tx) => {
      // Create saved diet
      const diet = await tx.savedDiet.create({
        data: {
          userId: session.user.id,
          name: name.trim(),
        },
      });

      // Create saved diet items
      const dietItems = items.map((item: any) => ({
        savedDietId: diet.id,
        foodName: item.foodName,
        brand: item.brand || null,
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        carbs: Number(item.carbs) || 0,
        fat: Number(item.fat) || 0,
        quantityGrams: Number(item.quantityGrams) || 0,
        mealType: item.mealType,
      }));

      await tx.savedDietItem.createMany({
        data: dietItems,
      });

      return await tx.savedDiet.findUnique({
        where: { id: diet.id },
        include: { items: true },
      });
    });

    return NextResponse.json(savedDiet, { status: 201 });
  } catch (error) {
    console.error("Error creating saved diet:", error);
    return NextResponse.json({ error: "Error al guardar la dieta" }, { status: 500 });
  }
}
