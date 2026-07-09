import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function resetPassword() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to', process.env.MONGODB_URI);
  
  const email = 'mamun@injaazh.com';
  const newPassword = 'password123';
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  const result = await User.updateOne(
    { email: email },
    { $set: { password: hashedPassword } }
  );
  
  console.log(`Password reset for ${email}. Modified: ${result.modifiedCount}`);
  
  await mongoose.disconnect();
}

resetPassword().catch(console.error);
