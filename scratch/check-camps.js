const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const campaigns = await db.collection('campaigns').find({}).toArray();
  const campMap = {};
  campaigns.forEach(c => campMap[c._id.toString()] = c.name);
  
  const activeLeads = await db.collection('campaignleads').find({ status: 'Active' }).toArray();
  
  const counts = {};
  activeLeads.forEach(l => {
    const cid = l.campaignId ? l.campaignId.toString() : 'undefined';
    counts[cid] = (counts[cid] || 0) + 1;
  });
  
  console.log('Active Leads per Campaign:');
  for (const cid in counts) {
    console.log(`- ${campMap[cid] || 'Unknown'} (${cid}): ${counts[cid]} active leads`);
  }
  
  const recentLogs = await db.collection('emailcampaignlogs').find({ status: 'Sent' }).sort({ sentAt: -1 }).limit(10).toArray();
  console.log('\nRecently sent emails belong to campaigns:');
  const recentCounts = {};
  recentLogs.forEach(l => {
    if(l.campaignId) {
      const cid = l.campaignId.toString();
      recentCounts[cid] = (recentCounts[cid] || 0) + 1;
    } else {
      recentCounts['Manual/No Campaign'] = (recentCounts['Manual/No Campaign'] || 0) + 1;
    }
  });
  for (const cid in recentCounts) {
    console.log(`- ${campMap[cid] || cid}: ${recentCounts[cid]} emails sent recently`);
  }
  
  process.exit();
}
run();
