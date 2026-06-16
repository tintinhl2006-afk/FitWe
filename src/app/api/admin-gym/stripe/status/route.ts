import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const gymId = session.user.id;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    // Obtener datos actuales del gimnasio
    const gym = await prisma.user.findUnique({
      where: { id: gymId },
      select: { stripeAccountId: true, stripeConnected: true },
    });

    if (!gym) {
      return NextResponse.json({ message: "Gimnasio no encontrado" }, { status: 404 });
    }

    // ─── MODO SIMULADO / DEMO ───
    if (!stripeSecretKey) {
      // Simular éxito y registrar de forma ficticia si se requiere
      const mockAccountId = gym.stripeAccountId || "acct_mock123456789";
      
      await prisma.user.update({
        where: { id: gymId },
        data: {
          stripeConnected: true,
          stripeAccountId: mockAccountId,
          stripeEnabled: true,
        },
      });

      return NextResponse.json({
        stripeConnected: true,
        stripeAccountId: mockAccountId,
        isMock: true,
      });
    }

    // ─── MODO REAL CON STRIPE CONNECT ───
    if (!gym.stripeAccountId) {
      return NextResponse.json({
        stripeConnected: false,
        message: "No se ha iniciado la conexión con Stripe",
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16" as any,
    });

    // Recuperar la cuenta de Stripe para inspeccionar su onboarding
    const account = await stripe.accounts.retrieve(gym.stripeAccountId);

    const isConnected = !!account.charges_enabled && !!account.details_submitted;

    if (isConnected !== gym.stripeConnected) {
      await prisma.user.update({
        where: { id: gymId },
        data: { 
          stripeConnected: isConnected,
          ...(isConnected && { stripeEnabled: true }),
        },
      });
    }

    return NextResponse.json({
      stripeConnected: isConnected,
      stripeAccountId: gym.stripeAccountId,
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
