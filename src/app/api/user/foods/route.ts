import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFoodCategory } from "@/lib/nutritionUtils";
import { STANDARD_FOODS } from "@/lib/dietEngine";
import { getRequestUserId } from "@/lib/apiAuth";
import { readPageParams } from "@/lib/pagination";

export async function GET(req: Request) {
  try {
    const userId = await getRequestUserId(req);
    if (!userId) {
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

    // The candidate set is bounded: the shared catalogue plus this user's own foods. Matching is
    // accent-insensitive, which the database cannot do here without an extension, so it stays in
    // memory, but over a capped set and returning one page instead of every match.
    const { skip, take } = readPageParams(req.url, { defaultSize: 60, maxSize: 200 });
    const allFoods = await prisma.foodItem.findMany({
      where: {
        OR: [
          { userId },
          { userId: null },
        ],
      },
      orderBy: { name: "asc" },
      take: 5000,
    });

    const normalizeText = (str: string) =>
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const normalizedQuery = normalizeText(query);
    // Category filter and ordering used to happen in the browser over the full list. With one page
    // at a time they have to happen here, in the same order the screen shows (category, then name).
    const categoryFilter = searchParams.get("category");
    const filteredFoods = allFoods
      .filter((food) =>
        normalizeText(food.name).includes(normalizedQuery) ||
        (food.category && normalizeText(food.category).includes(normalizedQuery))
      )
      .filter((food) => !categoryFilter || categoryFilter === "Todos" || (food.category || "Otros") === categoryFilter)
      .sort((a, b) => {
        // The web groups results by category; the mobile app has always listed them by name.
        if (searchParams.get("sort") === "category") {
          const catA = a.category || "Otros";
          const catB = b.category || "Otros";
          if (catA !== catB) return catA.localeCompare(catB);
        }
        return a.name.localeCompare(b.name);
      });

    return NextResponse.json(filteredFoods.slice(skip, skip + take));
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
    const userId = await getRequestUserId(req);
    if (!userId) {
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
        userId,
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
