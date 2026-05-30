/**
 * Email Utility Library
 * Handles all email sending operations using SMTP
 */

import nodemailer from 'nodemailer';
import { getSystemSettings } from '@/app/actions/settingsActions';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
  }>;
}

/**
 * Get SMTP transporter with current settings
 */
async function getTransporter() {
  const smtpSettings = await getSystemSettings('smtp');
  
  if (!smtpSettings.success || !smtpSettings.data) {
    throw new Error('SMTP settings not configured. Please configure SMTP in Settings.');
  }

  const settings = smtpSettings.data;

  if (!settings.host || !settings.user || !settings.pass) {
    throw new Error('SMTP credentials incomplete. Please check Settings > SMTP Configurations.');
  }

  const transporter = nodemailer.createTransport({
    host: settings.host,
    port: Number(settings.port) || 587,
    secure: Number(settings.port) === 465, // true for 465, false for other ports
    auth: {
      user: settings.user,
      pass: settings.pass,
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000,
  });

  return { transporter, settings };
}

/**
 * Send email using configured SMTP
 */
export async function sendEmail(options: EmailOptions) {
  try {
    const { transporter, settings } = await getTransporter();

    // Prepare email options
    const mailOptions = {
      from: settings.fromEmail 
        ? `"${settings.fromName || 'Injaazh ERP'}" <${settings.fromEmail}>`
        : `"${settings.fromName || 'Injaazh ERP'}" <${settings.user}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully',
    };
  } catch (error: any) {
    console.error('❌ Failed to send email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Send bulk emails (with rate limiting)
 */
export async function sendBulkEmails(
  recipients: string[],
  subject: string,
  htmlTemplate: (email: string) => string,
  options?: {
    batchSize?: number;
    delayMs?: number;
  }
) {
  const batchSize = options?.batchSize || 10;
  const delayMs = options?.delayMs || 1000;
  
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Process in batches
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    const promises = batch.map(async (email) => {
      try {
        const result = await sendEmail({
          to: email,
          subject,
          html: htmlTemplate(email),
        });
        
        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`${email}: ${result.error}`);
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${email}: ${error.message}`);
      }
    });

    await Promise.all(promises);

    // Delay between batches to avoid rate limiting
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
