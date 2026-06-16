import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    // Get the client's payments and their associated gym info
    const userWithGymAndPayments = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        lastName: true,
        email: true,
        documentType: true,
        documentNumber: true,
        documentLetter: true,
        address: true,
        postalCode: true,
        province: true,
        locality: true,
        payments: {
          orderBy: { date: "desc" },
        },
        gym: {
          select: {
            name: true,
            email: true,
            documentType: true,
            documentNumber: true,
            documentLetter: true,
            phone: true,
            address: true,
            country: true,
            province: true,
            locality: true,
            postalCode: true,
          },
        },
      },
    });

    if (!userWithGymAndPayments) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      client: {
        name: userWithGymAndPayments.name,
        lastName: userWithGymAndPayments.lastName || "",
        email: userWithGymAndPayments.email,
        documentType: userWithGymAndPayments.documentType || "",
        documentNumber: userWithGymAndPayments.documentNumber || "",
        documentLetter: userWithGymAndPayments.documentLetter || "",
        address: userWithGymAndPayments.address || "",
        postalCode: userWithGymAndPayments.postalCode || "",
        province: userWithGymAndPayments.province || "",
        locality: userWithGymAndPayments.locality || "",
      },
      gym: userWithGymAndPayments.gym || null,
      payments: userWithGymAndPayments.payments,
    });
  } catch (error) {
    console.error("Error fetching client payments:", error);
    return NextResponse.json(
      { message: "Error en el servidor" },
      { status: 500 }
    );
  }
}
