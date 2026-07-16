const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const subject = '{quick question|quick heads up|small question} {about your site|regarding your site}';
const body = '{Hi|Hey|Hello},\n\nI was {checking out|looking at} your flooring business online today and noticed your mobile site takes {unusually long|a bit too long} to fully load. \n\n{In this industry|For local businesses}, if a site takes more than 3 seconds to load, potential clients just get impatient and {go straight to a competitor|bounce}. You\'re likely losing out on {a lot of easy local jobs|good leads} simply because of this small tech glitch.\n\nI actually {made|recorded} a quick 2-minute screen recording showing exactly what\'s slowing it down and how you can fix it. \n\n{Mind if I send the video over?|Would it be okay if I shared the link here?}';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const testCamp = await db.collection('campaigns').findOne({name: 'Test'});
  if (testCamp) {
    testCamp.sequences[0].subjectTemplate = subject;
    testCamp.sequences[0].bodyTemplate = body;
    testCamp.sequences[0].useAI = false;
    
    await db.collection('campaigns').updateOne({_id: testCamp._id}, {$set: {sequences: testCamp.sequences}});
    console.log('Campaign updated!');
  } else {
    console.log('Test campaign not found!');
  }
  process.exit();
}
run();
