import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyAccessCode } from "@/lib/cryptoUtils";
import { getNow } from "@/lib/timeUtils";

const TOKEN_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes validity

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    const { token, manualInput } = await req.json();

    let targetUserId: string | null = null;

    let verifiedToken: { userId: string; timestamp: number } | null = null;

    if (token) {
      const verified = verifyAccessCode(token);
      if (!verified) {
        return NextResponse.json({
          status: "DENIED",
          reason: "INVALID_SIGNATURE",
          message: "Código QR inválido o alterado.",
        });
      }
      verifiedToken = verified;
      targetUserId = verified.userId;
    } else if (manualInput) {
      const trimmedInput = manualInput.trim();
      
      // Search user by email or exact UUID
      const user = await prisma.user.findFirst({
        where: {
          gymId: session.user.id,
          OR: [
            { email: trimmedInput },
            ...(trimmedInput.length === 36 ? [{ id: trimmedInput }] : []),
          ],
        },
        select: { id: true },
      });

      if (!user) {
        return NextResponse.json({
          status: "DENIED",
          reason: "USER_NOT_FOUND",
          message: "Cliente no encontrado en este gimnasio.",
        });
      }

      targetUserId = user.id;
    } else {
      return NextResponse.json(
        { message: "Se requiere un token o entrada manual." },
        { status: 400 }
      );
    }

    // Fetch full client details
    const client = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        plan: {
          select: { name: true, price: true },
        },
      },
    });

    if (!client) {
      return NextResponse.json({
        status: "DENIED",
        reason: "USER_NOT_FOUND",
        message: "El cliente no existe en el sistema.",
      });
    }

    // Verify the client belongs to the logged-in gym
    if (client.gymId !== session.user.id) {
      await prisma.accessLog.create({
        data: {
          userId: client.id,
          gymId: session.user.id,
          status: "DENIED",
          reason: "WRONG_GYM",
        },
      });

      return NextResponse.json({
        status: "DENIED",
        reason: "WRONG_GYM",
        message: "El cliente pertenece a otro centro deportivo.",
      });
    }

    // Check QR expiration if token was used
    if (verifiedToken) {
      const nowMs = Date.now();
      if (nowMs - verifiedToken.timestamp > TOKEN_EXPIRY_MS) {
        await prisma.accessLog.create({
          data: {
            userId: client.id,
            gymId: session.user.id,
            status: "DENIED",
            reason: "EXPIRED",
          },
        });

        return NextResponse.json({
          status: "DENIED",
          reason: "EXPIRED",
          message: "El código QR ha expirado. Por favor, pida al cliente que lo regenere.",
        });
      }
    }

    // Check subscription status
    const serverNow = await getNow();
    const isExpired = client.subscriptionEndDate && client.subscriptionEndDate < serverNow;

    if (client.subscriptionStatus !== "ACTIVE" || isExpired) {
      await prisma.accessLog.create({
        data: {
          userId: client.id,
          gymId: session.user.id,
          status: "DENIED",
          reason: "INACTIVE_SUBSCRIPTION",
        },
      });

      return NextResponse.json({
        status: "DENIED",
        reason: "INACTIVE_SUBSCRIPTION",
        message: isExpired
          ? `Suscripción vencida el ${new Date(client.subscriptionEndDate!).toLocaleDateString("es-ES")}.`
          : "La cuota del cliente se encuentra INACTIVA.",
        client: {
          name: client.name,
          email: client.email,
          image: client.image,
          planName: client.plan?.name || "Sin tarifa asignada",
        },
      });
    }

    // Access granted! Log successful entry
    await prisma.accessLog.create({
      data: {
        userId: client.id,
        gymId: session.user.id,
        status: "GRANTED",
      },
    });

    return NextResponse.json({
      status: "GRANTED",
      message: "Acceso Permitido",
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        image: client.image,
        planName: client.plan?.name || "Tarifa Estándar",
        subscriptionEndDate: client.subscriptionEndDate ? client.subscriptionEndDate.toISOString() : null,
      },
    });
  } catch (error) {
    console.error("Error validating gym access:", error);
    return NextResponse.json(
      { message: "Error interno en el servidor" },
      { status: 500 }
    );
  }
}
