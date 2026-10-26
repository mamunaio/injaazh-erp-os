import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function checkUsers() {
  const sanitizeUri = (uri?: string) => uri ? uri.replace(/\/\/[^@]+@/, '//[REDACTED]@') : 'NOT_SET';

  // Check current DB (injaazh_os)
  console.log('Connecting to database:', sanitizeUri(process.env.MONGODB_URI));
  await mongoose.connect(process.env.MONGODB_URI as string);

  const currentDbUsers = await User.find({}, { name: 1, email: 1, role: 1 }).lean();
  console.log('\n--- Users in current DB (' + mongoose.connection.name + ') ---');
  console.log(currentDbUsers);

  await mongoose.disconnect();

  // Check other DB (injaazh_erp)
  const otherUri = (process.env.MONGODB_URI as string).replace('injaazh_os', 'injaazh_erp');
  console.log('\nConnecting to secondary database:', sanitizeUri(otherUri));
  await mongoose.connect(otherUri);

  const otherDbUsers = await User.find({}, { name: 1, email: 1, role: 1 }).lean();
  console.log('\n--- Users in other DB (' + mongoose.connection.name + ') ---');
  console.log(otherDbUsers);

  await mongoose.disconnect();
}

checkUsers().catch(console.error);
