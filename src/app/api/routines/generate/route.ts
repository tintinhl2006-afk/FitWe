import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateWorkoutPlan, WorkoutPreference } from "@/lib/workoutEngine";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { days, level, split, priorities, lesiones, goal, nutricion } = body;

    // Validate inputs
    if (!days || !level || !split || !goal) {
      return NextResponse.json({ message: "Datos de entrada incompletos" }, { status: 400 });
    }

    const parsedDays = Number(days);
    if (isNaN(parsedDays) || parsedDays < 2 || parsedDays > 6) {
      return NextResponse.json({ message: "Días por semana no válidos (2 a 6)" }, { status: 400 });
    }

    // 1. Fetch available exercises from the DB
    const dbExercises = await prisma.exercise.findMany({
      select: {
        id: true,
        name: true,
        muscleGroup: true,
        equipment: true,
        description: true,
      },
    });

    const pref: WorkoutPreference = {
      days: parsedDays,
      level,
      split,
      priorities: Array.isArray(priorities) ? priorities : [],
      injuries: Array.isArray(lesiones) ? lesiones : [],
      goal,
      nutrition: nutricion || "mantenimiento",
    };

    // 2. Generate workout plan locally
    const plan = generateWorkoutPlan(pref, dbExercises);

    if (plan.length === 0) {
      return NextResponse.json({ message: "No se pudieron generar rutinas con las especificaciones dadas." }, { status: 422 });
    }

    // 3. Save routines inside a Prisma transaction
    const createdRoutines = await prisma.$transaction(async (tx) => {
      const routines = [];
      for (const routineData of plan) {
        // Create the Routine record
        const routine = await tx.routine.create({
          data: {
            name: routineData.name,
            userId: session.user.id,
          },
        });

        // Add exercises
        if (routineData.exercises.length > 0) {
          const exercisesToInsert = routineData.exercises.map((item, idx) => ({
            routineId: routine.id,
            exerciseId: item.exerciseId,
            sets: item.sets,
            reps: item.reps,
            repsList: item.repsList,
            weight: 0, // start at 0
            order: idx,
          }));

          await tx.routineExercise.createMany({
            data: exercisesToInsert,
          });
        }
        routines.push(routine);
      }
      return routines;
    });

    return NextResponse.json({ success: true, count: createdRoutines.length });
  } catch (error) {
    console.error("Error generating workout routines:", error);
    return NextResponse.json({ error: "Error al generar tus rutinas de entrenamiento" }, { status: 500 });
  }
}
