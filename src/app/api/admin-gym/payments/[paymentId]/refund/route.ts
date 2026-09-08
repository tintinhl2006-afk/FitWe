import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Marks a payment as refunded and, optionally, revokes the client's access immediately.
 *
 * Scope, deliberately: this does NOT attempt to precisely "undo" the exact number of days
 * or credits that payment granted. With the current data model (a single cumulative
 * subscriptionEndDate/creditsRemaining, not a ledger of individual grants), that calculation
 * is only unambiguous when this is the client's *only* payment — if they've paid again since,
 * subtracting days automatically could produce a wrong result. Instead: the refund is always
 * recorded (so the invoice/audit trail is correct — a refunded payment must never look like a
 * normal one), and revoking access is an explicit, separate choice left to gym staff, who have
 * the full picture of the client's history.
 */
export async function POST(req: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { paymentId } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : null;
    const revokeAccess = body.revokeAccess === true;

    const payment = await prisma.paymentRecord.findUnique({
      where: { id: paymentId },
      select: { id: true, userId: true, refundedAt: true, user: { select: { gymId: true } } },
    });

    if (!payment || payment.user.gymId !== session.user.id) {
      return NextResponse.json({ message: "Factura no encontrada" }, { status: 404 });
    }

    if (payment.refundedAt) {
      return NextResponse.json({ message: "Esta factura ya está marcada como reembolsada" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const refunded = await tx.paymentRecord.update({
        where: { id: paymentId },
        data: { refundedAt: new Date(), refundReason: reason },
      });

      if (revokeAccess) {
        await tx.user.update({
          where: { id: payment.userId },
          data: { subscriptionStatus: "INACTIVE", sessionVersion: { increment: 1 } },
        });
      }

      return refunded;
    });

    return NextResponse.json({ payment: updated });
  } catch (error) {
    console.error("Error refunding payment:", error);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}
