import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "USER") {
      return NextResponse.json(
        { message: "Solo los clientes pueden realizar pagos" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { cardNumber, cardHolder, expiryDate, cvv } = body;

    // ── Validación de formato de tarjeta ──

    // Limpiar espacios del número de tarjeta
    const cleanCardNumber = cardNumber?.replace(/\s/g, "") || "";

    // Validar que sea un número de 13-19 dígitos
    if (!/^\d{13,19}$/.test(cleanCardNumber)) {
      return NextResponse.json(
        { message: "Número de tarjeta inválido. Debe contener entre 13 y 19 dígitos." },
        { status: 400 }
      );
    }

    // Validación Luhn (checksum estándar de tarjetas)
    let sum = 0;
    let isAlternate = false;
    for (let i = cleanCardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanCardNumber[i], 10);
      if (isAlternate) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isAlternate = !isAlternate;
    }
    if (sum % 10 !== 0) {
      return NextResponse.json(
        { message: "Número de tarjeta inválido. No pasa la validación de seguridad." },
        { status: 400 }
      );
    }

    // Validar titular
    if (!cardHolder || cardHolder.trim().length < 3) {
      return NextResponse.json(
        { message: "El nombre del titular es obligatorio (mínimo 3 caracteres)." },
        { status: 400 }
      );
    }

    // Validar fecha de expiración (MM/YY)
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      return NextResponse.json(
        { message: "Fecha de expiración inválida. Usa el formato MM/AA." },
        { status: 400 }
      );
    }
    const [month, year] = expiryDate.split("/").map(Number);
    if (month < 1 || month > 12) {
      return NextResponse.json(
        { message: "Mes de expiración inválido." },
        { status: 400 }
      );
    }
    const fullYear = 2000 + year;
    const now = new Date();
    const expiryDateObj = new Date(fullYear, month); // First day of next month
    if (expiryDateObj <= now) {
      return NextResponse.json(
        { message: "La tarjeta ha expirado." },
        { status: 400 }
      );
    }

    // Validar CVV (3-4 dígitos)
    if (!/^\d{3,4}$/.test(cvv)) {
      return NextResponse.json(
        { message: "CVV inválido. Debe ser de 3 o 4 dígitos." },
        { status: 400 }
      );
    }

    // ── Simulación de pago exitoso ──

    const { planId } = body;

    // Obtener datos del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { monthlyFee: true, gymId: true },
    });

    if (!user || !user.gymId) {
      return NextResponse.json(
        { message: "No estás vinculado a ningún gimnasio." },
        { status: 400 }
      );
    }

    let amount = user.monthlyFee;
    let durationDays = 30;
    let planName = "Cuota mensual";
    let resolvedPlanId: string | null = null;

    // Si se proporciona un planId, buscar el plan
    if (planId) {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });

      if (!plan || plan.gymId !== user.gymId || !plan.isActive) {
        return NextResponse.json(
          { message: "Plan no válido o no disponible." },
          { status: 400 }
        );
      }

      amount = plan.price;
      durationDays = plan.durationDays;
      planName = plan.name;
      resolvedPlanId = plan.id;
    }

    // Calcular nueva fecha de fin de suscripción
    const newEndDate = new Date();
    newEndDate.setDate(newEndDate.getDate() + durationDays);

    // Transacción: registrar pago + actualizar suscripción + asignar plan
    const [payment] = await prisma.$transaction([
      prisma.paymentRecord.create({
        data: {
          userId: session.user.id,
          amount,
          description: `${planName} - Tarjeta ****${cleanCardNumber.slice(-4)}`,
          date: new Date(),
          planId: resolvedPlanId,
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          subscriptionStatus: "ACTIVE",
          subscriptionEndDate: newEndDate,
          ...(resolvedPlanId && { planId: resolvedPlanId }),
        },
      }),
    ]);

    return NextResponse.json(
      {
        message: "Pago procesado correctamente (simulado)",
        payment: {
          id: payment.id,
          amount: payment.amount,
          date: payment.date.toISOString(),
          lastFourDigits: cleanCardNumber.slice(-4),
        },
        subscription: {
          status: "ACTIVE",
          endDate: newEndDate.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
