import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertOwnedMethod(gymId: string, methodId: string) {
  const method = await prisma.gymPaymentMethod.findUnique({ where: { id: methodId } });
  if (!method || method.gymId !== gymId) return null;
  return method;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const method = await assertOwnedMethod(session.user.id, params.id);
    if (!method) {
      return NextResponse.json({ message: "Método de pago no encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const {
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
      redsysFuc,
      redsysTerminal,
      redsysClave,
    } = body;

    const updateData: Record<string, any> = {};
    if (billingName !== undefined) updateData.billingName = billingName.trim();
    if (billingDocumentType !== undefined) updateData.billingDocumentType = billingDocumentType || null;
    if (billingDocumentNumber !== undefined) updateData.billingDocumentNumber = billingDocumentNumber || null;
    if (billingDocumentLetter !== undefined) updateData.billingDocumentLetter = billingDocumentLetter || null;
    if (billingPhone !== undefined) updateData.billingPhone = billingPhone || null;
    if (billingEmail !== undefined) updateData.billingEmail = billingEmail || null;
    if (billingAddress !== undefined) updateData.billingAddress = billingAddress || null;
    if (billingCountry !== undefined) updateData.billingCountry = billingCountry || "España";
    if (billingProvince !== undefined) updateData.billingProvince = billingProvince || null;
    if (billingLocality !== undefined) updateData.billingLocality = billingLocality || null;
    if (billingPostalCode !== undefined) updateData.billingPostalCode = billingPostalCode || null;

    if (method.gateway === "REDSYS") {
      if (redsysFuc !== undefined) updateData.redsysFuc = redsysFuc?.trim() || null;
      if (redsysTerminal !== undefined) updateData.redsysTerminal = redsysTerminal?.trim() || "001";
      if (redsysClave !== undefined) updateData.redsysClave = redsysClave?.trim() || null;
    }

    const updated = await prisma.gymPaymentMethod.update({
      where: { id: method.id },
      data: updateData,
    });

    return NextResponse.json({ method: updated });
  } catch (error) {
    console.error("Error updating gym payment method:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const method = await assertOwnedMethod(session.user.id, params.id);
    if (!method) {
      return NextResponse.json({ message: "Método de pago no encontrado" }, { status: 404 });
    }

    await prisma.gymPaymentMethod.delete({ where: { id: method.id } });

    return NextResponse.json({ message: "Método de pago eliminado" });
  } catch (error) {
    console.error("Error deleting gym payment method:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}
