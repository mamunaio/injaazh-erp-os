import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { EmailAccount } from '@/models/EmailAccount';
import { WarmupLog } from '@/models/WarmupLog';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';

export const maxDuration = 60; // 60 seconds (Vercel max)

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    await connectToDatabase();

    // Find the account that hasn't been checked in the longest time
    const account = await EmailAccount.findOne({
      isActive: true,
      warmupEnabled: true,
    }).sort({ lastWarmupCheck: 1 });

    if (!account) {
      return NextResponse.json({ success: true, message: 'No active warmup accounts found.' });
    }

    // Mark as checked to prevent overlapping runs if cron triggers quickly
    await EmailAccount.findByIdAndUpdate(account._id, { lastWarmupCheck: new Date() });

    console.log(`Processing IMAP warmup for account: ${account.email}`);

    const config = {
      imap: {
        user: account.email,
        password: account.appPassword,
        host: account.imapHost || 'imap.gmail.com',
        port: account.imapPort || 993,
        tls: account.imapSecure !== false,
        authTimeout: 10000,
        tlsOptions: { rejectUnauthorized: false }
      }
    };

    let connection;
    try {
      connection = await imaps.connect(config);
    } catch (connErr: any) {
      console.error(`IMAP connection failed for ${account.email}:`, connErr);
      return NextResponse.json({ success: false, error: 'IMAP connection failed' }, { status: 500 });
    }

    let unspammedCount = 0;
    let readCount = 0;

    // Helper to process a specific box
    const processBox = async (boxName: string, isSpam: boolean) => {
      try {
        await connection.openBox(boxName);
        const searchCriteria = ['UNSEEN'];
        const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: false };
        const messages = await connection.search(searchCriteria, fetchOptions);

        for (const msg of messages) {
          const headerPart = msg.parts.find((p: any) => p.which === 'HEADER');
          if (!headerPart || !headerPart.body) continue;

          // Check if it's a warmup email
          const isWarmup = headerPart.body['x-injaazh-warmup'] === 'true' || 
                           (headerPart.body['x-injaazh-warmup'] && headerPart.body['x-injaazh-warmup'][0] === 'true');

          if (isWarmup) {
            const messageIdHeader = headerPart.body['message-id'] ? headerPart.body['message-id'][0] : null;

            if (isSpam) {
              // Move to inbox
              await connection.moveMessage(msg.attributes.uid, 'INBOX');
              unspammedCount++;
            } else {
              // Mark as read
              await connection.addFlags(msg.attributes.uid, ['\\Seen']);
              readCount++;
            }

            // Update log in DB
            if (messageIdHeader) {
              const cleanMessageId = messageIdHeader.replace(/[<>]/g, '');
              await WarmupLog.findOneAndUpdate(
                { messageId: cleanMessageId },
                { status: isSpam ? 'unspammed' : 'read' }
              );
            }
          }
        }
      } catch (boxErr: any) {
        console.warn(`Could not process box ${boxName} for ${account.email}:`, boxErr.message);
      }
    };

    // Try processing Spam box (Gmail uses [Gmail]/Spam, others might use Junk or Spam)
    await processBox('[Gmail]/Spam', true);
    await processBox('Spam', true);
    await processBox('Junk', true);

    // Process Inbox to mark unseen warmup emails as read
    await processBox('INBOX', false);

    connection.end();

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${account.email}. Unspammed: ${unspammedCount}, Read: ${readCount}` 
    });

  } catch (error: any) {
    console.error('Receive Warmup Cron Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
