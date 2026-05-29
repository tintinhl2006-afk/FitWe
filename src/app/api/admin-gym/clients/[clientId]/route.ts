import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNow } from "@/lib/timeUtils";
import bcrypt from "bcryptjs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "GYM") {
      return NextResponse.json({ message: "Acceso prohibido" }, { status: 403 });
    }

    const { clientId } = await params;
    const gymId = session.user.id;

    // IDOR prevention: only fetch if client belongs to THIS gym
    const client = await prisma.user.findFirst({
      where: {
        id: clientId,
        gymId: gymId,
        role: "USER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        weight: true,
        height: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        lastName: true,
        documentType: true,
        documentNumber: true,
        documentLetter: true,
        phone: true,
        landline: true,
        registrationDate: true,
        address: true,
        country: true,
        province: true,
        locality: true,
        postalCode: true,
        birthDate: true,
        civilStatus: true,
        gender: true,
        isRegisteredCitizen: true,
        referralSource: true,
        gdprConsent: true,
        // Last 5 completed workout sessions
        workoutSessions: {
          where: { endTime: { not: null } },
          orderBy: { startTime: "desc" },
          take: 5,
          select: {
            id: true,
            startTime: true,
            endTime: true,
            routine: {
              select: { name: true },
            },
          },
        },
        // Current routines
        routines: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            createdAt: true,
            _count: {
              select: { exercises: true },
            },
          },
        },
        // Aggregate stats
        _count: {
          select: {
            workoutSessions: {
              where: { endTime: { not: null } },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { message: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Transform for the frontend
    const recentSessions = client.workoutSessions.map((s) => {
      let durationMinutes = 0;
      if (s.endTime && s.startTime) {
        durationMinutes = Math.round(
          (s.endTime.getTime() - s.startTime.getTime()) / 60000
        );
      }
      return {
        id: s.id,
        routineName: s.routine?.name || "Entrenamiento Libre",
        date: s.startTime.toISOString(),
        durationMinutes,
      };
    });

    const routines = client.routines.map((r) => ({
      id: r.id,
      name: r.name,
      createdAt: r.createdAt.toISOString(),
      exerciseCount: r._count.exercises,
    }));

    return NextResponse.json({
      id: client.id,
      name: client.name,
      email: client.email,
      image: client.image,
      weight: client.weight,
      height: client.height,
      subscriptionStatus: client.subscriptionStatus,
      subscriptionEndDate: client.subscriptionEndDate?.toISOString() || null,
      createdAt: client.createdAt.toISOString(),
      lastName: client.lastName,
      documentType: client.documentType,
      documentNumber: client.documentNumber,
      documentLetter: client.documentLetter,
      phone: client.phone,
      landline: client.landline,
      registrationDate: client.registrationDate.toISOString(),
      address: client.address,
      country: client.country,
      province: client.province,
      locality: client.locality,
      postalCode: client.postalCode,
      birthDate: client.birthDate?.toISOString() || null,
      civilStatus: client.civilStatus,
      gender: client.gender,
      isRegisteredCitizen: client.isRegisteredCitizen,
      referralSource: client.referralSource,
      gdprConsent: client.gdprConsent,
      totalWorkouts: client._count.workoutSessions,
      recentSessions,
      routines,
      serverNow: (await getNow()).toISOString(),
    });
  } catch (error) {
    console.error("Error fetching client detail:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "GYM") {
      return NextResponse.json({ message: "Acceso prohibido" }, { status: 403 });
    }

    const { clientId } = await params;
    const gymId = session.user.id;
    const { newPassword } = await req.json();

    if (!newPassword || newPassword.trim().length < 4) {
      return NextResponse.json(
        { message: "La contraseña debe tener al menos 4 caracteres" },
        { status: 400 }
      );
    }

    // Verify client belongs to this gym
    const client = await prisma.user.findFirst({
      where: {
        id: clientId,
        gymId: gymId,
        role: "USER",
      },
    });

    if (!client) {
      return NextResponse.json(
        { message: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Hash the new password securely
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the password in database
    await prisma.user.update({
      where: { id: clientId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      message: "Contraseña cambiada con éxito",
    });
  } catch (error) {
    console.error("Error resetting client password:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
