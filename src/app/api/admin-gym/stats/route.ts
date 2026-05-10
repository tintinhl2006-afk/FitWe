import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNow } from "@/lib/timeUtils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "GYM") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const gymId = session.user.id;
    const now = await getNow();

    // Clients stats
    const clients = await prisma.user.findMany({
      where: { gymId, role: "USER" },
      select: { subscriptionStatus: true },
    });

    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.subscriptionStatus === "ACTIVE").length;
    const inactiveClients = totalClients - activeClients;

    // Current month revenue
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Fetch payments for this gym's clients
    const payments = await prisma.paymentRecord.findMany({
      where: {
        user: { gymId },
        date: {
          lte: now // Up to current date just in case
        }
      },
      select: { amount: true, date: true }
    });

    // Calculate current month
    const currentMonthRevenue = payments
      .filter(p => p.date >= firstDayOfMonth && p.date <= lastDayOfMonth)
      .reduce((sum, p) => sum + p.amount, 0);

    // Group revenue for the last 6 months
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const revenueMap = new Map<string, number>();

    // Initialize last 6 months with 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      revenueMap.set(key, 0);
    }

    // Determine the start date for the 6-month window
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Aggregate revenue
    payments.forEach(p => {
      if (p.date >= sixMonthsAgo) {
        const key = `${monthNames[p.date.getMonth()]} ${p.date.getFullYear().toString().slice(-2)}`;
        if (revenueMap.has(key)) {
          revenueMap.set(key, revenueMap.get(key)! + p.amount);
        }
      }
    });

    const revenueByMonth = Array.from(revenueMap.entries()).map(([name, total]) => ({
      name,
      total: Math.round(total * 100) / 100 // rounding to 2 decimals
    }));

    return NextResponse.json({
      totalClients,
      activeClients,
      inactiveClients,
      currentMonthRevenue,
      revenueByMonth,
    });
  } catch (error) {
    console.error("Error fetching gym stats:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
