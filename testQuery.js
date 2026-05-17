const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function test() {
  try {
    const foods = await prisma.foodItem.findMany({
      where: {
        OR: [
          { userId: "123e4567-e89b-12d3-a456-426614174000" },
          { userId: null },
        ],
        name: {
          contains: "",
          mode: "insensitive",
        },
      },
      orderBy: { name: "asc" },
    });
    console.log("Foods found:", foods.length);
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
