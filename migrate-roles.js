const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function migrate() {
  // Add USER value to the existing Role enum if not present
  try {
    await p.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'USER'`);
    console.log("Added USER to Role enum");
  } catch (e) {
    console.log("USER already exists or error:", e.message);
  }

  // Add GYM value to the existing Role enum if not present  
  try {
    await p.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'GYM'`);
    console.log("Added GYM to Role enum");
  } catch (e) {
    console.log("GYM already exists or error:", e.message);
  }

  // Migrate all existing users to USER role
  const result = await p.$executeRawUnsafe(`UPDATE "User" SET role = 'USER' WHERE role IN ('CLIENT', 'ADMIN', 'TRAINER')`);
  console.log("Updated users:", result);

  await p.$disconnect();
}

migrate().catch(e => {
  console.error(e);
  p.$disconnect();
});
