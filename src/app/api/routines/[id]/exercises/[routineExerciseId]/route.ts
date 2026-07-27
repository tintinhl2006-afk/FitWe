import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRoutineAccess } from "@/lib/routineAccess";
import { getRequestAuth } from "@/lib/apiAuth";

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

    const updateData: any = {};
    if (exerciseId !== undefined) updateData.exerciseId = exerciseId;
    if (sets !== undefined) updateData.sets = Number(sets);
    if (reps !== undefined) updateData.reps = Number(reps);
    if (repsList !== undefined) updateData.repsList = repsList;
    if (weight !== undefined) updateData.weight = Number(weight);

    const updated = await prisma.routineExercise.update({
      where: { id: routineExerciseId },
      data: updateData
    });

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

    await prisma.routineExercise.delete({
      where: { id: routineExerciseId }
    });

    return NextResponse.json({ message: "Eliminado" });
  } catch (error) {
    console.error("Error deleting routine exercise:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
