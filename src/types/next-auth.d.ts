import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: "USER" | "GYM" | "EMPLOYEE";
    image?: string | null;
    subscriptionStatus: string;
    subscriptionEndDate: string | null;
    serverNow: string;
    monthlyFee?: number;
    gymId?: string | null;
    gymName?: string | null;
    mustChangePassword?: boolean;
  }

  interface Session {
    user: User & {
      id: string;
      role: "USER" | "GYM" | "EMPLOYEE";
      image?: string | null;
      subscriptionStatus: string;
      subscriptionEndDate: string | null;
      serverNow: string;
      monthlyFee?: number;
      gymId?: string | null;
      gymName?: string | null;
      mustChangePassword?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "USER" | "GYM" | "EMPLOYEE";
    subscriptionStatus: string;
    subscriptionEndDate: string | null;
    serverNow: string;
    monthlyFee?: number;
    gymId?: string | null;
    gymName?: string | null;
    mustChangePassword?: boolean;
  }
}

