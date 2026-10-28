import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { getNow } from "@/lib/timeUtils";
import { checkRateLimit, pickClientIp } from "@/lib/rateLimit";

export const authOptions: NextAuthOptions = {
  // ... (adapter remains same)
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // ... (provider remains same)
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "tu@email.com" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email y contraseña requeridos");
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();
        // NextAuth's credentials `req` exposes headers as a plain object, not a full Request —
        // extract the proxy-forwarded IP the same way the shape allows.
        const reqHeaders = req?.headers as Record<string, string> | undefined;
        const ip = pickClientIp((name) => reqHeaders?.[name]);
        const [ipLimit, emailLimit] = await Promise.all([
          checkRateLimit(`login:ip:${ip}`, 20, 15),
          checkRateLimit(`login:email:${normalizedEmail}`, 10, 15),
        ]);
        if (!ipLimit.allowed || !emailLimit.allowed) {
          throw new Error("Demasiados intentos. Espera unos minutos antes de volver a intentarlo.");
        }

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: { gym: { select: { id: true, name: true } } },
        });

        // One message for "no such user" and "wrong password", and the same amount of work for
        // both: telling them apart (by text or by response time) let anyone test which emails
        // are registered. The mobile login already behaved this way.
        const isValid = await verifyPassword(credentials.password, user?.password);

        if (!user || !isValid) {
          throw new Error("Credenciales inválidas");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionEndDate: user.subscriptionEndDate?.toISOString() || null,
          serverNow: (await getNow()).toISOString(),
          monthlyFee: user.monthlyFee,
          gymId: user.gymId || null,
          gymName: user.gym?.name || null,
          mustChangePassword: user.mustChangePassword,
          sessionVersion: user.sessionVersion,
        };
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.subscriptionStatus = user.subscriptionStatus;
        token.subscriptionEndDate = user.subscriptionEndDate;
        token.serverNow = user.serverNow;
        token.monthlyFee = user.monthlyFee;
        token.gymId = user.gymId;
        token.gymName = user.gymName;
        token.mustChangePassword = user.mustChangePassword;
        token.sessionVersion = (user as any).sessionVersion;
      }
      
      // Manejar la actualización manual del lado del cliente
      if (trigger === "update") {
        if (typeof session?.name === "string" && session.name.trim()) token.name = session.name;

        // `session` here is req.body.data of POST /api/auth/session, i.e. fully controlled by
        // whoever holds the cookie. Security-relevant claims must never be copied from it:
        // sessionVersion is the very value the revocation check below compares against, so
        // accepting it from the client let a revoked session re-validate itself. Re-read them.
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            sessionVersion: true,
            mustChangePassword: true,
            subscriptionStatus: true,
            subscriptionEndDate: true,
            monthlyFee: true,
          },
        });
        if (fresh) {
          token.sessionVersion = fresh.sessionVersion;
          token.mustChangePassword = fresh.mustChangePassword;
          token.subscriptionStatus = fresh.subscriptionStatus;
          token.subscriptionEndDate = fresh.subscriptionEndDate?.toISOString() ?? null;
          token.monthlyFee = fresh.monthlyFee;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Fetch image and sessionVersion directly from DB to validate session
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { image: true, sessionVersion: true },
        });

        // Si el usuario no existe o la versión de sesión no coincide, invalidamos la sesión de inmediato
        if (!dbUser || dbUser.sessionVersion !== (token.sessionVersion as number)) {
          console.log(`Sesión invalidada para el usuario ${token.email} (ID: ${token.id}). Razón: Sesión expirada o revocada.`);
          (session as any).user = null;
          return session;
        }

        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "GYM" | "EMPLOYEE";
        session.user.name = token.name as string;
        session.user.subscriptionStatus = token.subscriptionStatus as string;
        session.user.subscriptionEndDate = token.subscriptionEndDate as string;
        session.user.monthlyFee = token.monthlyFee as number;
        session.user.gymId = token.gymId as string | null;
        session.user.gymName = token.gymName as string | null;
        session.user.mustChangePassword = token.mustChangePassword as boolean;
        session.user.image = dbUser.image || null;
        
        // Always refresh serverNow from the cookie on each session request
        session.user.serverNow = (await getNow()).toISOString();
      }
      return session;
    }
  },
  pages: {
    signIn: "/login"
  }
};
