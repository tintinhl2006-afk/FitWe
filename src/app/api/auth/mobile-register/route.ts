import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import crypto from "crypto";
import { z } from "zod";
import { encode } from "next-auth/jwt";
import { sendVerificationEmail, getAppBaseUrl } from "@/lib/email";
import { getAuthSecret } from "@/lib/authSecret";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const mobileRegisterSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(80, "El nombre es demasiado largo."),
  email: z.string().trim().email("Introduce un correo electrónico válido.").max(254),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres.")
    .max(128, "La contraseña es demasiado larga."),
  gymCode: z.string().trim().length(6, "El código de gimnasio debe tener exactamente 6 caracteres"),
});

export async function POST(req: Request) {
  try {
    const { allowed } = await checkRateLimit(`register:ip:${getClientIp(req)}`, 5, 60);
    if (!allowed) {
      return NextResponse.json(
        { message: "Demasiados intentos de registro. Inténtalo de nuevo más tarde." },
        { status: 429 }
      );
    }

    // Same rules as the web registration (src/app/api/register-client): this endpoint used to
    // accept any type and any length for every field, including the name that is later put into
    // emails and exported to spreadsheets.
    const parsed = mobileRegisterSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
    }
    const { name, email, password, gymCode } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "El correo electrónico ya está registrado" },
        { status: 400 }
      );
    }

    const gym = await prisma.user.findFirst({
      where: { gymCode: gymCode.trim().toUpperCase(), role: "GYM" },
    });

    if (!gym) {
      return NextResponse.json(
        { message: "El código de gimnasio introducido no es válido o no pertenece a ningún centro activo" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: "USER",
        gymId: gym.id,
        subscriptionStatus: "INACTIVE", // Needs subscription plan selection / payment
        mustChangePassword: false,      // User chose their own password
        verificationToken,
        verificationTokenExpiry,
      },
    });

    // Best-effort: a failed verification email must not block account creation.
    try {
      const verifyLink = `${getAppBaseUrl(req)}/verify-email?token=${verificationToken}`;
      await sendVerificationEmail(newUser.email, newUser.name, verifyLink);
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
    }

    const tokenPayload = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      subscriptionStatus: newUser.subscriptionStatus,
      // Required by the JWT type declared in src/types/next-auth.d.ts.
      subscriptionEndDate: newUser.subscriptionEndDate?.toISOString() ?? null,
      serverNow: new Date().toISOString(),
      sessionVersion: newUser.sessionVersion,
    };

    // No unsigned fallback if encode() throws — see mobile-login/route.ts for why.
    const token = await encode({ token: tokenPayload, secret: getAuthSecret() });

    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      subscriptionStatus: newUser.subscriptionStatus,
    };

    return NextResponse.json({
      token,
      user: userResponse,
    });
  } catch (error: any) {
    console.error("Mobile register error:", error);
    return NextResponse.json(
      { message: "Error al registrar el usuario" },
      { status: 500 }
    );
  }
}
