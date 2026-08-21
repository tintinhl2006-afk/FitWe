import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const gymId = session.user.id;

    const method = await prisma.gymPaymentMethod.findUnique({ where: { id: params.id } });
    if (!method || method.gymId !== gymId) {
      return NextResponse.json({ message: "Método de pago no encontrado" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.gymPaymentMethod.updateMany({
        where: { gymId, isActive: true },
        data: { isActive: false },
      }),
      prisma.gymPaymentMethod.update({
        where: { id: method.id },
        data: { isActive: true },
      }),
    ]);

    return NextResponse.json({ message: "Método de pago activado" });
  } catch (error) {
    console.error("Error activating gym payment method:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}
