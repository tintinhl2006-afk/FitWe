import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyRoutineAccess } from "@/lib/routineAccess";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id: routineId } = await params;
    const body = await req.json();
    const { exerciseId, sets, reps, weight } = body;

    if (!exerciseId || sets === undefined || reps === undefined || weight === undefined) {
      return NextResponse.json(
        { message: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    // Verificar acceso (usuario dueño O gimnasio del cliente)
    const routine = await verifyRoutineAccess(routineId, session.user.id, session.user.role);

    if (!routine) {
      return NextResponse.json(
        { message: "Rutina no encontrada o no autorizada" },
        { status: 404 }
      );
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
        sets,
        reps,
        weight,
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
