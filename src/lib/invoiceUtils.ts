import { prisma } from "@/lib/prisma";

/**
 * Generates the next sequential invoice number for a given gym.
 * Must be executed inside a Prisma transaction to ensure consistency and avoid race conditions.
 * 
 * @param tx The Prisma transaction client.
 * @param gymId The UUID of the gym user.
 * @returns A formatted invoice string, e.g. "F-2026-00001"
 */
export async function generateNextInvoiceNumber(tx: any, gymId: string): Promise<string> {
  const currentYear = new Date().getFullYear();
  
  let sequence = await tx.gymInvoiceSequence.findUnique({
    where: { gymId },
  });
  
  if (!sequence) {
    sequence = await tx.gymInvoiceSequence.create({
      data: { gymId, nextValue: 1 },
    });
  }
  
  const currentValue = sequence.nextValue;
  
  // Increment for the next invocation
  await tx.gymInvoiceSequence.update({
    where: { gymId },
    data: { nextValue: currentValue + 1 },
  });
  
  // Format with leading zeroes, e.g., "00001"
  const formattedSeq = String(currentValue).padStart(5, "0");
  return `F-${currentYear}-${formattedSeq}`;
}
