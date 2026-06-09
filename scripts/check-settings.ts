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
  const { SystemSettings } = await import('../models/SystemSettings');
  const mongoose = (await import('mongoose')).default;

  await connectToDatabase();
  console.log('--- SYSTEM SETTINGS IN DATABASE ---');
  const settings = await SystemSettings.find({}).lean();
  settings.forEach((s: any) => {
    let displayValue = s.value;
    if (s.key === 'smtp' && s.value) {
      displayValue = {
        ...s.value,
        pass: s.value.pass ? '****' : undefined
      };
    }
    console.log(`Key: ${s.key}, Value:`, displayValue);
  });

  await mongoose.connection.close();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
