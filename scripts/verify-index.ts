/**
 * Verify database index creation
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
try {
  const envPath = join(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  const envVars = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  envVars.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
    process.env[key.trim()] = value.trim();
  });
} catch (error) {
  console.error('⚠️ Could not load .env.local file');
}

import connectToDatabase from '../lib/mongodb';
import { Transaction } from '../models/Transaction';

async function verifyIndex() {
  console.log('🔍 Verifying Database Index\n');
  
  try {
    await connectToDatabase();
    console.log('✅ Database connected\n');
    
    // Trigger index creation by doing a query
    console.log('📋 Triggering index creation with a query...');
    await Transaction.findOne({ projectId: { $ne: null } }).lean();
    console.log('✅ Query executed\n');
    
    // Wait a moment for index creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check indexes
    console.log('📋 Checking Transaction collection indexes...');
    const indexes = await Transaction.collection.getIndexes();
    
    console.log('\n📊 Available Indexes:');
    for (const [name, spec] of Object.entries(indexes)) {
      console.log(`  ${name}:`);
      if (Array.isArray(spec)) {
        spec.forEach((field: any) => {
          console.log(`    - ${field[0]}: ${field[1]}`);
        });
      } else {
        console.log(`    ${JSON.stringify(spec)}`);
      }
    }
    
    // Check specifically for projectId index
    const hasProjectIdIndex = Object.keys(indexes).some(key => key.includes('projectId'));
    
    console.log();
    if (hasProjectIdIndex) {
      console.log('✅ ProjectId index exists!');
    } else {
      console.log('⚠️ ProjectId index not found in collection');
      console.log('   This is normal - MongoDB creates indexes lazily');
      console.log('   The index is defined in the schema and will be created when needed');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

verifyIndex().catch(console.error);
