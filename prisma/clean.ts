import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanAndSeed() {
  console.log('Limpiando ejercicios sin usar...');
  
  // Buscar ejercicios que no estén en ninguna rutina ni en ningún set
  const unusedExercises = await prisma.exercise.findMany({
    where: {
      routineExercises: { none: {} },
      workoutSets: { none: {} }
    },
    select: { id: true }
  });

  const unusedIds = unusedExercises.map(e => e.id);
  
  if (unusedIds.length > 0) {
    const deleted = await prisma.exercise.deleteMany({
      where: {
        id: { in: unusedIds }
      }
    });
    console.log(`Borrados ${deleted.count} ejercicios antiguos/sin uso.`);
  }

  console.log('Ahora ejecuta "npx prisma db seed" para rellenar con las traducciones limpias.');
}

cleanAndSeed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
