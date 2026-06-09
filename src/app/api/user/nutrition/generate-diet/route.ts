import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDietPlan, STANDARD_FOODS, filterFoodsForUser, solveMealGrams } from "@/lib/dietEngine";

// GET: Generate a customized diet plan based on the user's active nutrition profile and custom overrides
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const profile = await prisma.nutritionProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { message: "Primero debes configurar tus objetivos en el perfil nutricional." },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);

    // Read custom overrides or fall back to profile values
    const cals = searchParams.get("calories") ? Number(searchParams.get("calories")) : profile.targetCalories;
    const protein = searchParams.get("protein") ? Number(searchParams.get("protein")) : profile.targetProtein;
    const carbs = searchParams.get("carbs") ? Number(searchParams.get("carbs")) : profile.targetCarbs;
    const fat = searchParams.get("fat") ? Number(searchParams.get("fat")) : profile.targetFat;
    const dietType = searchParams.get("dietType") || profile.dietType || "STANDARD";
    
    const allergensStr = searchParams.get("allergens") !== null ? searchParams.get("allergens") : profile.allergens;
    const allergensList = allergensStr
      ? allergensStr.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
      : [];

    const culinaryStyle = searchParams.get("culinaryStyle") || profile.culinaryStyle || "CLASSIC";

    const excluded = searchParams.get("excluded")
      ? searchParams.get("excluded")!.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const prioritized = searchParams.get("prioritized")
      ? searchParams.get("prioritized")!.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const plan = generateDietPlan(
      cals,
      protein,
      carbs,
      fat,
      dietType,
      allergensList,
      culinaryStyle,
      excluded,
      prioritized
    );

    return NextResponse.json({
      profile: {
        dietType,
        allergens: allergensStr,
        culinaryStyle,
        targetCalories: cals,
        targetProtein: protein,
        targetCarbs: carbs,
        targetFat: fat,
        excludedFoodIds: excluded,
        prioritizedFoodIds: prioritized,
      },
      plan,
      availableFoods: STANDARD_FOODS.map(f => ({
        id: f.id,
        name: f.name,
        brand: f.brand,
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
        group: f.group,
        isVegan: f.isVegan,
        isVegetarian: f.isVegetarian,
        isKeto: f.isKeto,
        allergens: f.allergens,
        styles: f.styles,
      }))
    });
  } catch (error) {
    console.error("Error generating diet:", error);
    return NextResponse.json({ error: "Error al generar la dieta automática" }, { status: 500 });
  }
}

// POST: Save/Register the customized diet plan into the user's daily meal entries
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { date, items } = body; // date: "YYYY-MM-DD", items: Array of { foodName, calories, protein, carbs, fat, quantityGrams, mealType, brand }

    if (!date || !items || !Array.isArray(items)) {
      return NextResponse.json({ message: "Datos incompletos" }, { status: 400 });
    }

    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);

    // Run within a Prisma transaction for complete database consistency
    await prisma.$transaction(async (tx) => {
      // 1. Clean up existing meal entries for the selected day
      await tx.mealEntry.deleteMany({
        where: {
          userId: session.user.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // 2. Iterate and insert each generated food & meal entry
      for (const item of items) {
        // Find if FoodItem already exists in DB (either created by user or global null)
        let foodItem = await tx.foodItem.findFirst({
          where: {
            name: item.foodName,
            OR: [
              { userId: session.user.id },
              { userId: null }
            ]
          }
        });

        // If not, create standard FoodItem in DB
        if (!foodItem) {
          foodItem = await tx.foodItem.create({
            data: {
              userId: null, // Global standard food
              name: item.foodName,
              brand: item.brand || null,
              calories: Number(item.caloriesPer100g) || 0,
              protein: Number(item.proteinPer100g) || 0,
              carbs: Number(item.carbsPer100g) || 0,
              fat: Number(item.fatPer100g) || 0,
            }
          });
        }

        // 3. Create the MealEntry log
        await tx.mealEntry.create({
          data: {
            userId: session.user.id,
            foodItemId: foodItem.id,
            mealType: item.mealType, // BREAKFAST, LUNCH, DINNER, SNACK
            quantityGrams: Number(item.quantityGrams),
            date: new Date(date),
          }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving automatic diet:", error);
    return NextResponse.json({ error: "Error al guardar el plan de dieta en el diario" }, { status: 500 });
  }
}
