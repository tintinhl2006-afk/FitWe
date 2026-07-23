import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";

export async function POST(req: Request) {
  try {
    const { name, email, password, gymId } = await req.json();

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
        role: "MEMBER",
        gymId: gymId || null,
        subscriptionStatus: "ACTIVE",
      },
      include: {
        gym: { select: { id: true, name: true } },
      },
    });

    const tokenPayload = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      subscriptionStatus: newUser.subscriptionStatus,
      gymId: newUser.gymId,
      gymName: newUser.gym?.name || null,
      sessionVersion: newUser.sessionVersion,
    };

    const secret = process.env.NEXTAUTH_SECRET || "default_secret_key";
    const token = await encode({
      token: tokenPayload,
      secret,
    });

    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      gymId: newUser.gymId || null,
      gymName: newUser.gym?.name || null,
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
