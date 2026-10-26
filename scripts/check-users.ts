import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function checkUsers() {
  const sanitizeUri = (uri?: string) => uri ? uri.replace(/\/\/[^@]+@/, '//[REDACTED]@') : 'NOT_SET';

  const baseUri = process.env.MONGODB_URI;
  if (!baseUri) {
    console.error('Error: MONGODB_URI environment variable is not defined.');
    process.exit(1);
  }

  // 1. Check authoritative production database (injaazh_os)
  console.log('Connecting to primary database (injaazh_os):', sanitizeUri(baseUri));
  await mongoose.connect(baseUri, { dbName: 'injaazh_os' });

  const primaryCount = await User.countDocuments();
  console.log(`\n--- Primary DB: ${mongoose.connection.name} (Total Users: ${primaryCount}) ---`);

  await mongoose.disconnect();

  // 2. Diagnostic audit of legacy database (injaazh_erp) to verify no stranded records
  console.log('\nConnecting to legacy database for diagnostic audit (injaazh_erp)...');
  await mongoose.connect(baseUri, { dbName: 'injaazh_erp' });

  const legacyCount = await User.countDocuments();
  console.log(`\n--- Legacy DB: ${mongoose.connection.name} (Total Users: ${legacyCount}) ---`);

  await mongoose.disconnect();
}

checkUsers().catch(console.error);
