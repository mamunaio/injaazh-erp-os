const mongoose = require('mongoose');
const imaps = require('imap-simple');

const MONGODB_URI = "mongodb+srv://injaazhos:rXfVzMOVEz2gD7Jx@injaazh-os.kerqqku.mongodb.net/injaazh_os?retryWrites=true&w=majority&appName=Injaazh-OS";

async function testImap() {
  await mongoose.connect(MONGODB_URI);
  
  // We need to require the EmailAccount model. 
  // Since we are running outside Next.js, we might have issues with TS models.
  // We can just query MongoDB directly
  const db = mongoose.connection.db;
  const accounts = await db.collection('emailaccounts').find({ isActive: true }).toArray();
  
  if(accounts.length === 0) {
    console.log("No active email accounts found.");
    process.exit(0);
  }

  const account = accounts[0];
  console.log(`Testing IMAP for: ${account.email}`);

  const config = {
    imap: {
      user: account.email,
      password: account.appPassword,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      authTimeout: 3000,
      tlsOptions: { rejectUnauthorized: false }
    }
  };

  try {
    const connection = await imaps.connect(config);
    console.log('Fetching total number of messages in INBOX...');
    const box = await connection.openBox('INBOX');
    const totalMessages = box.messages.total;
    console.log(`Total messages in INBOX: ${totalMessages}`);

    if (totalMessages === 0) {
      console.log('No messages found.');
      process.exit(0);
    }

    // Fetch the last 10 messages (or fewer if there are less than 10)
    const fetchStart = Math.max(1, totalMessages - 9);
    const fetchSeq = `${fetchStart}:*`;

    const fetchOptions = {
      bodies: ['HEADER.FIELDS (FROM TO SUBJECT MESSAGE-ID IN-REPLY-TO REFERENCES DATE)'],
      struct: true
    };

    console.log(`Fetching messages ${fetchSeq}...`);
    const messages = await connection.search([fetchSeq], fetchOptions);
    console.log(`Fetched ${messages.length} messages.`);

    let replies = 0;
    for (const msg of messages) {
      const headerPart = msg.parts.find(part => part.which.includes('HEADER'));
      if (!headerPart) continue;

      const headers = headerPart.body;
      let inReplyTo = headers['in-reply-to'] ? headers['in-reply-to'][0] : null;

      if(inReplyTo) {
        replies++;
        console.log(`Found In-Reply-To: ${inReplyTo}`);
        inReplyTo = inReplyTo.replace(/[<>]/g, '').trim();
        const log = await db.collection('emailcampaignlogs').findOne({ messageId: new RegExp(inReplyTo, 'i') });
        if(log) {
          console.log(`MATCHED with campaign log! LeadID: ${log.leadId}`);
          await db.collection('leads').updateOne({ _id: log.leadId }, { $set: { is_replied: true, outreach_status: 'Replied' } });
          console.log('Updated lead in DB.');
        } else {
          console.log('No matching campaign log found.');
        }
      }
    }
    
    console.log(`Total replies found with In-Reply-To header: ${replies}`);
    connection.end();
  } catch(e) {
    console.error('IMAP Error:', e);
  }
  process.exit(0);
}

testImap();
