import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const publicDir = path.join(process.cwd(), "public");
  const files = fs.readdirSync(publicDir);
  
  const imageExtensions = [".jpg", ".jpeg", ".png", ".svg", ".webp"];
  const imageFiles = files.filter(f => imageExtensions.includes(path.extname(f).toLowerCase()));

  console.log(`Encontrados ${imageFiles.length} archivos de imagen en public.`);

  const exercises = await prisma.exercise.findMany();
  console.log(`Encontrados ${exercises.length} ejercicios en la base de datos.`);

  let updatedCount = 0;

  for (const exercise of exercises) {
    // Normalizar el nombre del ejercicio para buscar el archivo
    // Ejemplo: "Press banca" -> "press_banca"
    const normalizedName = exercise.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Quitar tildes
      .replace(/ /g, "_")
      .replace(/[^a-z0-9_]/g, "");

    // Buscar coincidencia exacta (sin extensión)
    const match = imageFiles.find(f => {
      const fileNameWithoutExt = path.parse(f).name.toLowerCase();
      return fileNameWithoutExt === normalizedName;
    });

    if (match) {
      await prisma.exercise.update({
        where: { id: exercise.id },
        data: { imageUrl: `/${match}` }
      });
      console.log(`✅ Actualizado: ${exercise.name} -> /${match}`);
      updatedCount++;
    } else {
      // Intento de búsqueda parcial o parecida? 
      // Por ahora solo exacta para evitar errores.
      console.log(`❌ No se encontró imagen para: ${exercise.name} (buscado: ${normalizedName})`);
    }
  }

  console.log(`\nResumen: ${updatedCount} ejercicios actualizados.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
