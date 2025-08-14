import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/auth/login", "/auth/register"]
  const isPublicRoute = publicRoutes.includes(pathname)

  // Check if user has authentication cookie/header
  const userCookie = request.cookies.get("user-session")

  // If accessing auth pages while logged in, redirect to home
  if (isPublicRoute && userCookie) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // If accessing protected routes without authentication, redirect to login
  if (!isPublicRoute && !userCookie) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  return NextResponse.next()
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
}
