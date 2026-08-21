import { prisma } from "@/lib/prisma";

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
 * Returns the gym's currently active payment method, or null if none is active.
 * Used to stamp new PaymentRecords with the billing/fiscal data that should appear
 * on their invoice, independently of the gym's general profile.
 */
export async function getActiveGymPaymentMethod(tx: any, gymId: string) {
  return tx.gymPaymentMethod.findFirst({
    where: { gymId, isActive: true },
  });
}
