import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRoutineAccess } from "@/lib/routineAccess";
import { getRequestAuth } from "@/lib/apiAuth";

export async function PATCH(
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
    const { orderUpdates } = body; // Array of { id, order }

    if (!Array.isArray(orderUpdates)) {
      return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    }

    const routine = await verifyRoutineAccess(routineId, auth.id, auth.role);

    if (!routine) {
      return NextResponse.json({ message: "No autorizado" }, { status: 404 });
    }

    if (orderUpdates.length > 200) {
      return NextResponse.json({ message: "Demasiados elementos" }, { status: 400 });
    }
    for (const u of orderUpdates) {
      if (typeof u?.id !== "string" || !Number.isInteger(u?.order) || u.order < 0 || u.order > 10000) {
        return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
      }
    }

    // Every id in the caller-supplied array must belong to the authorized routine. Updating by
    // id alone let any user reorder exercises of any other user's routine.
    await prisma.$transaction(
      orderUpdates.map(({ id, order }: { id: string; order: number }) =>
        prisma.routineExercise.updateMany({
          where: { id, routineId: routine.id },
          data: { order },
        })
      )
    );

    return NextResponse.json({ message: "Reordenado con éxito" });
  } catch (error) {
    console.error("Error reordering routine exercises:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
