const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
prisma.foodItem.findMany().then(f => console.log(f.length)).finally(() => prisma.$disconnect());
