/**
 * Direct Database Tests for Marketplace Integration
 * 
 * These tests bypass Next.js server actions and test the core logic directly
 * using database models. This avoids Next.js runtime dependencies like revalidatePath.
 * 
 * Usage: npx tsx tests/integration/marketplace-integration/direct-db-tests.ts
 */

import mongoose from 'mongoose';
import connectToDatabase from '../../../lib/mongodb';
import MarketplaceProject from '../../../models/MarketplaceProject';
import { Transaction } from '../../../models/Transaction';

// Simple test framework
class TestRunner {
  private passed = 0;
  private failed = 0;
  private tests: Array<{ name: string; fn: () => Promise<void> }> = [];

  test(name: string, fn: () => Promise<void>) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('\n🧪 Running Marketplace Integration Direct DB Tests\n');
    console.log('='.repeat(70));

    for (const test of this.tests) {
      try {
        process.stdout.write(`\n📝 ${test.name}... `);
        await test.fn();
        console.log('✅ PASSED');
        this.passed++;
      } catch (error) {
        console.log('❌ FAILED');
        console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        if (error instanceof Error && error.stack) {
          console.error(`   Stack: ${error.stack.split('\n').slice(1, 3).join('\n')}`);
        }
        this.failed++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
    console.log(`   Total: ${this.tests.length} tests\n`);

    return this.failed === 0;
  }
}

// Helper functions
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${expected}, but got ${actual}`
    );
  }
}

function assertDefined(value: any, message?: string) {
  if (value === undefined || value === null) {
    throw new Error(message || 'Value is undefined or null');
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper: Parse budget amount (same logic as in marketplaceActions.ts)
function parseBudgetAmount(budget: string | undefined): number {
  if (!budget) return 0;
  const cleaned = budget.replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

// Helper: Create auto-transaction (simulates the server action logic)
async function createAutoTransaction(project: any): Promise<void> {
  const amount = parseBudgetAmount(project.budget);
  
  const transaction = new Transaction({
    platform: project.platform,
    type: 'Income',
    amount: amount,
    date: new Date(),
    category: 'Project Income',
    description: `Project: ${project.title}`,
    projectId: project._id,
  });
  
  await transaction.save();
}

// Test suite
const runner = new TestRunner();

// Cleanup function
async function cleanup() {
  await MarketplaceProject.deleteMany({ title: /^Test/ });
  await Transaction.deleteMany({ description: /^Test|^Project: Test/ });
}

// Test 1: Auto-transaction creation
runner.test('Auto-transaction: Should create transaction when project is completed', async () => {
  await cleanup();

  // Create project
  const project = await MarketplaceProject.create({
    title: 'Test Auto-Transaction Project',
    platform: 'Upwork',
    budget: '$2,500',
    status: 'Planning',
    clientDetails: {
      clientName: 'Test Client',
      clientEmail: 'test@example.com'
    },
    scope: 'Test project scope',
    startDate: new Date(),
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });

  // Simulate status change to Completed and auto-transaction creation
  project.status = 'Completed';
  await project.save();
  await createAutoTransaction(project);

  // Verify transaction was created
  const transactions = await Transaction.find({ projectId: project._id }).lean();
  
  assertEqual(transactions.length, 1, 'Should have exactly 1 transaction');
  
  const autoTransaction = transactions[0];
  assertEqual(autoTransaction.platform, 'Upwork', 'Platform should match');
  assertEqual(autoTransaction.type, 'Income', 'Type should be Income');
  assertEqual(autoTransaction.amount, 2500, 'Amount should be 2500');
  assertEqual(autoTransaction.category, 'Project Income', 'Category should be Project Income');
  assert(autoTransaction.description.includes('Test Auto-Transaction Project'), 'Description should include project title');
  assertDefined(autoTransaction.projectId, 'ProjectId should be defined');
  assertEqual(autoTransaction.projectId!.toString(), project._id.toString(), 'ProjectId should match');
});

// Test 2: Manual transaction creation
runner.test('Manual transaction: Should create transaction linked to project', async () => {
  await cleanup();

  const project = await MarketplaceProject.create({
    title: 'Test Manual Transaction Project',
    platform: 'Direct',
    budget: '$3,000',
    status: 'In Progress',
    clientDetails: { clientName: 'Manual Test Client' },
    scope: 'Test scope'
  });

  // Create manual transaction
  const transaction = await Transaction.create({
    platform: 'Direct',
    type: 'Income',
    amount: 1500, // User modified from $3,000
    date: new Date(),
    category: 'Project Income',
    description: 'Partial payment for Test Manual Transaction Project',
    projectId: project._id
  });

  assertDefined(transaction, 'Transaction should be created');
  assertDefined(transaction.projectId, 'ProjectId should be defined');
  assertEqual(transaction.projectId!.toString(), project._id.toString(), 'ProjectId should match');
  assertEqual(transaction.amount, 1500, 'Amount should be modified value');
  assertEqual(transaction.platform, 'Direct', 'Platform should match');
});

// Test 3: Project link population
runner.test('Transaction display: Should populate project details', async () => {
  await cleanup();

  const project = await MarketplaceProject.create({
    title: 'Test Project Link Display',
    platform: 'Freelancer',
    budget: '$2,000',
    status: 'Completed',
    clientDetails: { clientName: 'Test Client' },
    scope: 'Test scope'
  });

  await createAutoTransaction(project);

  // Fetch transaction with populated project data
  const transactions = await Transaction.find({ projectId: project._id })
    .populate('projectId', 'title platform')
    .lean();

  assertEqual(transactions.length, 1, 'Should have 1 transaction');
  
  const linkedTransaction = transactions[0];
  assertDefined(linkedTransaction.projectId, 'ProjectId should be populated');
  assertEqual((linkedTransaction.projectId as any)._id.toString(), project._id.toString(), 'ProjectId should match');
  assertEqual((linkedTransaction.projectId as any).title, 'Test Project Link Display', 'Title should match');
  assertEqual((linkedTransaction.projectId as any).platform, 'Freelancer', 'Platform should match');
});

// Test 4: Platform analytics
runner.test('Platform analytics: Should return accurate project counts', async () => {
  await cleanup();

  // Create projects on different platforms
  await MarketplaceProject.create([
    { title: 'Test Freelancer 1', platform: 'Freelancer', budget: '$1000', status: 'Planning', clientDetails: { clientName: 'Client 1' }, scope: 'Scope 1' },
    { title: 'Test Freelancer 2', platform: 'Freelancer', budget: '$2000', status: 'In Progress', clientDetails: { clientName: 'Client 2' }, scope: 'Scope 2' },
    { title: 'Test Direct 1', platform: 'Direct', budget: '$3000', status: 'Completed', clientDetails: { clientName: 'Client 3' }, scope: 'Scope 3' },
    { title: 'Test Upwork 1', platform: 'Upwork', budget: '$4000', status: 'Planning', clientDetails: { clientName: 'Client 4' }, scope: 'Scope 4' },
    { title: 'Test Upwork 2', platform: 'Upwork', budget: '$5000', status: 'In Progress', clientDetails: { clientName: 'Client 5' }, scope: 'Scope 5' },
    { title: 'Test Upwork 3', platform: 'Upwork', budget: '$6000', status: 'Completed', clientDetails: { clientName: 'Client 6' }, scope: 'Scope 6' },
  ]);

  // Aggregate project counts
  const analytics = await MarketplaceProject.aggregate([
    { $match: { title: /^Test/ } },
    { $group: { _id: '$platform', count: { $sum: 1 } } }
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

  assertEqual(result.Freelancer, 2, 'Freelancer count should be 2');
  assertEqual(result.Direct, 1, 'Direct count should be 1');
  assertEqual(result.Upwork, 3, 'Upwork count should be 3');
  assertEqual(result.Fiverr, 0, 'Fiverr count should be 0');
});

// Test 5: Budget parsing
runner.test('Budget parsing: Should parse various formats correctly', async () => {
  const testCases = [
    { budget: '$1,500', expected: 1500 },
    { budget: '1500.50', expected: 1500.50 },
    { budget: '$1,234.56', expected: 1234.56 },
    { budget: '', expected: 0 },
    { budget: undefined, expected: 0 },
    { budget: 'invalid', expected: 0 },
    { budget: '$10,000.99', expected: 10000.99 },
    { budget: '5000', expected: 5000 },
  ];

  for (const testCase of testCases) {
    const result = parseBudgetAmount(testCase.budget as string);
    assertEqual(result, testCase.expected, `Budget "${testCase.budget}" should parse to ${testCase.expected}`);
  }
});

// Test 6: Transactions without project links
runner.test('Transaction display: Should handle transactions without project links', async () => {
  await cleanup();

  // Create standalone transaction (no projectId)
  const transaction = await Transaction.create({
    platform: 'Direct',
    type: 'Income',
    amount: 1000,
    date: new Date(),
    category: 'Other Income',
    description: 'Test standalone transaction'
    // No projectId
  });

  assertDefined(transaction, 'Transaction should be created');
  assert(transaction.projectId === undefined || transaction.projectId === null, 'ProjectId should be null/undefined');

  // Fetch with populate - should not fail
  const transactions = await Transaction.find({ _id: transaction._id })
    .populate('projectId', 'title platform')
    .lean();

  assertEqual(transactions.length, 1, 'Should find transaction');
  assert(transactions[0].projectId === null || transactions[0].projectId === undefined, 'ProjectId should remain null');
});

// Test 7: Deleted project handling
runner.test('Error handling: Should handle deleted project references', async () => {
  await cleanup();

  const project = await MarketplaceProject.create({
    title: 'Test Deleted Project',
    platform: 'Upwork',
    budget: '$1,500',
    status: 'Completed',
    clientDetails: { clientName: 'Test Client' },
    scope: 'Test scope'
  });

  await createAutoTransaction(project);

  // Delete the project
  await MarketplaceProject.findByIdAndDelete(project._id);

  // Fetch transactions - should still work
  const transactions = await Transaction.find({ description: /Test Deleted Project/ })
    .populate('projectId', 'title platform')
    .lean();

  assertEqual(transactions.length, 1, 'Transaction should still exist');
  // The projectId field will exist but populated data will be null
  assert(transactions[0].projectId === null, 'Populated projectId should be null for deleted project');
});

// Test 8: ProjectId validation
runner.test('Error handling: Should validate projectId exists', async () => {
  const nonExistentId = new mongoose.Types.ObjectId();
  
  // Check if project exists
  const project = await MarketplaceProject.findById(nonExistentId);
  assert(project === null, 'Project should not exist');

  // Attempting to create transaction with non-existent projectId
  // In the actual server action, this would be caught and return an error
  // Here we just verify the project doesn't exist
  assertEqual(project, null, 'Project lookup should return null');
});

// Test 9: Null projectId allowed
runner.test('Error handling: Should allow transactions with null projectId', async () => {
  await cleanup();

  const transaction = await Transaction.create({
    platform: 'Direct',
    type: 'Income',
    amount: 500,
    date: new Date(),
    category: 'Other Income',
    description: 'Test null projectId',
    projectId: undefined
  });

  assertDefined(transaction, 'Transaction should be created');
  assertEqual(transaction.projectId, undefined, 'ProjectId should be undefined');
});

// Test 10: Multiple concurrent completions
runner.test('Performance: Should handle multiple concurrent project completions', async () => {
  await cleanup();

  // Create multiple projects
  const projects = await MarketplaceProject.create([
    { title: 'Test Concurrent 1', platform: 'Upwork', budget: '$1000', status: 'Planning', clientDetails: { clientName: 'Client 1' }, scope: 'Scope 1' },
    { title: 'Test Concurrent 2', platform: 'Upwork', budget: '$1100', status: 'Planning', clientDetails: { clientName: 'Client 2' }, scope: 'Scope 2' },
    { title: 'Test Concurrent 3', platform: 'Upwork', budget: '$1200', status: 'Planning', clientDetails: { clientName: 'Client 3' }, scope: 'Scope 3' },
    { title: 'Test Concurrent 4', platform: 'Upwork', budget: '$1300', status: 'Planning', clientDetails: { clientName: 'Client 4' }, scope: 'Scope 4' },
    { title: 'Test Concurrent 5', platform: 'Upwork', budget: '$1400', status: 'Planning', clientDetails: { clientName: 'Client 5' }, scope: 'Scope 5' },
  ]);

  // Mark all as completed and create transactions concurrently
  await Promise.all(
    projects.map(async (project: any) => {
      project.status = 'Completed';
      await project.save();
      await createAutoTransaction(project);
    })
  );

  // Verify all transactions were created
  const projectIds = projects.map((p: any) => p._id);
  const transactions = await Transaction.find({ projectId: { $in: projectIds } }).lean();

  assertEqual(transactions.length, 5, 'Should have 5 transactions');
});

// Test 11: Referential integrity
runner.test('Data integrity: Should maintain referential integrity when project is deleted', async () => {
  await cleanup();

  const project = await MarketplaceProject.create({
    title: 'Test Referential Integrity',
    platform: 'Direct',
    budget: '$2,000',
    status: 'Completed',
    clientDetails: { clientName: 'Test Client' },
    scope: 'Test scope'
  });

  await createAutoTransaction(project);

  // Get transaction before deletion
  const transactionBefore = await Transaction.findOne({ projectId: project._id }).lean();
  assertDefined(transactionBefore, 'Transaction should exist before deletion');

  // Delete project
  await MarketplaceProject.findByIdAndDelete(project._id);

  // Transaction should still exist
  const transactionAfter = await Transaction.findOne({ _id: transactionBefore!._id }).lean();
  assertDefined(transactionAfter, 'Transaction should still exist after project deletion');
  assertDefined(transactionAfter!.projectId, 'ProjectId should be defined');
  assertEqual(transactionAfter!.projectId!.toString(), project._id.toString(), 'ProjectId reference should remain');
});

// Test 12: Field mapping verification
runner.test('Auto-transaction: Should map all fields correctly', async () => {
  await cleanup();

  const project = await MarketplaceProject.create({
    title: 'Test Field Mapping',
    platform: 'Fiverr',
    budget: '$7,890.12',
    status: 'Completed',
    clientDetails: { clientName: 'Test Client' },
    scope: 'Test scope'
  });

  await createAutoTransaction(project);

  const transaction = await Transaction.findOne({ projectId: project._id }).lean();
  
  assertDefined(transaction, 'Transaction should exist');
  assertEqual(transaction!.platform, 'Fiverr', 'Platform should be Fiverr');
  assertEqual(transaction!.type, 'Income', 'Type should be Income');
  assertEqual(transaction!.amount, 7890.12, 'Amount should be 7890.12');
  assertEqual(transaction!.category, 'Project Income', 'Category should be Project Income');
  assertEqual(transaction!.description, 'Project: Test Field Mapping', 'Description should include project title');
  assertDefined(transaction!.projectId, 'ProjectId should be defined');
  assertEqual(transaction!.projectId!.toString(), project._id.toString(), 'ProjectId should match');
  assertDefined(transaction!.date, 'Date should be set');
});

// Main execution
async function main() {
  try {
    console.log('🔌 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Database connected');

    const success = await runner.run();

    console.log('🧹 Cleaning up test data...');
    await cleanup();
    console.log('✅ Cleanup complete');

    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
