'use server';

import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { generateAuthToken, setAuthCookie, removeAuthCookie, generate2FATempToken, verify2FATempToken, getAuthUser } from '@/lib/auth';
import { verifySync } from 'otplib';
import crypto from 'crypto';
import { headers } from 'next/headers';
import Session from '@/models/Session';

async function createDbSession(userId: string) {
  const headersList = await headers();
  const ua = headersList.get('user-agent') || '';
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'Unknown IP';
  
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

export async function registerUser(formData: FormData) {
  try {
    await connectToDatabase();
    
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!name || !email || !password) {
      return { success: false, message: 'All fields are required' };
    }

    if (password !== confirmPassword) {
      return { success: false, message: 'Passwords do not match' };
    }

    if (password.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters long' };
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { success: false, message: 'User with this email already exists' };
    }

    const newUser = await User.create({
      name,
      email,
      password,
      role: 'user'
    });

    const sessionId = await createDbSession(newUser._id.toString());

    const token = await generateAuthToken({
      id: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
      sessionId
    });

    await setAuthCookie(token);

    return { success: true, message: 'Registration successful' };
  } catch (error: any) {
    console.error('Registration error:', error);
    return { success: false, message: error.message || 'Something went wrong during registration' };
  }
}

export async function loginUser(formData: FormData) {
  try {
    await connectToDatabase();
    
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return { success: false, message: 'Email and password are required' };
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return { success: false, message: 'Invalid credentials' };
    }

    if (user.twoFactorEnabled) {
      const tempToken = await generate2FATempToken(user._id.toString());
      return { success: true, requires2FA: true, tempToken };
    }

    const sessionId = await createDbSession(user._id.toString());

    const token = await generateAuthToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionId
    });

    await setAuthCookie(token);

    return { success: true, message: 'Login successful' };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, message: error.message || 'Something went wrong during login' };
  }
}

export async function verifyTwoFactorLogin(tempToken: string, code: string) {
  try {
    await connectToDatabase();
    
    // Verify the temporary token and extract userId
    const userId = await verify2FATempToken(tempToken);

    const user = await User.findById(userId).select('+twoFactorSecret');
    if (!user || !user.twoFactorSecret) {
      return { success: false, message: '2FA setup not found for this user' };
    }

    const result = verifySync({
      token: code,
      secret: user.twoFactorSecret
    });

    if (!result.valid) {
      return { success: false, message: 'Invalid verification code' };
    }

    const sessionId = await createDbSession(user._id.toString());

    const token = await generateAuthToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionId
    });

    await setAuthCookie(token);

    return { success: true, message: 'Login successful' };
  } catch (error: any) {
    console.error('2FA Login error:', error);
    return { success: false, message: `2FA Error: ${error.message}` };
  }
}

export async function logoutUser() {
  try {
    await removeAuthCookie();
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function requestPasswordReset(formData: FormData) {
  try {
    await connectToDatabase();
    
    const email = formData.get('email') as string;
    if (!email) {
      return { success: false, message: 'Email is required' };
    }

    const user = await User.findOne({ email });
    if (!user) {
      // We don't want to leak whether a user exists or not, so we return success anyway
      return { success: true, message: 'If that email is registered, we have sent a reset link.' };
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token before saving to database (security best practice)
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expiry to 1 hour from now
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

    user.resetPasswordToken = passwordResetToken;
    user.resetPasswordExpires = passwordResetExpires;
    await user.save();

    // MOCK EMAIL SENDING
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    console.log('\n\n===========================================');
    console.log('MOCK EMAIL SENT TO: ', email);
    console.log('PASSWORD RESET LINK: ', resetUrl);
    console.log('===========================================\n\n');

    return { success: true, message: 'If that email is registered, we have sent a reset link.' };
  } catch (error: any) {
    console.error('Password reset request error:', error);
    return { success: false, message: 'Something went wrong' };
  }
}

export async function resetPassword(formData: FormData, token: string) {
  try {
    await connectToDatabase();
    
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!password || password !== confirmPassword) {
      return { success: false, message: 'Passwords do not match' };
    }
    if (password.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters long' };
    }

    // Hash the token from the URL to compare with database
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with this token and ensure it hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      return { success: false, message: 'Token is invalid or has expired' };
    }

    // Set new password (the pre-save hook will hash it)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { success: true, message: 'Password has been reset successfully' };
  } catch (error: any) {
    console.error('Password reset error:', error);
    return { success: false, message: 'Something went wrong while resetting password' };
  }
}

export async function getCurrentUser() {
  try {
    await connectToDatabase();
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: 'Not authenticated' };
    }
    const user = await User.findById(authUser.id).select('-password');
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    return { success: true, data: JSON.parse(JSON.stringify(user)) };
  } catch (error: any) {
    console.error('Error fetching current user:', error);
    return { success: false, error: error.message || 'Something went wrong' };
  }
}
