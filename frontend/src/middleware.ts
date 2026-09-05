import { NextResponse, type NextRequest } from "next/server";

// List of public routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/client-portal",
  "/api",
  "/_next",
  "/favicon.ico",
  "/manifest.json",
  "/events/google/callback",
  "/i/",
];

// List of protected routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/inventory",
  "/pos",
  "/crm",
  "/sales",
  "/time-tracking",
  "/team",
  "/projects",
  "/events",
  "/tasks",
  "/users",
  "/workspace",
  "/reports",
  "/hrm",
  "/workshop-management",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Check if the route is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // If it's a protected route, check for authentication
  if (isProtectedRoute) {
    // Check for authentication token in cookies or headers
    const token =
      request.cookies.get("auth-token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      // Redirect to login if no token found
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For all other routes, allow access (they'll be handled by the client-side AuthGuard)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
