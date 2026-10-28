import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/password";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/apiAuth";
import { erasedEmail } from "@/lib/accountErasure";

export async function POST(req: Request) {
  try {
    const userId = await getRequestUserId(req);
    if (!userId) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const account = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!account) return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });

    // Closing a gym removes a whole tenant (plans, classes, payment methods, every member's
    // link) and is not something to expose as a one-tap action.
    if (account.role === "GYM") {
      return NextResponse.json(
        { message: "Las cuentas de gimnasio no se pueden eliminar desde la app. Contacta con soporte." },
        { status: 403 }
      );
    }

    // Computed outside the transaction: bcrypt is deliberately slow.
    const unusablePassword = await hashPassword(crypto.randomBytes(32).toString("hex"));

    const outcome = await prisma.$transaction(
      async (tx) => {
        // Everything personal that is not a fiscal document goes, in one atomic step. This used
        // to be five independent commits followed by user.delete, which failed for every member
        // who had ever paid or booked a class (PaymentRecord and ClassBooking restrict the
        // delete), leaving the account alive with its whole training history already destroyed.
        const sessions = await tx.workoutSession.findMany({ where: { userId }, select: { id: true } });
        await tx.workoutSet.deleteMany({ where: { sessionId: { in: sessions.map((s) => s.id) } } });
        await tx.workoutSession.deleteMany({ where: { userId } });

        const routines = await tx.routine.findMany({ where: { userId }, select: { id: true } });
        await tx.routineExercise.deleteMany({ where: { routineId: { in: routines.map((r) => r.id) } } });
        await tx.routine.deleteMany({ where: { userId } });

        await tx.foodEntry.deleteMany({ where: { userId } });
        await tx.mealEntry.deleteMany({ where: { userId } });
        await tx.savedDiet.deleteMany({ where: { userId } });
        await tx.foodItem.deleteMany({ where: { userId } });
        await tx.nutritionProfile.deleteMany({ where: { userId } });
        await tx.classBooking.deleteMany({ where: { userId } });
        await tx.accessLog.deleteMany({ where: { userId } });

        // Private exercises nobody else uses go too; any still referenced elsewhere is left
        // (the foreign key detaches it) rather than blocking the closure.
        await tx.exercise.deleteMany({
          where: { userId, routineExercises: { none: {} }, workoutSets: { none: {} } },
        });

        const invoices = await tx.paymentRecord.count({ where: { userId } });

        if (invoices === 0) {
          await tx.user.delete({ where: { id: userId } });
          return "deleted" as const;
        }

        // Issued invoices must be kept and point at this row. Keep only what an invoice needs
        // (name, tax id, address) and erase the rest, including the means to sign in. The
        // sessionVersion bump ends every session and mobile token immediately.
        await tx.user.update({
          where: { id: userId },
          data: {
            email: erasedEmail(userId),
            password: unusablePassword,
            image: null,
            bio: null,
            link: null,
            location: null,
            phone: null,
            landline: null,
            birthDate: null,
            civilStatus: null,
            gender: null,
            weight: null,
            height: null,
            referralSource: null,
            isRegisteredCitizen: false,
            resetToken: null,
            resetTokenExpiry: null,
            verificationToken: null,
            verificationTokenExpiry: null,
            emailVerified: false,
            mustChangePassword: false,
            subscriptionStatus: "INACTIVE",
            creditsRemaining: null,
            creditsNextRechargeAt: null,
            isPrivate: true,
            sessionVersion: { increment: 1 },
          },
        });
        return "anonymised" as const;
      },
      { timeout: 20000 }
    );

    return NextResponse.json({
      message:
        outcome === "deleted"
          ? "Cuenta eliminada"
          : "Cuenta cerrada. Tus datos personales se han borrado; solo se conservan las facturas emitidas, que el gimnasio debe guardar por obligación legal.",
      outcome,
    });
  } catch (e) {
    console.error("Error deleting account:", e);
    return NextResponse.json({ message: "Error al eliminar" }, { status: 500 });
  }
}
