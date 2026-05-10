import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: "USER" | "GYM";
    subscriptionStatus: string;
    subscriptionEndDate: string | null;
    serverNow: string;
    monthlyFee?: number;
  }

  interface Session {
    user: User & {
      id: string;
      role: "USER" | "GYM";
      subscriptionStatus: string;
      subscriptionEndDate: string | null;
      serverNow: string;
      monthlyFee?: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "USER" | "GYM";
    subscriptionStatus: string;
    subscriptionEndDate: string | null;
    serverNow: string;
    monthlyFee?: number;
  }
}
