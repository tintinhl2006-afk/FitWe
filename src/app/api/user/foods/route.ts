import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFoodCategory } from "@/lib/nutritionUtils";
import { STANDARD_FOODS } from "@/lib/dietEngine";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // Self-healing: Ensure standard foods are populated in DB
    const globalCount = await prisma.foodItem.count({ where: { userId: null } });
    if (globalCount < STANDARD_FOODS.length) {
      for (const stdFood of STANDARD_FOODS) {
        const exists = await prisma.foodItem.findFirst({
          where: { name: stdFood.name, userId: null }
        });
        if (!exists) {
          await prisma.foodItem.create({
            data: {
              userId: null,
              name: stdFood.name,
              brand: stdFood.brand || null,
              category: getFoodCategory(stdFood.name),
              calories: stdFood.calories,
              protein: stdFood.protein,
              carbs: stdFood.carbs,
              fat: stdFood.fat,
            }
          });
        }
      }
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";

    const allFoods = await prisma.foodItem.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { userId: null },
        ],
      },
      orderBy: { name: "asc" },
    });

    const normalizeText = (str: string) =>
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const normalizedQuery = normalizeText(query);
    const filteredFoods = allFoods.filter((food) =>
      normalizeText(food.name).includes(normalizedQuery) ||
      (food.category && normalizeText(food.category).includes(normalizedQuery))
    );

    return NextResponse.json(filteredFoods);
  } catch (error) {
    console.error("Error fetching foods:", error);
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
    const { name, brand, calories, protein, carbs, fat, category } = body;

    if (!name || calories === undefined || protein === undefined || carbs === undefined || fat === undefined) {
      return NextResponse.json(
        { message: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    if (Number(calories) < 0 || Number(protein) < 0 || Number(carbs) < 0 || Number(fat) < 0) {
      return NextResponse.json(
        { message: "Los valores nutricionales no pueden ser negativos" },
        { status: 400 }
      );
    }

    const food = await prisma.foodItem.create({
      data: {
        userId: session.user.id,
        name,
        brand: brand || null,
        category: category || getFoodCategory(name),
        calories: Number(calories),
        protein: Number(protein),
        carbs: Number(carbs),
        fat: Number(fat),
      },
    });

    return NextResponse.json(food, { status: 201 });
  } catch (error) {
    console.error("Error creating food:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
