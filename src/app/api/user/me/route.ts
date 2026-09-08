import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/apiAuth";

export async function GET(req: Request) {
  try {
    // Delegates to the shared, correctly-signed bearer-token verifier — this route used to
    // have its own decode logic with an insecure fallback that trusted an UNSIGNED base64
    // JSON blob (e.g. `{"id":"<any-user-id>"}`) whenever JWT verification failed, letting
    // anyone impersonate any user id with no signature at all. Removed.
    const userId = await getRequestUserId(req);

    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        gymId: true,
        image: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        gym: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    // Evaluate real subscription expiration against end date
    const now = new Date();
    const isExpired = user.subscriptionEndDate ? new Date(user.subscriptionEndDate) < now : false;
    const isSubscriptionActive = user.subscriptionStatus === "ACTIVE" && !isExpired;
    const finalSubscriptionStatus = isSubscriptionActive ? "ACTIVE" : "INACTIVE";

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        gymId: user.gymId || null,
        gymName: user.gym?.name || null,
        subscriptionStatus: finalSubscriptionStatus,
        subscriptionEndDate: user.subscriptionEndDate?.toISOString() || null,
        avatarUrl: user.image || null,
      },
    });
  } catch (error: any) {
    console.error("User me error:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
