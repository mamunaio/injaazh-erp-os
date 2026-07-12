const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/injaazh-erp');
  const accounts = await mongoose.connection.collection('emailaccounts').find({}).toArray();
  console.log("Email Accounts:", accounts);
  process.exit(0);
}

check();
