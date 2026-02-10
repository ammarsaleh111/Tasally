import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const canonicalHost = (process.env.NEXT_PUBLIC_CANONICAL_HOST || process.env.CANONICAL_HOST || "").toLowerCase();
const canonicalProtocol = process.env.NEXT_PUBLIC_CANONICAL_PROTOCOL || "https";
const enforceCanonical = process.env.CONTEXT === "production" && Boolean(canonicalHost);

export function middleware(request: NextRequest) {
  if (!enforceCanonical) {
    return NextResponse.next();
  }

  const requestHost = (request.headers.get("host") || "").toLowerCase();
  if (!requestHost || requestHost === canonicalHost) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.protocol = `${canonicalProtocol}:`;
  redirectUrl.host = canonicalHost;
  return NextResponse.redirect(redirectUrl, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

