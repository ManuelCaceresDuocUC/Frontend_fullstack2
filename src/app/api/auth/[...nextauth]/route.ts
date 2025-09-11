// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions, Session, User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",");

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],
  session: { strategy: "jwt" as const },
  callbacks: {
    async signIn({ user }: { user: User }) {
      if (!user.email) return false;
      await prisma.user.upsert({
        where: { email: user.email },
        create: {
          email: user.email,
          name: user.name ?? "",
          image: user.image ?? "",
          role: ADMIN_EMAILS.includes(user.email) ? "ADMIN" : "USER",
        },
        update: {},
      });
      return true;
    },
    async jwt({ token }: { token: JWT }) {
      if (token.email) {
        const u = await prisma.user.findUnique({ where: { email: token.email } });
        if (u) {
          token.uid = u.id;
          token.role = u.role as "ADMIN" | "USER";
        }
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
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
