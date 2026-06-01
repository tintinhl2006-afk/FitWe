import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const gymId = session.user.id;
    const origin = req.headers.get("origin") || "http://localhost:3000";

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    // ─── MODO SIMULADO / DEMO ───
    if (!stripeSecretKey) {
      console.log("Stripe Secret Key not found in env, using simulated Stripe Connect onboarding.");
      // Redirigir directamente al panel con estado success-mock
      const mockSuccessUrl = `${origin}/admin-gym/configuracion?stripe_status=success-mock`;
      return NextResponse.json({ url: mockSuccessUrl });
    }

    // ─── MODO REAL CON STRIPE CONNECT ───
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16" as any,
    });

    // Cargar los datos del gimnasio
    const gym = await prisma.user.findUnique({
      where: { id: gymId },
      select: { email: true, stripeAccountId: true, name: true },
    });

    if (!gym) {
      return NextResponse.json({ message: "Gimnasio no encontrado" }, { status: 404 });
    }

    let stripeAccountId = gym.stripeAccountId;

    // Crear la cuenta conectada si no existe una
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "standard",
        country: "ES",
        email: gym.email,
        business_type: "individual",
        metadata: {
          gymId: gymId,
          gymName: gym.name,
        },
      });

      stripeAccountId = account.id;

      // Guardar el accountId en la base de datos
      await prisma.user.update({
        where: { id: gymId },
        data: { stripeAccountId },
      });
    }

    // Crear el Account Link de incorporación (onboarding)
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${origin}/admin-gym/configuracion?stripe_status=refresh`,
      return_url: `${origin}/admin-gym/configuracion?stripe_status=success`,
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
