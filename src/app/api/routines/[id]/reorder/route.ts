import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyRoutineAccess } from "@/lib/routineAccess";

export async function PATCH(
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
    const { orderUpdates } = body; // Array of { id, order }

    if (!Array.isArray(orderUpdates)) {
      return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    }

    const routine = await verifyRoutineAccess(routineId, session.user.id, session.user.role);

    if (!routine) {
      return NextResponse.json({ message: "No autorizado" }, { status: 404 });
    }

    // Process all updates in a transaction
    await prisma.$transaction(
      orderUpdates.map(({ id, order }: { id: string; order: number }) =>
        prisma.routineExercise.update({
          where: { id },
          data: { order }
        })
      )
    );

    return NextResponse.json({ message: "Reordenado con éxito" });
  } catch (error) {
    console.error("Error reordering routine exercises:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
