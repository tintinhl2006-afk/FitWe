import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });
  const user = await prisma.user.findUnique({ 
    where: { id: session.user.id }, 
    select: { weightUnit: true, distanceUnit: true, measurementUnit: true } 
  });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });
  
  const { weightUnit, distanceUnit, measurementUnit } = await req.json();

  try {
    // 1. Fetch current settings to compare
    const oldUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { weightUnit: true, distanceUnit: true, measurementUnit: true, weight: true, height: true }
    });

    if (oldUser) {
      const oldWeightUnit = oldUser.weightUnit || "kg";
      const oldDistanceUnit = oldUser.distanceUnit || "km";
      const oldMeasurementUnit = oldUser.measurementUnit || "cm";

      // Weight conversion (kg <-> lbs)
      if (oldWeightUnit !== weightUnit && (weightUnit === "kg" || weightUnit === "lbs")) {
        const factor = weightUnit === "lbs" ? 2.20462 : (1 / 2.20462);

        // Update WorkoutSets (Strength exercises - weight)
        await prisma.$executeRaw`
          UPDATE "WorkoutSet"
          SET "weight" = ROUND(CAST("weight" * ${factor} AS numeric), 1)
          WHERE "sessionId" IN (
            SELECT "id" FROM "WorkoutSession" WHERE "userId" = CAST(${session.user.id} AS uuid)
          ) AND "exerciseId" IN (
            SELECT "id" FROM "Exercise" WHERE LOWER("muscleGroup") != 'cardio'
          )
        `;

        // Update RoutineExercises (Strength exercises - weight)
        await prisma.$executeRaw`
          UPDATE "RoutineExercise"
          SET "weight" = ROUND(CAST("weight" * ${factor} AS numeric), 1)
          WHERE "routineId" IN (
            SELECT "id" FROM "Routine" WHERE "userId" = CAST(${session.user.id} AS uuid)
          ) AND "exerciseId" IN (
            SELECT "id" FROM "Exercise" WHERE LOWER("muscleGroup") != 'cardio'
          )
        `;

        // Update User Weight
        if (oldUser.weight !== null) {
          await prisma.$executeRaw`
            UPDATE "User"
            SET "weight" = ROUND(CAST("weight" * ${factor} AS numeric), 1)
            WHERE "id" = CAST(${session.user.id} AS uuid)
          `;
        }

        // Update NutritionProfile Weight
        await prisma.$executeRaw`
          UPDATE "NutritionProfile"
          SET "weight" = ROUND(CAST("weight" * ${factor} AS numeric), 1)
          WHERE "userId" = CAST(${session.user.id} AS uuid)
        `;
      }

      // Distance conversion (km <-> mi)
      if (oldDistanceUnit !== distanceUnit && (distanceUnit === "km" || distanceUnit === "mi")) {
        const factor = distanceUnit === "mi" ? 0.621371 : (1 / 0.621371);

        // Update WorkoutSets (Cardio exercises - distance)
        await prisma.$executeRaw`
          UPDATE "WorkoutSet"
          SET "weight" = ROUND(CAST("weight" * ${factor} AS numeric), 1)
          WHERE "sessionId" IN (
            SELECT "id" FROM "WorkoutSession" WHERE "userId" = CAST(${session.user.id} AS uuid)
          ) AND "exerciseId" IN (
            SELECT "id" FROM "Exercise" WHERE LOWER("muscleGroup") = 'cardio'
          )
        `;

        // Update RoutineExercises (Cardio exercises - distance)
        await prisma.$executeRaw`
          UPDATE "RoutineExercise"
          SET "weight" = ROUND(CAST("weight" * ${factor} AS numeric), 1)
          WHERE "routineId" IN (
            SELECT "id" FROM "Routine" WHERE "userId" = CAST(${session.user.id} AS uuid)
          ) AND "exerciseId" IN (
            SELECT "id" FROM "Exercise" WHERE LOWER("muscleGroup") = 'cardio'
          )
        `;
      }

      // Measurement conversion (cm <-> in)
      if (oldMeasurementUnit !== measurementUnit && (measurementUnit === "cm" || measurementUnit === "in")) {
        const factor = measurementUnit === "in" ? 0.393701 : (1 / 0.393701);

        // Update User Height
        if (oldUser.height !== null) {
          await prisma.$executeRaw`
            UPDATE "User"
            SET "height" = ROUND(CAST("height" * ${factor} AS numeric), 1)
            WHERE "id" = CAST(${session.user.id} AS uuid)
          `;
        }

        // Update NutritionProfile Height
        await prisma.$executeRaw`
          UPDATE "NutritionProfile"
          SET "height" = ROUND(CAST("height" * ${factor} AS numeric), 1)
          WHERE "userId" = CAST(${session.user.id} AS uuid)
        `;
      }
    }
  } catch (error) {
    console.error("Error converting units:", error);
  }

  const user = await prisma.user.update({ 
    where: { id: session.user.id }, 
    data: { weightUnit, distanceUnit, measurementUnit } 
  });
  return NextResponse.json(user);
}
