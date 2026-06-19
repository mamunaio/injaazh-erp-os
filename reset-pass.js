const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
env.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    process.env[match[1]] = val;
  }
});

async function reset() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const emails = [
    'Imtiaz@injaazh.info',
    'ismail@injaazh.info',
    'Shanto@injaazh.info',
    'arafat@injaazh.info'
  ];

  const db = mongoose.connection.db;
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash('12345678', salt);

  for (const email of emails) {
    const result = await db.collection('users').updateOne(
      { email: email.toLowerCase() },
      { $set: { password: hashedPassword } }
    );
    console.log(`Reset ${email}: ${result.modifiedCount} modified`);
  }

  console.log('Done');
  process.exit(0);
}

reset();
