import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { PersonalDebt } from '@/models/PersonalDebt';

export async function POST() {
  try {
    console.log('🔄 Starting comprehensive debt fix...');
    
    await connectToDatabase();
    console.log('✅ Connected to database');
    
    // Find all debts
    const allDebts = await PersonalDebt.find();
    
    console.log(`📊 Found ${allDebts.length} debts to process`);
    
    let fixedCount = 0;
    let alreadyCorrectCount = 0;
    const details: string[] = [];
    
    for (const debt of allDebts) {
      try {
        const currentAmount = debt.amount || 0;
        const currentPaidAmount = debt.paidAmount || 0;
        const currentOriginalAmount = debt.originalAmount;
        
        // Calculate what the original amount should be
        const calculatedOriginalAmount = currentAmount + currentPaidAmount;
        
        let needsUpdate = false;
        const updates: any = {};
        
        // Check if originalAmount needs to be set or fixed
        if (!currentOriginalAmount) {
          // No originalAmount - set it
          updates.originalAmount = calculatedOriginalAmount;
          needsUpdate = true;
        } else if (currentPaidAmount > 0 && currentOriginalAmount !== calculatedOriginalAmount) {
          // Has payments but originalAmount is wrong - fix it
          updates.originalAmount = calculatedOriginalAmount;
          needsUpdate = true;
        }
        
        // Ensure paidAmount exists
        if (debt.paidAmount === undefined || debt.paidAmount === null) {
          updates.paidAmount = 0;
          needsUpdate = true;
        }
        
        // Ensure paymentHistory exists
        if (!debt.paymentHistory || !Array.isArray(debt.paymentHistory)) {
          updates.paymentHistory = [];
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await PersonalDebt.findByIdAndUpdate(
            debt._id,
            { $set: updates }
          );
          
          fixedCount++;
          details.push(
            `✅ Fixed: ${debt.personName} - ` +
            `Original: ${currentOriginalAmount || 'none'} → ৳${updates.originalAmount || currentOriginalAmount}, ` +
            `Paid: ৳${currentPaidAmount}, Remaining: ৳${currentAmount}`
          );
          console.log(`✅ Fixed: ${debt.personName}`);
        } else {
          alreadyCorrectCount++;
          details.push(
            `✓ OK: ${debt.personName} - ` +
            `Original: ৳${currentOriginalAmount}, Paid: ৳${currentPaidAmount}, Remaining: ৳${currentAmount}`
          );
        }
      } catch (error: any) {
        details.push(`❌ Error: ${debt.personName} - ${error.message}`);
        console.error(`❌ Error fixing debt ${debt._id}:`, error);
      }
    }
    
    console.log('\n📈 Fix Summary:');
    console.log(`   ✅ Fixed: ${fixedCount}`);
    console.log(`   ✓ Already correct: ${alreadyCorrectCount}`);
    console.log(`   📊 Total processed: ${allDebts.length}`);
    
    return NextResponse.json({
      success: true,
      fixedCount,
      alreadyCorrectCount,
      totalProcessed: allDebts.length,
      details
    });
    
  } catch (error: any) {
    console.error('❌ Fix failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Fix failed'
    }, { status: 500 });
  }
}
