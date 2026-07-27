import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateMetabolicTargets, BioData } from "@/lib/nutritionUtils";
import { getRequestUserId } from "@/lib/apiAuth";

export async function POST(req: Request) {
  try {
    const userId = await getRequestUserId(req);
    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      gender,
      age,
      weight,
      height,
      activityLevel,
      goal,
      aggressiveness,
      isManual,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      dietType,
      allergens,
      culinaryStyle,
      excludedFoods,
      prioritizedFoods,
      mealsConfig
    } = body;

    // Fetch user units to perform correct BMR conversion (Mifflin-St Jeor)
    const userPref = await prisma.user.findUnique({
      where: { id: userId },
      select: { weightUnit: true, measurementUnit: true }
    });
    const weightUnit = userPref?.weightUnit || "kg";
    const measurementUnit = userPref?.measurementUnit || "cm";

    let bioData: BioData;
    let targets: { targetCalories: number; targetProtein: number; targetCarbs: number; targetFat: number };

    const weightVal = Number(weight) || 0;
    const heightVal = Number(height) || 0;

    if (isManual) {
      // Manual mode: save user-provided targets
      // If it's the first time, use dummy values for required fields. Otherwise, they will be updated if provided.
      bioData = {
        gender: gender || "none",
        age: Number(age) || 30,
        weight: weightVal || 70,
        height: heightVal || 170,
        activityLevel: activityLevel || "none",
        goal: goal || "none",
        aggressiveness: aggressiveness || "none",
      };
      targets = {
        targetCalories: Number(targetCalories),
        targetProtein: Number(targetProtein),
        targetCarbs: Number(targetCarbs),
        targetFat: Number(targetFat),
      };
    } else {
      // Wizard mode
      bioData = {
        gender,
        age: Number(age),
        weight: weightVal,
        height: heightVal,
        activityLevel,
        goal,
        aggressiveness,
      };

      if (bioData.age <= 0 || bioData.weight <= 0 || bioData.height <= 0) {
        return NextResponse.json(
          { message: "Edad, peso y altura deben ser valores positivos" },
          { status: 400 }
        );
      }

      // Convert to metric (kg and cm) for formula calculations (Mifflin-St Jeor)
      const weightInKg = weightUnit === "lbs" ? weightVal / 2.20462 : weightVal;
      const heightInCm = measurementUnit === "in" ? heightVal / 0.393701 : heightVal;

      const bioDataForCalc = {
        ...bioData,
        weight: weightInKg,
        height: heightInCm,
      };

      targets = calculateMetabolicTargets(bioDataForCalc);
    }

    // Save or update to Prisma
    const profile = await prisma.nutritionProfile.upsert({
      where: { userId },
      update: {
        ...(isManual && !gender ? {} : bioData), // Don't overwrite existing bio data with dummy values if manual mode without bio
        ...targets,
        dietType: dietType || undefined,
        allergens: allergens !== undefined ? allergens : undefined,
        culinaryStyle: culinaryStyle || undefined,
        excludedFoods: excludedFoods !== undefined ? excludedFoods : undefined,
        prioritizedFoods: prioritizedFoods !== undefined ? prioritizedFoods : undefined,
        ...(mealsConfig !== undefined ? { mealsConfig } : {}),
      } as any,
      create: {
        userId,
        ...bioData,
        ...targets,
        dietType: dietType || "STANDARD",
        allergens: allergens || "",
        culinaryStyle: culinaryStyle || "CLASSIC",
        excludedFoods: excludedFoods || "",
        prioritizedFoods: prioritizedFoods || "",
        mealsConfig: mealsConfig || "BREAKFAST,LUNCH,DINNER,SNACK",
      } as any,
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error creating nutrition profile:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const userId = await getRequestUserId(req);
    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const profile = await prisma.nutritionProfile.findUnique({
      where: { userId },
    });

    return NextResponse.json(profile || null);
  } catch (error) {
    console.error("Error fetching nutrition profile:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
