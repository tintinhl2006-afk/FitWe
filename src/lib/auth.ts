import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getNow } from "@/lib/timeUtils";

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email y contraseña requeridos");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { gym: { select: { id: true, name: true } } },
        });

        if (!user || !user.password) {
          throw new Error("Usuario no encontrado");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Contraseña incorrecta");
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
        if (session?.name) token.name = session.name;
        if (session?.monthlyFee !== undefined) token.monthlyFee = session.monthlyFee;
        if (session?.subscriptionStatus) token.subscriptionStatus = session.subscriptionStatus;
        if (session?.subscriptionEndDate) token.subscriptionEndDate = session.subscriptionEndDate;
        if (session?.mustChangePassword !== undefined) token.mustChangePassword = session.mustChangePassword;
        if (session?.sessionVersion !== undefined) token.sessionVersion = session.sessionVersion;
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
