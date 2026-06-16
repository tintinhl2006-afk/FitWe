import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyAccessCode } from "@/lib/cryptoUtils";
import { getNow } from "@/lib/timeUtils";
import { logger } from "@/lib/logger";

const TOKEN_EXPIRY_MS = 20 * 1000; // 20 seconds validity

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
        logger.warn(`Intento de acceso denegado: firma QR inválida en gimnasio ${session.user.id}`);
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
        logger.warn(`Intento de acceso denegado: usuario manual '${trimmedInput}' no encontrado en gimnasio ${session.user.id}`);
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
      logger.warn(`Intento de acceso denegado: ID de cliente ${targetUserId} no existe en el sistema`);
      return NextResponse.json({
        status: "DENIED",
        reason: "USER_NOT_FOUND",
        message: "El cliente no existe en el sistema.",
      });
    }

    // Verify the client belongs to the logged-in gym
    if (client.gymId !== session.user.id) {
      logger.warn(`Intento de acceso denegado: Cliente ${client.id} pertenece al gimnasio ${client.gymId}, no a ${session.user.id}`);
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

    // Check QR expiration if token was used (allowing a 30-second clock drift buffer)
    if (verifiedToken) {
      const nowMs = Date.now();
      const DRIFT_BUFFER_MS = 10 * 1000; // 10 seconds clock drift grace buffer

      const isFutureToken = verifiedToken.timestamp - nowMs > DRIFT_BUFFER_MS;
      const isExpiredToken = nowMs - verifiedToken.timestamp > (TOKEN_EXPIRY_MS + DRIFT_BUFFER_MS);

      if (isFutureToken || isExpiredToken) {
        logger.warn(`Intento de acceso denegado: Token QR ${isFutureToken ? 'futuro' : 'expirado'} para el cliente ${client.id} (gimnasio ${session.user.id})`);
        await prisma.accessLog.create({
          data: {
            userId: client.id,
            gymId: session.user.id,
            status: "DENIED",
            reason: "EXPIRED",
          },
        });

        const debugMsg = isFutureToken
          ? "Código QR no válido temporalmente (desajuste de hora en el dispositivo). Asegúrese de tener la hora automática activada."
          : "El código QR ha expirado. Por favor, pida al cliente que lo regenere.";

        return NextResponse.json({
          status: "DENIED",
          reason: "EXPIRED",
          message: debugMsg,
        });
      }
    }

    // Check subscription status
    const serverNow = await getNow();
    const isExpired = client.subscriptionEndDate && client.subscriptionEndDate < serverNow;

    if (client.subscriptionStatus !== "ACTIVE" || isExpired) {
      logger.warn(`Intento de acceso denegado: Suscripción inactiva/vencida para cliente ${client.id} (gimnasio ${session.user.id})`);
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

    logger.info(`Acceso PERMITIDO para cliente ${client.id} en gimnasio ${session.user.id}`);
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
  } catch (error: any) {
    logger.error(`Error validating gym access: ${error.message || error}`);
    return NextResponse.json(
      { message: "Error interno en el servidor" },
      { status: 500 }
    );
  }
}
