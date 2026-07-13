import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const TransactionSchema = new mongoose.Schema({}, { strict: false });
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const txs = await Transaction.find().sort({ createdAt: -1 }).limit(5).lean();
  console.log("Last 5 transactions:", txs);
  process.exit(0);
}
check();
