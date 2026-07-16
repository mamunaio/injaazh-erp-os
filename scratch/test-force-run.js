const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const camp = await db.collection('campaigns').findOne({ name: 'Test' });
  const campLeads = await db.collection('campaignleads').find({
    campaignId: camp._id,
    status: 'Active',
    nextActionDate: { $lte: new Date() }
  }).toArray();
  console.log('Eligible leads:', campLeads.length);
  process.exit();
}
run();
