import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Which exercises a user may see and use: the shared catalog (no owner), their own, and — for a
 * member — their gym's. Exercise used to be one table shared by every gym with no owner column,
 * so any member could add entries that every other user then saw.
 */
export async function visibleExercisesWhere(userId: string): Promise<Prisma.ExerciseWhereInput> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { gymId: true } });
  const owners = [userId, ...(u?.gymId ? [u.gymId] : [])];
  return { OR: [{ userId: null }, { userId: { in: owners } }] };
}
