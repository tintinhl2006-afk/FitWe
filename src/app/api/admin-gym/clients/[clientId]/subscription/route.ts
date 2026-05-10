import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNow } from "@/lib/timeUtils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { clientId } = await params;
    const payments = await prisma.paymentRecord.findMany({
      where: { userId: clientId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { clientId } = await params;
    const body = await req.json();
    const { status, addDays, exactEndDate, amount, description: customDesc } = body;

    // Verify client belongs to this gym and fetch gym config
    const [client, gymUser] = await Promise.all([
      prisma.user.findFirst({
        where: { id: clientId, gymId: session.user.id },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { monthlyFee: true },
      })
    ]);

    if (!client || !gymUser) {
      return NextResponse.json({ message: "Cliente o gimnasio no encontrado" }, { status: 404 });
    }

    const now = await getNow();
    let finalStatus = status || client.subscriptionStatus;
    let finalEndDate = client.subscriptionEndDate;
    let recordDescription = "";
    let recordAmount = amount || 0;

    if (exactEndDate) {
      finalEndDate = new Date(exactEndDate);
      recordDescription = customDesc || `Ajuste manual de fecha: ${finalEndDate.toLocaleDateString('es-ES')}`;
    } else if (addDays) {
      const baseDate = (client.subscriptionEndDate && client.subscriptionEndDate > now) 
        ? client.subscriptionEndDate 
        : now;
      finalEndDate = new Date(baseDate.getTime() + addDays * 24 * 60 * 60 * 1000);
      
      recordDescription = "Cuota mensual estándar";
      recordAmount = gymUser.monthlyFee;
    } else if (status === "ACTIVE" && (!client.subscriptionEndDate || client.subscriptionEndDate < now)) {
      finalEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      recordDescription = "Activación automática (30 días)";
      recordAmount = gymUser.monthlyFee;
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: clientId },
        data: {
          subscriptionStatus: finalStatus,
          subscriptionEndDate: finalEndDate,
        },
      });

      if (recordDescription) {
        await tx.paymentRecord.create({
          data: {
            userId: clientId,
            amount: recordAmount,
            description: recordDescription,
            date: now,
          }
        });
      }

      return user;
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
