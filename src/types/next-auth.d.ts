import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: "USER" | "GYM";
  }

  interface Session {
    user: User & {
      id: string;
      role: "USER" | "GYM";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "USER" | "GYM";
  }
}
