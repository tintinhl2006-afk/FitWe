import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const gymId = session.user.id;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    const method = await prisma.gymPaymentMethod.findUnique({ where: { id: params.id } });
    if (!method || method.gymId !== gymId || method.gateway !== "STRIPE") {
      return NextResponse.json({ message: "Método de pago no encontrado" }, { status: 404 });
    }

    // ─── MODO SIMULADO / DEMO ───
    if (!stripeSecretKey) {
      const mockAccountId = method.stripeAccountId || "acct_mock123456789";

      await prisma.gymPaymentMethod.update({
        where: { id: method.id },
        data: {
          stripeConnected: true,
          stripeAccountId: mockAccountId,
        },
      });

      return NextResponse.json({
        stripeConnected: true,
        stripeAccountId: mockAccountId,
        isMock: true,
      });
    }

    // ─── MODO REAL CON STRIPE CONNECT ───
    if (!method.stripeAccountId) {
      return NextResponse.json({
        stripeConnected: false,
        message: "No se ha iniciado la conexión con Stripe",
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16" as any,
    });

    const account = await stripe.accounts.retrieve(method.stripeAccountId);

    const isConnected = !!account.charges_enabled && !!account.details_submitted;

    if (isConnected !== method.stripeConnected) {
      await prisma.gymPaymentMethod.update({
        where: { id: method.id },
        data: { stripeConnected: isConnected },
      });
    }

    return NextResponse.json({
      stripeConnected: isConnected,
      stripeAccountId: method.stripeAccountId,
      isMock: false,
    });
  } catch (error) {
    console.error("Error in stripe status check route:", error);
    return NextResponse.json(
      { message: "Error interno al verificar el estado de Stripe" },
      { status: 500 }
    );
  }
}
