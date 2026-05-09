const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testHistory() {
  const sessionId = "69d9ed6d-a320-46f8-9222-425a1b857d8b";
  const userId = "455efcfc-3bfb-4b48-8f3b-74385b340e86";

  const workoutSession = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    include: { workoutSets: true }
  });

  const uniqueExerciseIds = [...new Set(workoutSession.workoutSets.map(s => s.exerciseId))];
  const exerciseHistoryMap = {};

  for (const exerciseId of uniqueExerciseIds) {
    const lastSessionSet = await prisma.workoutSet.findFirst({
      where: {
        exerciseId,
        isCompleted: true,
        sessionId: { not: sessionId },
        session: { userId }
      },
      orderBy: { session: { startTime: 'desc' } },
      select: { sessionId: true }
    });

    if (lastSessionSet) {
      const historicalSets = await prisma.workoutSet.findMany({
        where: {
          sessionId: lastSessionSet.sessionId,
          exerciseId,
          isCompleted: true,
        },
        orderBy: { id: 'asc' },
        select: { weight: true, reps: true }
      });
      exerciseHistoryMap[exerciseId] = historicalSets;
    } else {
      exerciseHistoryMap[exerciseId] = [];
    }
  }

  console.log(JSON.stringify(exerciseHistoryMap, null, 2));
}

testHistory()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
