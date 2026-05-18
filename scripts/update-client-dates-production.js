const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const CLIENT_DATES = {
  "cliente@gmail.com": new Date("2026-03-19T10:30:00Z"),       // 60 days ago
  "sofia.valencia@gmail.com": new Date("2026-04-03T14:15:00Z"), // 45 days ago
  "lucas.rodriguez@gmail.com": new Date("2026-02-18T09:00:00Z"),// 89 days ago
  "marta.sanz@gmail.com": new Date("2026-01-18T16:45:00Z"),     // 120 days ago
  "javier.gomez@gmail.com": new Date("2025-11-14T11:20:00Z"),   // 185 days ago
  "elena.ruiz@gmail.com": new Date("2026-03-04T08:10:00Z"),     // 75 days ago
  "alejandro.ortiz@gmail.com": new Date("2026-01-28T15:30:00Z"),// 110 days ago
  "valeria.castro@gmail.com": new Date("2026-05-02T12:00:00Z"),  // 16 days ago
  "diego.morales@gmail.com": new Date("2026-04-26T17:40:00Z"),  // 22 days ago
  "clara.benitez@gmail.com": new Date("2026-02-22T10:15:00Z")   // 85 days ago
};

async function main() {
  console.log("Conectando con la base de datos de producción Neon...");

  let updatedCount = 0;

  for (const [email, createdAtDate] of Object.entries(CLIENT_DATES)) {
    // Buscar al usuario
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (user) {
      // Actualizar el campo createdAt
      await prisma.user.update({
        where: { id: user.id },
        data: {
          createdAt: createdAtDate
        }
      });
      console.log(`✅ Usuario ${user.name} (${email}) actualizado con fecha de registro: ${createdAtDate.toLocaleDateString()}`);
      updatedCount++;
    } else {
      console.log(`⚠️ Usuario con email ${email} no encontrado.`);
    }
  }

  console.log(`\n🎉 ¡COMPLETADO! Se han modificado las fechas de registro de ${updatedCount} clientes con éxito.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
