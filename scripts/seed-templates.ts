import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  const email = "martinherrerolitarte@gmail.com";
  
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || user.role !== "GYM") {
    console.log(`❌ No se encontró un usuario con rol GYM para el email ${email}`);
    return;
  }

  const templates = [
    {
      name: "Cross Training",
      instructor: "Carlos Trainer",
      capacity: 15,
      dayOfWeek: 1, // Lunes
      startTime: "18:30",
      durationMinutes: 60,
      gymId: user.id,
    },
    {
      name: "Yoga Vinyasa",
      instructor: "Lucía Zen",
      capacity: 12,
      dayOfWeek: 3, // Miércoles
      startTime: "19:00",
      durationMinutes: 75,
      gymId: user.id,
    },
    {
      name: "Spinning Pro",
      instructor: "Marcos Ciclo",
      capacity: 20,
      dayOfWeek: 2, // Martes
      startTime: "10:00",
      durationMinutes: 45,
      gymId: user.id,
    },
    {
      name: "HIIT Explosive",
      instructor: "Sara Power",
      capacity: 10,
      dayOfWeek: 4, // Jueves
      startTime: "08:30",
      durationMinutes: 45,
      gymId: user.id,
    },
    {
      name: "Pilates Reformer",
      instructor: "Elena Core",
      capacity: 8,
      dayOfWeek: 5, // Viernes
      startTime: "17:00",
      durationMinutes: 60,
      gymId: user.id,
    }
  ];

  console.log(`🚀 Insertando ${templates.length} plantillas para ${user.name}...`);

  for (const t of templates) {
    await prisma.classTemplate.create({
      data: t,
    });
  }

  console.log("✅ Seed de plantillas completado.");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
