import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
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
      normalizeText(food.name).includes(normalizedQuery)
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
    const { name, brand, calories, protein, carbs, fat } = body;

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
