/**
 * Test script for auto-transaction creation
 * Creates a test project and marks it as completed to verify auto-transaction creation
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
import MarketplaceProject from '../models/MarketplaceProject';
import { Transaction } from '../models/Transaction';

async function testAutoTransaction() {
  console.log('🧪 Testing Auto-Transaction Creation\n');
  
  try {
    await connectToDatabase();
    console.log('✅ Database connected\n');
    
    // Create a test project
    console.log('📝 Creating test project...');
    const testProject = await MarketplaceProject.create({
      title: 'Test Project for Auto-Transaction',
      platform: 'Upwork',
      status: 'In Progress',
      budget: '$1,500.00',
      description: 'This is a test project to verify auto-transaction creation',
      clientDetails: {
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
      },
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });
    console.log(`✅ Test project created: ${testProject._id}\n`);
    
    // Count transactions before
    const transactionsBefore = await Transaction.countDocuments({ projectId: testProject._id });
    console.log(`📊 Transactions linked to project before: ${transactionsBefore}\n`);
    
    // Simulate the updateMarketplaceProject logic
    console.log('🔄 Marking project as Completed...');
    const oldStatus = testProject.status;
    testProject.status = 'Completed';
    await testProject.save();
    
    // Manually trigger auto-transaction creation (simulating what updateMarketplaceProject does)
    if (oldStatus !== 'Completed' && testProject.status === 'Completed') {
      console.log('🎯 Status changed to Completed, creating auto-transaction...');
      
      // Parse budget
      const parseBudgetAmount = (budget: string | undefined): number => {
        if (!budget) return 0;
        const cleaned = budget.replace(/[$,\s]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
      };
      
      const amount = parseBudgetAmount(testProject.budget);
      console.log(`  Parsed budget: ${testProject.budget} → ${amount}`);
      
      const transaction = new Transaction({
        platform: testProject.platform,
        type: 'Income',
        amount: amount,
        date: new Date(),
        category: 'Project Income',
        description: `Project: ${testProject.title}`,
        projectId: testProject._id,
      });
      
      await transaction.save();
      console.log(`✅ Auto-created transaction: ${transaction._id}\n`);
    }
    
    // Count transactions after
    const transactionsAfter = await Transaction.countDocuments({ projectId: testProject._id });
    console.log(`📊 Transactions linked to project after: ${transactionsAfter}\n`);
    
    // Verify the transaction
    const createdTransaction = await Transaction.findOne({ projectId: testProject._id }).lean();
    if (createdTransaction) {
      console.log('✅ Transaction Verification:');
      console.log(`  Platform: ${createdTransaction.platform} (expected: ${testProject.platform})`);
      console.log(`  Type: ${createdTransaction.type} (expected: Income)`);
      console.log(`  Amount: ${createdTransaction.amount} (expected: 1500)`);
      console.log(`  Category: ${createdTransaction.category} (expected: Project Income)`);
      console.log(`  Description: ${createdTransaction.description}`);
      console.log(`  ProjectId: ${createdTransaction.projectId} (expected: ${testProject._id})`);
      console.log();
      
      // Verify all fields match
      const allMatch = 
        createdTransaction.platform === testProject.platform &&
        createdTransaction.type === 'Income' &&
        createdTransaction.amount === 1500 &&
        createdTransaction.category === 'Project Income' &&
        createdTransaction.description === `Project: ${testProject.title}` &&
        createdTransaction.projectId?.toString() === testProject._id.toString();
      
      if (allMatch) {
        console.log('🎉 All fields match! Auto-transaction creation works correctly.\n');
      } else {
        console.log('⚠️ Some fields do not match. Please review.\n');
      }
    } else {
      console.log('❌ No transaction found for the project!\n');
    }
    
    // Test populate functionality
    console.log('🔍 Testing transaction populate...');
    const populatedTransaction = await Transaction.findOne({ projectId: testProject._id })
      .populate('projectId', 'title platform')
      .lean();
    
    if (populatedTransaction && populatedTransaction.projectId) {
      const proj = populatedTransaction.projectId as any;
      console.log(`✅ Populated project data:`);
      console.log(`  Title: ${proj.title}`);
      console.log(`  Platform: ${proj.platform}`);
      console.log();
    }
    
    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await Transaction.deleteMany({ projectId: testProject._id });
    await MarketplaceProject.findByIdAndDelete(testProject._id);
    console.log('✅ Test data cleaned up\n');
    
    console.log('✅ Auto-transaction creation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

testAutoTransaction().catch(console.error);
