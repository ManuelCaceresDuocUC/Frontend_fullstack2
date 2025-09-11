import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "USER";
    } & DefaultSession["user"];
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: "ADMIN" | "USER";
    accessToken?: string;
  }
}
