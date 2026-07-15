import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: '.env' });
}

const ProjectSchema = new mongoose.Schema({}, { strict: false });
const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

const TransactionSchema = new mongoose.Schema({}, { strict: false });
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const projects = await Project.find({}).lean();
    const txs = await Transaction.find({}).lean();
    console.log(`Found ${projects.length} projects.`);
    console.log(`Found ${txs.length} transactions.`);
    if (projects.length > 0) console.log("First project:", projects[0]);
    if (txs.length > 0) console.log("First tx:", txs[0]);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
