const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://injaazhos:rXfVzMOVEz2gD7Jx@injaazh-os.kerqqku.mongodb.net/injaazh_os?retryWrites=true&w=majority&appName=Injaazh-OS";

async function updateLead() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  
  // Find the single replied lead and update it
  await db.collection('leads').updateOne(
    { is_replied: true, company_name: "Injaazh" }, 
    { $set: { last_reply_subject: "Re: We can build your Custom ERP / SaaS" } }
  );
  
  console.log('Lead updated successfully!');
  process.exit(0);
}

updateLead();
