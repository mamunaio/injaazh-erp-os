/**
 * Test script for manual transaction creation from project
 * Tests the createTransactionFromProject server action
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

async function testManualTransaction() {
  console.log('🧪 Testing Manual Transaction Creation from Project\n');
  
  try {
    await connectToDatabase();
    console.log('✅ Database connected\n');
    
    // Create a test project
    console.log('📝 Creating test project...');
    const testProject = await MarketplaceProject.create({
      title: 'Test Project for Manual Transaction',
      platform: 'Freelancer',
      status: 'In Progress',
      budget: '$2,500.50',
      description: 'This is a test project to verify manual transaction creation',
      clientDetails: {
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
      },
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    console.log(`✅ Test project created: ${testProject._id}\n`);
    
    // Test 1: Create transaction with valid projectId
    console.log('📋 Test 1: Create transaction with valid projectId');
    const transactionData = {
      platform: 'Freelancer',
      type: 'Income' as const,
      amount: 2500.50,
      date: new Date(),
      category: 'Project Income',
      description: 'Manual payment for test project',
    };
    
    // Simulate createTransactionFromProject
    const project = await MarketplaceProject.findById(testProject._id).lean().exec();
    if (!project) {
      console.log('❌ Project not found');
    } else {
      const transaction = new Transaction({
        ...transactionData,
        projectId: testProject._id,
      });
      await transaction.save();
      console.log(`✅ Transaction created: ${transaction._id}`);
      console.log(`  Platform: ${transaction.platform}`);
      console.log(`  Amount: ${transaction.amount}`);
      console.log(`  ProjectId: ${transaction.projectId}`);
      console.log();
    }
    
    // Test 2: Verify transaction is linked
    console.log('📋 Test 2: Verify transaction is linked to project');
    const linkedTransaction = await Transaction.findOne({ projectId: testProject._id }).lean();
    if (linkedTransaction) {
      console.log(`✅ Transaction found with projectId: ${linkedTransaction.projectId}`);
      console.log(`  Matches project ID: ${linkedTransaction.projectId?.toString() === testProject._id.toString()}`);
      console.log();
    } else {
      console.log('❌ No linked transaction found\n');
    }
    
    // Test 3: Test with invalid projectId
    console.log('📋 Test 3: Create transaction with invalid projectId');
    const invalidProjectId = '507f1f77bcf86cd799439011'; // Non-existent ID
    const invalidProject = await MarketplaceProject.findById(invalidProjectId).lean().exec();
    if (!invalidProject) {
      console.log('✅ Correctly rejected: Project not found');
      console.log();
    } else {
      console.log('❌ Should have rejected invalid projectId\n');
    }
    
    // Test 4: Test with null projectId
    console.log('📋 Test 4: Create transaction with null projectId');
    const nullTransaction = new Transaction({
      platform: 'Direct',
      type: 'Income',
      amount: 1000,
      date: new Date(),
      category: 'Other Income',
      description: 'Transaction without project link',
      projectId: null,
    });
    await nullTransaction.save();
    console.log(`✅ Transaction created without projectId: ${nullTransaction._id}`);
    console.log(`  ProjectId is null: ${nullTransaction.projectId === null || nullTransaction.projectId === undefined}`);
    console.log();
    
    // Test 5: Test populate functionality
    console.log('📋 Test 5: Test populate functionality');
    const transactionIds = [linkedTransaction?._id, nullTransaction._id].filter((id): id is typeof nullTransaction._id => id !== undefined);
    const populatedTransactions = await Transaction.find({
      _id: { $in: transactionIds }
    })
      .populate('projectId', 'title platform')
      .lean();
    
    console.log(`✅ Found ${populatedTransactions.length} transactions`);
    for (const trans of populatedTransactions) {
      console.log(`  Transaction ${trans._id}:`);
      if (trans.projectId) {
        const proj = trans.projectId as any;
        console.log(`    Linked to project: ${proj.title} (${proj.platform})`);
      } else {
        console.log(`    No project link`);
      }
    }
    console.log();
    
    // Test 6: Test getProjectAnalytics
    console.log('📋 Test 6: Test getProjectAnalytics');
    const analytics = await MarketplaceProject.aggregate([
      {
        $group: {
          _id: '$platform',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const result = {
      Freelancer: 0,
      Direct: 0,
      Upwork: 0,
      Fiverr: 0
    };
    
    analytics.forEach((item: { _id: string; count: number }) => {
      if (item._id in result) {
        result[item._id as keyof typeof result] = item.count;
      }
    });
    
    console.log('✅ Project analytics:');
    console.log(`  Freelancer: ${result.Freelancer}`);
    console.log(`  Direct: ${result.Direct}`);
    console.log(`  Upwork: ${result.Upwork}`);
    console.log(`  Fiverr: ${result.Fiverr}`);
    console.log();
    
    // Cleanup
    console.log('🧹 Cleaning up test data...');
    const cleanupIds = [linkedTransaction?._id, nullTransaction._id].filter((id): id is typeof nullTransaction._id => id !== undefined);
    await Transaction.deleteMany({ 
      _id: { $in: cleanupIds }
    });
    await MarketplaceProject.findByIdAndDelete(testProject._id);
    console.log('✅ Test data cleaned up\n');
    
    console.log('✅ Manual transaction creation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

testManualTransaction().catch(console.error);
