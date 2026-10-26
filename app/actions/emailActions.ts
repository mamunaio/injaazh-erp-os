'use server';

import { sendEmail } from '@/lib/email';
import * as templates from '@/lib/emailTemplates';
import { requireAdminOrOwnerAuth } from '@/lib/auth';
import { isValidEmail, isSafeUrl } from '@/lib/emailService';

/**
 * Validates header fields to prevent SMTP header injection / CRLF splitting
 */
function isSafeHeader(val?: string): boolean {
  if (!val || typeof val !== 'string') return false;
  return !/[\r\n]/.test(val) && val.trim().length > 0 && val.trim().length <= 250;
}

/**
 * Send custom email
 * Restricted to admin and owner roles.
 */
export async function sendCustomEmail(data: {
  to: string | string[];
  subject: string;
  title: string;
  content: string;
  buttonText?: string;
  buttonUrl?: string;
}) {
  try {
    // 1. Enforce admin or owner authorization
    await requireAdminOrOwnerAuth();

    // 2. Validate recipients and enforce count limits
    const rawRecipients = Array.isArray(data.to) ? data.to : [data.to];
    if (rawRecipients.length === 0 || rawRecipients.length > 20) {
      return {
        success: false,
        error: 'Recipients must be between 1 and 20 email addresses',
      };
    }

    const cleanRecipients: string[] = [];
    for (const r of rawRecipients) {
      if (!isValidEmail(r)) {
        return {
          success: false,
          error: `Invalid recipient email address format: ${r}`,
        };
      }
      cleanRecipients.push(r.trim());
    }

    // 3. Validate subject against header injection
    if (!isSafeHeader(data.subject)) {
      return {
        success: false,
        error: 'Invalid or unsafe email subject header',
      };
    }

    // 4. Validate title and content
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0 || data.title.length > 250) {
      return {
        success: false,
        error: 'Title is required and must not exceed 250 characters',
      };
    }

    if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0 || data.content.length > 50000) {
      return {
        success: false,
        error: 'Content is required and must not exceed 50,000 characters',
      };
    }

    // 5. Validate button URL if provided
    if (data.buttonUrl && !isSafeUrl(data.buttonUrl)) {
      return {
        success: false,
        error: 'Unsafe button URL scheme rejected',
      };
    }

    const html = templates.customEmail({
      title: data.title.trim(),
      content: data.content.trim(),
      buttonText: data.buttonText ? data.buttonText.trim().slice(0, 50) : undefined,
      buttonUrl: data.buttonUrl ? data.buttonUrl.trim() : undefined,
    });

    const result = await sendEmail({
      to: cleanRecipients.length === 1 ? cleanRecipients[0] : cleanRecipients,
      subject: data.subject.trim(),
      html,
    });

    if (!result.success) {
      return {
        success: false,
        error: 'Failed to deliver email. Please verify SMTP settings.',
      };
    }

    return result;
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error';
    console.error('❌ Failed to send custom email:', errorMsg);
    if (errorMsg.includes('Unauthorized') || errorMsg.includes('Not authenticated')) {
      return {
        success: false,
        error: errorMsg,
      };
    }
    return {
      success: false,
      error: 'Failed to send custom email. Please verify SMTP settings.',
    };
  }
}

/**
 * Send test email
 * Restricted to admin and owner roles.
 */
export async function sendTestEmail(data: {
  to: string;
}) {
  try {
    // 1. Enforce admin or owner authorization
    await requireAdminOrOwnerAuth();

    // 2. Validate recipient email
    if (!data.to || !isValidEmail(data.to)) {
      return {
        success: false,
        error: 'Invalid test recipient email address format',
      };
    }

    const cleanRecipient = data.to.trim();
    const html = templates.testEmail({
      recipientEmail: cleanRecipient,
    });

    const result = await sendEmail({
      to: cleanRecipient,
      subject: '✅ SMTP Test Email - Injaazh ERP',
      html,
    });

    if (!result.success) {
      return {
        success: false,
        error: 'Failed to deliver test email. Please verify SMTP settings.',
      };
    }

    return result;
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error';
    console.error('❌ Failed to send test email:', errorMsg);
    if (errorMsg.includes('Unauthorized') || errorMsg.includes('Not authenticated')) {
      return {
        success: false,
        error: errorMsg,
      };
    }
    return {
      success: false,
      error: 'Failed to send test email. Please verify SMTP settings.',
    };
  }
}
