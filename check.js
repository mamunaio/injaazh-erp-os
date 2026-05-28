require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("No URI");
  
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  const txs = await db.collection('transactions').find({}).sort({_id: -1}).limit(5).toArray();
  console.log("LAST 5 TRANSACTIONS:", JSON.stringify(txs, null, 2));
  
  process.exit(0);
}

run().catch(console.error);
