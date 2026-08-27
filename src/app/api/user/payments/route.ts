import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/apiAuth";

export async function GET(req: Request) {
  try {
    const userId = await getRequestUserId(req);
    if (!userId) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    // Get the client's payments and their associated gym info
    const userWithGymAndPayments = await prisma.user.findUnique({
      where: { id: userId },
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
          include: { paymentMethod: true },
        },
        gym: {
          select: { name: true, email: true },
        },
      },
    });

    if (!userWithGymAndPayments) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Cada factura usa los datos fiscales del método de pago con el que se cobró (no los
    // del gimnasio en general), ya que ahora son independientes por método. Los pagos
    // antiguos, o los registrados sin ningún método activo, solo tienen el nombre del gimnasio.
    const payments = userWithGymAndPayments.payments.map(({ paymentMethod, ...payment }) => ({
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
            name: userWithGymAndPayments.gym?.name || "",
            email: userWithGymAndPayments.gym?.email || "",
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
      payments,
    });
  } catch (error) {
    console.error("Error fetching client payments:", error);
    return NextResponse.json(
      { message: "Error en el servidor" },
      { status: 500 }
    );
  }
}
