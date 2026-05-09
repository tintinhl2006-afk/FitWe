const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  const sessions = await prisma.workoutSession.findMany({
    orderBy: { startTime: 'desc' },
    take: 50,
    include: {
        user: true,
        routine: true
    }
  });

  console.log("\nÚltimas 50 sesiones:");
  sessions.forEach(s => {
    console.log(`- ${s.startTime.toISOString()} | Fin: ${s.endTime ? 'SÍ' : 'NO'} | ${s.routine?.name}`);
  });
}

check().then(() => prisma.$disconnect());
