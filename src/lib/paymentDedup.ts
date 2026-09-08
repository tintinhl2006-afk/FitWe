import { Prisma } from "@prisma/client";

/**
 * True when `error` is the unique-constraint violation on `PaymentRecord.providerRef` — the
 * signal that another request already created this exact payment (Stripe session id / Redsys
 * order) a moment ago. The `PaymentRecord.create` inside the transaction is what actually
 * prevents a double-grant race now: two concurrent verify/webhook calls for the same payment
 * can no longer both succeed, because only one INSERT can win the unique index. This replaces
 * a prior check-then-act (`findFirst` before `create`) that had a real TOCTOU gap.
 */
export function isDuplicateProviderRefViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray((error.meta as any)?.target) &&
    (error.meta as any).target.includes("providerRef")
  );
}
