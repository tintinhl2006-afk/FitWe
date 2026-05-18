const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const MEALS_DATA = [
  // Day 10 (Sunday, May 10)
  {
    date: "2026-05-10T08:30:00Z",
    name: "Tostadas de masa madre con aguacate y 2 huevos poché",
    mealType: "BREAKFAST",
    calories: 450,
    protein: 22.0,
    carbs: 35.0,
    fat: 24.0
  },
  {
    date: "2026-05-10T13:45:00Z",
    name: "Salmón salvaje al horno con puré de batata y espárragos trigueros",
    mealType: "LUNCH",
    calories: 620,
    protein: 45.0,
    carbs: 42.0,
    fat: 28.0
  },
  {
    date: "2026-05-10T17:30:00Z",
    name: "Yogur griego con arándanos, nueces y miel de flores",
    mealType: "SNACK",
    calories: 310,
    protein: 18.0,
    carbs: 22.0,
    fat: 14.0
  },
  {
    date: "2026-05-10T21:15:00Z",
    name: "Fajitas de pollo con pimientos salteados, cebolla y guacamole casero",
    mealType: "DINNER",
    calories: 580,
    protein: 42.0,
    carbs: 48.0,
    fat: 18.0
  },

  // Day 11 (Monday, May 11)
  {
    date: "2026-05-11T08:15:00Z",
    name: "Gachas de avena (porridge) con plátano, canela y crema de almendras",
    mealType: "BREAKFAST",
    calories: 420,
    protein: 15.0,
    carbs: 60.0,
    fat: 12.0
  },
  {
    date: "2026-05-11T14:00:00Z",
    name: "Pechuga de pollo a la parrilla con arroz integral y verduras salteadas al wok",
    mealType: "LUNCH",
    calories: 580,
    protein: 48.0,
    carbs: 55.0,
    fat: 10.0
  },
  {
    date: "2026-05-11T18:00:00Z",
    name: "Batido de proteína whey con leche de avena y fresas frescas",
    mealType: "SNACK",
    calories: 250,
    protein: 28.0,
    carbs: 18.0,
    fat: 4.0
  },
  {
    date: "2026-05-11T20:45:00Z",
    name: "Ensalada templada de quinoa con queso feta, tomate cherry y pepino",
    mealType: "DINNER",
    calories: 490,
    protein: 16.0,
    carbs: 50.0,
    fat: 22.0
  },

  // Day 12 (Tuesday, May 12)
  {
    date: "2026-05-12T08:30:00Z",
    name: "Tortilla de 3 claras y 1 huevo entero con espinacas y pechuga de pavo",
    mealType: "BREAKFAST",
    calories: 320,
    protein: 30.0,
    carbs: 4.0,
    fat: 18.0
  },
  {
    date: "2026-05-12T13:30:00Z",
    name: "Lentejas estofadas tradicionales con verduras de temporada y patata",
    mealType: "LUNCH",
    calories: 520,
    protein: 24.0,
    carbs: 75.0,
    fat: 8.0
  },
  {
    date: "2026-05-12T17:15:00Z",
    name: "Manzana verde laminada con una cucharada de crema de cacahuete pura",
    mealType: "SNACK",
    calories: 220,
    protein: 7.0,
    carbs: 25.0,
    fat: 11.0
  },
  {
    date: "2026-05-12T21:00:00Z",
    name: "Hamburguesa casera de ternera magra en pan integral con rúcula y tomate",
    mealType: "DINNER",
    calories: 610,
    protein: 40.0,
    carbs: 45.0,
    fat: 20.0
  },

  // Day 13 (Wednesday, May 13)
  {
    date: "2026-05-13T08:00:00Z",
    name: "Tostadas de centeno con queso crema light y salmón ahumado",
    mealType: "BREAKFAST",
    calories: 380,
    protein: 26.0,
    carbs: 30.0,
    fat: 12.0
  },
  {
    date: "2026-05-13T14:15:00Z",
    name: "Tallarines integrales con salsa boloñesa de pavo y champiñones al ajillo",
    mealType: "LUNCH",
    calories: 640,
    protein: 38.0,
    carbs: 78.0,
    fat: 14.0
  },
  {
    date: "2026-05-13T17:45:00Z",
    name: "Tortitas de arroz integral con queso requesón y rodajas de kiwi",
    mealType: "SNACK",
    calories: 210,
    protein: 12.0,
    carbs: 32.0,
    fat: 3.0
  },
  {
    date: "2026-05-13T20:30:00Z",
    name: "Lubina fresca a la plancha con ensalada verde variada y aderezo de limón",
    mealType: "DINNER",
    calories: 430,
    protein: 36.0,
    carbs: 12.0,
    fat: 22.0
  },

  // Day 14 (Thursday, May 14)
  {
    date: "2026-05-14T08:30:00Z",
    name: "Tortitas de avena y claras de huevo acompañadas de frutos rojos silvestre",
    mealType: "BREAKFAST",
    calories: 350,
    protein: 24.0,
    carbs: 45.0,
    fat: 5.0
  },
  {
    date: "2026-05-14T13:45:00Z",
    name: "Arroz basmati con pechuga de pollo al curry y un toque de leche de coco ligera",
    mealType: "LUNCH",
    calories: 610,
    protein: 42.0,
    carbs: 65.0,
    fat: 16.0
  },
  {
    date: "2026-05-14T17:30:00Z",
    name: "Puñado de almendras tostadas sin sal y una taza de kéfir natural",
    mealType: "SNACK",
    calories: 280,
    protein: 14.0,
    carbs: 16.0,
    fat: 15.0
  },
  {
    date: "2026-05-14T21:15:00Z",
    name: "Tortilla de patatas ligera (hecha al horno) con ensalada caprese de tomate",
    mealType: "DINNER",
    calories: 480,
    protein: 18.0,
    carbs: 40.0,
    fat: 24.0
  },

  // Day 15 (Friday, May 15)
  {
    date: "2026-05-15T08:15:00Z",
    name: "Revuelto de tofu con cúrcuma, espinacas baby y tostadas integrales",
    mealType: "BREAKFAST",
    calories: 380,
    protein: 22.0,
    carbs: 38.0,
    fat: 14.0
  },
  {
    date: "2026-05-15T14:00:00Z",
    name: "Wrap de trigo integral relleno de pollo asado, lechuga, tomate y salsa de yogur",
    mealType: "LUNCH",
    calories: 530,
    protein: 35.0,
    carbs: 42.0,
    fat: 16.0
  },
  {
    date: "2026-05-15T17:30:00Z",
    name: "Queso batido 0% con nueces troceadas y una pizca de cacao puro en polvo",
    mealType: "SNACK",
    calories: 260,
    protein: 20.0,
    carbs: 12.0,
    fat: 12.0
  },
  {
    date: "2026-05-15T20:45:00Z",
    name: "Brochetas de langostinos y verduras al wok acompañadas de arroz salvaje",
    mealType: "DINNER",
    calories: 470,
    protein: 38.0,
    carbs: 48.0,
    fat: 8.0
  },

  // Day 16 (Saturday, May 16)
  {
    date: "2026-05-16T09:00:00Z",
    name: "Gofres de avena caseros decorados con fresas laminadas y sirope de agave",
    mealType: "BREAKFAST",
    calories: 390,
    protein: 16.0,
    carbs: 62.0,
    fat: 7.0
  },
  {
    date: "2026-05-16T14:30:00Z",
    name: "Entrecot de ternera a la parrilla con patata asada y pimientos de Padrón",
    mealType: "LUNCH",
    calories: 680,
    protein: 46.0,
    carbs: 38.0,
    fat: 32.0
  },
  {
    date: "2026-05-16T18:00:00Z",
    name: "Bol de piña natural troceada con un yogur skyr natural",
    mealType: "SNACK",
    calories: 190,
    protein: 16.0,
    carbs: 24.0,
    fat: 1.0
  },
  {
    date: "2026-05-16T21:30:00Z",
    name: "Sushi variado premium (maki, nigiri de salmón y atún) con edamame al vapor",
    mealType: "DINNER",
    calories: 590,
    protein: 28.0,
    carbs: 85.0,
    fat: 10.0
  },

  // Day 17 (Sunday, May 17)
  {
    date: "2026-05-17T08:30:00Z",
    name: "Huevos revueltos con champiñones salteados y tostadas de centeno integral",
    mealType: "BREAKFAST",
    calories: 360,
    protein: 20.0,
    carbs: 28.0,
    fat: 16.0
  },
  {
    date: "2026-05-17T14:00:00Z",
    name: "Paella de marisco casera tradicional con langostinos, calamar y mejillones",
    mealType: "LUNCH",
    calories: 620,
    protein: 32.0,
    carbs: 80.0,
    fat: 12.0
  },
  {
    date: "2026-05-17T17:45:00Z",
    name: "Batido de proteína whey isolada con plátano maduro y avena molida",
    mealType: "SNACK",
    calories: 340,
    protein: 32.0,
    carbs: 42.0,
    fat: 5.0
  },
  {
    date: "2026-05-17T20:30:00Z",
    name: "Crema templada de calabacín y puerros con picatostes y taquitos de jamón serrano",
    mealType: "DINNER",
    calories: 410,
    protein: 18.0,
    carbs: 35.0,
    fat: 16.0
  }
];

async function main() {
  console.log("Conectando con la base de datos de producción...");
  
  const user = await prisma.user.findUnique({
    where: { email: "cliente@gmail.com" }
  });

  if (!user) {
    console.error("❌ ERROR: El usuario cliente@gmail.com no fue encontrado en la base de datos.");
    process.exit(1);
  }

  const userId = user.id;
  console.log(`✅ Usuario encontrado: ${user.name} (ID: ${userId})`);

  const startDate = new Date("2026-05-10T00:00:00Z");
  const endDate = new Date("2026-05-17T23:59:59Z");

  // 1. Limpiar la tabla FoodEntry por completo en ese rango (para limpiar los registros antiguos erróneos)
  const deleteFoodEntriesCount = await prisma.foodEntry.deleteMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  });
  console.log(`🧹 Eliminados ${deleteFoodEntriesCount.count} registros de la tabla obsoleta FoodEntry.`);

  // 2. Limpiar la tabla MealEntry en ese rango para evitar duplicados
  const deleteMealEntriesCount = await prisma.mealEntry.deleteMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  });
  console.log(`🧹 Eliminados ${deleteMealEntriesCount.count} registros antiguos de la tabla real MealEntry.`);

  // 3. Inyectar las comidas creando el FoodItem y luego el MealEntry
  console.log("🍱 Insertando registros de comida vinculados a FoodItems reales...");
  let insertedCount = 0;

  for (const meal of MEALS_DATA) {
    // 3.1 Buscar o crear el FoodItem (global para simplificar o privado)
    let foodItem = await prisma.foodItem.findFirst({
      where: {
        name: meal.name,
        userId: null // Global
      }
    });

    if (!foodItem) {
      foodItem = await prisma.foodItem.create({
        data: {
          name: meal.name,
          brand: "FitWe Gourmet",
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          userId: null // Hacemos que sea un alimento global disponible en el catálogo
        }
      });
    }

    // 3.2 Crear la entrada en el diario (MealEntry) con 100g para conservar los valores exactos
    await prisma.mealEntry.create({
      data: {
        userId,
        foodItemId: foodItem.id,
        mealType: meal.mealType,
        quantityGrams: 100.0,
        date: new Date(meal.date)
      }
    });

    insertedCount++;
  }

  console.log(`🎉 ¡ÉXITO DE PRODUCCIÓN! Se han poblado correctamente ${insertedCount} comidas reales (MealEntry) en Neon.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
