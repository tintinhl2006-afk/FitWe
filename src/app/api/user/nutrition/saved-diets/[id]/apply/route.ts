import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/apiAuth";

// POST: Apply a saved diet to a specific date in the user's daily food journal
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getRequestUserId(req);
    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { date } = body; // date: "YYYY-MM-DD"

    if (!date) {
      return NextResponse.json({ message: "Fecha requerida" }, { status: 400 });
    }

    // Verify ownership and load diet items
    const savedDiet = await prisma.savedDiet.findFirst({
      where: { id, userId },
      include: { items: true },
    });

    if (!savedDiet) {
      return NextResponse.json({ message: "Dieta no encontrada o no autorizada" }, { status: 404 });
    }

    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);

    // Run within a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Clean up existing meal entries for the selected day
      await tx.mealEntry.deleteMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // 2. Iterate and insert each saved diet food as a daily meal entry
      for (const item of savedDiet.items) {
        // Find if FoodItem already exists in DB (either created by user or global standard)
        let foodItem = await tx.foodItem.findFirst({
          where: {
            name: item.foodName,
            OR: [
              { userId },
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
              calories: Number(item.calories) || 0,
              protein: Number(item.protein) || 0,
              carbs: Number(item.carbs) || 0,
              fat: Number(item.fat) || 0,
            }
          });
        }

        // 3. Create the MealEntry log
        await tx.mealEntry.create({
          data: {
            userId,
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
    console.error("Error applying saved diet:", error);
    return NextResponse.json({ error: "Error al aplicar la dieta al diario" }, { status: 500 });
  }
}
