import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Introduce un correo electrónico válido."),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Buscar usuario en base de datos
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    // Medida de seguridad (Email Enumeration Mitigation):
    // Si el usuario no existe, devolvemos 200 de todas formas para no dar pistas al atacante.
    if (!user) {
      return NextResponse.json({
        message: "Si tu cuenta de correo está registrada, recibirás un enlace de restablecimiento.",
      });
    }

    // 2. Generar token aleatorio seguro y expiración (1 hora)
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora de validez

    // Guardar en base de datos
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    // 3. Generar enlace de restablecimiento
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const resetLink = `${origin}/reset-password?token=${token}`;

    // 4. Enviar email (vía Resend o loguear en consola si no hay clave de API)
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey && resendApiKey !== "mock" && resendApiKey.trim() !== "") {
      try {
        const mailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "FitWe Security <onboarding@resend.dev>", // Dominio de pruebas de Resend
            to: trimmedEmail,
            subject: "Restablece tu contraseña de FitWe",
            html: `
              <div style="font-family: sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; rounded: 16px;">
                <h2 style="color: #06b6d4; font-weight: 900; margin-bottom: 16px;">Restablecer Contraseña</h2>
                <p>Hola, ${user.name}:</p>
                <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de FitWe.</p>
                <p>Puedes hacerlo haciendo clic en el siguiente botón:</p>
                <div style="margin: 24px 0;">
                  <a href="${resetLink}" style="background-color: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Restablecer Contraseña</a>
                </div>
                <p style="font-size: 11px; color: #64748b; margin-top: 24px;">Este enlace es de un solo uso y expirará en 1 hora. Si no has solicitado este cambio, puedes ignorar este correo de forma segura.</p>
              </div>
            `,
          }),
        });

        if (!mailRes.ok) {
          const mailErr = await mailRes.text();
          console.error("Error al enviar email con Resend API:", mailErr);
        }
      } catch (mailError) {
        console.error("Excepción al enviar email con Resend:", mailError);
      }
    } else {
      // Fallback de desarrollo para logs de auditoría locales
      console.log("\n✉️  [DESARROLLO - EMAIL SIMULADO]");
      console.log(`Para: ${trimmedEmail}`);
      console.log(`Enlace de restablecimiento: ${resetLink}\n`);
    }

    return NextResponse.json({
      message: "Si tu cuenta de correo está registrada, recibirás un enlace de restablecimiento.",
    });
  } catch (error) {
    console.error("Error in forgot-password:", error);
    return NextResponse.json(
      { message: "Error interno en el servidor" },
      { status: 500 }
    );
  }
}
