import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const gymId = session.user.id;
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const { id } = await params;

    const method = await prisma.gymPaymentMethod.findUnique({ where: { id } });
    if (!method || method.gymId !== gymId || method.gateway !== "STRIPE") {
      return NextResponse.json({ message: "Método de pago no encontrado" }, { status: 404 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    // ─── MODO SIMULADO / DEMO ───
    if (!stripeSecretKey) {
      console.log("Stripe Secret Key not found in env, using simulated Stripe Connect onboarding.");
      const mockSuccessUrl = `${origin}/admin-gym/metodos-pago?stripe_status=success-mock&methodId=${method.id}`;
      return NextResponse.json({ url: mockSuccessUrl });
    }

    // ─── MODO REAL CON STRIPE CONNECT ───
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16" as any,
    });

    const gym = await prisma.user.findUnique({
      where: { id: gymId },
      select: { email: true, name: true },
    });

    if (!gym) {
      return NextResponse.json({ message: "Gimnasio no encontrado" }, { status: 404 });
    }

    let stripeAccountId = method.stripeAccountId;

    // Crear la cuenta conectada si no existe una para este método
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "standard",
        country: "ES",
        email: gym.email,
        business_type: "individual",
        metadata: {
          gymId,
          gymName: gym.name,
          paymentMethodId: method.id,
        },
      });

      stripeAccountId = account.id;

      await prisma.gymPaymentMethod.update({
        where: { id: method.id },
        data: { stripeAccountId },
      });
    }

    // Crear el Account Link de incorporación (onboarding)
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${origin}/admin-gym/metodos-pago?stripe_status=refresh&methodId=${method.id}`,
      return_url: `${origin}/admin-gym/metodos-pago?stripe_status=success&methodId=${method.id}`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("Error in stripe connect route:", error);
    return NextResponse.json(
      { message: "Error interno al iniciar Stripe Connect" },
      { status: 500 }
    );
  }
}
