import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const canonicalHost = (process.env.NEXT_PUBLIC_CANONICAL_HOST || process.env.CANONICAL_HOST || "").toLowerCase();
const canonicalProtocol = process.env.NEXT_PUBLIC_CANONICAL_PROTOCOL || "https";
// Opt in only after the custom domain and TLS have been verified.
const enforceCanonical = process.env.CONTEXT === "production" && process.env.ENFORCE_CANONICAL_REDIRECT === "true" && Boolean(canonicalHost);

export function middleware(request: NextRequest) {
  if (!enforceCanonical) {
    return NextResponse.next();
  }

  const requestHost = (request.headers.get("host") || "").toLowerCase();
  if (requestHost !== "tasally.netlify.app" || requestHost === canonicalHost || !["GET", "HEAD"].includes(request.method) || request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.protocol = `${canonicalProtocol}:`;
  redirectUrl.host = canonicalHost;
  return NextResponse.redirect(redirectUrl, 307);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

