// Script to fix the shareToken index issue
// Run this with: node scripts/fix-proposal-index.js

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');
let MONGODB_URI = '';

for (const line of envLines) {
  if (line.startsWith('MONGODB_URI=')) {
    MONGODB_URI = line.split('=')[1].trim().replace(/['"]/g, '');
    break;
  }
}

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function fixIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully');

    const db = mongoose.connection.db;
    const collection = db.collection('proposals');

    // Get existing indexes
    console.log('\nExisting indexes:');
    const indexes = await collection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Drop the old shareToken index if it exists
    try {
      console.log('\nDropping old shareToken_1 index...');
      await collection.dropIndex('shareToken_1');
      console.log('✓ Old index dropped successfully');
    } catch (error) {
      if (error.code === 27) {
        console.log('Index does not exist, skipping...');
      } else {
        throw error;
      }
    }

    // Create new sparse index
    console.log('\nCreating new sparse index on shareToken...');
    await collection.createIndex(
      { shareToken: 1 },
      { unique: true, sparse: true }
    );
    console.log('✓ New sparse index created successfully');

    // Verify new indexes
    console.log('\nNew indexes:');
    const newIndexes = await collection.indexes();
    console.log(JSON.stringify(newIndexes, null, 2));

    console.log('\n✅ Index fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixIndex();
