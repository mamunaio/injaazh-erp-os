/**
 * Simplified E2E Test Runner for Marketplace Integration
 * 
 * This script runs the end-to-end tests without requiring full Jest setup.
 * It can be executed directly with ts-node or tsx.
 * 
 * Usage: npx tsx tests/integration/marketplace-integration/run-e2e-tests.ts
 */

import mongoose from 'mongoose';
import connectToDatabase from '../../../lib/mongodb';
import MarketplaceProject from '../../../models/MarketplaceProject';
import { Transaction } from '../../../models/Transaction';
import { 
  createMarketplaceProject, 
  updateMarketplaceProject, 
  deleteMarketplaceProject,
  getProjectAnalytics,
  createTransactionFromProject 
} from '../../../app/actions/marketplaceActions';
import { getTransactions } from '../../../app/actions/transactionActions';

// Simple test framework
class TestRunner {
  private passed = 0;
  private failed = 0;
  private tests: Array<{ name: string; fn: () => Promise<void> }> = [];

  test(name: string, fn: () => Promise<void>) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('\n🧪 Running Marketplace Integration E2E Tests\n');
    console.log('='.repeat(60));

    for (const test of this.tests) {
      try {
        process.stdout.write(`\n📝 ${test.name}... `);
        await test.fn();
        console.log('✅ PASSED');
        this.passed++;
      } catch (error) {
        console.log('❌ FAILED');
        console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        this.failed++;
      }
    }

    console.log('\n' + '='.repeat(60));
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

// Test suite
const runner = new TestRunner();

// Cleanup function
async function cleanup() {
  await MarketplaceProject.deleteMany({ title: /^Test/ });
  await Transaction.deleteMany({ description: /^Test|^Project: Test/ });
}

// Test 1: Auto-transaction creation
runner.test('Should automatically create transaction when project is marked as completed', async () => {
  await cleanup();

  const projectData = {
    title: 'Test Auto-Transaction Project',
    platform: 'Upwork',
    budget: '$2,500',
    status: 'Planning',
    clientDetails: {
      clientName: 'Test Client',
      clientEmail: 'test@example.com'
    },
    scope: 'Test project scope',
    startDate: new Date().toISOString(),
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };

  const createResult = await createMarketplaceProject(projectData);
  assert(createResult.success, 'Project creation should succeed');
  assertDefined(createResult.data, 'Project data should be defined');
  
  const projectId = createResult.data._id;

  // Mark project as completed
  const updateResult = await updateMarketplaceProject(projectId, { status: 'Completed' });
  assert(updateResult.success, 'Project update should succeed');
  assertEqual(updateResult.data.status, 'Completed', 'Status should be Completed');

  // Wait for async transaction creation
  await sleep(500);

  // Verify transaction was created
  const transactionsResult = await getTransactions();
  assert(transactionsResult.success, 'Get transactions should succeed');
  
  const projectTransactions = transactionsResult.data.filter(
    (t: any) => (t.projectId?._id || t.projectId)?.toString() === projectId
  );
  
  assertEqual(projectTransactions.length, 1, 'Should have exactly 1 transaction');
  
  const autoTransaction = projectTransactions[0];
  assertEqual(autoTransaction.platform, 'Upwork', 'Platform should match');
  assertEqual(autoTransaction.type, 'Income', 'Type should be Income');
  assertEqual(autoTransaction.amount, 2500, 'Amount should be 2500');
  assertEqual(autoTransaction.category, 'Project Income', 'Category should be Project Income');
  assert(autoTransaction.description.includes('Test Auto-Transaction Project'), 'Description should include project title');
});

// Test 2: Manual transaction creation
runner.test('Should create transaction manually from project with pre-populated data', async () => {
  await cleanup();

  const projectData = {
    title: 'Test Manual Transaction Project',
    platform: 'Direct',
    budget: '$3,000',
    status: 'In Progress',
    clientDetails: { clientName: 'Manual Test Client' },
    scope: 'Test scope'
  };

  const createResult = await createMarketplaceProject(projectData);
  const projectId = createResult.data._id;

  const transactionData = {
    platform: 'Direct',
    type: 'Income' as const,
    amount: 1500,
    date: new Date(),
    category: 'Project Income',
    description: 'Partial payment for Test Manual Transaction Project'
  };

  const result = await createTransactionFromProject(projectId, transactionData);
  
  assert(result.success, 'Transaction creation should succeed');
  assertDefined(result.data, 'Transaction data should be defined');
  assertEqual(result.data.projectId.toString(), projectId, 'ProjectId should match');
  assertEqual(result.data.amount, 1500, 'Amount should be modified value');
  assertEqual(result.data.platform, 'Direct', 'Platform should match');
});

// Test 3: Project link display
runner.test('Should populate project details when fetching transactions', async () => {
  await cleanup();

  const projectData = {
    title: 'Test Project Link Display',
    platform: 'Freelancer',
    budget: '$2,000',
    status: 'Completed',
    clientDetails: { clientName: 'Test Client' },
    scope: 'Test scope'
  };

  const createResult = await createMarketplaceProject(projectData);
  const projectId = createResult.data._id;

  await sleep(500);

  const transactionsResult = await getTransactions();
  assert(transactionsResult.success, 'Get transactions should succeed');

  const linkedTransaction = transactionsResult.data.find(
    (t: any) => (t.projectId?._id || t.projectId)?.toString() === projectId
  );

  assertDefined(linkedTransaction, 'Linked transaction should exist');
  assertDefined(linkedTransaction!.projectId, 'ProjectId should be populated');
  assertEqual(linkedTransaction!.projectId!._id, projectId, 'ProjectId should match');
  assertEqual(linkedTransaction!.projectId!.title, 'Test Project Link Display', 'Title should match');
  assertEqual(linkedTransaction!.projectId!.platform, 'Freelancer', 'Platform should match');
});

// Test 4: Platform analytics
runner.test('Should return accurate project counts for all platforms', async () => {
  await cleanup();

  const projects = [
    { title: 'Test Freelancer 1', platform: 'Freelancer', budget: '$1000', status: 'Planning', clientDetails: { clientName: 'Client 1' }, scope: 'Scope 1' },
    { title: 'Test Freelancer 2', platform: 'Freelancer', budget: '$2000', status: 'In Progress', clientDetails: { clientName: 'Client 2' }, scope: 'Scope 2' },
    { title: 'Test Direct 1', platform: 'Direct', budget: '$3000', status: 'Completed', clientDetails: { clientName: 'Client 3' }, scope: 'Scope 3' },
    { title: 'Test Upwork 1', platform: 'Upwork', budget: '$4000', status: 'Planning', clientDetails: { clientName: 'Client 4' }, scope: 'Scope 4' },
    { title: 'Test Upwork 2', platform: 'Upwork', budget: '$5000', status: 'In Progress', clientDetails: { clientName: 'Client 5' }, scope: 'Scope 5' },
    { title: 'Test Upwork 3', platform: 'Upwork', budget: '$6000', status: 'Completed', clientDetails: { clientName: 'Client 6' }, scope: 'Scope 6' },
  ];

  for (const project of projects) {
    await createMarketplaceProject(project);
  }

  const analyticsResult = await getProjectAnalytics();
  
  assert(analyticsResult.success, 'Analytics query should succeed');
  assertDefined(analyticsResult.data, 'Analytics data should be defined');
  assertEqual(analyticsResult.data.Freelancer, 2, 'Freelancer count should be 2');
  assertEqual(analyticsResult.data.Direct, 1, 'Direct count should be 1');
  assertEqual(analyticsResult.data.Upwork, 3, 'Upwork count should be 3');
  assertEqual(analyticsResult.data.Fiverr, 0, 'Fiverr count should be 0');
});

// Test 5: Budget parsing
runner.test('Should parse various budget formats correctly', async () => {
  await cleanup();

  const testCases = [
    { budget: '$1,500', expected: 1500 },
    { budget: '1500.50', expected: 1500.50 },
    { budget: '$1,234.56', expected: 1234.56 },
    { budget: '', expected: 0 },
    { budget: 'invalid', expected: 0 },
  ];

  for (const testCase of testCases) {
    const projectData = {
      title: `Test Budget ${testCase.budget}`,
      platform: 'Upwork',
      budget: testCase.budget,
      status: 'Planning',
      clientDetails: { clientName: 'Test Client' },
      scope: 'Test scope'
    };

    const createResult = await createMarketplaceProject(projectData);
    const projectId = createResult.data._id;

    await updateMarketplaceProject(projectId, { status: 'Completed' });
    await sleep(300);

    const transactionsResult = await getTransactions();
    const transaction = transactionsResult.data.find(
      (t: any) => (t.projectId?._id || t.projectId)?.toString() === projectId
    );

    assertDefined(transaction, `Transaction should exist for budget: ${testCase.budget}`);
    assertEqual(transaction!.amount, testCase.expected, `Amount should be ${testCase.expected} for budget: ${testCase.budget}`);
  }
});

// Test 6: Error handling - invalid projectId
runner.test('Should return error when creating transaction for non-existent project', async () => {
  const fakeProjectId = new mongoose.Types.ObjectId().toString();
  
  const transactionData = {
    platform: 'Upwork',
    type: 'Income' as const,
    amount: 1000,
    date: new Date(),
    category: 'Project Income',
    description: 'Test transaction'
  };

  const result = await createTransactionFromProject(fakeProjectId, transactionData);
  
  assert(!result.success, 'Transaction creation should fail');
  assertEqual(result.error, 'Project not found', 'Error message should be "Project not found"');
});

// Test 7: Deleted project handling
runner.test('Should handle deleted project references gracefully', async () => {
  await cleanup();

  const projectData = {
    title: 'Test Deleted Project',
    platform: 'Upwork',
    budget: '$1,500',
    status: 'Completed',
    clientDetails: { clientName: 'Test Client' },
    scope: 'Test scope'
  };

  const createResult = await createMarketplaceProject(projectData);
  const projectId = createResult.data._id;

  await sleep(500);

  // Delete the project
  await deleteMarketplaceProject(projectId);

  // Fetch transactions - should still work
  const transactionsResult = await getTransactions();
  assert(transactionsResult.success, 'Get transactions should succeed even with deleted project');

  const orphanedTransaction = transactionsResult.data.find(
    (t: any) => t.description?.includes('Test Deleted Project')
  );

  assertDefined(orphanedTransaction, 'Transaction should still exist');
});

// Test 8: Duplicate protection on project completed
runner.test('Should prevent duplicate transaction creation on multiple project updates', async () => {
  await cleanup();

  const projectData = {
    title: 'Test Duplicate Completion Project',
    platform: 'Fiverr',
    budget: '$500',
    status: 'Planning',
    clientDetails: { clientName: 'Duplicate Test Client' },
    scope: 'Test scope'
  };

  const createResult = await createMarketplaceProject(projectData);
  const projectId = createResult.data._id;

  // First completion
  await updateMarketplaceProject(projectId, { status: 'Completed' });
  await sleep(300);

  // Second completion update (e.g. updating title or client details while remaining Completed)
  await updateMarketplaceProject(projectId, { status: 'Completed', title: 'Test Duplicate Completion Project (Updated)' });
  await sleep(300);

  // Verify only 1 transaction exists for this project
  const transactionsResult = await getTransactions();
  const projectTransactions = transactionsResult.data.filter(
    (t: any) => (t.projectId?._id || t.projectId)?.toString() === projectId
  );

  assertEqual(projectTransactions.length, 1, 'Should have exactly 1 transaction even after multiple completions');
});

// Test 9: Milestone payment tracking without duplication
runner.test('Should track milestones automatically and prevent duplication', async () => {
  await cleanup();

  const projectData = {
    title: 'Test Milestone Project',
    platform: 'Direct',
    budget: '$1,000',
    status: 'In Progress',
    clientDetails: { clientName: 'Milestone Test Client' },
    scope: 'Test scope',
    milestones: []
  };

  const createResult = await createMarketplaceProject(projectData);
  const projectId = createResult.data._id;

  // Add first Paid milestone
  const milestones1 = [
    { id: 'ms-101', description: 'Initial Milestone', date: '2026-05-30', status: 'Paid', amount: 400 }
  ];
  await updateMarketplaceProject(projectId, { milestones: milestones1 });
  await sleep(300);

  // Verify first milestone transaction exists
  let transactionsResult = await getTransactions();
  let milestoneTx = transactionsResult.data.filter(
    (t: any) => (t.projectId?._id || t.projectId)?.toString() === projectId
  );
  assertEqual(milestoneTx.length, 1, 'Should have created exactly 1 transaction for the first paid milestone');
  assertEqual(milestoneTx[0].amount, 400, 'Milestone amount should match');
  assertEqual(milestoneTx[0].milestoneId, 'ms-101', 'Milestone ID should be stored');

  // Add second Paid milestone and update first milestone details (keeping status Paid)
  const milestones2 = [
    { id: 'ms-101', description: 'Initial Milestone (Revised)', date: '2026-05-30', status: 'Paid', amount: 400 },
    { id: 'ms-102', description: 'Second Milestone', date: '2026-06-15', status: 'Paid', amount: 600 }
  ];
  await updateMarketplaceProject(projectId, { milestones: milestones2 });
  await sleep(300);

  // Verify all transactions
  transactionsResult = await getTransactions();
  milestoneTx = transactionsResult.data.filter(
    (t: any) => (t.projectId?._id || t.projectId)?.toString() === projectId
  );
  
  assertEqual(milestoneTx.length, 2, 'Should have exactly 2 transactions total for the two paid milestones');
  
  const secondTx = milestoneTx.find((t: any) => t.milestoneId === 'ms-102');
  assertDefined(secondTx, 'Second milestone transaction should exist');
  assertEqual(secondTx!.amount, 600, 'Second milestone amount should match');
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
