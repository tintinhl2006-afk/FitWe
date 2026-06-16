import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const gymEmail = 'martinherrerolitarte@gmail.com';
  const gym = await prisma.user.findUnique({
    where: { email: gymEmail },
  });

  if (!gym) {
    console.error(`Gym user with email ${gymEmail} not found. Aborting seed.`);
    process.exit(1);
  }

  console.log(`Found Gym: ${gym.name} (${gym.id})`);

  const mockNames = [
    'Carlos García',
    'María Rodríguez',
    'Javier López',
    'Laura Martínez',
    'David Sánchez',
    'Ana Pérez',
    'Miguel Gómez',
    'Lucía Martín',
    'Jorge Ruiz',
    'Elena Díaz'
  ];

  // Base password "password123" (Not hashed here since it's mock, but normally should be)
  // Wait, if users log in, they might need hashed password, but this is just for testing B2B analytics.
  const mockPassword = 'password123';

  // Make sure we have at least one exercise
  let exercise = await prisma.exercise.findFirst();
  if (!exercise) {
    exercise = await prisma.exercise.create({
      data: {
        name: 'Sentadilla Libre',
        muscleGroup: 'Piernas',
        description: 'Sentadilla con barra',
      }
    });
    console.log('Created dummy exercise.');
  }

  const baseDate = new Date('2026-05-09T12:00:00Z');

  for (let i = 0; i < 10; i++) {
    const name = mockNames[i];
    const email = `mockuser${i}@fitwe.test`;
    
    // Check if user exists to avoid unique constraint error on rerun
    let user = await prisma.user.findUnique({ where: { email } });
    
    const isActive = i < 7; // 7 active, 3 inactive
    
    // Active ends in June 2026, inactive ended in April 2026
    const endDate = isActive 
      ? new Date('2026-06-15T00:00:00Z') 
      : new Date('2026-04-10T00:00:00Z');

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          password: mockPassword,
          name,
          role: 'USER',
          gymId: gym.id,
          subscriptionStatus: isActive ? 'ACTIVE' : 'INACTIVE',
          subscriptionEndDate: endDate,
          mustChangePassword: false,
        }
      });
      console.log(`Created user: ${name} (${isActive ? 'ACTIVE' : 'INACTIVE'})`);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: isActive ? 'ACTIVE' : 'INACTIVE',
          subscriptionEndDate: endDate,
        }
      });
    }

    // Create PaymentRecords
    const existingPayments = await prisma.paymentRecord.count({ where: { userId: user.id } });
    if (existingPayments === 0) {
      await prisma.paymentRecord.create({
        data: {
          userId: user.id,
          amount: 49.99,
          description: 'Cuota mensual estándar',
          date: new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days before end date
        }
      });
      
      if (isActive) {
        // Active users might have an older payment too
        await prisma.paymentRecord.create({
          data: {
            userId: user.id,
            amount: 49.99,
            description: 'Cuota mensual estándar',
            date: new Date(endDate.getTime() - 60 * 24 * 60 * 60 * 1000)
          }
        });
      }
    }

    // Create Routines
    const existingRoutines = await prisma.routine.count({ where: { userId: user.id } });
    let routine1, routine2;
    if (existingRoutines === 0) {
      routine1 = await prisma.routine.create({
        data: {
          name: 'Full Body',
          userId: user.id,
        }
      });
      routine2 = await prisma.routine.create({
        data: {
          name: 'Empuje/Tirón',
          userId: user.id,
        }
      });
    } else {
      const routines = await prisma.routine.findMany({ where: { userId: user.id } });
      routine1 = routines[0];
      routine2 = routines[1] || routines[0];
    }

    // Create WorkoutSessions
    const existingSessions = await prisma.workoutSession.count({ where: { userId: user.id } });
    if (existingSessions === 0) {
      // Distribution of sessions: Active users have trained, Inactive users haven't recently
      if (isActive) {
        // Random number of sessions between 1 and 4
        const numSessions = Math.floor(Math.random() * 4) + 1; // 1 to 4 sessions
        for (let j = 0; j < numSessions; j++) {
          // Distributed in the last 7 days (May 2 - May 9)
          const daysAgo = Math.floor(Math.random() * 7);
          const sessionDate = new Date(baseDate.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          
          await prisma.workoutSession.create({
            data: {
              userId: user.id,
              routineId: j % 2 === 0 ? routine1.id : routine2.id,
              startTime: sessionDate,
              endTime: new Date(sessionDate.getTime() + 60 * 60 * 1000), // 1 hour later
              createdAt: sessionDate,
              workoutSets: {
                create: [
                  {
                    exerciseId: exercise.id,
                    weight: 60,
                    reps: 10,
                    isCompleted: true
                  },
                  {
                    exerciseId: exercise.id,
                    weight: 60,
                    reps: 10,
                    isCompleted: true
                  }
                ]
              }
            }
          });
        }
      } else {
        // Inactive user, maybe trained a long time ago
        const sessionDate = new Date('2026-03-15T12:00:00Z');
        await prisma.workoutSession.create({
            data: {
              userId: user.id,
              routineId: routine1.id,
              startTime: sessionDate,
              endTime: new Date(sessionDate.getTime() + 60 * 60 * 1000), // 1 hour later
              createdAt: sessionDate,
            }
        });
      }
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
