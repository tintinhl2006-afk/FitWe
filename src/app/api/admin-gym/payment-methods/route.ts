import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/encryption";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const rawMethods = await prisma.gymPaymentMethod.findMany({
      where: { gymId: session.user.id },
      orderBy: { createdAt: "asc" },
    });

    // Never send the (encrypted, at-rest) Redsys signing key to the browser — it's write-only
    // from the client's perspective. The UI only needs to know whether one is already set.
    const methods = rawMethods.map(({ redsysClave, ...method }) => ({
      ...method,
      hasRedsysClave: !!redsysClave,
    }));

    return NextResponse.json({ methods });
  } catch (error) {
    console.error("Error fetching gym payment methods:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      gateway,
      billingName,
      billingDocumentType,
      billingDocumentNumber,
      billingDocumentLetter,
      billingPhone,
      billingEmail,
      billingAddress,
      billingCountry,
      billingProvince,
      billingLocality,
      billingPostalCode,
      vatRate,
      redsysFuc,
      redsysTerminal,
      redsysClave,
    } = body;

    if (gateway !== "STRIPE" && gateway !== "REDSYS") {
      return NextResponse.json({ message: "Pasarela no válida" }, { status: 400 });
    }

    if (!billingName || typeof billingName !== "string" || !billingName.trim()) {
      return NextResponse.json({ message: "El nombre de facturación es obligatorio" }, { status: 400 });
    }

    if (vatRate !== undefined && (Number(vatRate) < 0 || Number(vatRate) > 100)) {
      return NextResponse.json({ message: "El IVA debe estar entre 0 y 100" }, { status: 400 });
    }

    if (gateway === "REDSYS") {
      if (!redsysFuc || !redsysClave) {
        return NextResponse.json(
          { message: "El FUC y la clave secreta son obligatorios para dar de alta un TPV Redsys" },
          { status: 400 }
        );
      }
    }

    const gymId = session.user.id;

    const method = await prisma.$transaction(async (tx) => {
      const existingCount = await tx.gymPaymentMethod.count({ where: { gymId } });

      return tx.gymPaymentMethod.create({
        data: {
          gymId,
          gateway,
          isActive: existingCount === 0, // el primer método del gimnasio se activa automáticamente
          billingName: billingName.trim(),
          billingDocumentType: billingDocumentType || null,
          billingDocumentNumber: billingDocumentNumber || null,
          billingDocumentLetter: billingDocumentLetter || null,
          billingPhone: billingPhone || null,
          billingEmail: billingEmail || null,
          billingAddress: billingAddress || null,
          billingCountry: billingCountry || "España",
          billingProvince: billingProvince || null,
          billingLocality: billingLocality || null,
          billingPostalCode: billingPostalCode || null,
          vatRate: vatRate !== undefined ? Number(vatRate) : 21,
          ...(gateway === "REDSYS"
            ? {
                redsysFuc: redsysFuc.trim(),
                redsysTerminal: redsysTerminal?.trim() || "001",
                redsysClave: encryptSecret(redsysClave.trim()),
              }
            : {}),
        },
      });
    });

    const { redsysClave: _redsysClave, ...methodWithoutClave } = method;
    return NextResponse.json({ method: { ...methodWithoutClave, hasRedsysClave: !!method.redsysClave } });
  } catch (error) {
    console.error("Error creating gym payment method:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}
