import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAccessCode } from "@/lib/cryptoUtils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    // 1. Obtener estado real del usuario en base de datos
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionStatus: true, subscriptionEndDate: true },
    });

    if (!dbUser) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    const now = new Date();
    const isExpired = dbUser.subscriptionEndDate && new Date(dbUser.subscriptionEndDate) < now;
    const isInactive = dbUser.subscriptionStatus !== "ACTIVE" || isExpired;

    if (isInactive) {
      return NextResponse.json(
        { 
          error: "INACTIVE_SUBSCRIPTION", 
          message: "Tu cuota ha expirado. Por favor, renuévala para poder acceder al centro." 
        }, 
        { status: 403 }
      );
    }

    // Generar código firmado con HMAC
    const token = generateAccessCode(session.user.id);

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating access token:", error);
    return NextResponse.json(
      { message: "Error interno en el servidor" },
      { status: 500 }
    );
  }
}
