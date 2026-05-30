'use server';

import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function generateTwoFactorSecret() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, message: 'Unauthorized' };
    }

    await connectToDatabase();
    const user = await User.findById(authUser.id);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Generate a new secret
    const secret = generateSecret();
    const otpauth = generateURI({ label: user.email, issuer: 'Injaazh ERP', secret });

    // Create QR code
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    // Save the secret temporarily to the user (but do not enable yet)
    // We will save it to the DB so that verifyAndEnableTwoFactor can check against it
    user.twoFactorSecret = secret;
    await user.save();

    return { 
      success: true, 
      data: {
        secret,
        qrCodeUrl: qrCodeDataUrl
      }
    };
  } catch (error: any) {
    console.error('Error generating 2FA secret:', error);
    return { success: false, message: 'Failed to generate 2FA secret' };
  }
}

export async function verifyAndEnableTwoFactor(token: string) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, message: 'Unauthorized' };
    }

    await connectToDatabase();
    const user = await User.findById(authUser.id).select('+twoFactorSecret');
    if (!user || !user.twoFactorSecret) {
      return { success: false, message: 'No 2FA setup found' };
    }

    // Verify token
    const result = verifySync({
      token,
      secret: user.twoFactorSecret
    });

    if (!result.valid) {
      return { success: false, message: 'Invalid verification code' };
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    await user.save();

    return { success: true, message: 'Two-Factor Authentication enabled successfully' };
  } catch (error: any) {
    console.error('Error verifying 2FA:', error);
    return { success: false, message: 'Failed to verify 2FA code' };
  }
}

export async function disableTwoFactor(token: string) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, message: 'Unauthorized' };
    }

    await connectToDatabase();
    const user = await User.findById(authUser.id).select('+twoFactorSecret');
    if (!user || !user.twoFactorSecret) {
      return { success: false, message: '2FA is not enabled' };
    }

    // Verify token to allow disabling
    const result = verifySync({
      token,
      secret: user.twoFactorSecret
    });

    if (!result.valid) {
      return { success: false, message: 'Invalid verification code' };
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    return { success: true, message: 'Two-Factor Authentication disabled successfully' };
  } catch (error: any) {
    console.error('Error disabling 2FA:', error);
    return { success: false, message: 'Failed to disable 2FA' };
  }
}

export async function checkTwoFactorStatus() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, message: 'Unauthorized' };
    }

    await connectToDatabase();
    const user = await User.findById(authUser.id);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    return { 
      success: true, 
      enabled: user.twoFactorEnabled 
    };
  } catch (error: any) {
    console.error('Error checking 2FA status:', error);
    return { success: false, message: 'Failed to check 2FA status' };
  }
}
