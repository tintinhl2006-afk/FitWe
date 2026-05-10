import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { setId } = await params;
    const body = await req.json();
    const { reps, weight, isCompleted } = body;

    // Verificar que el set pertenece a una sesion del usuario
    const workoutSet = await prisma.workoutSet.findUnique({
      where: { id: setId },
      include: { session: true },
    });

    if (!workoutSet || workoutSet.session.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Set no encontrado o no autorizado" },
        { status: 404 }
      );
    }

    const updatedSet = await prisma.workoutSet.update({
      where: { id: setId },
      data: {
        reps: Math.round(Number(reps)) || 0,
        weight: Number(weight),
        isCompleted: Boolean(isCompleted),
      },
    });

    return NextResponse.json(updatedSet);
  } catch (error) {
    console.error("Error updating set:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
