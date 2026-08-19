import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "GYM") {
      return NextResponse.json({ message: "Acceso prohibido" }, { status: 403 });
    }

    const gymId = session.user.id;

    const [gym, payments] = await Promise.all([
      prisma.user.findUnique({
        where: { id: gymId },
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
      }),
      prisma.paymentRecord.findMany({
        where: { user: { gymId } },
        orderBy: { date: "desc" },
        select: {
          id: true,
          amount: true,
          description: true,
          date: true,
          invoiceNumber: true,
          user: {
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
            },
          },
        },
      }),
    ]);

    if (!gym) {
      return NextResponse.json({ message: "Gimnasio no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ gym, payments });
  } catch (error) {
    console.error("Error fetching gym invoices:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}
