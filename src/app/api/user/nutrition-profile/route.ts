import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateMetabolicTargets, BioData } from "@/lib/nutritionUtils";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
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
      targetFat
    } = body;

    let bioData: BioData;
    let targets: { targetCalories: number; targetProtein: number; targetCarbs: number; targetFat: number };

    if (isManual) {
      // Manual mode: save user-provided targets
      // If it's the first time, use dummy values for required fields. Otherwise, they will be updated if provided.
      bioData = {
        gender: gender || "none",
        age: Number(age) || 30,
        weight: Number(weight) || 70,
        height: Number(height) || 170,
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
        weight: Number(weight),
        height: Number(height),
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

      targets = calculateMetabolicTargets(bioData);
    }

    // Save or update to Prisma
    const profile = await prisma.nutritionProfile.upsert({
      where: { userId: session.user.id },
      update: {
        ...(isManual && !gender ? {} : bioData), // Don't overwrite existing bio data with dummy values if manual mode without bio
        ...targets,
      },
      create: {
        userId: session.user.id,
        ...bioData,
        ...targets,
      },
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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const profile = await prisma.nutritionProfile.findUnique({
      where: { userId: session.user.id },
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
