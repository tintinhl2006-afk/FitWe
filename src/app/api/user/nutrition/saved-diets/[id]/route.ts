import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT: Update a saved diet (name and/or its food items)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, items } = body;

    // Verify ownership
    const existingDiet = await prisma.savedDiet.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingDiet) {
      return NextResponse.json({ message: "Dieta no encontrada o no autorizada" }, { status: 404 });
    }

    const updatedDiet = await prisma.$transaction(async (tx) => {
      // Update name if provided
      if (name && name.trim()) {
        await tx.savedDiet.update({
          where: { id },
          data: { name: name.trim() },
        });
      }

      // If items are provided, replace them
      if (items && Array.isArray(items)) {
        // Delete old items
        await tx.savedDietItem.deleteMany({
          where: { savedDietId: id },
        });

        // Insert new items
        const dietItems = items.map((item: any) => ({
          savedDietId: id,
          foodName: item.foodName,
          brand: item.brand || null,
          calories: Number(item.calories) || 0,
          protein: Number(item.protein) || 0,
          carbs: Number(item.carbs) || 0,
          fat: Number(item.fat) || 0,
          quantityGrams: Number(item.quantityGrams) || 0,
          mealType: item.mealType,
        }));

        await tx.savedDietItem.createMany({
          data: dietItems,
        });
      }

      return await tx.savedDiet.findUnique({
        where: { id },
        include: { items: true },
      });
    });

    return NextResponse.json(updatedDiet);
  } catch (error) {
    console.error("Error updating saved diet:", error);
    return NextResponse.json({ error: "Error al actualizar la dieta guardada" }, { status: 500 });
  }
}

// DELETE: Delete a saved diet
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership and delete
    const existingDiet = await prisma.savedDiet.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingDiet) {
      return NextResponse.json({ message: "Dieta no encontrada o no autorizada" }, { status: 404 });
    }

    await prisma.savedDiet.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting saved diet:", error);
    return NextResponse.json({ error: "Error al eliminar la dieta guardada" }, { status: 500 });
  }
}
