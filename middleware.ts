// Location: middleware.ts
import { auth } from "./lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  // 1. Extract 2FA Security Token State
  const is2FAVerified = req.cookies.get("admin_2fa_verified")?.value === "true";

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
  // Only enforce the redirect to /verify-pin if they are not already heading there.
  if (isLoggedIn && isDashboardPage && !is2FAVerified) {
    return NextResponse.redirect(new URL("/verify-pin", nextUrl));
  }

  // 🌟 FIXED: Allow users to hit the verify page even if the cookie is mid-transit.
  // We only bounce them away from /verify-pin if we are 100% sure they are verified.
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

  // If logged in but lacks 2FA, prevent them from bouncing back to login pages
  if (isLoggedIn && !is2FAVerified && isAuthPage) {
    return NextResponse.redirect(new URL("/verify-pin", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Fortified matcher array to skip internal compiler threads completely
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|globals.css|.*\\..*).*)"],
};