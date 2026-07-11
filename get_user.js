const mongoose = require('mongoose');

async function findUser() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/injaazh-erp-os');
  
  const userSchema = new mongoose.Schema({
    email: String
  }, { strict: false });
  
  const User = mongoose.models.User || mongoose.model('User', userSchema);
  const users = await User.find({}).limit(1);
  
  if (users.length > 0) {
    console.log('User found:');
    console.log(users[0].email);
  } else {
    console.log('No users found in database.');
  }
  process.exit(0);
}

// Load env variables
require('dotenv').config({ path: '.env.local' });
findUser();
