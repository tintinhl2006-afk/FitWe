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

    const [gym, rawPayments] = await Promise.all([
      prisma.user.findUnique({
        where: { id: gymId },
        select: { name: true, email: true },
      }),
      prisma.paymentRecord.findMany({
        where: { user: { gymId } },
        orderBy: { date: "desc" },
        select: {
          id: true,
          amount: true,
          description: true,
          vatRate: true,
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
          paymentMethod: true,
        },
      }),
    ]);

    if (!gym) {
      return NextResponse.json({ message: "Gimnasio no encontrado" }, { status: 404 });
    }

    // Cada factura usa los datos fiscales del método de pago con el que se cobró, no los
    // del perfil general del gimnasio, ya que ahora son independientes por método.
    const payments = rawPayments.map(({ paymentMethod, ...payment }) => ({
      ...payment,
      gym: paymentMethod
        ? {
            name: paymentMethod.billingName,
            email: paymentMethod.billingEmail || "",
            documentType: paymentMethod.billingDocumentType || "",
            documentNumber: paymentMethod.billingDocumentNumber || "",
            documentLetter: paymentMethod.billingDocumentLetter || "",
            phone: paymentMethod.billingPhone || "",
            address: paymentMethod.billingAddress || "",
            country: paymentMethod.billingCountry || "",
            province: paymentMethod.billingProvince || "",
            locality: paymentMethod.billingLocality || "",
            postalCode: paymentMethod.billingPostalCode || "",
          }
        : {
            name: gym.name,
            email: gym.email,
            documentType: "",
            documentNumber: "",
            documentLetter: "",
            phone: "",
            address: "",
            country: "",
            province: "",
            locality: "",
            postalCode: "",
          },
    }));

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Error fetching gym invoices:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}
