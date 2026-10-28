import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRoutineAccess } from "@/lib/routineAccess";
import { getRequestAuth } from "@/lib/apiAuth";
import { visibleExercisesWhere } from "@/lib/exerciseAccess";
import { MAX_REPS, MAX_SETS, MAX_WEIGHT, boundedInt, boundedNumber } from "@/lib/trainingLimits";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getRequestAuth(req);

    if (!auth) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id: routineId } = await params;
    const body = await req.json();
    const { exerciseId, sets, reps, weight, repsList } = body;

    if (!exerciseId || sets === undefined || reps === undefined || weight === undefined) {
      return NextResponse.json(
        { message: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    // Unbounded `sets` was persisted as-is and later drove a loop in POST /api/sessions/start.
    const safeSets = boundedInt(sets, 1, MAX_SETS);
    const safeReps = boundedInt(reps, 0, MAX_REPS);
    const safeWeight = boundedNumber(weight, 0, MAX_WEIGHT);
    if (
      typeof exerciseId !== "string" ||
      safeSets === null ||
      safeReps === null ||
      safeWeight === null ||
      (repsList != null && (typeof repsList !== "string" || repsList.length > 500))
    ) {
      return NextResponse.json({ message: "Datos de ejercicio no válidos" }, { status: 400 });
    }

    // Verificar acceso (usuario dueño O gimnasio del cliente)
    const routine = await verifyRoutineAccess(routineId, auth.id, auth.role);

    if (!routine) {
      return NextResponse.json(
        { message: "Rutina no encontrada o no autorizada" },
        { status: 404 }
      );
    }

    // The exercise must exist and be one this user may use. Previously any id was accepted, so
    // another member's private exercise could be attached by guessing its UUID.
    const usable = await prisma.exercise.findFirst({
      where: { id: exerciseId, ...(await visibleExercisesWhere(auth.id)) },
      select: { id: true },
    });
    if (!usable) {
      return NextResponse.json({ message: "Ejercicio no encontrado" }, { status: 404 });
    }

    // Obtener el orden máximo actual
    const maxOrderEx = await prisma.routineExercise.findFirst({
      where: { routineId },
      orderBy: { order: 'desc' }
    });
    const nextOrder = maxOrderEx ? maxOrderEx.order + 1 : 0;

    // Crear la relación
    const routineExercise = await prisma.routineExercise.create({
      data: {
        routineId,
        exerciseId,
        sets: safeSets,
        reps: safeReps,
        repsList: repsList || null,
        weight: safeWeight,
        order: nextOrder,
      },
    });

    return NextResponse.json(routineExercise, { status: 201 });
  } catch (error) {
    console.error("Error adding exercise to routine:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
