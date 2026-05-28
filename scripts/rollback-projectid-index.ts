/**
 * Rollback Script: Remove projectId Index from Transaction Collection
 * 
 * Purpose: Removes the projectId index from the Transaction collection.
 * This is the rollback for the create-projectid-index.ts migration.
 * 
 * Usage:
 *   npx tsx scripts/rollback-projectid-index.ts
 * 
 * WARNING: This will remove the index and may impact query performance.
 * Only run this if you need to rollback the migration.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env.local
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

/**
 * Check if projectId index exists
 */
async function checkIndexExists(): Promise<boolean> {
  try {
    const indexes = await Transaction.collection.getIndexes();
    const hasProjectIdIndex = Object.keys(indexes).some(key => key.includes('projectId'));
    return hasProjectIdIndex;
  } catch (error) {
    console.error('❌ Error checking indexes:', error);
    throw error;
  }
}

/**
 * Drop projectId index
 */
async function dropIndex(): Promise<void> {
  try {
    console.log('🗑️ Dropping projectId index...');
    await Transaction.collection.dropIndex('projectId_1');
    console.log('✅ Index dropped successfully');
  } catch (error: any) {
    if (error.code === 27 || error.message.includes('index not found')) {
      console.log('⚠️ Index does not exist - nothing to drop');
    } else {
      console.error('❌ Error dropping index:', error);
      throw error;
    }
  }
}

/**
 * Verify index was removed
 */
async function verifyRemoval(): Promise<void> {
  try {
    console.log('\n🔍 Verifying index removal...');
    const indexes = await Transaction.collection.getIndexes();
    
    console.log('\n📊 Remaining Transaction Collection Indexes:');
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
    
    const hasProjectIdIndex = Object.keys(indexes).some(key => key.includes('projectId'));
    
    console.log();
    if (!hasProjectIdIndex) {
      console.log('✅ ProjectId index successfully removed!');
    } else {
      console.log('⚠️ ProjectId index still exists after removal attempt');
      throw new Error('Index removal verification failed');
    }
  } catch (error) {
    console.error('❌ Error verifying removal:', error);
    throw error;
  }
}

/**
 * Main rollback function
 */
async function runRollback() {
  console.log('🔄 Starting projectId Index Rollback\n');
  console.log('=' .repeat(60));
  console.log('Rollback: Remove projectId index from Transaction collection');
  console.log('Date:', new Date().toISOString());
  console.log('=' .repeat(60));
  console.log();
  
  console.log('⚠️ WARNING: This will remove the projectId index');
  console.log('⚠️ Query performance for project-linked transactions may decrease');
  console.log();
  
  try {
    // Step 1: Connect to database
    console.log('📡 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Database connected\n');
    
    // Step 2: Check if index exists
    console.log('🔍 Checking if projectId index exists...');
    const indexExists = await checkIndexExists();
    
    if (!indexExists) {
      console.log('✅ ProjectId index does not exist - no action needed\n');
      console.log('=' .repeat(60));
      console.log('Rollback Status: SKIPPED (index does not exist)');
      console.log('=' .repeat(60));
      return;
    }
    
    console.log('⚠️ ProjectId index exists - will remove\n');
    
    // Step 3: Drop the index
    await dropIndex();
    
    // Step 4: Verify the index was removed
    await verifyRemoval();
    
    // Step 5: Success summary
    console.log();
    console.log('=' .repeat(60));
    console.log('Rollback Status: COMPLETED SUCCESSFULLY');
    console.log('=' .repeat(60));
    console.log();
    console.log('✅ ProjectId index has been removed from Transaction collection');
    console.log();
    console.log('⚠️ IMPORTANT NOTES:');
    console.log('   - Queries will still work, but may be slower');
    console.log('   - The index is defined in models/Transaction.ts');
    console.log('   - MongoDB may recreate it when the application starts');
    console.log('   - To permanently prevent recreation, remove this line:');
    console.log('     TransactionSchema.index({ projectId: 1 });');
    console.log();
    
  } catch (error) {
    console.error('\n❌ Rollback failed:', error);
    console.log();
    console.log('=' .repeat(60));
    console.log('Rollback Status: FAILED');
    console.log('=' .repeat(60));
    console.log();
    console.log('Please check the error above and try again.');
    console.log('If the issue persists, contact the development team.');
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the rollback
runRollback().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
