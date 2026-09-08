/**
 * Shared outbound email sender for the whole app (password reset, email verification, ...).
 * Uses Resend when RESEND_API_KEY is configured; otherwise logs the email to the server
 * console so local/dev flows are still testable without a real provider.
 */
export interface EmailAttachment {
  filename: string;
  /** Base64-encoded file contents (Resend's expected format). */
  content: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}) {
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
          ...(attachments && attachments.length > 0 ? { attachments } : {}),
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
    if (attachments?.length) {
      console.log(`Adjuntos: ${attachments.map((a) => a.filename).join(", ")}`);
    }
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

export async function sendInvoiceEmail(
  to: string,
  clientName: string,
  invoiceNumber: string,
  pdfBytes: Uint8Array
) {
  await sendEmail({
    to,
    subject: `Tu factura ${invoiceNumber} de FitWe`,
    html: emailShell(
      "Nueva Factura",
      `
        <p>Hola, ${clientName}:</p>
        <p>Adjuntamos la factura <strong>${invoiceNumber}</strong> correspondiente a tu último pago.</p>
        <p style="font-size: 11px; color: #64748b; margin-top: 24px;">También puedes consultarla en cualquier momento desde la app, en tu historial de pagos.</p>
      `
    ),
    attachments: [
      {
        filename: `factura_${invoiceNumber}.pdf`,
        content: Buffer.from(pdfBytes).toString("base64"),
      },
    ],
  });
}

export async function sendClassBookingConfirmedEmail(
  to: string,
  name: string,
  className: string,
  gymName: string,
  dateLabel: string,
  timeLabel: string
) {
  await sendEmail({
    to,
    subject: `Reserva confirmada: ${className}`,
    html: emailShell(
      "Reserva Confirmada",
      `
        <p>Hola, ${name}:</p>
        <p>Tu plaza en <strong>${className}</strong> en ${gymName} está confirmada.</p>
        <div style="margin: 20px 0; padding: 16px; background-color: #f0fdfa; border-radius: 12px; border: 1px solid #99f6e4;">
          <p style="margin: 0; font-size: 13px; color: #0f766e;"><strong>Cuándo:</strong> ${dateLabel}, ${timeLabel}</p>
        </div>
        <p style="font-size: 11px; color: #64748b; margin-top: 24px;">Puedes cancelar tu plaza en cualquier momento desde la app, en la sección de Clases.</p>
      `
    ),
  });
}

export async function sendClassBookingCancelledEmail(
  to: string,
  name: string,
  className: string,
  dateLabel: string,
  timeLabel: string
) {
  await sendEmail({
    to,
    subject: `Reserva cancelada: ${className}`,
    html: emailShell(
      "Reserva Cancelada",
      `
        <p>Hola, ${name}:</p>
        <p>Tu plaza en <strong>${className}</strong> (${dateLabel}, ${timeLabel}) ha sido cancelada correctamente. Tu hueco queda libre para otro socio.</p>
        <p style="font-size: 11px; color: #64748b; margin-top: 24px;">Si ha sido un error, puedes volver a reservar desde la app si aún quedan plazas.</p>
      `
    ),
  });
}

export async function sendClassReminderEmail(
  to: string,
  name: string,
  className: string,
  gymName: string,
  timeLabel: string
) {
  await sendEmail({
    to,
    subject: `Mañana tienes clase: ${className}`,
    html: emailShell(
      "Recordatorio de Clase",
      `
        <p>Hola, ${name}:</p>
        <p><strong>${className}</strong> en ${gymName} es <strong>mañana a las ${timeLabel}</strong>. ¡Te esperamos!</p>
        <p style="font-size: 11px; color: #64748b; margin-top: 24px;">Si ya no puedes asistir, cancela tu plaza desde la app para liberar el hueco a otro socio.</p>
      `
    ),
  });
}

export async function sendSubscriptionExpiringSoonEmail(
  to: string,
  name: string,
  gymName: string,
  daysLeft: number,
  endDateLabel: string,
  paymentLink: string
) {
  await sendEmail({
    to,
    subject: `Tu cuota de ${gymName} caduca en ${daysLeft === 1 ? "1 día" : `${daysLeft} días`}`,
    html: emailShell(
      "Tu Cuota Está a Punto de Caducar",
      `
        <p>Hola, ${name}:</p>
        <p>Tu cuota en <strong>${gymName}</strong> caduca el <strong>${endDateLabel}</strong>. Renuévala para no perder el acceso.</p>
        <div style="margin: 24px 0;">
          <a href="${paymentLink}" style="background-color: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Renovar Cuota</a>
        </div>
        <p style="font-size: 11px; color: #64748b; margin-top: 24px;">Si ya la has renovado, puedes ignorar este correo.</p>
      `
    ),
  });
}

export async function sendSubscriptionExpiredEmail(
  to: string,
  name: string,
  gymName: string,
  paymentLink: string
) {
  await sendEmail({
    to,
    subject: `Tu cuota de ${gymName} ha caducado`,
    html: emailShell(
      "Tu Cuota Ha Caducado",
      `
        <p>Hola, ${name}:</p>
        <p>Tu cuota en <strong>${gymName}</strong> ha caducado y tu acceso ha quedado inactivo. Renuévala cuando quieras para recuperarlo.</p>
        <div style="margin: 24px 0;">
          <a href="${paymentLink}" style="background-color: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Renovar Cuota</a>
        </div>
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
