import { NextRequest, NextResponse } from "next/server";

const roleHome: Record<string, string> = {
  MURID: "/murid",
  GURU: "/guru",
  KEPSEK: "/kepsek",
  KURIKULUM: "/kurikulum",
  ADMIN_UTAMA: "/admin",
};

export function middleware(req: NextRequest) {
  const token = req.cookies.get("wd_token")?.value;
  const role = req.cookies.get("wd_role")?.value;
  const { pathname } = req.nextUrl;

  const isAuthRoute = pathname === "/login";
  const isProtected = Object.values(roleHome).some((base) => pathname.startsWith(base));

  if (!token && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL(roleHome[role ?? ""] ?? "/", req.url));
  }

  if (token && role && isProtected) {
    const allowedBase = roleHome[role];
    if (allowedBase && !pathname.startsWith(allowedBase)) {
      return NextResponse.redirect(new URL(allowedBase, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/murid/:path*", "/guru/:path*", "/kepsek/:path*", "/kurikulum/:path*", "/admin/:path*", "/login"],
};
