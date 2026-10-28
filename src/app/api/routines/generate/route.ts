import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateWorkoutPlan, WorkoutPreference } from "@/lib/workoutEngine";
import { getRequestUserId } from "@/lib/apiAuth";
import { MAX_REPS, MAX_SETS, boundedInt } from "@/lib/trainingLimits";
import { visibleExercisesWhere } from "@/lib/exerciseAccess";

export async function POST(req: Request) {
  try {
    const userId = await getRequestUserId(req);
    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { savePlan, days, level, split, priorities, lesiones, goal, nutricion, repeats } = body;

    // Save Mode: persist a user-customized plan
    if (savePlan) {
      if (!Array.isArray(savePlan) || savePlan.length === 0) {
        return NextResponse.json({ message: "Plan de entrenamiento no válido o vacío" }, { status: 400 });
      }

      // Bound the bulk insert: one request used to be able to create unlimited routines and rows.
      const planInvalid = () =>
        NextResponse.json({ message: "Plan de entrenamiento no válido" }, { status: 400 });
      if (savePlan.length > 14) return planInvalid();
      for (const r of savePlan) {
        if (typeof r?.name !== "string" || !r.name.trim() || r.name.length > 100) return planInvalid();
        const exs = r.exercises == null ? [] : r.exercises;
        if (!Array.isArray(exs) || exs.length > 60) return planInvalid();
        for (const item of exs) {
          if (
            typeof item?.exerciseId !== "string" ||
            boundedInt(item.sets, 1, MAX_SETS) === null ||
            boundedInt(item.reps, 0, MAX_REPS) === null ||
            (item.repsList != null && (typeof item.repsList !== "string" || item.repsList.length > 500))
          ) {
            return planInvalid();
          }
        }
      }

      // Every exercise in the plan must be one this user may use.
      type PlanRoutine = { exercises?: { exerciseId: string }[] | null };
      const wantedIds = Array.from(
        new Set((savePlan as PlanRoutine[]).flatMap((r) => (r.exercises ?? []).map((i) => i.exerciseId)))
      );
      if (wantedIds.length > 0) {
        const usableCount = await prisma.exercise.count({
          where: { id: { in: wantedIds }, ...(await visibleExercisesWhere(userId)) },
        });
        if (usableCount !== wantedIds.length) {
          return NextResponse.json({ message: "El plan contiene ejercicios no disponibles" }, { status: 400 });
        }
      }

      const createdRoutines = await prisma.$transaction(async (tx) => {
        const routines = [];
        for (const routineData of savePlan) {
          // Create the Routine record
          const routine = await tx.routine.create({
            data: {
              name: routineData.name,
              userId,
            },
          });

          // Add exercises
          if (routineData.exercises && routineData.exercises.length > 0) {
            const exercisesToInsert = routineData.exercises.map((item: any, idx: number) => ({
              routineId: routine.id,
              exerciseId: item.exerciseId,
              sets: Number(item.sets),
              reps: Number(item.reps),
              repsList: item.repsList || Array(Number(item.sets)).fill(Number(item.reps)).join(","),
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
    }

    // Preview Mode: generate preview plan based on parameters
    if (!days || !level || !split || !goal) {
      return NextResponse.json({ message: "Datos de entrada incompletos" }, { status: 400 });
    }

    const parsedDays = Number(days);
    if (isNaN(parsedDays) || parsedDays < 2 || parsedDays > 6) {
      return NextResponse.json({ message: "Días por semana no válidos (2 a 6)" }, { status: 400 });
    }

    // 1. Fetch available exercises from the DB
    // Generated plans draw from the shared catalog only, never from exercises other members
    // created (those carry arbitrary names and have no equipment data the engine relies on).
    const dbExercises = await prisma.exercise.findMany({
      where: { userId: null },
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
      repeats: Array.isArray(repeats) ? repeats : [],
    };

    // 2. Generate workout plan locally
    const plan = generateWorkoutPlan(pref, dbExercises);

    if (plan.length === 0) {
      return NextResponse.json({ message: "No se pudieron generar rutinas con las especificaciones dadas." }, { status: 422 });
    }

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("Error generating/saving workout routines:", error);
    return NextResponse.json({ error: "Error al gestionar tus rutinas de entrenamiento" }, { status: 500 });
  }
}
