// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { JWT } from "next-auth/jwt";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",");

declare module "next-auth" {
  interface User { role: "ADMIN" | "USER" }
  interface Session { user: { name?: string|null; email?: string|null; image?: string|null; role: "ADMIN"|"USER" } }
}
declare module "next-auth/jwt" {
  interface JWT { role?: "ADMIN" | "USER" }
}

export const authOptions: NextAuthOptions = {
  providers: [GoogleProvider({ clientId: process.env.GOOGLE_ID!, clientSecret: process.env.GOOGLE_SECRET! })],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const role: "ADMIN" | "USER" = ADMIN_EMAILS.includes(user.email) ? "ADMIN" : "USER";
      await prisma.user.upsert({
        where: { email: user.email },
        create: { email: user.email, name: user.name ?? "", image: user.image ?? "", role },
        update: { role },
      });
      return true;
    },
    async jwt({ token, user }) {
      // Primer login: viene user. Luego leemos desde BD si falta.
      if (user?.email) {
        const found = await prisma.user.findUnique({ where: { email: user.email }, select: { role: true } });
        token.role = found?.role ?? (ADMIN_EMAILS.includes(user.email) ? "ADMIN" : "USER");
      }
      return token as JWT;
    },
    async session({ session, token }) {
      if (session.user) session.user.role = (token.role ?? "USER");
      return session;
    },
  },
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
