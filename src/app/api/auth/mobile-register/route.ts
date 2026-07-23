import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Todos los campos obligatorios deben ser completados" },
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: "USER",
        subscriptionStatus: "ACTIVE",
      },
    });

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
