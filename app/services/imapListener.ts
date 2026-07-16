import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import { EmailAccount } from '@/models/EmailAccount';
import { EmailCampaignLog } from '@/models/EmailCampaignLog';
import { Lead } from '@/models/Lead';
import connectDB from '@/lib/mongodb';
import { decrypt } from '@/lib/encryption';

export async function checkRepliesForAccount(account: any) {
  const config = {
    imap: {
      user: account.email,
      password: decrypt(account.appPassword),
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      authTimeout: 3000,
      tlsOptions: { rejectUnauthorized: false }
    }
  };

  try {
    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    // Search for all emails from the last 5 days (even if marked as read in Gmail)
    // node-imap requires a JS Date object for SINCE, not an ISO string!
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const searchCriteria = [
      ['SINCE', fiveDaysAgo]
    ];
    
    const fetchOptions = {
      bodies: [''],
      struct: true
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    for (const msg of messages) {
      const all = msg.parts.find(part => part.which === '' || part.which === 'TEXT') || msg.parts[0];
      if (!all || !all.body) continue;

      const parsed = await simpleParser(all.body);
      let inReplyTo = parsed.inReplyTo;
      if (!inReplyTo) continue;

      // Clean the Message-ID format (e.g., <msg-id>)
      inReplyTo = inReplyTo.replace(/[<>]/g, '').trim();

      // Check if this matches a sent campaign log
      await connectDB();
      const log = await EmailCampaignLog.findOne({ messageId: new RegExp(inReplyTo, 'i') });

      if (log) {
        // We found a reply to our campaign!
        const lead = await Lead.findById(log.leadId);
        
        if (lead) {
          const subject = parsed.subject || 'No Subject';
          const textBody = parsed.text || 'No content';
          const logNote = `[REPLY RECEIVED]\nSubject: ${subject}\n\n${textBody}`;
          
          // Check for duplicate to avoid multiple logging
          const alreadyLogged = lead.outreach_logs && lead.outreach_logs.some((l: any) => 
             l.notes && l.notes === logNote
          );

          if (!alreadyLogged) {
            lead.outreach_logs = lead.outreach_logs || [];
            lead.outreach_logs.unshift({
              method: 'Email',
              date: parsed.date || new Date(),
              notes: logNote
            });
            
            if (!lead.is_replied) {
              lead.is_replied = true;
              lead.outreach_status = 'Replied';
              lead.nextFollowUpDate = undefined;
              lead.last_reply_subject = subject;
            }
            
            await lead.save();
            console.log(`[IMAP] Logged reply from Lead: ${lead.email} | Subject: ${subject}`);
          }
        }

        // Mark message as read so we don't process it again
        await connection.addFlags(msg.attributes.uid, ['\\Seen']);
      }
    }

    connection.end();
  } catch (error) {
    console.error(`[IMAP Error] Account ${account.email}:`, error);
  }
}

export async function checkAllInboxes() {
  await connectDB();
  const accounts = await EmailAccount.find({ isActive: true });
  for (const account of accounts) {
    await checkRepliesForAccount(account);
  }
}
