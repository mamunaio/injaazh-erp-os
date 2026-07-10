import mongoose from 'mongoose';
import { forceRunCampaign } from './app/actions/outreachAutomationActions.ts';
import { config } from 'dotenv';
config({ path: '.env.local' });

mongoose.connect(process.env.MONGODB_URI as string).then(async () => {
  const result = await forceRunCampaign('6a50ba60342bf96edbbf3831');
  console.log("Result:", result);
  process.exit();
}).catch(err => { console.error(err); process.exit(1); });
