import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/apiAuth";

export async function GET() {
  try {
    const exercises = await prisma.exercise.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(exercises);
  } catch (error) {
    console.error("Error fetching exercises:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getRequestUserId(req);
    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, muscleGroup } = body;

    if (!name || !muscleGroup) {
      return NextResponse.json(
        { message: "El nombre y grupo muscular son obligatorios" },
        { status: 400 }
      );
    }

    const exercise = await prisma.exercise.create({
      data: {
        name,
        description,
        muscleGroup,
      },
    });

    return NextResponse.json(exercise, { status: 201 });
  } catch (error) {
    console.error("Error creating exercise:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
