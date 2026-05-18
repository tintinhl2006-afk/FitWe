const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando sincronización de ejercicios de local a producción...");

  // Read exported exercises
  const exportPath = path.join(process.cwd(), "exercises-export.json");
  if (!fs.existsSync(exportPath)) {
    console.error("❌ Archivo exercises-export.json no encontrado. Expórtalo primero.");
    process.exit(1);
  }

  const exercises = JSON.parse(fs.readFileSync(exportPath, "utf-8"));
  console.log(`📦 Encontrados ${exercises.length} ejercicios en el archivo de exportación.`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const ex of exercises) {
    // Check if the exercise already exists in the production database by name
    const existing = await prisma.exercise.findFirst({
      where: { name: ex.name }
    });

    if (existing) {
      // Update fields to match
      await prisma.exercise.update({
        where: { id: existing.id },
        data: {
          description: ex.description || existing.description,
          muscleGroup: ex.muscleGroup || existing.muscleGroup,
          equipment: ex.equipment || existing.equipment,
          imageUrl: ex.imageUrl || existing.imageUrl
        }
      });
      updatedCount++;
    } else {
      // Create new exercise in production
      await prisma.exercise.create({
        data: {
          name: ex.name,
          description: ex.description,
          muscleGroup: ex.muscleGroup,
          equipment: ex.equipment,
          imageUrl: ex.imageUrl
        }
      });
      createdCount++;
    }
  }

  console.log(`\n🎉 Sincronización completada con éxito:`);
  console.log(`- Creados nuevos en producción: ${createdCount}`);
  console.log(`- Actualizados/Verificados: ${updatedCount}`);
}

main()
  .catch(e => {
    console.error("❌ Error durante la sincronización:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
