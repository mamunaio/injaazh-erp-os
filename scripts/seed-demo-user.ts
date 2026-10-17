import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env or .env.local
['.env.local', '.env'].forEach(fileName => {
  try {
    const envPath = join(process.cwd(), fileName);
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf-8');
      const envVars = envContent.split(/\r?\n/).filter(line => line.trim() && !line.startsWith('#'));
      envVars.forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0 && !process.env[key.trim()]) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value;
        }
      });
    }
  } catch (error) {
    // ignore
  }
});

async function main() {
  const connectToDatabase = (await import('../lib/mongodb')).default;
  const User = (await import('../models/User')).default;
  const mongoose = (await import('mongoose')).default;

  await connectToDatabase();
  console.log('Connected to Database. Checking for demo user...');

  let demoUser = await User.findOne({ email: 'demo@injaazh.com' });

  if (!demoUser) {
    demoUser = await User.create({
      name: 'Demo Viewer',
      email: 'demo@injaazh.com',
      password: 'demo123456',
      role: 'viewer',
      permissions: ['view:all']
    });
    console.log('✅ Created new Demo Viewer user:');
    console.log({
      id: demoUser._id,
      name: demoUser.name,
      email: demoUser.email,
      role: demoUser.role
    });
  } else {
    demoUser.role = 'viewer';
    demoUser.password = 'demo123456';
    await demoUser.save();
    console.log('✅ Updated existing Demo user to viewer role with password demo123456:');
    console.log({
      id: demoUser._id,
      name: demoUser.name,
      email: demoUser.email,
      role: demoUser.role
    });
  }

  await mongoose.connection.close();
  console.log('Done!');
  process.exit(0);
}

main().catch(err => {
  console.error('Error seeding demo user:', err);
  process.exit(1);
});
