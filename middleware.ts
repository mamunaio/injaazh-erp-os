import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  return secret || 'super-secret-fallback-key-for-dev-and-prod-12345';
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public paths that do not require authentication
  const isPublicPath =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/p/'); // public proposals /p/[id]

  // Extract the user token from the request cookies
  const token = request.cookies.get('user_token')?.value;

  // Verify token validity
  let hasValidToken = false;
  if (token) {
    try {
      await jwtVerify(
        token,
        new TextEncoder().encode(getJwtSecretKey())
      );
      hasValidToken = true;
    } catch (err) {
      // Invalid or expired token
      hasValidToken = false;
    }
  }

  // Handle redirects:
  // 1. If the user has a valid token and tries to access auth pages, redirect to dashboard
  if (hasValidToken && (pathname === '/login' || pathname === '/register' || pathname === '/forgot-password')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. If the user doesn't have a valid token and tries to access any restricted page, redirect to login
  if (!hasValidToken && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/' && pathname !== '/dashboard') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Configuration to filter which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/mobile (mobile API endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets with extensions (e.g. logo.png, styles.css, etc.)
     */
    '/((?!api/mobile|_next/static|_next/image|favicon.ico|[^?]*\\.(?:html|css|js|json|jpe?g|png|gif|svg|ico|woff2?|webmanifest)).*)',
  ],
};
