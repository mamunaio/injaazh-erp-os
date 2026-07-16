const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  try {
    const acc = await db.collection('emailaccounts').findOne({ isActive: true, $expr: { $lt: ['$sentToday', '$dailyLimit'] } });
    const camp = await db.collection('campaigns').findOne({ name: 'Test' });
    const cl = await db.collection('campaignleads').findOne({ campaignId: camp._id, status: 'Active' });
    
    // I am writing a mock function to test the AI provider
    const { generateAIContent } = require('./.next/server/app/actions/aiActions.js') || {}; // wait, can't require Next.js compiled files directly
    
  } catch(e) {
    console.error('Error:', e.message);
  }
  process.exit();
}
run();
