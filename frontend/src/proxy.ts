import { NextResponse, type NextRequest } from "next/server";

/**
 * Route guard for the dashboard shell.
 *
 * Auth state is held in an httpOnly cookie set by the backend (`kwmoc_token`),
 * which we can't decrypt on the edge. So this middleware only enforces that a
 * logged-in user (cookie present) can reach /dashboard/* — the role/permission
 * enforcement happens client-side in the (app) layout + the backend guards.
 *
 * Its main job: keep unauthenticated visitors out of the app shell and stop
 * them from hitting deep dashboard links directly.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("kwmoc_token")?.value;

  // Protect the app shell.
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from /login.
  if (pathname === "/login" && token) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
