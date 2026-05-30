import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env.local first
try {
  const envPath = join(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  const envVars = envContent.split(/\r?\n/).filter(line => line.trim() && !line.startsWith('#'));
  envVars.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    process.env[key.trim()] = value;
  });
} catch (error) {
  console.error('⚠️ Could not load .env.local file', error);
}

async function main() {
  const connectToDatabase = (await import('../lib/mongodb')).default;
  const User = (await import('../models/User')).default;
  const mongoose = (await import('mongoose')).default;

  await connectToDatabase();
  console.log('--- USERS IN DATABASE (BEFORE) ---');
  let users = await User.find({}).lean();
  users.forEach((u: any) => {
    console.log(`ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
  });

  // Automatically make all users with name Mamun or emails to 'admin'
  const matchingUsers = await User.find({
    $or: [
      { email: 'admin@injaazh.com' },
      { email: 'mamun@injaazh.com' },
      { email: 'info@injaazh.com' },
      { name: /Mamun/i }
    ]
  });

  for (const user of matchingUsers) {
    if (user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
      console.log(`Updated ${user.name} (${user.email}) to role 'admin'!`);
    } else {
      console.log(`${user.name} (${user.email}) is already an admin.`);
    }
  }

  console.log('\n--- USERS IN DATABASE (AFTER) ---');
  users = await User.find({}).lean();
  users.forEach((u: any) => {
    console.log(`ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
  });

  await mongoose.connection.close();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
