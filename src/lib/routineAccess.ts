import { prisma } from "@/lib/prisma";

/**
 * Verifies that the current session user can access a routine.
 * - USER role: routine must belong to them (routine.userId === sessionUserId)
 * - GYM role: routine must belong to one of their clients (routine.user.gymId === sessionUserId)
 * 
 * Returns the routine if authorized, null otherwise.
 */
export async function verifyRoutineAccess(routineId: string, sessionUserId: string, sessionRole: string) {
  const routine = await prisma.routine.findUnique({
    where: { id: routineId },
    include: { user: { select: { id: true, gymId: true } } },
  });

  if (!routine) return null;

  // Owner access (USER editing their own routine)
  if (routine.userId === sessionUserId) return routine;

  // Gym access (GYM managing a client's routine)
  if (sessionRole === "GYM" && routine.user.gymId === sessionUserId) return routine;

  return null;
}
