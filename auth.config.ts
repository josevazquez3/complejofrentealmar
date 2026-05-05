import type { NextAuthConfig } from "next-auth";

/**
 * Config Edge-safe (sin Prisma): usada por el middleware.
 * Los providers reales y el login con bcrypt están en `auth.ts`.
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: { signIn: "/admin/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLogin = nextUrl.pathname === "/admin/login";
      if (nextUrl.pathname.startsWith("/admin") && !isLogin && !isLoggedIn) return false;
      if (isLogin && isLoggedIn) {
        return Response.redirect(new URL("/admin/dashboard", nextUrl));
      }
      return true;
    },
  },
};
