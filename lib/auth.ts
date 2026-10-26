import { jwtVerify, SignJWT } from 'jose';
import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Session from '@/models/Session';
import User from '@/models/User';
import crypto from 'crypto';

export interface UserJwtPayload {
  id: string;
  email: string;
  role: string;
  sessionId?: string;
  tokenVersion?: number;
  [key: string]: any;
}

export const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length === 0) {
    throw new Error('JWT_SECRET environment variable is not set. This is a critical security risk.');
  }
  return secret;
};

export const verifyAuth = async (token: string) => {
  try {
    const verified = await jwtVerify(
      token,
      new TextEncoder().encode(getJwtSecretKey())
    );
    return verified.payload as UserJwtPayload;
  } catch {
    throw new Error('Your token has expired or is invalid.');
  }
};

export const generateAuthToken = async (payload: UserJwtPayload, rememberMe: boolean = false) => {
  const tokenVersion = typeof payload.tokenVersion === 'number' ? payload.tokenVersion : 0;
  const token = await new SignJWT({ ...payload, tokenVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(rememberMe ? '30d' : '1d') // 30 days or 1 day
    .sign(new TextEncoder().encode(getJwtSecretKey()));

  return token;
};

export const generate2FATempToken = async (userId: string) => {
  const token = await new SignJWT({ id: userId, is2FA: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m') // 10 minutes expiration for 2FA
    .sign(new TextEncoder().encode(getJwtSecretKey()));

  return token;
};

export const verify2FATempToken = async (token: string) => {
  try {
    const verified = await jwtVerify(
      token,
      new TextEncoder().encode(getJwtSecretKey())
    );
    if (!verified.payload.is2FA) throw new Error('Invalid token type');
    return verified.payload.id as string;
  } catch (err: any) {
    console.error('verify2FATempToken error:', err);
    throw new Error(`JWT Verify Error: ${err.message}`);
  }
};

export const setAuthCookie = async (token: string, rememberMe: boolean = false) => {
  try {
    const cookieStore = await cookies();
    const cookieOptions: any = {
      name: 'user_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    };

    if (rememberMe) {
      const thirtyDays = 60 * 60 * 24 * 30;
      cookieOptions.maxAge = thirtyDays; // 30 days
      cookieOptions.expires = new Date(Date.now() + thirtyDays * 1000);
    }

    cookieStore.set(cookieOptions);
  } catch {
    // cookies() unavailable in non-request contexts
  }
};

export const removeAuthCookie = async () => {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('user_token');
  } catch {
    // cookies() unavailable in non-request contexts
  }
};

/**
 * Creates a database session entry for tracking user devices and revoking sessions.
 */
export async function createDbSession(userId: string, req?: Request): Promise<string> {
  let ua = '';
  let ip = 'Unknown IP';

  if (req) {
    ua = req.headers.get('user-agent') || '';
    ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Unknown IP';
  } else {
    try {
      const headersList = await headers();
      ua = headersList.get('user-agent') || '';
      ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'Unknown IP';
    } catch {
      // In contexts where next/headers is not available
    }
  }

  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let device = 'Desktop';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS') || ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) { os = 'Android'; device = 'Mobile'; }
  else if (ua.includes('iPhone') || ua.includes('iPad')) { os = 'iOS'; device = 'Mobile'; }

  if (ua.includes('Edge') || ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';

  const sessionId = crypto.randomUUID();

  await connectToDatabase();
  await Session.create({
    userId,
    sessionId,
    device,
    browser,
    os,
    ip,
    isValid: true,
  });

  return sessionId;
}

/**
 * Extracts authentication token from either Authorization header or cookies.
 */
export async function extractTokenFromRequest(req?: Request): Promise<string | null> {
  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      return authHeader.substring(7).trim();
    }
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)user_token=([^;]*)/);
      if (match) return decodeURIComponent(match[1]);
    }
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_token')?.value;
    if (token) return token;
  } catch {
    // cookies() unavailable in non-request contexts
  }

  return null;
}

/**
 * Authenticates an API request, verifying JWT signature and active DB session.
 */
export async function authenticateApiRequest(req?: Request): Promise<UserJwtPayload | null> {
  const token = await extractTokenFromRequest(req);
  if (!token) return null;

  try {
    const verified = await verifyAuth(token);

    // 1. Explicitly reject 2FA temporary tokens from standard API access
    if (verified.is2FA) {
      return null;
    }

    // 2. Explicitly require database-backed sessionId for standard API access
    if (!verified.sessionId) {
      return null;
    }

    // 3. Explicitly require numeric tokenVersion in token payload
    if (typeof verified.tokenVersion !== 'number') {
      return null;
    }

    // 4. Check session validity and user tokenVersion concurrently in database
    await connectToDatabase();
    const [session, user] = await Promise.all([
      Session.findOne({ sessionId: verified.sessionId }),
      User.findById(verified.id).select('tokenVersion'),
    ]);

    if (!session || !session.isValid) {
      return null; // Session revoked or invalid
    }

    if (!user) {
      return null; // User no longer exists
    }

    const currentVersion = typeof user.tokenVersion === 'number' ? user.tokenVersion : 0;
    if (verified.tokenVersion !== currentVersion) {
      return null; // Token version mismatch (account security epoch incremented)
    }

    return verified;
  } catch {
    return null;
  }
}

export { getMobileCorsHeaders } from '@/lib/cors';

/**
 * Standard 401 Unauthorized response for API routes.
 */
export function apiUnauthorizedResponse(message = 'Unauthorized: Authentication required.') {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

/**
 * Standard 403 Forbidden response for API routes.
 */
export function apiForbiddenResponse(message = 'Forbidden: Insufficient permissions.') {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

/**
 * Enforces API authentication (read access).
 */
export async function requireApiAuth(req?: Request): Promise<
  { user: UserJwtPayload; errorResponse?: never } | { user?: never; errorResponse: NextResponse }
> {
  const user = await authenticateApiRequest(req);
  if (!user) {
    return { errorResponse: apiUnauthorizedResponse() };
  }
  return { user };
}

/**
 * Enforces API authentication and non-viewer write permissions.
 */
export async function requireApiWriteAuth(req?: Request): Promise<
  { user: UserJwtPayload; errorResponse?: never } | { user?: never; errorResponse: NextResponse }
> {
  const user = await authenticateApiRequest(req);
  if (!user) {
    return { errorResponse: apiUnauthorizedResponse() };
  }
  if (user.role === 'viewer') {
    return { errorResponse: apiForbiddenResponse('Demo / View-Only Mode: Data modifications are disabled for demo accounts.') };
  }
  return { user };
}

/**
 * Backwards compatible helper for server actions and routes.
 */
export const getAuthUser = async (req?: Request): Promise<UserJwtPayload | null> => {
  return authenticateApiRequest(req);
};

export const requireWriteAuth = async (): Promise<UserJwtPayload> => {
  const user = await getAuthUser();
  if (!user) {
    throw new Error('Not authenticated.');
  }
  if (user.role === 'viewer') {
    throw new Error('Demo / View-Only Mode: Data modifications are disabled for demo accounts.');
  }
  return user;
};

export const isViewerRole = (user: UserJwtPayload | null | undefined): boolean => {
  return user?.role === 'viewer';
};

export const requireOwnerAuth = async (): Promise<UserJwtPayload> => {
  const user = await getAuthUser();
  if (!user) {
    throw new Error('Not authenticated.');
  }
  if (user.role !== 'owner') {
    throw new Error('Unauthorized: Owner access required.');
  }
  return user;
};

export const requireAdminOrOwnerAuth = async (): Promise<UserJwtPayload> => {
  const user = await getAuthUser();
  if (!user) {
    throw new Error('Not authenticated.');
  }
  if (user.role !== 'admin' && user.role !== 'owner') {
    throw new Error('Unauthorized: Admin or owner access required.');
  }
  return user;
};
