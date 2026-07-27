import { getServerSession } from "next-auth";
import { decode } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";

/**
 * Resolves the authenticated user id for an API route from either source:
 * - The web app's NextAuth session cookie (getServerSession).
 * - The mobile app's `Authorization: Bearer <next-auth JWT>` header, issued by
 *   /api/auth/mobile-login and /api/auth/mobile-register (same pattern as /api/user/me).
 *
 * Lets shared API routes serve both clients without changing web behavior.
 */
export async function getRequestUserId(req: Request): Promise<string | null> {
  const auth = await getRequestAuth(req);
  return auth?.id ?? null;
}

/**
 * Same resolution as getRequestUserId, but also returns the user's role — needed by
 * routes that branch on GYM vs regular member access (e.g. verifyRoutineAccess).
 */
export async function getRequestAuth(req: Request): Promise<{ id: string; role: string } | null> {
  const authHeader = req.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const tokenString = authHeader.substring(7);
    const secret = process.env.NEXTAUTH_SECRET || "default_secret_key";
    try {
      const decoded = await decode({ token: tokenString, secret });
      if (decoded?.id) return { id: decoded.id as string, role: (decoded.role as string) || "MEMBER" };
    } catch {
      // Fall through to cookie-based session
    }
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return { id: session.user.id, role: session.user.role };
}
