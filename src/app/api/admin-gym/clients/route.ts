import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "GYM") {
      return NextResponse.json({ message: "Acceso prohibido" }, { status: 403 });
    }

    const gymId = session.user.id;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10) || 20)
    );
    const search = (searchParams.get("search") || "").trim();

    const where = {
      gymId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, clients] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          subscriptionStatus: true,
          subscriptionEndDate: true,
          plan: { select: { id: true, name: true, price: true, durationDays: true } },
          _count: {
            select: {
              workoutSessions: {
                where: { endTime: { not: null } },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const result = clients.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      image: c.image,
      createdAt: c.createdAt.toISOString(),
      totalWorkouts: c._count.workoutSessions,
      subscriptionStatus: c.subscriptionStatus,
      subscriptionEndDate: c.subscriptionEndDate?.toISOString() || null,
      plan: c.plan,
    }));

    return NextResponse.json({ clients: result, total, page, pageSize });
  } catch (error) {
    console.error("Error fetching gym clients:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "GYM") {
      return NextResponse.json({ message: "Acceso prohibido" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      email,
      password,
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

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Nombre, email y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Ese email ya está registrado en la plataforma" },
        { status: 409 }
      );
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear el usuario vinculado al gimnasio
    const newClient = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: "USER",
        gymId: session.user.id,
        lastName: lastName ? lastName.trim() : null,
        documentType: documentType || "DNI",
        documentNumber: documentNumber ? documentNumber.trim() : null,
        documentLetter: documentLetter ? documentLetter.trim() : null,
        phone: phone ? phone.trim() : null,
        landline: landline ? landline.trim() : null,
        registrationDate: registrationDate ? new Date(registrationDate) : undefined,
        address: address ? address.trim() : null,
        country: country || "España",
        province: province ? province.trim() : null,
        locality: locality ? locality.trim() : null,
        postalCode: postalCode ? postalCode.trim() : null,
        birthDate: birthDate ? new Date(birthDate) : null,
        civilStatus: civilStatus ? civilStatus.trim() : null,
        gender: gender ? gender.trim() : null,
        isRegisteredCitizen: isRegisteredCitizen === true,
        referralSource: referralSource ? referralSource.trim() : null,
        gdprConsent: gdprConsent !== false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        id: newClient.id,
        name: newClient.name,
        email: newClient.email,
        image: newClient.image,
        createdAt: newClient.createdAt.toISOString(),
        totalWorkouts: 0,
        subscriptionStatus: "ACTIVE",
        subscriptionEndDate: null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating gym client:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

