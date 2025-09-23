// src/types/next-auth.d.ts
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "ADMIN" | "USER";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: "ADMIN" | "USER";
    accessToken?: string;
  }
}
