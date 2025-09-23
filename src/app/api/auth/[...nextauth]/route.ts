// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",");

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const role = ADMIN_EMAILS.includes(user.email) ? "ADMIN" : "USER";
      await prisma.user.upsert({
        where: { email: user.email },
        create: { email: user.email, name: user.name ?? "", image: user.image ?? "", role },
        update: { role },
      });
      return true;
    },
    async jwt({ token }) {
      if (token.email) {
        const u = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true },
        });
        token.uid = u?.id ?? token.sub ?? "";
        token.role = (u?.role ?? (ADMIN_EMAILS.includes(token.email) ? "ADMIN" : "USER")) as "ADMIN" | "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid ?? "";
        session.user.role = (token.role as "ADMIN" | "USER") ?? "USER";
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
// opcional:
// export const runtime = "nodejs";
