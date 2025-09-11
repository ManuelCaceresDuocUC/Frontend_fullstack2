import { withAuth } from "next-auth/middleware";
export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const isAdmin = req.nextUrl.pathname.startsWith("/perfumes/admin");
      if (!isAdmin) return !!token;
      return token?.role === "ADMIN";
    },
  },
});
export const config = { matcher: ["/perfil", "/perfumes/admin"] };