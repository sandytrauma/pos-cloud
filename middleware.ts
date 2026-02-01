import { auth } from "./lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  // Define our paths
  const isDashboardPage = nextUrl.pathname.startsWith("/dashboard");
  const isAuthPage = nextUrl.pathname.startsWith("/login");
  const isLandingPage = nextUrl.pathname === "/";

  // 1. If trying to reach Dashboard without login -> Go to Login
  if (isDashboardPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // 2. If logged in and trying to reach Login or Landing -> Go to Dashboard
  if (isLoggedIn && (isAuthPage || isLandingPage)) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Matches all paths except static files and icons
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};