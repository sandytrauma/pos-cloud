import { auth } from "./lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  // 1. Check for the 2FA Verification Cookie
  const is2FAVerified = req.cookies.get("admin_2fa_verified")?.value === "true";

  // Define paths
  const isDashboardPage = nextUrl.pathname.startsWith("/dashboard");
  const isAuthPage = nextUrl.pathname.startsWith("/login");
  const isVerifyPage = nextUrl.pathname.startsWith("/verify-pin");
  const isLandingPage = nextUrl.pathname === "/";

  // --- LOGIC GATE 1: AUTHENTICATION ---
  if (isDashboardPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // --- LOGIC GATE 2: 2-STEP VERIFICATION (PIN) ---
  // If logged in, trying to access dashboard, but NOT PIN verified -> Go to Verify Page
  // if (isLoggedIn && isDashboardPage && !is2FAVerified) {
  //   return NextResponse.redirect(new URL("/verify-pin", nextUrl));
  // }

  // Prevent accessing Verify Page if already verified or not logged in
  if (isVerifyPage && (!isLoggedIn || is2FAVerified)) {
    return NextResponse.redirect(new URL(isLoggedIn ? "/dashboard" : "/login", nextUrl));
  }

  // --- LOGIC GATE 3: REDIRECTS FOR LOGGED IN USERS ---
  // Only redirect from Landing/Login if they are FULLY verified
  if (isLoggedIn && is2FAVerified && (isAuthPage || isLandingPage)) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};