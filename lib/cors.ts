/**
 * Centralized CORS configuration and header generator for mobile and public APIs.
 */

export const ALLOWED_ORIGINS = [
  process.env.NEXTAUTH_URL,
  process.env.APP_URL,
  'http://localhost:3000',
  'http://localhost:8081',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8081',
].filter(Boolean) as string[];

export function isAllowedOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false;

  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  // Allow local dev origins (e.g. Metro bundler, local IP) in non-production only
  if (process.env.NODE_ENV !== 'production') {
    if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin)) {
      return true;
    }
  }

  return false;
}

export function getMobileCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers.get('origin');

  // If origin is not provided or not in the allowed list, do not return CORS allow headers.
  // Never reflect arbitrary origins or combine wildcard origins with credentials.
  if (!origin || !isAllowedOrigin(origin)) {
    return {};
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}
