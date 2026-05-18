const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const MEALS_DATA = [
  // Day 10 (Sunday, May 10)
  {
    date: "2026-05-10T08:30:00Z",
    name: "Tostadas de masa madre con aguacate y 2 huevos poché",
    calories: 450,
    protein: 22.0,
    carbs: 35.0,
    fat: 24.0
  },
  {
    date: "2026-05-10T13:45:00Z",
    name: "Salmón salvaje al horno con puré de batata y espárragos trigueros",
    calories: 620,
    protein: 45.0,
    carbs: 42.0,
    fat: 28.0
  },
  {
    date: "2026-05-10T17:30:00Z",
    name: "Yogur griego con arándanos, nueces y miel de flores",
    calories: 310,
    protein: 18.0,
    carbs: 22.0,
    fat: 14.0
  },
  {
    date: "2026-05-10T21:15:00Z",
    name: "Fajitas de pollo con pimientos salteados, cebolla y guacamole casero",
    calories: 580,
    protein: 42.0,
    carbs: 48.0,
    fat: 18.0
  },

  // Day 11 (Monday, May 11)
  {
    date: "2026-05-11T08:15:00Z",
    name: "Gachas de avena (porridge) con plátano, canela y crema de almendras",
    calories: 420,
    protein: 15.0,
    carbs: 60.0,
    fat: 12.0
  },
  {
    date: "2026-05-11T14:00:00Z",
    name: "Pechuga de pollo a la parrilla con arroz integral y verduras salteadas al wok",
    calories: 580,
    protein: 48.0,
    carbs: 55.0,
    fat: 10.0
  },
  {
    date: "2026-05-11T18:00:00Z",
    name: "Batido de proteína whey con leche de avena y fresas frescas",
    calories: 250,
    protein: 28.0,
    carbs: 18.0,
    fat: 4.0
  },
  {
    date: "2026-05-11T20:45:00Z",
    name: "Ensalada templada de quinoa con queso feta, tomate cherry y pepino",
    calories: 490,
    protein: 16.0,
    carbs: 50.0,
    fat: 22.0
  },

  // Day 12 (Tuesday, May 12)
  {
    date: "2026-05-12T08:30:00Z",
    name: "Tortilla de 3 claras y 1 huevo entero con espinacas y pechuga de pavo",
    calories: 320,
    protein: 30.0,
    carbs: 4.0,
    fat: 18.0
  },
  {
    date: "2026-05-12T13:30:00Z",
    name: "Lentejas estofadas tradicionales con verduras de temporada y patata",
    calories: 520,
    protein: 24.0,
    carbs: 75.0,
    fat: 8.0
  },
  {
    date: "2026-05-12T17:15:00Z",
    name: "Manzana verde laminada con una cucharada de crema de cacahuete pura",
    calories: 220,
    protein: 7.0,
    carbs: 25.0,
    fat: 11.0
  },
  {
    date: "2026-05-12T21:00:00Z",
    name: "Hamburguesa casera de ternera magra en pan integral con rúcula y tomate",
    calories: 610,
    protein: 40.0,
    carbs: 45.0,
    fat: 20.0
  },

  // Day 13 (Wednesday, May 13)
  {
    date: "2026-05-13T08:00:00Z",
    name: "Tostadas de centeno con queso crema light y salmón ahumado",
    calories: 380,
    protein: 26.0,
    carbs: 30.0,
    fat: 12.0
  },
  {
    date: "2026-05-13T14:15:00Z",
    name: "Tallarines integrales con salsa boloñesa de pavo y champiñones al ajillo",
    calories: 640,
    protein: 38.0,
    carbs: 78.0,
    fat: 14.0
  },
  {
    date: "2026-05-13T17:45:00Z",
    name: "Tortitas de arroz integral con queso requesón y rodajas de kiwi",
    calories: 210,
    protein: 12.0,
    carbs: 32.0,
    fat: 3.0
  },
  {
    date: "2026-05-13T20:30:00Z",
    name: "Lubina fresca a la plancha con ensalada verde variada y aderezo de limón",
    calories: 430,
    protein: 36.0,
    carbs: 12.0,
    fat: 22.0
  },

  // Day 14 (Thursday, May 14)
  {
    date: "2026-05-14T08:30:00Z",
    name: "Tortitas de avena y claras de huevo acompañadas de frutos rojos silvestre",
    calories: 350,
    protein: 24.0,
    carbs: 45.0,
    fat: 5.0
  },
  {
    date: "2026-05-14T13:45:00Z",
    name: "Arroz basmati con pechuga de pollo al curry y un toque de leche de coco ligera",
    calories: 610,
    protein: 42.0,
    carbs: 65.0,
    fat: 16.0
  },
  {
    date: "2026-05-14T17:30:00Z",
    name: "Puñado de almendras tostadas sin sal y una taza de kéfir natural",
    calories: 280,
    protein: 14.0,
    carbs: 16.0,
    fat: 15.0
  },
  {
    date: "2026-05-14T21:15:00Z",
    name: "Tortilla de patatas ligera (hecha al horno) con ensalada caprese de tomate",
    calories: 480,
    protein: 18.0,
    carbs: 40.0,
    fat: 24.0
  },

  // Day 15 (Friday, May 15)
  {
    date: "2026-05-15T08:15:00Z",
    name: "Revuelto de tofu con cúrcuma, espinacas baby y tostadas integrales",
    calories: 380,
    protein: 22.0,
    carbs: 38.0,
    fat: 14.0
  },
  {
    date: "2026-05-15T14:00:00Z",
    name: "Wrap de trigo integral relleno de pollo asado, lechuga, tomate y salsa de yogur",
    calories: 530,
    protein: 35.0,
    carbs: 42.0,
    fat: 16.0
  },
  {
    date: "2026-05-15T17:30:00Z",
    name: "Queso batido 0% con nueces troceadas y una pizca de cacao puro en polvo",
    calories: 260,
    protein: 20.0,
    carbs: 12.0,
    fat: 12.0
  },
  {
    date: "2026-05-15T20:45:00Z",
    name: "Brochetas de langostinos y verduras al wok acompañadas de arroz salvaje",
    calories: 470,
    protein: 38.0,
    carbs: 48.0,
    fat: 8.0
  },

  // Day 16 (Saturday, May 16)
  {
    date: "2026-05-16T09:00:00Z",
    name: "Gofres de avena caseros decorados con fresas laminadas y sirope de agave",
    calories: 390,
    protein: 16.0,
    carbs: 62.0,
    fat: 7.0
  },
  {
    date: "2026-05-16T14:30:00Z",
    name: "Entrecot de ternera a la parrilla con patata asada y pimientos de Padrón",
    calories: 680,
    protein: 46.0,
    carbs: 38.0,
    fat: 32.0
  },
  {
    date: "2026-05-16T18:00:00Z",
    name: "Bol de piña natural troceada con un yogur skyr natural",
    calories: 190,
    protein: 16.0,
    carbs: 24.0,
    fat: 1.0
  },
  {
    date: "2026-05-16T21:30:00Z",
    name: "Sushi variado premium (maki, nigiri de salmón y atún) con edamame al vapor",
    calories: 590,
    protein: 28.0,
    carbs: 85.0,
    fat: 10.0
  },

  // Day 17 (Sunday, May 17)
  {
    date: "2026-05-17T08:30:00Z",
    name: "Huevos revueltos con champiñones salteados y tostadas de centeno integral",
    calories: 360,
    protein: 20.0,
    carbs: 28.0,
    fat: 16.0
  },
  {
    date: "2026-05-17T14:00:00Z",
    name: "Paella de marisco casera tradicional con langostinos, calamar y mejillones",
    calories: 620,
    protein: 32.0,
    carbs: 80.0,
    fat: 12.0
  },
  {
    date: "2026-05-17T17:45:00Z",
    name: "Batido de proteína whey isolada con plátano maduro y avena molida",
    calories: 340,
    protein: 32.0,
    carbs: 42.0,
    fat: 5.0
  },
  {
    date: "2026-05-17T20:30:00Z",
    name: "Crema templada de calabacín y puerros con picatostes y taquitos de jamón serrano",
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

  // Eliminar comidas pre-existentes entre el 10 y el 17 de mayo para evitar duplicados
  const startDate = new Date("2026-05-10T00:00:00Z");
  const endDate = new Date("2026-05-17T23:59:59Z");

  const deleteCount = await prisma.foodEntry.deleteMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  console.log(`🧹 Eliminados ${deleteCount.count} registros de comida antiguos para los días del 10 al 17 de mayo.`);

  // Insertar los registros realistas
  console.log("🍱 Insertando registros de comida realistas...");
  
  let insertedCount = 0;
  for (const meal of MEALS_DATA) {
    await prisma.foodEntry.create({
      data: {
        userId,
        date: new Date(meal.date),
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat
      }
    });
    insertedCount++;
  }

  console.log(`🎉 ¡ÉXITO! Se han poblado correctamente ${insertedCount} registros de comida del 10 al 17 de mayo para cliente@gmail.com.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
