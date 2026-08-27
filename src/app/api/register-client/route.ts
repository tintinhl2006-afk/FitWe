import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { sendVerificationEmail, getAppBaseUrl } from "@/lib/email";

const registerClientSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  email: z.string().email("Introduce un correo electrónico válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  gymCode: z.string().length(6, "El código de gimnasio debe tener exactamente 6 caracteres."),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerClientSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, gymCode } = parsed.data;
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "El correo electrónico ya está registrado." },
        { status: 409 }
      );
    }

    // 2. Find gym by gymCode
    const gym = await prisma.user.findFirst({
      where: {
        gymCode: gymCode.trim().toUpperCase(),
        role: "GYM",
      },
    });

    if (!gym) {
      return NextResponse.json(
        { message: "El código de gimnasio ingresado no es válido o no pertenece a ningún centro activo." },
        { status: 400 }
      );
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Generate an email verification token up front so it can be stored with the user
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // 5. Create user linked to gym
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: trimmedEmail,
        password: hashedPassword,
        role: "USER",
        gymId: gym.id,
        subscriptionStatus: "INACTIVE", // Needs subscription plan selection / payment
        mustChangePassword: false,      // User chose their own password
        verificationToken,
        verificationTokenExpiry,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Best-effort: a failed verification email must not block account creation.
    try {
      const verifyLink = `${getAppBaseUrl(req)}/verify-email?token=${verificationToken}`;
      await sendVerificationEmail(newUser.email, newUser.name, verifyLink);
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
    }

    return NextResponse.json(
      { user: newUser, message: "Usuario registrado con éxito" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in client registration:", error);
    return NextResponse.json(
      { message: "Error interno en el servidor" },
      { status: 500 }
    );
  }
}
