import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { PersonalDebt } from '@/models/PersonalDebt';

export async function POST() {
  try {
    console.log('🔄 Starting debt migration...');
    
    await connectToDatabase();
    console.log('✅ Connected to database');
    
    // Find all debts that don't have originalAmount field
    const debtsToMigrate = await PersonalDebt.find({
      $or: [
        { originalAmount: { $exists: false } },
        { paidAmount: { $exists: false } },
        { paymentHistory: { $exists: false } }
      ]
    });
    
    console.log(`📊 Found ${debtsToMigrate.length} debts to migrate`);
    
    if (debtsToMigrate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No debts need migration. All done!',
        successCount: 0,
        errorCount: 0,
        totalProcessed: 0,
        details: []
      });
    }
    
    let successCount = 0;
    let errorCount = 0;
    const details: string[] = [];
    
    for (const debt of debtsToMigrate) {
      try {
        await PersonalDebt.findByIdAndUpdate(
          debt._id,
          {
            $set: {
              originalAmount: debt.amount, // Current amount becomes original
              paidAmount: 0, // No payments made yet
              paymentHistory: [] // Empty payment history
            }
          }
        );
        successCount++;
        details.push(`✅ Migrated: ${debt.personName} - ৳${debt.amount}`);
        console.log(`✅ Migrated debt: ${debt.personName} - ${debt.amount}`);
      } catch (error: any) {
        errorCount++;
        details.push(`❌ Failed: ${debt.personName} - ${error.message}`);
        console.error(`❌ Error migrating debt ${debt._id}:`, error);
      }
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📊 Total processed: ${debtsToMigrate.length}`);
    
    return NextResponse.json({
      success: true,
      successCount,
      errorCount,
      totalProcessed: debtsToMigrate.length,
      details
    });
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Migration failed'
    }, { status: 500 });
  }
}
