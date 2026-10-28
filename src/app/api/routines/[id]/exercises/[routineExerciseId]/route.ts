import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRoutineAccess } from "@/lib/routineAccess";
import { getRequestAuth } from "@/lib/apiAuth";
import { visibleExercisesWhere } from "@/lib/exerciseAccess";
import { MAX_REPS, MAX_SETS, MAX_WEIGHT, boundedInt, boundedNumber } from "@/lib/trainingLimits";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; routineExerciseId: string }> }
) {
  try {
    const auth = await getRequestAuth(req);
    if (!auth) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id: routineId, routineExerciseId } = await params;
    const { exerciseId, sets, reps, repsList, weight } = await req.json();

    const routine = await verifyRoutineAccess(routineId, auth.id, auth.role);

    if (!routine) {
      return NextResponse.json({ message: "No autorizado" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const invalid = (what: string) =>
      NextResponse.json({ message: `Valor no válido: ${what}` }, { status: 400 });

    if (exerciseId !== undefined) {
      if (typeof exerciseId !== "string" || !exerciseId) return invalid("ejercicio");
      const usable = await prisma.exercise.findFirst({
        where: { id: exerciseId, ...(await visibleExercisesWhere(auth.id)) },
        select: { id: true },
      });
      if (!usable) return invalid("ejercicio");
      updateData.exerciseId = exerciseId;
    }
    if (sets !== undefined) {
      const v = boundedInt(sets, 1, MAX_SETS);
      if (v === null) return invalid("series");
      updateData.sets = v;
    }
    if (reps !== undefined) {
      const v = boundedInt(reps, 0, MAX_REPS);
      if (v === null) return invalid("repeticiones");
      updateData.reps = v;
    }
    if (repsList !== undefined) {
      if (repsList !== null && (typeof repsList !== "string" || repsList.length > 500)) return invalid("lista de repeticiones");
      updateData.repsList = repsList;
    }
    if (weight !== undefined) {
      const v = boundedNumber(weight, 0, MAX_WEIGHT);
      if (v === null) return invalid("peso");
      updateData.weight = v;
    }

    // Authorizing the parent routine does not authorize an arbitrary child row: bind the write
    // to the routine verifyRoutineAccess just approved. Updating by routineExerciseId alone let
    // any user edit exercises inside anyone else's routine.
    const { count } = await prisma.routineExercise.updateMany({
      where: { id: routineExerciseId, routineId: routine.id },
      data: updateData,
    });
    if (count === 0) {
      return NextResponse.json({ message: "Ejercicio no encontrado en esta rutina" }, { status: 404 });
    }

    const updated = await prisma.routineExercise.findUnique({ where: { id: routineExerciseId } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating routine exercise:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; routineExerciseId: string }> }
) {
  try {
    const auth = await getRequestAuth(req);
    if (!auth) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id: routineId, routineExerciseId } = await params;

    const routine = await verifyRoutineAccess(routineId, auth.id, auth.role);

    if (!routine) {
      return NextResponse.json({ message: "No autorizado" }, { status: 404 });
    }

    const { count } = await prisma.routineExercise.deleteMany({
      where: { id: routineExerciseId, routineId: routine.id },
    });
    if (count === 0) {
      return NextResponse.json({ message: "Ejercicio no encontrado en esta rutina" }, { status: 404 });
    }

    return NextResponse.json({ message: "Eliminado" });
  } catch (error) {
    console.error("Error deleting routine exercise:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
