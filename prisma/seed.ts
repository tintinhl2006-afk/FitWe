import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const curatedExercises = [
  // PECHO
  { name: 'Press de Banca', primaryMuscle: 'Pecho', equipment: 'Barra', description: 'Ejercicio básico para el pectoral. Acuéstate en el banco, agarra la barra a una anchura ligeramente superior a los hombros y bájala hasta rozar el pecho medio.' },
  { name: 'Press de Banca Inclinado', primaryMuscle: 'Pecho', equipment: 'Barra', description: 'Enfocado en el haz clavicular (pecho superior). Banco a 30-45 grados. Baja la barra hasta la parte alta del pecho.' },
  { name: 'Press con Mancuernas', primaryMuscle: 'Pecho', equipment: 'Mancuernas', description: 'Permite mayor rango de recorrido que la barra. Junta las mancuernas arriba sin que lleguen a chocar.' },
  { name: 'Aperturas con Mancuernas', primaryMuscle: 'Pecho', equipment: 'Mancuernas', description: 'Movimiento de aislamiento. Mantén una ligera flexión de codo y abre los brazos como si fueras a dar un abrazo.' },
  { name: 'Press de Pecho en Máquina', primaryMuscle: 'Pecho', equipment: 'Máquina', description: 'Versión guiada del press. Ideal para llegar al fallo muscular con seguridad.' },

  // ESPALDA
  { name: 'Dominadas Pronas', primaryMuscle: 'Espalda', equipment: 'Peso Corporal', description: 'Agarre ancho. Sube hasta pasar la barbilla por encima de la barra.' },
  { name: 'Jalón al Pecho', primaryMuscle: 'Espalda', equipment: 'Polea', description: 'Tira de la barra hacia la clavícula retrayendo las escápulas. No te balancees excesivamente.' },
  { name: 'Remo con Barra', primaryMuscle: 'Espalda', equipment: 'Barra', description: 'Inclina el torso a unos 45 grados. Lleva la barra hacia tu ombligo.' },
  { name: 'Remo con Mancuerna a 1 Mano', primaryMuscle: 'Espalda', equipment: 'Mancuernas', description: 'Apoya una rodilla y mano en un banco. Tira de la mancuerna llevando el codo hacia la cadera.' },
  { name: 'Remo Gironda (Polea Baja)', primaryMuscle: 'Espalda', equipment: 'Polea', description: 'Sentado en el suelo, tira del triángulo hacia el estómago manteniendo la espalda neutra.' },
  { name: 'Peso Muerto Clásico', primaryMuscle: 'Espalda', equipment: 'Barra', description: 'Levanta el peso desde el suelo con espalda recta. Trabaja cadena posterior completa.' },

  // HOMBRO
  { name: 'Press Militar de Pie', primaryMuscle: 'Hombro', equipment: 'Barra', description: 'Empuje vertical por excelencia. Aprieta glúteos y core para no arquear la espalda.' },
  { name: 'Press de Hombro Sentado', primaryMuscle: 'Hombro', equipment: 'Mancuernas', description: 'Sentado con banco a 90 grados. Empuja las mancuernas por encima de la cabeza.' },
  { name: 'Elevaciones Laterales', primaryMuscle: 'Hombro', equipment: 'Mancuernas', description: 'Aislamiento clave para la anchura de hombros. Eleva los codos ligeramente por delante del torso.' },
  { name: 'Face Pull', primaryMuscle: 'Hombro', equipment: 'Polea', description: 'Usa la cuerda en polea alta y tira hacia tu cara, separando las manos al final.' },

  // PIERNA
  { name: 'Sentadilla Libre', primaryMuscle: 'Pierna', equipment: 'Barra', description: 'El rey de los ejercicios. Barra en la espalda alta, desciende hasta romper el paralelo.' },
  { name: 'Prensa de Piernas', primaryMuscle: 'Pierna', equipment: 'Máquina', description: 'Ajusta los pies bajos y juntos para cuádriceps, o altos y separados para glúteos e isquios.' },
  { name: 'Extensiones de Cuádriceps', primaryMuscle: 'Pierna', equipment: 'Máquina', description: 'Aislamiento puro para cuádriceps. Aprieta fuerte un segundo arriba.' },
  { name: 'Curl Femoral Sentado', primaryMuscle: 'Pierna', equipment: 'Máquina', description: 'Aislamiento para isquiosurales. Mantiene el músculo en mayor elongación inicial.' },
  { name: 'Hip Thrust (Empuje de Cadera)', primaryMuscle: 'Pierna', equipment: 'Barra', description: 'El mejor ejercicio para aislar el glúteo. Empuja con fuerza usando los talones.' },

  // BRAZO
  { name: 'Curl con Barra EZ', primaryMuscle: 'Brazo', equipment: 'Barra', description: 'Versión más amigable con las muñecas gracias al agarre curvado.' },
  { name: 'Curl de Bíceps Alterno', primaryMuscle: 'Brazo', equipment: 'Mancuernas', description: 'Sube una mancuerna y luego la otra, supinando la muñeca.' },
  { name: 'Curl Martillo', primaryMuscle: 'Brazo', equipment: 'Mancuernas', description: 'Agarre neutro. Trabaja el bíceps braquial y braquiorradial (antebrazo).' },
  { name: 'Press Francés', primaryMuscle: 'Brazo', equipment: 'Barra', description: 'Tumbado, lleva la barra hacia la frente o detrás de la cabeza flexionando los codos.' },
  { name: 'Extensión de Tríceps con Cuerda', primaryMuscle: 'Brazo', equipment: 'Polea', description: 'Abre la cuerda al final del movimiento para mayor contracción lateral.' },

  // CORE
  { name: 'Crunch Abdominal', primaryMuscle: 'Core', equipment: 'Peso Corporal', description: 'Encogimiento clásico. Eleva solo los hombros del suelo apretando el abdomen.' },
  { name: 'Plancha Abdominal (Plank)', primaryMuscle: 'Core', equipment: 'Peso Corporal', description: 'Isométrico apoyado en antebrazos. Mantén el cuerpo en línea recta.' },

  // CARDIO
  { name: 'Cinta de Correr', primaryMuscle: 'Cardio', equipment: 'Máquina', description: 'Trabajo aeróbico o HIIT caminando, trotando o corriendo.' },
  { name: 'Bicicleta Estática', primaryMuscle: 'Cardio', equipment: 'Máquina', description: 'Cardio de bajo impacto articular.' }
];

async function main() {
  console.log('⚡ Iniciando proceso de siembra premium de base de datos...');

  // 1. Clean previous seeded users to prevent unique constraint failures
  const testEmails = [
    'gimnasio@gmail.com',
    'cliente@gmail.com',
    'sofia.valencia@gmail.com',
    'lucas.rodriguez@gmail.com',
    'marta.sanz@gmail.com',
    'javier.gomez@gmail.com',
    'elena.ruiz@gmail.com',
    'alejandro.ortiz@gmail.com',
    'valeria.castro@gmail.com',
    'diego.morales@gmail.com',
    'clara.benitez@gmail.com'
  ];

  console.log('🧹 Eliminando datos previos del catálogo y usuarios de test...');
  await prisma.foodEntry.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.mealEntry.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.workoutSet.deleteMany({ where: { session: { user: { email: { in: testEmails } } } } });
  await prisma.workoutSession.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.routineExercise.deleteMany({ where: { routine: { user: { email: { in: testEmails } } } } });
  await prisma.routine.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.nutritionProfile.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.classBooking.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.paymentRecord.deleteMany({ where: { user: { email: { in: testEmails } } } });
  await prisma.gymClass.deleteMany({ where: { gym: { email: 'gimnasio@gmail.com' } } });
  await prisma.classTemplate.deleteMany({ where: { gym: { email: 'gimnasio@gmail.com' } } });
  await prisma.accessLog.deleteMany({ where: { OR: [ { user: { email: { in: testEmails } } }, { gym: { email: 'gimnasio@gmail.com' } } ] } });
  await prisma.subscriptionPlan.deleteMany({ where: { gym: { email: 'gimnasio@gmail.com' } } });
  await prisma.user.deleteMany({ where: { email: { in: testEmails } } });

  // 2. Ensure Exercises Curated Catalog Exists
  console.log('💪 Asegurando catálogo curado de ejercicios...');
  for (const ex of curatedExercises) {
    await prisma.exercise.upsert({
      where: { id: '00000000-0000-0000-0000-000000000000' }, // Dummy or match by name manually
      create: {
        name: ex.name,
        muscleGroup: ex.primaryMuscle,
        equipment: ex.equipment,
        description: ex.description,
      },
      update: {}
    }).catch(async () => {
      // If upsert unique failed on id, simply find or create by name
      const exists = await prisma.exercise.findFirst({ where: { name: ex.name } });
      if (!exists) {
        await prisma.exercise.create({
          data: {
            name: ex.name,
            muscleGroup: ex.primaryMuscle,
            equipment: ex.equipment,
            description: ex.description,
          }
        });
      }
    });
  }

  // Get all active exercises mapped by name for easy reference later
  const exerciseMap: Record<string, any> = {};
  const dbExercises = await prisma.exercise.findMany();
  dbExercises.forEach(e => {
    exerciseMap[e.name] = e;
  });

  // Helper hash function
  const gymPasswordHash = await bcrypt.hash('prueba', 10);
  const clientPasswordHash = await bcrypt.hash('cliente123', 10);

  // 3. Create Gym Account
  console.log('🏛️ Creando cuenta de gimnasio "Iron Temple Fitness"...');
  const gym = await prisma.user.create({
    data: {
      email: 'gimnasio@gmail.com',
      password: gymPasswordHash,
      name: 'Iron Temple Fitness',
      role: 'GYM',
      monthlyFee: 39.99,
      subscriptionStatus: 'ACTIVE',
      mustChangePassword: false,
      gymCode: 'FITWE1',
      stripeEnabled: true,
    }
  });

  // 4. Create Curated Plans for the Gym
  console.log('💳 Creando tarifas y planes del gimnasio...');
  const planStandard = await prisma.subscriptionPlan.create({
    data: {
      gymId: gym.id,
      name: 'Pase Mensual Estándar',
      price: 39.99,
      durationDays: 30,
      description: 'Acceso total a la sala de musculación, vestuarios y taquillas.'
    }
  });

  const planTrimestral = await prisma.subscriptionPlan.create({
    data: {
      gymId: gym.id,
      name: 'Bono Trimestral Ahorro',
      price: 99.99,
      durationDays: 90,
      description: 'Acceso total por 3 meses con descuento especial.'
    }
  });

  const planAnual = await prisma.subscriptionPlan.create({
    data: {
      gymId: gym.id,
      name: 'Anual Premium Club',
      price: 359.99,
      durationDays: 365,
      description: 'Acceso ilimitado por un año completo con toalla y asesoría inicial gratuita.'
    }
  });

  // 5. Create Realistic Gym Classes
  console.log('🗓️ Creando clases grupales...');
  const classCrossfit = await prisma.gymClass.create({
    data: {
      gymId: gym.id,
      name: 'CrossFit Elite',
      description: 'Entrenamiento funcional de alta intensidad que combina halterofilia, gimnasia y cardio.',
      instructor: 'Marcos Peña',
      capacity: 20,
      startTime: new Date('2026-05-19T10:00:00Z'),
      endTime: new Date('2026-05-19T11:00:00Z'),
    }
  });

  const classCycling = await prisma.gymClass.create({
    data: {
      gymId: gym.id,
      name: 'Ciclo Indoor Virtual',
      description: 'Sesión de ciclismo indoor con música estimulante y recorridos virtuales exigentes.',
      instructor: 'Laura Serna',
      capacity: 25,
      startTime: new Date('2026-05-20T18:00:00Z'),
      endTime: new Date('2026-05-20T19:00:00Z'),
    }
  });

  const classYoga = await prisma.gymClass.create({
    data: {
      gymId: gym.id,
      name: 'Power Yoga Flow',
      description: 'Clase dinámica para trabajar fuerza, flexibilidad, core y meditación activa.',
      instructor: 'Diana Mendoza',
      capacity: 15,
      startTime: new Date('2026-05-21T09:00:00Z'),
      endTime: new Date('2026-05-21T10:00:00Z'),
    }
  });

  // 6. Create 10 Premium, Realistic Gym Clients
  console.log('👥 Creando 10 clientes con suscripciones y estados realistas...');

  const clientsData = [
    {
      name: 'Sofia Valencia',
      email: 'sofia.valencia@gmail.com',
      weight: 62.5,
      height: 165.0,
      plan: planStandard,
      status: 'ACTIVE',
      daysRemaining: 22,
    },
    {
      name: 'Lucas Rodríguez',
      email: 'lucas.rodriguez@gmail.com',
      weight: 88.0,
      height: 182.0,
      plan: planTrimestral,
      status: 'ACTIVE',
      daysRemaining: 1, // Ending very soon!
    },
    {
      name: 'Marta Sanz',
      email: 'marta.sanz@gmail.com',
      weight: 58.0,
      height: 160.0,
      plan: planStandard,
      status: 'EXPIRED',
      daysRemaining: -4, // Expired 4 days ago
    },
    {
      name: 'Javier Gómez',
      email: 'javier.gomez@gmail.com',
      weight: 79.2,
      height: 175.0,
      plan: planAnual,
      status: 'ACTIVE',
      daysRemaining: 180,
    },
    {
      name: 'Elena Ruiz',
      email: 'elena.ruiz@gmail.com',
      weight: 66.8,
      height: 169.0,
      plan: planTrimestral,
      status: 'ACTIVE',
      daysRemaining: 45,
    },
    {
      name: 'Alejandro Ortiz',
      email: 'alejandro.ortiz@gmail.com',
      weight: 94.5,
      height: 188.0,
      plan: planStandard,
      status: 'EXPIRED',
      daysRemaining: -12, // Expired 12 days ago
    },
    {
      name: 'Valeria Castro',
      email: 'valeria.castro@gmail.com',
      weight: 55.4,
      height: 163.0,
      plan: planStandard,
      status: 'ACTIVE',
      daysRemaining: 14,
    },
    {
      name: 'Diego Morales',
      email: 'diego.morales@gmail.com',
      weight: 84.1,
      height: 180.0,
      plan: planStandard,
      status: 'ACTIVE',
      daysRemaining: 8,
    },
    {
      name: 'Clara Benítez',
      email: 'clara.benitez@gmail.com',
      weight: 60.2,
      height: 167.0,
      plan: planTrimestral,
      status: 'ACTIVE',
      daysRemaining: 5,
    }
  ];

  let seededInvoiceCounter = 1;
  const currentYear = new Date().getFullYear();

  for (const c of clientsData) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + c.daysRemaining);

    const clientUser = await prisma.user.create({
      data: {
        email: c.email,
        password: clientPasswordHash,
        name: c.name,
        role: 'USER',
        gymId: gym.id,
        weight: c.weight,
        height: c.height,
        planId: c.plan.id,
        subscriptionStatus: c.status,
        subscriptionEndDate: endDate,
        mustChangePassword: false,
      }
    });

    const invoiceNumber = `F-${currentYear}-${String(seededInvoiceCounter++).padStart(5, "0")}`;

    // Create a payment record
    await prisma.paymentRecord.create({
      data: {
        userId: clientUser.id,
        amount: c.plan.price,
        description: `Pago de tarifa: ${c.plan.name}`,
        date: new Date(new Date().setDate(new Date().getDate() - (c.plan.durationDays - Math.max(0, c.daysRemaining)))),
        planId: c.plan.id,
        invoiceNumber,
      }
    });

    // Create a simple routine
    const routine = await prisma.routine.create({
      data: {
        name: 'Rutina General Acondicionamiento',
        userId: clientUser.id,
      }
    });

    if (exerciseMap['Press de Banca'] && exerciseMap['Sentadilla Libre']) {
      await prisma.routineExercise.createMany({
        data: [
          { routineId: routine.id, exerciseId: exerciseMap['Press de Banca'].id, sets: 4, reps: 10, weight: 50.0, order: 0 },
          { routineId: routine.id, exerciseId: exerciseMap['Sentadilla Libre'].id, sets: 4, reps: 10, weight: 60.0, order: 1 }
        ]
      });
    }

    // Book a class
    await prisma.classBooking.create({
      data: {
        userId: clientUser.id,
        classId: classCrossfit.id,
        status: 'CONFIRMED'
      }
    });
  }

  // 7. Create The Important Main Client: cliente@gmail.com (Carlos Mendoza)
  console.log('🔥 Creando el cliente estrella: cliente@gmail.com (Carlos Mendoza)...');
  const mainClientEndDate = new Date();
  mainClientEndDate.setDate(mainClientEndDate.getDate() + 25);

  const mainClient = await prisma.user.create({
    data: {
      email: 'cliente@gmail.com',
      password: clientPasswordHash,
      name: 'Carlos Mendoza',
      role: 'USER',
      gymId: gym.id,
      weight: 82.5,
      height: 178.0,
      planId: planStandard.id,
      subscriptionStatus: 'ACTIVE',
      subscriptionEndDate: mainClientEndDate,
      mustChangePassword: false,
    }
  });

  const mainClientInvoiceNumber = `F-${currentYear}-${String(seededInvoiceCounter++).padStart(5, "0")}`;

  // Create payment record
  await prisma.paymentRecord.create({
    data: {
      userId: mainClient.id,
      amount: planStandard.price,
      description: `Pago de tarifa: ${planStandard.name}`,
      date: new Date('2026-05-01T10:00:00Z'),
      planId: planStandard.id,
      invoiceNumber: mainClientInvoiceNumber,
    }
  });

  console.log('📈 Configurando secuencia inicial de facturas...');
  await prisma.gymInvoiceSequence.create({
    data: {
      gymId: gym.id,
      nextValue: seededInvoiceCounter,
    }
  });

  // Create Nutrition Profile
  console.log('🥗 Creando Perfil de Nutrición de Carlos Mendoza...');
  await prisma.nutritionProfile.create({
    data: {
      userId: mainClient.id,
      gender: 'male',
      age: 28,
      weight: 82.5,
      height: 178.0,
      activityLevel: 'ACTIVE',
      goal: 'LOSE',
      aggressiveness: 'NORMAL',
      targetCalories: 2350,
      targetProtein: 180,
      targetFat: 75,
      targetCarbs: 220,
    }
  });

  // Create 3 premium routines for Carlos
  console.log('📋 Creando rutinas de Carlos...');
  const routineEmpuje = await prisma.routine.create({
    data: { name: 'Empuje (Pecho/Hombro/Tríceps)', userId: mainClient.id }
  });
  const routineTiron = await prisma.routine.create({
    data: { name: 'Tirón (Espalda/Bíceps)', userId: mainClient.id }
  });
  const routinePiernas = await prisma.routine.create({
    data: { name: 'Piernas Enfoque Glúteo', userId: mainClient.id }
  });

  // Add routine exercises
  if (exerciseMap['Press de Banca'] && exerciseMap['Press Militar de Pie'] && exerciseMap['Extensión de Tríceps con Cuerda']) {
    await prisma.routineExercise.createMany({
      data: [
        { routineId: routineEmpuje.id, exerciseId: exerciseMap['Press de Banca'].id, sets: 4, reps: 8, weight: 70.0, order: 0 },
        { routineId: routineEmpuje.id, exerciseId: exerciseMap['Press Militar de Pie'].id, sets: 3, reps: 10, weight: 40.0, order: 1 },
        { routineId: routineEmpuje.id, exerciseId: exerciseMap['Extensión de Tríceps con Cuerda'].id, sets: 3, reps: 12, weight: 22.5, order: 2 }
      ]
    });
  }

  if (exerciseMap['Jalón al Pecho'] && exerciseMap['Remo con Barra'] && exerciseMap['Curl de Bíceps Alterno']) {
    await prisma.routineExercise.createMany({
      data: [
        { routineId: routineTiron.id, exerciseId: exerciseMap['Jalón al Pecho'].id, sets: 4, reps: 10, weight: 60.0, order: 0 },
        { routineId: routineTiron.id, exerciseId: exerciseMap['Remo con Barra'].id, sets: 4, reps: 8, weight: 65.0, order: 1 },
        { routineId: routineTiron.id, exerciseId: exerciseMap['Curl de Bíceps Alterno'].id, sets: 3, reps: 12, weight: 14.0, order: 2 }
      ]
    });
  }

  if (exerciseMap['Sentadilla Libre'] && exerciseMap['Hip Thrust (Empuje de Cadera)'] && exerciseMap['Cinta de Correr']) {
    await prisma.routineExercise.createMany({
      data: [
        { routineId: routinePiernas.id, exerciseId: exerciseMap['Sentadilla Libre'].id, sets: 4, reps: 8, weight: 90.0, order: 0 },
        { routineId: routinePiernas.id, exerciseId: exerciseMap['Hip Thrust (Empuje de Cadera)'].id, sets: 4, reps: 10, weight: 110.0, order: 1 },
        { routineId: routinePiernas.id, exerciseId: exerciseMap['Cinta de Correr'].id, sets: 1, reps: 1, weight: 5.0, order: 2 } // Distance 5 km
      ]
    });
  }

  // 8. Populate Completed Workout Sessions from May 5th to May 12th, 2026
  console.log('🏋️‍♂️ Generando historial de entrenamientos completados del 5 al 12 de Mayo...');

  const workouts = [
    {
      date: '2026-05-05',
      startTime: '2026-05-05T18:00:00Z',
      endTime: '2026-05-05T19:15:00Z',
      routineId: routineEmpuje.id,
      sets: [
        { exercise: 'Press de Banca', weight: 70.0, reps: 8 },
        { exercise: 'Press de Banca', weight: 70.0, reps: 8 },
        { exercise: 'Press de Banca', weight: 72.5, reps: 7 },
        { exercise: 'Press Militar de Pie', weight: 40.0, reps: 10 },
        { exercise: 'Press Militar de Pie', weight: 40.0, reps: 9 },
        { exercise: 'Extensión de Tríceps con Cuerda', weight: 22.5, reps: 12 },
        { exercise: 'Extensión de Tríceps con Cuerda', weight: 25.0, reps: 10 }
      ]
    },
    {
      date: '2026-05-07',
      startTime: '2026-05-07T18:30:00Z',
      endTime: '2026-05-07T19:45:00Z',
      routineId: routineTiron.id,
      sets: [
        { exercise: 'Jalón al Pecho', weight: 60.0, reps: 10 },
        { exercise: 'Jalón al Pecho', weight: 60.0, reps: 10 },
        { exercise: 'Remo con Barra', weight: 65.0, reps: 8 },
        { exercise: 'Remo con Barra', weight: 65.0, reps: 8 },
        { exercise: 'Curl de Bíceps Alterno', weight: 14.0, reps: 12 },
        { exercise: 'Curl de Bíceps Alterno', weight: 14.0, reps: 12 }
      ]
    },
    {
      date: '2026-05-09',
      startTime: '2026-05-09T10:00:00Z',
      endTime: '2026-05-09T11:20:00Z',
      routineId: routinePiernas.id,
      sets: [
        { exercise: 'Sentadilla Libre', weight: 90.0, reps: 8 },
        { exercise: 'Sentadilla Libre', weight: 90.0, reps: 8 },
        { exercise: 'Sentadilla Libre', weight: 95.0, reps: 6 },
        { exercise: 'Hip Thrust (Empuje de Cadera)', weight: 110.0, reps: 10 },
        { exercise: 'Hip Thrust (Empuje de Cadera)', weight: 120.0, reps: 8 },
        { exercise: 'Cinta de Correr', weight: 5.2, reps: 1 } // 5.2 km distance
      ]
    },
    {
      date: '2026-05-11',
      startTime: '2026-05-11T19:00:00Z',
      endTime: '2026-05-11T20:15:00Z',
      routineId: routineEmpuje.id,
      sets: [
        { exercise: 'Press de Banca', weight: 72.5, reps: 8 }, // PR!
        { exercise: 'Press de Banca', weight: 72.5, reps: 8 },
        { exercise: 'Press de Banca', weight: 75.0, reps: 6 },
        { exercise: 'Press Militar de Pie', weight: 42.5, reps: 10 },
        { exercise: 'Extensión de Tríceps con Cuerda', weight: 25.0, reps: 12 }
      ]
    },
    {
      date: '2026-05-12',
      startTime: '2026-05-12T17:30:00Z',
      endTime: '2026-05-12T18:40:00Z',
      routineId: routineTiron.id,
      sets: [
        { exercise: 'Jalón al Pecho', weight: 62.5, reps: 10 },
        { exercise: 'Jalón al Pecho', weight: 65.0, reps: 8 },
        { exercise: 'Remo con Barra', weight: 67.5, reps: 8 },
        { exercise: 'Curl de Bíceps Alterno', weight: 16.0, reps: 10 }
      ]
    }
  ];

  for (const w of workouts) {
    const session = await prisma.workoutSession.create({
      data: {
        userId: mainClient.id,
        routineId: w.routineId,
        startTime: new Date(w.startTime),
        endTime: new Date(w.endTime),
        createdAt: new Date(w.startTime)
      }
    });

    for (const s of w.sets) {
      const exRecord = exerciseMap[s.exercise];
      if (exRecord) {
        await prisma.workoutSet.create({
          data: {
            sessionId: session.id,
            exerciseId: exRecord.id,
            weight: s.weight,
            reps: s.reps,
            isCompleted: true
          }
        });
      }
    }
  }

  // 9. Populate Completed Food Logs from May 5th to May 12th, 2026
  console.log('🍏 Generando bitácora diaria de comidas del 5 al 12 de Mayo...');

  const mealsData = [
    {
      date: '2026-05-05',
      meals: [
        { name: 'Avena con plátano y proteína', calories: 540, protein: 38, carbs: 65, fat: 12 },
        { name: 'Pechuga de pollo con arroz jazmín y brócoli', calories: 680, protein: 52, carbs: 80, fat: 14 },
        { name: 'Batido de proteína con almendras', calories: 320, protein: 30, carbs: 10, fat: 16 },
        { name: 'Salmón a la plancha con puré de patatas', calories: 620, protein: 45, carbs: 40, fat: 25 }
      ]
    },
    {
      date: '2026-05-06',
      meals: [
        { name: 'Tortilla de 3 huevos con espinacas y tostadas', calories: 480, protein: 32, carbs: 35, fat: 18 },
        { name: 'Ternera magra guisada con patatas y zanahorias', calories: 720, protein: 48, carbs: 75, fat: 22 },
        { name: 'Yogur griego con arándanos y nueces', calories: 290, protein: 20, carbs: 18, fat: 15 },
        { name: 'Ensalada César templada con pollo', calories: 510, protein: 42, carbs: 15, fat: 30 }
      ]
    },
    {
      date: '2026-05-07',
      meals: [
        { name: 'Tostadas integrales con aguacate y queso fresco', calories: 460, protein: 18, carbs: 42, fat: 24 },
        { name: 'Pasta integral con salsa boloñesa de pavo', calories: 710, protein: 46, carbs: 95, fat: 15 },
        { name: 'Manzana con crema de cacahuete', calories: 280, protein: 8, carbs: 22, fat: 18 },
        { name: 'Dorada al horno con verduras asadas', calories: 490, protein: 38, carbs: 25, fat: 12 }
      ]
    },
    {
      date: '2026-05-08',
      meals: [
        { name: 'Avena con plátano y proteína', calories: 540, protein: 38, carbs: 65, fat: 12 },
        { name: 'Pechuga de pollo con arroz jazmín y brócoli', calories: 680, protein: 52, carbs: 80, fat: 14 },
        { name: 'Batido de proteína con almendras', calories: 320, protein: 30, carbs: 10, fat: 16 },
        { name: 'Revuelto de claras con jamón y espárragos', calories: 410, protein: 40, carbs: 8, fat: 20 }
      ]
    },
    {
      date: '2026-05-09',
      meals: [
        { name: 'Tortilla de 3 huevos con espinacas y tostadas', calories: 480, protein: 32, carbs: 35, fat: 18 },
        { name: 'Ternera magra guisada con patatas y zanahorias', calories: 720, protein: 48, carbs: 75, fat: 22 },
        { name: 'Tortitas de arroz con pavo y queso crema', calories: 260, protein: 16, carbs: 30, fat: 8 },
        { name: 'Salmón a la plancha con puré de patatas', calories: 620, protein: 45, carbs: 40, fat: 25 }
      ]
    },
    {
      date: '2026-05-10',
      meals: [
        { name: 'Avena con fresas y proteína', calories: 510, protein: 38, carbs: 58, fat: 10 },
        { name: 'Lentejas estofadas con verduras y arroz', calories: 650, protein: 28, carbs: 90, fat: 12 },
        { name: 'Yogur griego con arándanos y nueces', calories: 290, protein: 20, carbs: 18, fat: 15 },
        { name: 'Ensalada César templada con pollo', calories: 510, protein: 42, carbs: 15, fat: 30 }
      ]
    },
    {
      date: '2026-05-11',
      meals: [
        { name: 'Tortilla de 3 huevos con espinacas y tostadas', calories: 480, protein: 32, carbs: 35, fat: 18 },
        { name: 'Pasta integral con salsa boloñesa de pavo', calories: 710, protein: 46, carbs: 95, fat: 15 },
        { name: 'Batido de proteína con almendras', calories: 320, protein: 30, carbs: 10, fat: 16 },
        { name: 'Salmón a la plancha con puré de patatas', calories: 620, protein: 45, carbs: 40, fat: 25 }
      ]
    },
    {
      date: '2026-05-12',
      meals: [
        { name: 'Tostadas integrales con aguacate y queso fresco', calories: 460, protein: 18, carbs: 42, fat: 24 },
        { name: 'Pechuga de pollo con arroz jazmín y brócoli', calories: 680, protein: 52, carbs: 80, fat: 14 },
        { name: 'Yogur griego con arándanos y nueces', calories: 290, protein: 20, carbs: 18, fat: 15 },
        { name: 'Revuelto de claras con jamón y espárragos', calories: 410, protein: 40, carbs: 8, fat: 20 }
      ]
    }
  ];

  for (const day of mealsData) {
    const mealDate = new Date(`${day.date}T12:00:00Z`);

    for (const m of day.meals) {
      await prisma.foodEntry.create({
        data: {
          userId: mainClient.id,
          date: mealDate,
          name: m.name,
          calories: m.calories,
          protein: m.protein,
          carbs: m.carbs,
          fat: m.fat,
        }
      });
    }
  }

  // 10. Book a class for Carlos
  console.log('🎟️ Registrando reserva a clases para Carlos...');
  await prisma.classBooking.create({
    data: {
      userId: mainClient.id,
      classId: classCycling.id,
      status: 'CONFIRMED'
    }
  });

  console.log('🚀 ✅ ¡Siembra de datos premium completada exitosamente! Todas las cuentas de producción listas para tu presentación.');
}

main()
  .catch(e => {
    console.error('❌ Error en el proceso de siembra:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
