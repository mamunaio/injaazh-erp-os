import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import connectToDatabase from '@/lib/mongodb';
import Session from '@/models/Session';

export interface UserJwtPayload {
  id: string;
  email: string;
  role: string;
  sessionId?: string;
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
  } catch (err) {
    throw new Error('Your token has expired or is invalid.');
  }
};

export const generateAuthToken = async (payload: UserJwtPayload, rememberMe: boolean = false) => {
  const token = await new SignJWT({ ...payload })
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
};

export const removeAuthCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete('user_token');
};

export const getAuthUser = async (): Promise<UserJwtPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get('user_token')?.value;
  if (!token) return null;
  
  try {
    const verified = await verifyAuth(token);
    
    // Check session validity in database if sessionId exists
    if (verified.sessionId) {
      await connectToDatabase();
      const session = await Session.findOne({ sessionId: verified.sessionId });
      if (!session || !session.isValid) {
        return null; // Session revoked or invalid
      }
      
      // Optionally update lastActive
      // session.lastActive = new Date();
      // await session.save();
    }
    
    return verified;
  } catch (err) {
    return null;
  }
};
