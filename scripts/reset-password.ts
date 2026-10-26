import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function resetPassword() {
  const email = process.argv[2] || process.env.RESET_EMAIL;
  const newPassword = process.argv[3] || process.env.NEW_PASSWORD;

  if (!email || !newPassword) {
    console.error('Usage: tsx scripts/reset-password.ts <email> <newPassword> (or set RESET_EMAIL and NEW_PASSWORD environment variables)');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to database successfully.');

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const result = await User.updateOne(
    { email: email },
    { $set: { password: hashedPassword } }
  );

  console.log(`Password reset for ${email}. Modified: ${result.modifiedCount}`);

  await mongoose.disconnect();
}

resetPassword().catch(console.error);
