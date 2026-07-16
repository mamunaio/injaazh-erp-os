const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const sentLogs = await db.collection('emailcampaignlogs').find({status: 'Sent'}).sort({sentAt: -1}).limit(5).toArray();
  
  for (const log of sentLogs) {
    const lead = await db.collection('leads').findOne({ _id: log.leadId });
    const acc = await db.collection('emailaccounts').findOne({ _id: log.accountId });
    console.log("To: " + (lead ? lead.email : 'Unknown Lead') + ", From: " + (acc ? acc.email : 'Unknown Account'));
  }
  
  process.exit();
}
run();
