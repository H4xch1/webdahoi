import { NextRequest, NextResponse } from "next/server";

const roleHome: Record<string, string> = {
  MURID: "/murid",
  GURU: "/guru",
  KEPSEK: "/kepsek",
  KURIKULUM: "/kurikulum",
  ADMIN_UTAMA: "/admin",
};

function getRoleFromToken(token: string): string | null {
  try {
    const payloadPart = token.split(".")[1];

    if (!payloadPart) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(payloadPart, "base64url").toString("utf8")
    );

    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = getRoleFromToken(token);
  const allowedBase = role ? roleHome[role] : undefined;

  if (!allowedBase) {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("token");
    return response;
  }

  if (!pathname.startsWith(allowedBase)) {
    return NextResponse.redirect(new URL(allowedBase, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/murid/:path*",
    "/guru/:path*",
    "/kepsek/:path*",
    "/kurikulum/:path*",
    "/admin/:path*",
  ],
};
``