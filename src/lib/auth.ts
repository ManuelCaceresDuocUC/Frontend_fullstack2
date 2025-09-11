import type { NextAuthOptions, Session } from "next-auth";
import Google from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";

export const authOptions: NextAuthOptions = {
  providers: [Google({
    clientId: process.env.GOOGLE_ID!,
    clientSecret: process.env.GOOGLE_SECRET!,
  })],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, user }): Promise<JWT> {
      if (account?.access_token) token.accessToken = account.access_token;
      if (user?.id) token.uid = user.id;
      token.role ??= "USER";
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid ?? "";
        session.user.role = (token.role as "ADMIN" | "USER") ?? "USER";
      }
      if (token.accessToken) session.accessToken = token.accessToken;
      return session as Session;
    },
  },
};
