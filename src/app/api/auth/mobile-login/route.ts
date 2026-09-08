import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";
import { getAuthSecret } from "@/lib/authSecret";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email y contraseña requeridos" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const ip = getClientIp(req);
    const [ipLimit, emailLimit] = await Promise.all([
      checkRateLimit(`login:ip:${ip}`, 20, 15),
      checkRateLimit(`login:email:${normalizedEmail}`, 10, 15),
    ]);
    if (!ipLimit.allowed || !emailLimit.allowed) {
      return NextResponse.json(
        { message: "Demasiados intentos. Espera unos minutos antes de volver a intentarlo." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { gym: { select: { id: true, name: true } } },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { message: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { message: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Evaluate real subscription expiration against end date
    const now = new Date();
    const isExpired = user.subscriptionEndDate ? new Date(user.subscriptionEndDate) < now : false;
    const isSubscriptionActive = user.subscriptionStatus === "ACTIVE" && !isExpired;
    const finalSubscriptionStatus = isSubscriptionActive ? "ACTIVE" : "INACTIVE";

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      subscriptionStatus: finalSubscriptionStatus,
      subscriptionEndDate: user.subscriptionEndDate?.toISOString() || null,
      gymId: user.gymId,
      gymName: user.gym?.name || null,
      sessionVersion: user.sessionVersion,
    };

    // No unsigned fallback if encode() throws: an unsigned token would never verify against
    // getRequestUserId anyway (it's not valid JWE), so silently issuing one just breaks the
    // client's session in a confusing way. Fail loudly instead — bubbled to the outer catch.
    const token = await encode({ token: tokenPayload, secret: getAuthSecret() });

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      gymId: user.gymId || null,
      gymName: user.gym?.name || null,
      subscriptionStatus: finalSubscriptionStatus,
      subscriptionEndDate: user.subscriptionEndDate?.toISOString() || null,
      avatarUrl: user.image || null,
    };

    return NextResponse.json({
      token,
      user: userResponse,
    });
  } catch (error: any) {
    console.error("Mobile login error:", error);
    return NextResponse.json(
      { message: error?.message || String(error) || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
