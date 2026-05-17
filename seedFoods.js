const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const basicFoods = [
  { name: "Pechuga de Pollo", brand: null, calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: "Arroz Blanco (hervido)", brand: null, calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: "Huevo Entero", brand: null, calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  { name: "Avena", brand: null, calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  { name: "Plátano", brand: null, calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3 },
  { name: "Manzana", brand: null, calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  { name: "Atún en lata (al natural)", brand: null, calories: 116, protein: 26, carbs: 0, fat: 1 },
  { name: "Salmón", brand: null, calories: 208, protein: 20, carbs: 0, fat: 13 },
  { name: "Lentejas (hervidas)", brand: null, calories: 116, protein: 9, carbs: 20, fat: 0.4 },
  { name: "Garbanzos (hervidos)", brand: null, calories: 164, protein: 8.9, carbs: 27.4, fat: 2.6 },
  { name: "Leche entera", brand: null, calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
  { name: "Leche semidesnatada", brand: null, calories: 47, protein: 3.3, carbs: 4.8, fat: 1.6 },
  { name: "Queso Fresco", brand: null, calories: 299, protein: 11, carbs: 3, fat: 27 },
  { name: "Almendras", brand: null, calories: 579, protein: 21, carbs: 22, fat: 50 },
  { name: "Nueces", brand: null, calories: 654, protein: 15, carbs: 14, fat: 65 },
  { name: "Aceite de Oliva", brand: null, calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: "Pan Integral", brand: null, calories: 247, protein: 13, carbs: 41, fat: 3.4 },
  { name: "Pan Blanco", brand: null, calories: 265, protein: 9, carbs: 49, fat: 3.2 },
  { name: "Pasta (hervida)", brand: null, calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  { name: "Patata (hervida)", brand: null, calories: 87, protein: 1.9, carbs: 20, fat: 0.1 },
  { name: "Yogur Natural", brand: null, calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
  { name: "Ternera (corte magro)", brand: null, calories: 250, protein: 26, carbs: 0, fat: 15 },
  { name: "Cerdo (lomo)", brand: null, calories: 242, protein: 27, carbs: 0, fat: 14 },
  { name: "Aguacate", brand: null, calories: 160, protein: 2, carbs: 8.5, fat: 15 },
  { name: "Tomate", brand: null, calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  { name: "Lechuga", brand: null, calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
  { name: "Zanahoria", brand: null, calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2 },
  { name: "Brócoli", brand: null, calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4 },
  { name: "Miel", brand: null, calories: 304, protein: 0.3, carbs: 82, fat: 0 },
  { name: "Azúcar Blanco", brand: null, calories: 387, protein: 0, carbs: 100, fat: 0 },
  { name: "Crema de Cacahuete", brand: null, calories: 588, protein: 25, carbs: 20, fat: 50 },
  { name: "Queso Cheddar", brand: null, calories: 402, protein: 25, carbs: 1.3, fat: 33 },
  { name: "Queso Mozzarella", brand: null, calories: 300, protein: 22, carbs: 2.2, fat: 22 },
  { name: "Mantequilla", brand: null, calories: 717, protein: 0.9, carbs: 0.1, fat: 81 },
  { name: "Cebolla", brand: null, calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  { name: "Ajo", brand: null, calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  { name: "Pimiento Rojo", brand: null, calories: 26, protein: 1, carbs: 6, fat: 0.3 },
  { name: "Pimiento Verde", brand: null, calories: 20, protein: 0.9, carbs: 4.6, fat: 0.2 },
  { name: "Espinacas", brand: null, calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { name: "Champiñones", brand: null, calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
  { name: "Calabacín", brand: null, calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
  { name: "Pera", brand: null, calories: 57, protein: 0.4, carbs: 15, fat: 0.1 },
  { name: "Naranja", brand: null, calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },
  { name: "Fresa", brand: null, calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
  { name: "Sandía", brand: null, calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2 },
  { name: "Melón", brand: null, calories: 34, protein: 0.8, carbs: 8.2, fat: 0.2 },
  { name: "Uvas", brand: null, calories: 69, protein: 0.7, carbs: 18, fat: 0.2 },
  { name: "Kiwi", brand: null, calories: 61, protein: 1.1, carbs: 15, fat: 0.5 },
  { name: "Jamón Serrano", brand: null, calories: 241, protein: 31, carbs: 0, fat: 13 },
  { name: "Jamón Cocido", brand: null, calories: 145, protein: 16, carbs: 1.5, fat: 8 },
  { name: "Pavo (fiambre)", brand: null, calories: 104, protein: 17, carbs: 1.5, fat: 3 },
  { name: "Queso Batido 0%", brand: null, calories: 46, protein: 8, carbs: 3.5, fat: 0 },
  { name: "Yogur Griego", brand: null, calories: 133, protein: 5.3, carbs: 4.7, fat: 10 },
  { name: "Boniato", brand: null, calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  { name: "Quinoa", brand: null, calories: 120, protein: 4.4, carbs: 21, fat: 1.9 },
  { name: "Cuscús", brand: null, calories: 112, protein: 3.8, carbs: 23, fat: 0.2 },
  { name: "Macarrones Integrales", brand: null, calories: 348, protein: 14, carbs: 65, fat: 2 },
  { name: "Merluza", brand: null, calories: 89, protein: 15.6, carbs: 0, fat: 2.8 },
  { name: "Bacalao", brand: null, calories: 82, protein: 18, carbs: 0, fat: 0.7 },
  { name: "Langostinos", brand: null, calories: 99, protein: 24, carbs: 0, fat: 0.3 },
  { name: "Pulpo", brand: null, calories: 164, protein: 30, carbs: 4.4, fat: 2.1 },
  { name: "Tofu", brand: null, calories: 144, protein: 16, carbs: 2.8, fat: 8.7 },
  { name: "Seitán", brand: null, calories: 118, protein: 24, carbs: 4, fat: 1 },
  { name: "Heura / Soja Texturizada", brand: null, calories: 136, protein: 19, carbs: 3, fat: 3 },
  { name: "Chocolate Negro 85%", brand: null, calories: 598, protein: 9, carbs: 22, fat: 43 },
  { name: "Galletas Maria", brand: null, calories: 436, protein: 7, carbs: 74, fat: 11 },
  { name: "Ketchup", brand: null, calories: 112, protein: 1.2, carbs: 26, fat: 0.1 },
  { name: "Mayonesa", brand: null, calories: 680, protein: 1, carbs: 1, fat: 75 },
  { name: "Mostaza", brand: null, calories: 66, protein: 4.4, carbs: 5.3, fat: 3.3 },
  { name: "Salsa de Soja", brand: null, calories: 53, protein: 8, carbs: 5, fat: 0 },
  { name: "Bebida de Soja", brand: null, calories: 33, protein: 3, carbs: 1.8, fat: 1.5 },
  { name: "Bebida de Avena", brand: null, calories: 47, protein: 0.3, carbs: 8, fat: 1.3 },
  { name: "Bebida de Almendra", brand: null, calories: 13, protein: 0.4, carbs: 0.1, fat: 1.1 },
  { name: "Mantequilla de Almendra", brand: null, calories: 614, protein: 21, carbs: 19, fat: 56 },
  { name: "Anacardos", brand: null, calories: 553, protein: 18, carbs: 30, fat: 44 },
  { name: "Pipas de Girasol", brand: null, calories: 584, protein: 21, carbs: 20, fat: 51 },
  { name: "Pistachos", brand: null, calories: 562, protein: 20, carbs: 28, fat: 45 },
  { name: "Dátiles", brand: null, calories: 282, protein: 2.5, carbs: 75, fat: 0.4 },
  { name: "Uvas Pasas", brand: null, calories: 299, protein: 3.1, carbs: 79, fat: 0.5 },
  { name: "Ciruelas", brand: null, calories: 46, protein: 0.7, carbs: 11, fat: 0.3 },
  { name: "Melocotón", brand: null, calories: 39, protein: 0.9, carbs: 9.5, fat: 0.3 },
  { name: "Cereza", brand: null, calories: 50, protein: 1, carbs: 12, fat: 0.3 },
  { name: "Piña", brand: null, calories: 50, protein: 0.5, carbs: 13, fat: 0.1 },
  { name: "Mango", brand: null, calories: 60, protein: 0.8, carbs: 15, fat: 0.4 },
  { name: "Papaya", brand: null, calories: 43, protein: 0.5, carbs: 11, fat: 0.3 },
  { name: "Limón", brand: null, calories: 29, protein: 1.1, carbs: 9.3, fat: 0.3 },
  { name: "Guisantes", brand: null, calories: 81, protein: 5.4, carbs: 14, fat: 0.4 },
  { name: "Maíz", brand: null, calories: 86, protein: 3.2, carbs: 19, fat: 1.2 },
  { name: "Coliflor", brand: null, calories: 25, protein: 1.9, carbs: 5, fat: 0.3 },
  { name: "Judías Verdes", brand: null, calories: 31, protein: 1.8, carbs: 7, fat: 0.1 },
  { name: "Chorizo", brand: null, calories: 455, protein: 24, carbs: 1.9, fat: 39 },
  { name: "Salchichón", brand: null, calories: 411, protein: 23, carbs: 2, fat: 34 },
  { name: "Salchichas Frankfurt", brand: null, calories: 249, protein: 12, carbs: 3.5, fat: 20 },
  { name: "Whey Protein", brand: "Generic", calories: 380, protein: 80, carbs: 5, fat: 4 },
  { name: "Maltodextrina", brand: null, calories: 380, protein: 0, carbs: 95, fat: 0 },
  { name: "Miel de Caña", brand: null, calories: 290, protein: 0, carbs: 75, fat: 0 },
  { name: "Mermelada", brand: null, calories: 278, protein: 0.3, carbs: 69, fat: 0.1 },
  { name: "Harina de Trigo", brand: null, calories: 364, protein: 10, carbs: 76, fat: 1 },
  { name: "Harina de Avena", brand: null, calories: 404, protein: 15, carbs: 66, fat: 7 },
  { name: "Cacao en Polvo Puro", brand: null, calories: 228, protein: 20, carbs: 12, fat: 14 }
];

async function main() {
  console.log("Seeding basic foods...");
  
  let count = 0;
  for (const food of basicFoods) {
    // Check if it already exists to prevent duplicates on multiple runs
    const exists = await prisma.foodItem.findFirst({
      where: { name: food.name, userId: null }
    });
    
    if (!exists) {
      await prisma.foodItem.create({
        data: {
          ...food,
          userId: null
        }
      });
      count++;
    }
  }
  
  console.log(`Seeded ${count} foods successfully!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
