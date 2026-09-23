import { NextRequest, NextResponse } from "next/server";

const ROLE_HOME: Record<string, string> = {
  MURID: "/murid",
  GURU: "/guru",
  KEPSEK: "/kepsek",
  KURIKULUM: "/kurikulum",
  ADMIN_UTAMA: "/admin",
};

function decodeRole(token: string): string | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString("utf8")
    );
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = decodeRole(token);
  const home = role ? ROLE_HOME[role] : null;

  if (home && !pathname.startsWith(home)) {
    return NextResponse.redirect(new URL(home, req.url));
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
