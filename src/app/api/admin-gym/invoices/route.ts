import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const paymentMethodId = (searchParams.get("paymentMethodId") || "").trim();

    const andConditions: any[] = [{ user: { gymId } }];
    if (search) {
      andConditions.push({
        OR: [
          { invoiceNumber: { contains: search, mode: "insensitive" as const } },
          { user: { name: { contains: search, mode: "insensitive" as const } } },
          { user: { lastName: { contains: search, mode: "insensitive" as const } } },
          { user: { email: { contains: search, mode: "insensitive" as const } } },
        ],
      });
    }
    if (paymentMethodId) {
      andConditions.push({ paymentMethodId });
    }
    const where = { AND: andConditions };

    const [gym, total, rawPayments, paymentMethods] = await Promise.all([
      prisma.user.findUnique({
        where: { id: gymId },
        select: { name: true, email: true },
      }),
      prisma.paymentRecord.count({ where }),
      prisma.paymentRecord.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          amount: true,
          description: true,
          vatRate: true,
          source: true,
          date: true,
          invoiceNumber: true,
          paymentMethodId: true,
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
      prisma.gymPaymentMethod.findMany({
        where: { gymId },
        select: { id: true, billingName: true, gateway: true, isActive: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    if (!gym) {
      return NextResponse.json({ message: "Gimnasio no encontrado" }, { status: 404 });
    }

    // Cada factura usa los datos fiscales del método de pago con el que se cobró, no los
    // del perfil general del gimnasio, ya que ahora son independientes por método.
    const payments = rawPayments.map(({ paymentMethod, ...payment }) => ({
      ...payment,
      paymentMethodName: paymentMethod?.billingName || null,
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

    return NextResponse.json({ payments, total, page, pageSize, paymentMethods });
  } catch (error) {
    console.error("Error fetching gym invoices:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}
