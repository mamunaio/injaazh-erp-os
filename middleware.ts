import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getMobileCorsHeaders } from '@/lib/cors';

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is missing');
  return secret;
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow unauthenticated OPTIONS preflight requests for mobile API routes to reach their CORS handlers.
  // We do NOT blindly bypass middleware for all OPTIONS requests.
  if (request.method === 'OPTIONS' && pathname.startsWith('/api/mobile/')) {
    return NextResponse.next();
  }

  // Define public paths that do not require authentication
  const isPublicPath =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/reset-password') ||
    pathname === '/api/mobile/auth/login';

  // Extract the user token from request cookies or Authorization header
  let token = request.cookies.get('user_token')?.value;
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  // Verify token validity
  let hasValidToken = false;
  if (token) {
    try {
      const verified = await jwtVerify(
        token,
        new TextEncoder().encode(getJwtSecretKey())
      );
      // Reject 2FA temporary tokens, tokens without sessionId, and tokens without numeric tokenVersion
      if (
        !verified.payload.is2FA &&
        verified.payload.sessionId &&
        typeof verified.payload.tokenVersion === 'number'
      ) {
        hasValidToken = true;
      }
    } catch {
      // Invalid or expired token
      hasValidToken = false;
    }
  }

  // Handle redirects / responses:
  // 1. If user has a valid token and tries to access auth pages, redirect to dashboard
  if (hasValidToken && (pathname === '/login' || pathname === '/register' || pathname === '/forgot-password')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. If user doesn't have a valid token and tries to access a restricted path
  if (!hasValidToken && !isPublicPath) {
    // API routes must return 401 JSON instead of redirecting to login page
    if (pathname.startsWith('/api/')) {
      const corsHeaders = pathname.startsWith('/api/mobile/') ? getMobileCorsHeaders(request) : {};
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401, headers: corsHeaders }
      );
    }

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
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets with extensions (e.g. logo.png, styles.css, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|[^?]*\\.(?:html|css|js|json|jpe?g|png|gif|svg|ico|woff2?|webmanifest)).*)',
  ],
};
