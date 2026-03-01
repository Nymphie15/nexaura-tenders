import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js middleware for route protection.
 *
 * Security model:
 * - `auth_presence` cookie = lightweight presence guard (set by auth-store on login)
 * - Actual JWT validation happens server-side on every API call
 *
 * TODO: For enhanced security, validate JWT signature here using `jose` library:
 * import { jwtVerify } from 'jose'
 * const secret = new TextEncoder().encode(process.env.JWT_SECRET)
 * await jwtVerify(token, secret)
 */
export function middleware(request: NextRequest) {
  // Middleware is not used in static export mode (output: "export")
  // Route protection is handled client-side by (auth)/layout.tsx and (dashboard)/layout.tsx
  if (process.env.GITHUB_PAGES === "true") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Public paths — never redirect
  const publicPaths = ["/login", "/register", "/_next", "/api", "/favicon", "/manifest.json", "/icon", "/robots.txt", "/sw.js"];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for auth presence cookie (set by auth-store on login)
  const hasAuth = request.cookies.get("auth_presence")?.value;
  if (!hasAuth) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
