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

    // Verificar que el cliente pertenezca a este gimnasio y obtener sus planes activos
    const [client, gymPlans] = await Promise.all([
      prisma.user.findFirst({
        where: { id: clientId, gymId: session.user.id },
      }),
      prisma.subscriptionPlan.findMany({
        where: { gymId: session.user.id, isActive: true },
        orderBy: { price: "asc" },
        take: 1,
      })
    ]);

    if (!client) {
      return NextResponse.json({ message: "Cliente no encontrado" }, { status: 404 });
    }

    const firstPlan = gymPlans[0];
    const defaultPrice = firstPlan ? firstPlan.price : 49.99;

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
      
      recordDescription = firstPlan ? `Cuota estándar: ${firstPlan.name}` : "Cuota estándar del centro";
      recordAmount = amount || defaultPrice;
    } else if (status === "ACTIVE" && (!client.subscriptionEndDate || client.subscriptionEndDate < now)) {
      finalEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      recordDescription = "Activación automática (30 días)";
      recordAmount = amount || defaultPrice;
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: clientId },
        data: {
          subscriptionStatus: finalStatus,
          subscriptionEndDate: finalEndDate,
          sessionVersion: { increment: 1 },
        },
      });

      if (recordDescription) {
        let invoiceNumber = null;
        if (session.user.id) {
          const { generateNextInvoiceNumber } = await import("@/lib/invoiceUtils");
          invoiceNumber = await generateNextInvoiceNumber(tx, session.user.id);
        }

        await tx.paymentRecord.create({
          data: {
            userId: clientId,
            amount: recordAmount,
            description: recordDescription,
            date: now,
            invoiceNumber,
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
