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

async function clean() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("Connected.");

    const delProj = await Project.deleteMany({});
    console.log(`Deleted ${delProj.deletedCount} projects.`);

    const delTx = await Transaction.deleteMany({});
    console.log(`Deleted ${delTx.deletedCount} transactions.`);

    console.log("Database cleaned.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

clean();
