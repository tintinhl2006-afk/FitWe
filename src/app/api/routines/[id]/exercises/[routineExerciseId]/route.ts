import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyRoutineAccess } from "@/lib/routineAccess";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; routineExerciseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id: routineId, routineExerciseId } = await params;
    const { exerciseId, sets } = await req.json();

    const routine = await verifyRoutineAccess(routineId, session.user.id, session.user.role);

    if (!routine) {
      return NextResponse.json({ message: "No autorizado" }, { status: 404 });
    }

    const updateData: any = {};
    if (exerciseId !== undefined) updateData.exerciseId = exerciseId;
    if (sets !== undefined) updateData.sets = Number(sets);

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id: routineId, routineExerciseId } = await params;

    const routine = await verifyRoutineAccess(routineId, session.user.id, session.user.role);

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
