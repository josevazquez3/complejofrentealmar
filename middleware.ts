import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getNextAuthSecret } from "@/lib/auth-secret";

/**
 * Protege `/admin/*` excepto `/admin/login`. Compatible con Edge (sin Prisma).
 */
export async function middleware(request: NextRequest) {
  const secret = getNextAuthSecret();
  if (!secret) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret });
  const path = request.nextUrl.pathname;
  const isLogin = path === "/admin/login";

  if (path.startsWith("/admin") && !isLogin && !token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (isLogin && token) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
