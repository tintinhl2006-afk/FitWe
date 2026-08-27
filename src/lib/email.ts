/**
 * Shared outbound email sender for the whole app (password reset, email verification, ...).
 * Uses Resend when RESEND_API_KEY is configured; otherwise logs the email to the server
 * console so local/dev flows are still testable without a real provider.
 */
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
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
          from: "FitWe <onboarding@resend.dev>", // Dominio de pruebas de Resend
          to,
          subject,
          html,
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
    console.log(`Para: ${to}`);
    console.log(`Asunto: ${subject}`);
    console.log(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    console.log("");
  }
}

/**
 * Base URL to build links inside emails. Requests from the mobile app carry no browser
 * `Origin` header, so we can't rely on `req.headers.get("origin")` alone — NEXTAUTH_URL is
 * the reliable source (set for both web and the API mobile talks to), with the request's
 * own origin as a fallback for any environment where it's missing.
 */
export function getAppBaseUrl(req?: Request): string {
  return process.env.NEXTAUTH_URL || req?.headers.get("origin") || "http://localhost:3000";
}

function emailShell(title: string, bodyHtml: string): string {
  return `
    <div style="font-family: sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h2 style="color: #06b6d4; font-weight: 900; margin-bottom: 16px;">${title}</h2>
      ${bodyHtml}
    </div>
  `;
}

export async function sendPasswordResetEmail(to: string, name: string, resetLink: string) {
  await sendEmail({
    to,
    subject: "Restablece tu contraseña de FitWe",
    html: emailShell(
      "Restablecer Contraseña",
      `
        <p>Hola, ${name}:</p>
        <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de FitWe.</p>
        <p>Puedes hacerlo haciendo clic en el siguiente botón:</p>
        <div style="margin: 24px 0;">
          <a href="${resetLink}" style="background-color: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Restablecer Contraseña</a>
        </div>
        <p style="font-size: 11px; color: #64748b; margin-top: 24px;">Este enlace es de un solo uso y expirará en 1 hora. Si no has solicitado este cambio, puedes ignorar este correo de forma segura.</p>
      `
    ),
  });
}

export async function sendVerificationEmail(to: string, name: string, verifyLink: string) {
  await sendEmail({
    to,
    subject: "Confirma tu email de FitWe",
    html: emailShell(
      "Confirma tu Email",
      `
        <p>Hola, ${name}:</p>
        <p>Gracias por registrarte en FitWe. Confirma que esta dirección de correo es tuya haciendo clic en el siguiente botón:</p>
        <div style="margin: 24px 0;">
          <a href="${verifyLink}" style="background-color: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Confirmar Email</a>
        </div>
        <p style="font-size: 11px; color: #64748b; margin-top: 24px;">Este enlace expira en 24 horas. Si no has creado esta cuenta, puedes ignorar este correo de forma segura.</p>
      `
    ),
  });
}
