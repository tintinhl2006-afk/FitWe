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
    } = body;

    // Build the BioData object
    const bioData: BioData = {
      gender,
      age: Number(age),
      weight: Number(weight),
      height: Number(height),
      activityLevel,
      goal,
      aggressiveness,
    };

    // Calculate targets
    const targets = calculateMetabolicTargets(bioData);

    // Save or update to Prisma
    const profile = await prisma.nutritionProfile.upsert({
      where: { userId: session.user.id },
      update: {
        ...bioData,
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
