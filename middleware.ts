// Location: middleware.ts
import { auth } from "./lib/auth";
import { NextResponse } from "next/server";
import { verify2FAToken } from "./lib/security";

export default auth(async (req) => {
  const isLoggedIn = !!req.auth?.user;
  const userId = req.auth?.user?.id;
  const { nextUrl } = req;

  // 1. Verify 2FA state: checks either cryptographically signed token or verified cookie
  const legacyVerified = req.cookies.get("admin_2fa_verified")?.value === "true";
  const tokenCookie = req.cookies.get("admin_2fa_token")?.value;
  
  let is2FAVerified = legacyVerified;
  if (!is2FAVerified && tokenCookie && userId) {
    is2FAVerified = await verify2FAToken(tokenCookie, userId);
  }

  // 2. Define Context Routes
  const isDashboardPage = nextUrl.pathname.startsWith("/dashboard");
  const isAuthPage = nextUrl.pathname.startsWith("/login");
  const isVerifyPage = nextUrl.pathname.startsWith("/verify-pin");
  const isLandingPage = nextUrl.pathname === "/";

  // --- LOGIC GATE 1: PRIMARY AUTHENTICATION ---
  if (isDashboardPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // --- LOGIC GATE 2: 2FA SECURITY LOCKOUTS ---
  if (isLoggedIn && isDashboardPage && !is2FAVerified) {
    return NextResponse.redirect(new URL("/verify-pin", nextUrl));
  }

  if (isVerifyPage && is2FAVerified) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }
  
  if (isVerifyPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // --- LOGIC GATE 3: REDIRECTS FOR FULLY VERIFIED SESSIONS ---
  if (isLoggedIn && is2FAVerified && (isAuthPage || isLandingPage)) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (isLoggedIn && !is2FAVerified && isAuthPage) {
    return NextResponse.redirect(new URL("/verify-pin", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|globals.css|.*\\..*).*)"],
};