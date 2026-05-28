'use server';

import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function fixProposalIndex() {
  try {
    await connectToDatabase();
    
    const db = mongoose.connection.db;
    if (!db) {
      return { success: false, error: 'Database connection not established' };
    }
    
    const collection = db.collection('proposals');

    // Get existing indexes
    const indexes = await collection.indexes();
    console.log('Existing indexes:', indexes);

    // Drop the old shareToken index if it exists
    try {
      await collection.dropIndex('shareToken_1');
      console.log('✓ Old index dropped successfully');
    } catch (error: any) {
      if (error.code === 27) {
        console.log('Index does not exist, skipping...');
      } else {
        console.log('Error dropping index:', error.message);
      }
    }

    // Create new sparse index
    await collection.createIndex(
      { shareToken: 1 },
      { unique: true, sparse: true }
    );
    console.log('✓ New sparse index created successfully');

    // Verify new indexes
    const newIndexes = await collection.indexes();
    console.log('New indexes:', newIndexes);

    return { success: true, message: 'Index fixed successfully' };
  } catch (error: any) {
    console.error('Error fixing index:', error);
    return { success: false, error: error.message };
  }
}
