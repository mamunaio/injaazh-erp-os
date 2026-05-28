/**
 * Migration Script: Create projectId Index on Transaction Collection
 * 
 * Purpose: Ensures the projectId index exists on the Transaction collection
 * for efficient querying of transactions linked to marketplace projects.
 * 
 * Usage:
 *   npm run ts-node scripts/create-projectid-index.ts
 * 
 * Rollback:
 *   See rollback instructions at the end of this file
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
 * Check if projectId index already exists
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
 * Create projectId index
 */
async function createIndex(): Promise<void> {
  try {
    console.log('📋 Creating projectId index...');
    await Transaction.collection.createIndex({ projectId: 1 });
    console.log('✅ Index created successfully');
  } catch (error) {
    console.error('❌ Error creating index:', error);
    throw error;
  }
}

/**
 * Verify index was created correctly
 */
async function verifyIndex(): Promise<void> {
  try {
    console.log('\n🔍 Verifying index creation...');
    const indexes = await Transaction.collection.getIndexes();
    
    console.log('\n📊 All Transaction Collection Indexes:');
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
    if (hasProjectIdIndex) {
      console.log('✅ ProjectId index verified successfully!');
    } else {
      console.log('⚠️ ProjectId index not found after creation');
      throw new Error('Index verification failed');
    }
  } catch (error) {
    console.error('❌ Error verifying index:', error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting projectId Index Migration\n');
  console.log('=' .repeat(60));
  console.log('Migration: Create projectId index on Transaction collection');
  console.log('Date:', new Date().toISOString());
  console.log('=' .repeat(60));
  console.log();
  
  try {
    // Step 1: Connect to database
    console.log('📡 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Database connected\n');
    
    // Step 2: Check if index already exists
    console.log('🔍 Checking if projectId index already exists...');
    const indexExists = await checkIndexExists();
    
    if (indexExists) {
      console.log('✅ ProjectId index already exists - no action needed\n');
      console.log('=' .repeat(60));
      console.log('Migration Status: SKIPPED (index already exists)');
      console.log('=' .repeat(60));
      await verifyIndex();
      return;
    }
    
    console.log('⚠️ ProjectId index does not exist - will create\n');
    
    // Step 3: Create the index
    await createIndex();
    
    // Step 4: Verify the index was created
    await verifyIndex();
    
    // Step 5: Success summary
    console.log();
    console.log('=' .repeat(60));
    console.log('Migration Status: COMPLETED SUCCESSFULLY');
    console.log('=' .repeat(60));
    console.log();
    console.log('✅ ProjectId index has been created on Transaction collection');
    console.log('✅ This will improve query performance for:');
    console.log('   - Finding transactions linked to a specific project');
    console.log('   - Populating project details in transaction lists');
    console.log('   - Validating project references');
    console.log();
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.log();
    console.log('=' .repeat(60));
    console.log('Migration Status: FAILED');
    console.log('=' .repeat(60));
    console.log();
    console.log('Please check the error above and try again.');
    console.log('If the issue persists, contact the development team.');
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the migration
runMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

/**
 * ROLLBACK INSTRUCTIONS
 * =====================
 * 
 * If you need to remove the projectId index, follow these steps:
 * 
 * Option 1: Using MongoDB Shell
 * ------------------------------
 * 1. Connect to your MongoDB instance:
 *    mongosh "your-connection-string"
 * 
 * 2. Switch to your database:
 *    use your-database-name
 * 
 * 3. List all indexes on Transaction collection:
 *    db.transactions.getIndexes()
 * 
 * 4. Drop the projectId index (replace 'projectId_1' with actual index name):
 *    db.transactions.dropIndex("projectId_1")
 * 
 * 5. Verify the index was removed:
 *    db.transactions.getIndexes()
 * 
 * 
 * Option 2: Using Node.js Script
 * -------------------------------
 * Create a file scripts/rollback-projectid-index.ts with:
 * 
 * ```typescript
 * import connectToDatabase from '../lib/mongodb';
 * import { Transaction } from '../models/Transaction';
 * 
 * async function rollback() {
 *   await connectToDatabase();
 *   await Transaction.collection.dropIndex('projectId_1');
 *   console.log('✅ Index dropped');
 *   process.exit(0);
 * }
 * 
 * rollback().catch(console.error);
 * ```
 * 
 * Then run: npm run ts-node scripts/rollback-projectid-index.ts
 * 
 * 
 * Option 3: Using MongoDB Compass
 * --------------------------------
 * 1. Open MongoDB Compass and connect to your database
 * 2. Navigate to the Transaction collection
 * 3. Click on the "Indexes" tab
 * 4. Find the projectId_1 index
 * 5. Click the trash icon to drop the index
 * 6. Confirm the deletion
 * 
 * 
 * IMPORTANT NOTES:
 * ----------------
 * - Dropping the index will not delete any data
 * - Queries will still work, but may be slower for projectId lookups
 * - The index is defined in the Transaction model schema, so it may be
 *   recreated automatically when the application starts
 * - To permanently prevent the index, remove this line from models/Transaction.ts:
 *   TransactionSchema.index({ projectId: 1 });
 */
