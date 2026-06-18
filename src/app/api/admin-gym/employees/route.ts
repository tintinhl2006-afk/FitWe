import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createEmployeeSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  lastName: z.string().optional().nullable(),
  email: z.string().email("El correo electrónico no es válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  documentType: z.string().optional().nullable(),
  documentNumber: z.string().optional().nullable(),
  documentLetter: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  landline: z.string().optional().nullable(),
  registrationDate: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  locality: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  civilStatus: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  isRegisteredCitizen: z.any().optional(),
  referralSource: z.string().optional().nullable(),
  gdprConsent: z.any().optional(),
});

const updateEmployeeSchema = z.object({
  id: z.string().min(1, "El ID de empleado es obligatorio."),
  name: z.string().min(1, "El nombre es obligatorio."),
  lastName: z.string().optional().nullable(),
  email: z.string().email("El correo electrónico no es válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres.").optional().or(z.literal("")),
  documentType: z.string().optional().nullable(),
  documentNumber: z.string().optional().nullable(),
  documentLetter: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  landline: z.string().optional().nullable(),
  registrationDate: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  locality: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  civilStatus: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  isRegisteredCitizen: z.any().optional(),
  referralSource: z.string().optional().nullable(),
  gdprConsent: z.any().optional(),
});

// GET: List all employees for the gym
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const employees = await prisma.user.findMany({
      where: {
        gymId: session.user.id,
        role: "EMPLOYEE",
      },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
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
        createdAt: true,
        image: true,
        bio: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}

// POST: Create a new employee
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
    }

    const {
      name,
      lastName,
      email,
      password,
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
    } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: "El correo electrónico ya está registrado" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = await prisma.user.create({
      data: {
        name,
        lastName: lastName || null,
        email,
        password: hashedPassword,
        documentType: documentType || "DNI",
        documentNumber: documentNumber || null,
        documentLetter: documentLetter || null,
        phone: phone || null,
        landline: landline || null,
        registrationDate: registrationDate ? new Date(registrationDate) : new Date(),
        address: address || null,
        country: country || "España",
        province: province || null,
        locality: locality || null,
        postalCode: postalCode || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        civilStatus: civilStatus || null,
        gender: gender || null,
        isRegisteredCitizen: isRegisteredCitizen === true || isRegisteredCitizen === "true",
        referralSource: referralSource || null,
        gdprConsent: gdprConsent !== false,
        role: "EMPLOYEE",
        gymId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}

// PUT: Update an employee
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
    }

    const {
      id,
      name,
      lastName,
      email,
      password,
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
    } = parsed.data;

    const employee = await prisma.user.findFirst({
      where: { id, gymId: session.user.id, role: "EMPLOYEE" },
    });

    if (!employee) {
      return NextResponse.json({ message: "Empleado no encontrado" }, { status: 404 });
    }

    if (email !== employee.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email },
      });
      if (emailTaken) {
        return NextResponse.json({ message: "El correo electrónico ya está en uso" }, { status: 409 });
      }
    }

    const updateData: any = {
      name,
      lastName: lastName || null,
      email,
      documentType: documentType || "DNI",
      documentNumber: documentNumber || null,
      documentLetter: documentLetter || null,
      phone: phone || null,
      landline: landline || null,
      registrationDate: registrationDate ? new Date(registrationDate) : undefined,
      address: address || null,
      country: country || "España",
      province: province || null,
      locality: locality || null,
      postalCode: postalCode || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      civilStatus: civilStatus || null,
      gender: gender || null,
      isRegisteredCitizen: isRegisteredCitizen === true || isRegisteredCitizen === "true",
      referralSource: referralSource || null,
      gdprConsent: gdprConsent !== false,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
      updateData.sessionVersion = { increment: 1 };
    }

    const updatedEmployee = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}

// DELETE: Delete an employee
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "ID requerido" }, { status: 400 });
    }

    const employee = await prisma.user.findFirst({
      where: { id, gymId: session.user.id, role: "EMPLOYEE" },
    });

    if (!employee) {
      return NextResponse.json({ message: "Empleado no encontrado" }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Empleado eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}
