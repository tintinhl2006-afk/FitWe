import { getServerSession } from "next-auth";
import { decode, encode } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { getAuthSecret } from "@/lib/authSecret";
import { prisma } from "@/lib/prisma";

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
    try {
      const decoded = await decode({ token: tokenString, secret: getAuthSecret() });
      if (decoded?.id) {
        // Honour revocation on the mobile path exactly like the cookie path does
        // (src/lib/auth.ts session callback). This used to return the token's own claims
        // unchecked, so deactivating a member, refunding with revocation or resetting a
        // password never affected a mobile token during its 30-day life. The role also comes
        // from the database now instead of the token (and no longer defaults to a role name
        // the schema does not have).
        const dbUser = await prisma.user.findUnique({
          where: { id: decoded.id as string },
          select: { sessionVersion: true, role: true },
        });
        if (!dbUser || dbUser.sessionVersion !== Number(decoded.sessionVersion)) return null;
        return { id: decoded.id as string, role: dbUser.role };
      }
    } catch (err) {
      // NEXTAUTH_SECRET missing is a real misconfiguration, not just "no bearer token
      // present" — surface it loudly instead of silently degrading to cookie auth (which
      // would just look like an unrelated 401 to whoever's debugging this).
      if (err instanceof Error && err.message.includes("NEXTAUTH_SECRET")) {
        console.error(err.message);
      }
      // Fall through to cookie-based session
    }
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return { id: session.user.id, role: session.user.role };
}

/**
 * After an action that bumps sessionVersion for the caller (a password change), the caller's own
 * mobile token would be revoked along with every other one. Returns a fresh token carrying the
 * new version so the app can keep its session; null for cookie callers (they re-sync through
 * the session `update()` call instead).
 */
export async function reissueBearerToken(req: Request, sessionVersion: number): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const decoded = await decode({ token: authHeader.substring(7), secret: getAuthSecret() });
    if (!decoded) return null;
    return await encode({ token: { ...decoded, sessionVersion }, secret: getAuthSecret() });
  } catch {
    return null;
  }
}
