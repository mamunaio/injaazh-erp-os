const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/injaazh-erp-os');
  const db = mongoose.connection.db;
  const logs = await db.collection('emailcampaignlogs').find().sort({ sentAt: -1 }).limit(5).toArray();
  console.log("Recent EmailCampaignLogs:", JSON.stringify(logs, null, 2));
  
  const activeCampaignLeads = await db.collection('campaignleads').find({ status: 'Active' }).toArray();
  console.log(`\nActive Campaign Leads: ${activeCampaignLeads.length}`);
  
  process.exit(0);
}

main().catch(console.error);
