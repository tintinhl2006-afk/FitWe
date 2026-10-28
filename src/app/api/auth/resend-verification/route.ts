import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { getRequestUserId } from "@/lib/apiAuth";
import { sendVerificationEmail, getAppBaseUrl } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const userId = await getRequestUserId(req);
    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // Every call rotates the token and sends an email: unlimited, it floods an inbox.
    const [userLimit, ipLimit] = await Promise.all([
      checkRateLimit(`resend-verification:user:${userId}`, 3, 60),
      checkRateLimit(`resend-verification:ip:${getClientIp(req)}`, 10, 60),
    ]);
    if (!userLimit.allowed || !ipLimit.allowed) {
      return NextResponse.json(
        { message: "Demasiados intentos. Inténtalo de nuevo más tarde." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: "Tu email ya está verificado." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: token, verificationTokenExpiry: expiry },
    });

    const verifyLink = `${getAppBaseUrl(req)}/verify-email?token=${token}`;
    await sendVerificationEmail(user.email, user.name, verifyLink);

    return NextResponse.json({ message: "Te hemos enviado un nuevo email de verificación." });
  } catch (error) {
    console.error("Error in resend-verification route:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
