import { prisma } from "@/lib/prisma";
import { generateInvoicePdf, type InvoiceClient, type InvoiceGym } from "@/lib/generateInvoicePdf";
import { sendInvoiceEmail } from "@/lib/email";

/** First 2 letters (A-Z only) of a name, uppercased — used as the invoice number prefix. */
function invoicePrefixFromName(name: string | null | undefined): string {
  const letters = (name || "").replace(/[^a-zA-Z]/g, "").toUpperCase();
  return letters.length >= 2 ? letters.slice(0, 2) : (letters + "XX").slice(0, 2);
}

/**
 * Generates the next sequential invoice number for a payment method, formatted as
 * `<2 letras del nombre>-<año>-00001`. Each payment method has its own independent
 * sequence starting at 1, so switching or adding methods never skips/reuses numbers
 * from another one. Must run inside a Prisma transaction to avoid race conditions.
 *
 * @param tx The Prisma transaction client.
 * @param gymId The UUID of the gym user (used only for the no-payment-method fallback).
 * @param paymentMethod The payment method the invoice is being issued under, or null/undefined
 *   if the gym has none (falls back to a gym-level sequence with an "FW" prefix).
 */
export async function generateNextInvoiceNumber(
  tx: any,
  gymId: string,
  paymentMethod?: { id: string; billingName: string } | null
): Promise<string> {
  const currentYear = new Date().getFullYear();

  if (paymentMethod) {
    const method = await tx.gymPaymentMethod.findUnique({
      where: { id: paymentMethod.id },
      select: { invoiceNextValue: true },
    });
    const currentValue = method?.invoiceNextValue ?? 1;

    await tx.gymPaymentMethod.update({
      where: { id: paymentMethod.id },
      data: { invoiceNextValue: currentValue + 1 },
    });

    const prefix = invoicePrefixFromName(paymentMethod.billingName);
    const formattedSeq = String(currentValue).padStart(5, "0");
    return `${prefix}-${currentYear}-${formattedSeq}`;
  }

  // Sin ningún método de pago configurado: se mantiene una numeración de respaldo a nivel
  // de gimnasio (p.ej. para un cobro en efectivo registrado antes de dar de alta ninguno).
  let sequence = await tx.gymInvoiceSequence.findUnique({
    where: { gymId },
  });

  if (!sequence) {
    sequence = await tx.gymInvoiceSequence.create({
      data: { gymId, nextValue: 1 },
    });
  }

  const currentValue = sequence.nextValue;

  await tx.gymInvoiceSequence.update({
    where: { gymId },
    data: { nextValue: currentValue + 1 },
  });

  const formattedSeq = String(currentValue).padStart(5, "0");
  return `FW-${currentYear}-${formattedSeq}`;
}

/**
 * Emails the invoice PDF for a just-created payment to the client — the exact same PDF
 * (same `generateInvoicePdf` function, same field mapping) the app itself shows/downloads,
 * so the emailed copy never drifts from what's visible in the panel. Best-effort: a failed
 * send is logged but never thrown, since it must not roll back or fail the payment flow
 * that already completed by the time this runs.
 */
export async function sendInvoiceEmailForPayment(paymentId: string): Promise<void> {
  try {
    const payment = await prisma.paymentRecord.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        amount: true,
        description: true,
        date: true,
        invoiceNumber: true,
        vatRate: true,
        source: true,
        user: {
          select: {
            name: true,
            lastName: true,
            email: true,
            documentType: true,
            documentNumber: true,
            documentLetter: true,
            address: true,
            postalCode: true,
            province: true,
            locality: true,
          },
        },
        paymentMethod: true,
      },
    });

    if (!payment || !payment.invoiceNumber) return;

    const client: InvoiceClient = {
      name: payment.user.name,
      lastName: payment.user.lastName || "",
      email: payment.user.email,
      documentType: payment.user.documentType || "",
      documentNumber: payment.user.documentNumber || "",
      documentLetter: payment.user.documentLetter || "",
      address: payment.user.address || "",
      postalCode: payment.user.postalCode || "",
      province: payment.user.province || "",
      locality: payment.user.locality || "",
    };

    // Misma lógica que /api/admin-gym/invoices: los datos fiscales del emisor son los del
    // método de pago con el que se cobró, no el perfil general del gimnasio.
    const pm = payment.paymentMethod;
    const gym: InvoiceGym | null = pm
      ? {
          name: pm.billingName,
          email: pm.billingEmail || "",
          documentType: pm.billingDocumentType || "",
          documentNumber: pm.billingDocumentNumber || "",
          documentLetter: pm.billingDocumentLetter || "",
          phone: pm.billingPhone || "",
          address: pm.billingAddress || "",
          country: pm.billingCountry || "",
          province: pm.billingProvince || "",
          locality: pm.billingLocality || "",
          postalCode: pm.billingPostalCode || "",
        }
      : null;

    const pdfBytes = await generateInvoicePdf(
      {
        id: payment.id,
        amount: payment.amount,
        description: payment.description,
        date: payment.date,
        invoiceNumber: payment.invoiceNumber,
        vatRate: payment.vatRate,
        source: payment.source,
      },
      client,
      gym
    );

    await sendInvoiceEmail(payment.user.email, payment.user.name, payment.invoiceNumber, pdfBytes);
  } catch (error) {
    console.error("Error sending invoice email:", error);
  }
}

/**
 * Returns the gym's currently active payment method, or null if none is active.
 * Used to stamp new PaymentRecords with the billing/fiscal data that should appear
 * on their invoice, independently of the gym's general profile.
 */
export async function getActiveGymPaymentMethod(tx: any, gymId: string) {
  return tx.gymPaymentMethod.findFirst({
    where: { gymId, isActive: true },
  });
}
