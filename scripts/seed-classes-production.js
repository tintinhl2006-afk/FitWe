const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Day of week mapping in DB:
// 1 = Lunes, 2 = Martes, 3 = Miércoles, 4 = Jueves, 5 = Viernes, 6 = Sábado, 7 = Domingo
const TEMPLATE_CLASSES = [
  {
    name: "CrossFit Elite",
    instructor: "Mario Gómez",
    capacity: 20,
    dayOfWeek: 1, // Lunes
    startTime: "08:00",
    durationMinutes: 60
  },
  {
    name: "CrossFit Elite",
    instructor: "Mario Gómez",
    capacity: 20,
    dayOfWeek: 3, // Miércoles
    startTime: "08:00",
    durationMinutes: 60
  },
  {
    name: "Yoga Flow & Mind",
    instructor: "Elena Sanz",
    capacity: 15,
    dayOfWeek: 2, // Martes
    startTime: "09:30",
    durationMinutes: 60
  },
  {
    name: "Yoga Flow & Mind",
    instructor: "Elena Sanz",
    capacity: 15,
    dayOfWeek: 4, // Jueves
    startTime: "09:30",
    durationMinutes: 60
  },
  {
    name: "Spinning Power & Beats",
    instructor: "Carlos Ruiz",
    capacity: 25,
    dayOfWeek: 1, // Lunes
    startTime: "19:30",
    durationMinutes: 50
  },
  {
    name: "Spinning Power & Beats",
    instructor: "Carlos Ruiz",
    capacity: 25,
    dayOfWeek: 3, // Miércoles
    startTime: "19:30",
    durationMinutes: 50
  },
  {
    name: "Pilates Core",
    instructor: "Julia Ortega",
    capacity: 15,
    dayOfWeek: 5, // Viernes
    startTime: "10:00",
    durationMinutes: 60
  },
  {
    name: "Zumba Fitness Latino",
    instructor: "Dani Martí",
    capacity: 30,
    dayOfWeek: 5, // Viernes
    startTime: "18:30",
    durationMinutes: 60
  },
  {
    name: "BodyPump Total Body",
    instructor: "Mario Gómez",
    capacity: 22,
    dayOfWeek: 6, // Sábado
    startTime: "11:00",
    durationMinutes: 60
  }
];

// Helper to generate classes based on template
async function generateClassesForTemplate(template, gymId) {
  let generated = 0;
  const now = new Date(); // Current local time

  for (let daysAhead = 0; daysAhead < 14; daysAhead++) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + daysAhead);

    const jsDayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday ... 6 = Saturday
    const templateDayJS = template.dayOfWeek === 7 ? 0 : template.dayOfWeek;

    if (jsDayOfWeek !== templateDayJS) continue;

    const [hours, minutes] = template.startTime.split(":").map(Number);
    const startTime = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      hours,
      minutes,
      0,
      0
    );

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + template.durationMinutes);

    // Create the gym class
    await prisma.gymClass.create({
      data: {
        gymId,
        name: template.name,
        instructor: template.instructor,
        capacity: template.capacity,
        startTime,
        endTime,
        templateId: template.id
      }
    });
    generated++;
  }
  return generated;
}

async function main() {
  console.log("Conectando con la base de datos de producción...");

  // Buscar el gimnasio
  const gym = await prisma.user.findFirst({
    where: { email: "gimnasio@gmail.com" }
  });

  if (!gym) {
    console.error("❌ ERROR: El usuario gimnasio@gmail.com no fue encontrado en la base de datos.");
    process.exit(1);
  }

  const gymId = gym.id;
  console.log(`✅ Gimnasio encontrado: ${gym.name} (ID: ${gymId})`);

  // Limpiar clases y plantillas previas para evitar duplicados
  console.log("🧹 Limpiando clases y plantillas antiguas...");
  
  // 1. Obtener los IDs de las clases del gimnasio
  const gymClassIds = (await prisma.gymClass.findMany({
    where: { gymId },
    select: { id: true }
  })).map(c => c.id);

  // 2. Eliminar reservas asociadas a estas clases para evitar violación de FK
  const deletedBookings = await prisma.classBooking.deleteMany({
    where: { classId: { in: gymClassIds } }
  });
  console.log(`🧹 Eliminadas ${deletedBookings.count} reservas asociadas a clases del gimnasio.`);

  // 3. Eliminar clases físicas
  const deletedClasses = await prisma.gymClass.deleteMany({
    where: { gymId }
  });

  // 4. Eliminar plantillas
  const deletedTemplates = await prisma.classTemplate.deleteMany({
    where: { gymId }
  });

  console.log(`🧹 Eliminados: ${deletedTemplates.count} plantillas antiguas y ${deletedClasses.count} clases generadas.`);

  // Inyectar plantillas
  console.log("🏋️ Seeding plantillas de clases semanales...");
  let templateCount = 0;
  let totalClassesGenerated = 0;

  for (const tData of TEMPLATE_CLASSES) {
    // 1. Crear plantilla
    const template = await prisma.classTemplate.create({
      data: {
        gymId,
        name: tData.name,
        instructor: tData.instructor,
        capacity: tData.capacity,
        dayOfWeek: tData.dayOfWeek,
        startTime: tData.startTime,
        durationMinutes: tData.durationMinutes
      }
    });

    templateCount++;

    // 2. Generar clases para las próximas 2 semanas
    const generated = await generateClassesForTemplate(template, gymId);
    totalClassesGenerated += generated;
  }

  console.log(`\n🎉 ¡MIGRACIÓN COMPLETADA CON ÉXITO!`);
  console.log(`👉 Plantillas creadas: ${templateCount}`);
  console.log(`👉 Clases físicas generadas (próximos 14 días): ${totalClassesGenerated}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
