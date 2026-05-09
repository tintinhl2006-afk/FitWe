import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    // Since relations might have foreign keys, we either need to delete cascades or manually delete.
    // Assuming schema allows cascade deletion on User. Let's do it safely.
    // If you don't have cascade in schema, you must delete related items first.
    
    // First delete WorkoutSets for all sessions
    const sessions = await prisma.workoutSession.findMany({ where: { userId: session.user.id }});
    const sessionIds = sessions.map(s => s.id);
    await prisma.workoutSet.deleteMany({ where: { sessionId: { in: sessionIds } } });
    
    // Delete WorkoutSessions
    await prisma.workoutSession.deleteMany({ where: { userId: session.user.id } });
    
    // Delete RoutineExercises
    const routines = await prisma.routine.findMany({ where: { userId: session.user.id } });
    const routineIds = routines.map(r => r.id);
    await prisma.routineExercise.deleteMany({ where: { routineId: { in: routineIds } } });
    
    // Delete Routines
    await prisma.routine.deleteMany({ where: { userId: session.user.id } });
    
    // Delete FoodEntries
    await prisma.foodEntry.deleteMany({ where: { userId: session.user.id } });

    // Finally delete user
    await prisma.user.delete({ where: { id: session.user.id } });

    return NextResponse.json({ message: "Cuenta eliminada" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Error al eliminar" }, { status: 500 });
  }
}
