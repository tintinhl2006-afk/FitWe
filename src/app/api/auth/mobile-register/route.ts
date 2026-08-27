import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { encode } from "next-auth/jwt";
import { sendVerificationEmail, getAppBaseUrl } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { name, email, password, gymCode } = await req.json();

    if (!name || !email || !password || !gymCode) {
      return NextResponse.json(
        { message: "Todos los campos obligatorios deben ser completados" },
        { status: 400 }
      );
    }

    if (typeof gymCode !== "string" || gymCode.trim().length !== 6) {
      return NextResponse.json(
        { message: "El código de gimnasio debe tener exactamente 6 caracteres" },
        { status: 400 }
      );
    }

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

    const hashedPassword = await bcrypt.hash(password, 10);
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
      sessionVersion: newUser.sessionVersion,
    };

    const secret = process.env.NEXTAUTH_SECRET || "default_secret_key";
    let token = "";

    try {
      token = await encode({
        token: tokenPayload,
        secret,
      });
    } catch (encodeErr) {
      token = Buffer.from(JSON.stringify(tokenPayload)).toString("base64");
    }

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
      { message: error?.message || "Error al registrar el usuario" },
      { status: 500 }
    );
  }
}
