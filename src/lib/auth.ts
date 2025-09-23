import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",");

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({ clientId: process.env.GOOGLE_ID!, clientSecret: process.env.GOOGLE_SECRET! }),
  ],
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
    async jwt({ token, account }) {
      if (account?.access_token) token.accessToken = account.access_token as string;
      if (token.email) {
        const db = await prisma.user.findUnique({ where: { email: token.email }, select: { id: true, role: true } });
        token.uid = db?.id ?? token.sub ?? "";
        token.role = (db?.role ?? (ADMIN_EMAILS.includes(token.email) ? "ADMIN" : "USER")) as "ADMIN" | "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid ?? "";
        session.user.role = (token.role as "ADMIN" | "USER") ?? "USER";
      }
      if (token.accessToken) session.accessToken = token.accessToken;
      return session;
    },
  },
};
