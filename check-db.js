const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDb() {
  const sets = await prisma.workoutSet.findMany({
    take: 10,
    orderBy: { id: 'desc' },
    include: { session: true }
  });
  console.log(JSON.stringify(sets, null, 2));
}

checkDb()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
