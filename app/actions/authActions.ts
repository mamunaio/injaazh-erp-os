'use server';

import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { generateAuthToken, setAuthCookie, removeAuthCookie, generate2FATempToken, verify2FATempToken, getAuthUser, createDbSession } from '@/lib/auth';
import { verifySync } from 'otplib';
import crypto from 'crypto';
import Session from '@/models/Session';
import bcrypt from 'bcryptjs';
import { sendPasswordResetEmail } from '@/lib/emailService';

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
      sessionId,
      tokenVersion: newUser.tokenVersion ?? 0,
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

    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const password = formData.get('password') as string;
    const rememberMe = formData.get('rememberMe') === 'on';

    if (!email || !password) {
      return { success: false, message: 'Email and password are required' };
    }

    let user = await User.findOne({ email }).select('+password');

    // Auto-provision demo user if requested
    if (!user && email === 'demo@injaazh.com' && password === 'demo123456') {
      user = await User.create({
        name: 'Demo Viewer',
        email: 'demo@injaazh.com',
        password: 'demo123456',
        role: 'viewer',
        permissions: ['view:all']
      });
    }

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
      sessionId,
      tokenVersion: user.tokenVersion ?? 0,
    }, rememberMe);

    await setAuthCookie(token, rememberMe);

    return { success: true, message: 'Login successful' };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, message: error.message || 'Something went wrong during login' };
  }
}

/**
 * 1-Click Instant Demo Login Action
 */
export async function loginAsDemoUser() {
  try {
    await connectToDatabase();

    let demoUser = await User.findOne({ email: 'demo@injaazh.com' });
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Demo Viewer',
        email: 'demo@injaazh.com',
        password: 'demo123456',
        role: 'viewer',
        permissions: ['view:all']
      });
    } else if (demoUser.role !== 'viewer') {
      demoUser.role = 'viewer';
      await demoUser.save();
    }

    const sessionId = await createDbSession(demoUser._id.toString());

    const token = await generateAuthToken({
      id: demoUser._id.toString(),
      email: demoUser.email,
      role: 'viewer',
      sessionId,
      tokenVersion: demoUser.tokenVersion ?? 0,
    }, false);

    await setAuthCookie(token, false);

    return { success: true, message: 'Signed in as Demo Viewer' };
  } catch (error: any) {
    console.error('loginAsDemoUser error:', error);
    return { success: false, message: error.message || 'Failed to login as demo user' };
  }
}

export async function verifyTwoFactorLogin(tempToken: string, code: string, rememberMe: boolean = false) {
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
      sessionId,
      tokenVersion: user.tokenVersion ?? 0,
    }, rememberMe);

    await setAuthCookie(token, rememberMe);

    return { success: true, message: 'Login successful' };
  } catch (error: any) {
    console.error('2FA Login error:', error);
    return { success: false, message: `2FA Error: ${error.message}` };
  }
}

export async function logoutUser() {
  try {
    const authUser = await getAuthUser();
    if (authUser?.sessionId) {
      await connectToDatabase();
      await Session.updateOne({ sessionId: authUser.sessionId }, { $set: { isValid: false } });
    }
    await removeAuthCookie();
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function requestPasswordReset(formData: FormData) {
  try {
    await connectToDatabase();

    const email = (formData.get('email') as string || '').toLowerCase().trim();
    if (!email) {
      return { success: false, message: 'Email is required' };
    }

    const user = await User.findOne({ email });
    if (!user) {
      // We don't want to leak whether a user exists or not, so we return generic success
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

    // Dispatch the reset link through the internal transactional email service.
    // Plaintext reset tokens or URLs are never printed or disclosed in logs.
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name || 'User',
        resetUrl,
        expiresIn: '1 hour',
      });
    } catch (emailErr: any) {
      console.error('Password reset email dispatch failed:', emailErr?.message || 'Email dispatch failed');
    }

    return { success: true, message: 'If that email is registered, we have sent a reset link.' };
  } catch (error: any) {
    console.error('Password reset request error:', error?.message || 'Unknown error');
    return { success: false, message: 'Something went wrong' };
  }
}

export async function resetPassword(formData: FormData, token: string) {
  try {
    // 1. Validate inputs before touching database
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return { success: false, message: 'Token is invalid or has expired' };
    }

    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!password || password !== confirmPassword) {
      return { success: false, message: 'Passwords do not match' };
    }
    if (password.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters long' };
    }

    await connectToDatabase();

    // 2. Hash the token from the URL to match against stored SHA-256 hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // 3. Pre-hash password using established bcrypt configuration (12 rounds matching UserSchema pre-save)
    // Note: findOneAndUpdate bypasses Mongoose pre('save') hooks, ensuring exactly one hash operation.
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Atomically match valid unexpired token, update password, consume token,
    // and increment tokenVersion (account security epoch) in a single DB operation
    const updatedUser = await User.findOneAndUpdate(
      {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: new Date() },
      },
      {
        $set: { password: hashedPassword },
        $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
        $inc: { tokenVersion: 1 },
      },
      { new: true }
    );

    if (!updatedUser) {
      return { success: false, message: 'Token is invalid or has expired' };
    }

    // 5. Invalidate all active sessions for this user across all devices upon password reset
    // Explicitly handle failure without reporting full success while old sessions remain active
    try {
      await Session.updateMany({ userId: updatedUser._id }, { $set: { isValid: false } });
    } catch (sessionError: any) {
      console.error('Password reset session revocation error:', sessionError?.message || 'Unknown error');
      return {
        success: false,
        partialSuccess: true,
        message: 'Password was updated, but active sessions could not be revoked. Please log in and review your active devices.',
      };
    }

    return { success: true, message: 'Password has been reset successfully' };
  } catch (error: any) {
    console.error('Password reset error:', error?.message || 'Unknown error');
    return { success: false, message: 'Something went wrong while resetting password' };
  }
}

export async function getCurrentUser() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: 'Not authenticated' };
    }
    await connectToDatabase();
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
