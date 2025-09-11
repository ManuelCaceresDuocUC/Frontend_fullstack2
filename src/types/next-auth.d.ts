// types/next-auth.d.ts
import "next-auth";
import { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "USER";
    } & DefaultSession["user"];
  }
  interface User {
    id?: string;
    role?: "ADMIN" | "USER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: "ADMIN" | "USER";
  }
}
