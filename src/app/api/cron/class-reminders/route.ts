import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendClassReminderEmail } from "@/lib/email";

const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000; // avisa cuando falta 1 día o menos

export async function runClassReminders(): Promise<{ sent: number }> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MS);

  // Reservas de clases que empiezan dentro de 1 día (o menos) y a las que aún no se les
  // ha enviado el recordatorio. La ventana amplia ("<= 1 día", no un rango estrecho) hace
  // que el resultado no dependa de con qué frecuencia se ejecute este cron.
  const dueBookings = await prisma.classBooking.findMany({
    where: {
      reminderSentAt: null,
      class: { startTime: { gt: now, lte: windowEnd } },
    },
    select: {
      id: true,
      user: { select: { name: true, email: true, gym: { select: { name: true } } } },
      class: { select: { name: true, startTime: true } },
    },
  });

  let sent = 0;
  for (const booking of dueBookings) {
    try {
      const timeLabel = booking.class.startTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
      await sendClassReminderEmail(
        booking.user.email,
        booking.user.name,
        booking.class.name,
        booking.user.gym?.name || "tu gimnasio",
        timeLabel
      );
      await prisma.classBooking.update({ where: { id: booking.id }, data: { reminderSentAt: now } });
      sent++;
    } catch (e) {
      console.error(`Error sending class reminder for booking ${booking.id}:`, e);
    }
  }

  return { sent };
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isSecretValid = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isSecretValid) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { sent } = await runClassReminders();
    return NextResponse.json({ message: `CRON completado: ${sent} recordatorios de clase enviados`, sent });
  } catch (error) {
    console.error("CRON class-reminders error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
