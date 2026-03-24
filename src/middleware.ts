import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getDashboardPathForRole, protectedRoutePolicies } from "@/lib/dashboard-paths";

const staticExport = process.env.STATIC_EXPORT === "true" || process.env.CF_PAGES === "1";

const legacyRouteMap: Record<string, string> = {
  "/super-admin": "/admin/super",
  "/tournament-admin": "/admin/tournament",
  "/team-dashboard": "/team"
};

export async function middleware(request: NextRequest) {
  if (staticExport) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  for (const [legacyPrefix, canonicalPrefix] of Object.entries(legacyRouteMap)) {
    if (pathname === legacyPrefix || pathname.startsWith(`${legacyPrefix}/`)) {
      const nextUrl = request.nextUrl.clone();
      nextUrl.pathname = pathname.replace(legacyPrefix, canonicalPrefix);
      return NextResponse.redirect(nextUrl);
    }
  }
  const protectedRoute = protectedRoutePolicies.find((entry) => pathname.startsWith(entry.prefix));
  if (!protectedRoute) {
    return NextResponse.next();
  }
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
  });
  if (!token?.role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  const role = token.role;
  if (!protectedRoute.roles.includes(role)) {
    return NextResponse.redirect(new URL(getDashboardPathForRole(role), request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/account",
    "/dashboard",
    "/get-started",
    "/team/:path*",
    "/scorer/:path*",
    "/login",
    "/super-admin/:path*",
    "/tournament-admin/:path*",
    "/team-dashboard/:path*"
  ]
};
