const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  try {
    const acc = await db.collection('emailaccounts').findOne({ isActive: true, $expr: { $lt: ['$sentToday', '$dailyLimit'] } });
    console.log('Account found:', acc ? acc.email : 'None');
  } catch(e) {
    console.error('Error in query:', e.message);
  }
  process.exit();
}
run();
