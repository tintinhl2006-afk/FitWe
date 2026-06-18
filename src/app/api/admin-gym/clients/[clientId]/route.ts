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
            className: true,
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
        routineName: s.className || s.routine?.name || "Entrenamiento Libre",
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
    const body = await req.json();

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

    // 1. Password Update flow
    if (body.newPassword !== undefined) {
      const { newPassword } = body;
      if (!newPassword || newPassword.trim().length < 4) {
        return NextResponse.json(
          { message: "La contraseña debe tener al menos 4 caracteres" },
          { status: 400 }
        );
      }
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: clientId },
        data: { 
          password: hashedPassword,
          sessionVersion: { increment: 1 }
        },
      });
      return NextResponse.json({
        message: "Contraseña cambiada con éxito",
      });
    }

    // 2. Profile Update flow
    const {
      name,
      email,
      lastName,
      documentType,
      documentNumber,
      documentLetter,
      phone,
      landline,
      registrationDate,
      address,
      country,
      province,
      locality,
      postalCode,
      birthDate,
      civilStatus,
      gender,
      isRegisteredCitizen,
      referralSource,
      gdprConsent,
    } = body;

    // Validate name
    if (name !== undefined && !name.trim()) {
      return NextResponse.json(
        { message: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    // Validate email uniqueness
    if (email !== undefined) {
      if (!email.trim()) {
        return NextResponse.json(
          { message: "El email es obligatorio" },
          { status: 400 }
        );
      }
      const existing = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          id: { not: clientId },
        },
      });
      if (existing) {
        return NextResponse.json(
          { message: "Ese email ya está registrado por otro usuario" },
          { status: 409 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (lastName !== undefined) updateData.lastName = lastName ? lastName.trim() : null;
    if (documentType !== undefined) updateData.documentType = documentType;
    if (documentNumber !== undefined) updateData.documentNumber = documentNumber ? documentNumber.trim() : null;
    if (documentLetter !== undefined) updateData.documentLetter = documentLetter ? documentLetter.trim() : null;
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (landline !== undefined) updateData.landline = landline ? landline.trim() : null;
    if (registrationDate !== undefined) updateData.registrationDate = registrationDate ? new Date(registrationDate) : undefined;
    if (address !== undefined) updateData.address = address ? address.trim() : null;
    if (country !== undefined) updateData.country = country;
    if (province !== undefined) updateData.province = province ? province.trim() : null;
    if (locality !== undefined) updateData.locality = locality ? locality.trim() : null;
    if (postalCode !== undefined) updateData.postalCode = postalCode ? postalCode.trim() : null;
    if (birthDate !== undefined) updateData.birthDate = birthDate ? new Date(birthDate) : null;
    if (civilStatus !== undefined) updateData.civilStatus = civilStatus ? civilStatus.trim() : null;
    if (gender !== undefined) updateData.gender = gender ? gender.trim() : null;
    if (isRegisteredCitizen !== undefined) updateData.isRegisteredCitizen = isRegisteredCitizen === true;
    if (referralSource !== undefined) updateData.referralSource = referralSource ? referralSource.trim() : null;
    if (gdprConsent !== undefined) updateData.gdprConsent = gdprConsent === true;

    await prisma.user.update({
      where: { id: clientId },
      data: updateData,
    });

    return NextResponse.json({
      message: "Ficha de cliente actualizada con éxito",
    });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
