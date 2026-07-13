import mongoose from 'mongoose';
import { Lead } from './models/Lead';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const l = await Lead.findOne({ outreach_status: 'Queued' });
  console.log('Lead Queued:', l?.email_subject_draft, l?.email_draft);
  process.exit(0);
}
check();
