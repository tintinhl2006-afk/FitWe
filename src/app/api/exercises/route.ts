import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/apiAuth";
import { checkRateLimit } from "@/lib/rateLimit";
import { visibleExercisesWhere } from "@/lib/exerciseAccess";

export async function GET(req: Request) {
  try {
    // The catalog is application data, not public content: every other read path requires a
    // session. It also had no row limit.
    const userId = await getRequestUserId(req);
    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const exercises = await prisma.exercise.findMany({
      where: await visibleExercisesWhere(userId),
      orderBy: { name: "asc" },
      take: 2000,
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

    // Exercise is a global, tenant-less table shared by every gym, and members may add entries
    // to it from the app. Without validation or a limit one account could fill it with
    // arbitrary content shown to everyone (and later exported to CSV and PDF).
    const limit = await checkRateLimit(`exercise-create:user:${userId}`, 30, 60);
    if (!limit.allowed) {
      return NextResponse.json({ message: "Demasiados ejercicios creados. Inténtalo más tarde." }, { status: 429 });
    }

    const body = await req.json();
    const { name, description, muscleGroup } = body;

    if (
      typeof name !== "string" || !name.trim() || name.length > 100 ||
      typeof muscleGroup !== "string" || !muscleGroup.trim() || muscleGroup.length > 50 ||
      (description != null && (typeof description !== "string" || description.length > 1000))
    ) {
      return NextResponse.json(
        { message: "El nombre y grupo muscular son obligatorios y deben tener una longitud razonable" },
        { status: 400 }
      );
    }

    const exercise = await prisma.exercise.create({
      data: {
        name: name.trim(),
        description: description ?? null,
        muscleGroup: muscleGroup.trim(),
        // Owned by its creator: it used to land in the catalog every other user sees.
        userId,
      },
    });

    return NextResponse.json(exercise, { status: 201 });
  } catch (error) {
    console.error("Error creating exercise:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
