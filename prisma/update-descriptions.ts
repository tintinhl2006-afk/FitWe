// Updates only Exercise.description for the shared catalog from ejercicios.json.
// Unlike prisma/seed.ts it does not touch users, routines or any other table.
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const file = path.join(process.cwd(), "ejercicios.json");
  const items: { name: string; description: string }[] = JSON.parse(fs.readFileSync(file, "utf8"));
  let updated = 0;
  const missing: string[] = [];
  for (const ex of items) {
    const res = await prisma.exercise.updateMany({
      where: { name: ex.name, userId: null },
      data: { description: ex.description },
    });
    if (res.count === 0) missing.push(ex.name);
    updated += res.count;
  }
  console.log(`Descripciones actualizadas: ${updated}`);
  if (missing.length) console.log("No existen en la base:", missing.join(", "));
}

main().finally(() => prisma.$disconnect());
