import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

// Coarse presence check only (Edge runtime can't run the Node `crypto` HMAC
// verification in lib/auth.ts). Every route handler and server page still
// calls getCurrentUserId(), which verifies the signature for real.
export function proxy(req: NextRequest) {
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = req.nextUrl;

  if (!hasSession && pathname.startsWith("/documents")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/documents", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/documents/:path*", "/login"],
};
