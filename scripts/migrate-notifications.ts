import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import Notification from '../models/Notification';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * Migration Script: Notification Privacy & RBAC Backfill
 *
 * Safely backfills legacy notification records with targetRoles, readBy, and dismissedBy.
 *
 * Safety & Legacy Preservation Invariants:
 * 1. Read-State Preservation: Existing `isRead: true` fields are NEVER modified or deleted.
 *    Historical read records remain read in the application layer and will not reappear as unread.
 * 2. Idempotent Execution: Updates filter strictly on missing or empty `targetRoles`/`readBy`.
 *    Subsequent runs detect `unmigratedCount === 0` and safely exit with zero writes.
 * 3. Pre-Migration Backup: Before executing `--apply` on production, run:
 *    mongodump --uri="<MONGODB_URI>" --db="injaazh_os" --collection="notifications" --out="./backup-pre-phase1a"
 * 4. Rollback: If rollback is required, restore from the snapshot dump.
 *
 * Usage:
 *   npx tsx scripts/migrate-notifications.ts           # Dry-run mode (default, read-only preview)
 *   npx tsx scripts/migrate-notifications.ts --apply   # Apply migration writes to injaazh_os
 */

const sanitizeUri = (uri?: string) => uri ? uri.replace(/\/\/[^@]+@/, '//[REDACTED]@') : 'NOT_SET';

async function migrateNotifications() {
  const isApply = process.argv.includes('--apply');
  const isDryRun = !isApply || process.argv.includes('--dry-run');

  const baseUri = process.env.MONGODB_URI;
  if (!baseUri) {
    console.error('Error: MONGODB_URI environment variable is not defined.');
    process.exit(1);
  }

  console.log('===============================================================');
  console.log('🔒 Notification Privacy & RBAC Migration Utility');
  console.log('===============================================================');
  console.log(`Mode: ${isDryRun ? 'DRY RUN (Read-Only Preview - No changes will be written)' : 'LIVE EXECUTION (--apply flag detected)'}`);
  console.log('Database:', sanitizeUri(baseUri));
  console.log('Target Database:', 'injaazh_os');
  console.log('---------------------------------------------------------------\n');

  await mongoose.connect(baseUri, { dbName: 'injaazh_os' });

  // 1. Audit existing notifications
  const totalCount = await Notification.countDocuments();
  const unmigratedCount = await Notification.countDocuments({
    $or: [
      { targetRoles: { $exists: false } },
      { targetRoles: { $size: 0 } },
      { readBy: { $exists: false } },
      { dismissedBy: { $exists: false } }
    ]
  });

  const paymentCount = await Notification.countDocuments({ type: 'payment', $or: [{ targetRoles: { $exists: false } }, { targetRoles: { $size: 0 } }] });
  const systemCount = await Notification.countDocuments({ type: 'system', $or: [{ targetRoles: { $exists: false } }, { targetRoles: { $size: 0 } }] });
  const leadCount = await Notification.countDocuments({ type: 'lead', $or: [{ targetRoles: { $exists: false } }, { targetRoles: { $size: 0 } }] });
  const proposalCount = await Notification.countDocuments({ type: 'proposal', $or: [{ targetRoles: { $exists: false } }, { targetRoles: { $size: 0 } }] });

  console.log('📊 Diagnostic Audit Summary:');
  console.log(`   Total Notifications in Database: ${totalCount}`);
  console.log(`   Unmigrated / Legacy Records:     ${unmigratedCount}`);
  console.log('\n🔍 Unmigrated Records by Type:');
  console.log(`   • Financial ('payment')  -> ${paymentCount} records (Proposed roles: ['owner', 'admin'])`);
  console.log(`   • System ('system')       -> ${systemCount} records (Proposed roles: ['owner', 'admin'])`);
  console.log(`   • CRM ('lead')            -> ${leadCount} records (Proposed roles: ['owner', 'admin', 'editor', 'marketplace_team'])`);
  console.log(`   • Project ('proposal')    -> ${proposalCount} records (Proposed roles: ['owner', 'admin', 'editor', 'marketplace_team'])`);

  if (unmigratedCount === 0) {
    console.log('\n✅ All notification records already have targetRoles, readBy, and dismissedBy metadata.');
    console.log('No migration action needed.');
    await mongoose.disconnect();
    return;
  }

  if (isDryRun) {
    console.log('\n---------------------------------------------------------------');
    console.log('ℹ️  DRY RUN PREVIEW: No records were modified.');
    console.log('To execute this migration against injaazh_os, run:');
    console.log('   npx tsx scripts/migrate-notifications.ts --apply');
    console.log('---------------------------------------------------------------');
    await mongoose.disconnect();
    return;
  }

  console.log('\n🚀 Applying migration updates...');

  // 2. Perform safe, non-destructive backfill
  const paymentRes = await Notification.updateMany(
    { type: 'payment', $or: [{ targetRoles: { $exists: false } }, { targetRoles: { $size: 0 } }] },
    { $set: { targetRoles: ['owner', 'admin'] } }
  );

  const systemRes = await Notification.updateMany(
    { type: 'system', $or: [{ targetRoles: { $exists: false } }, { targetRoles: { $size: 0 } }] },
    { $set: { targetRoles: ['owner', 'admin'] } }
  );

  const leadRes = await Notification.updateMany(
    { type: 'lead', $or: [{ targetRoles: { $exists: false } }, { targetRoles: { $size: 0 } }] },
    { $set: { targetRoles: ['owner', 'admin', 'editor', 'marketplace_team'] } }
  );

  const proposalRes = await Notification.updateMany(
    { type: 'proposal', $or: [{ targetRoles: { $exists: false } }, { targetRoles: { $size: 0 } }] },
    { $set: { targetRoles: ['owner', 'admin', 'editor', 'marketplace_team'] } }
  );

  // Initialize readBy and dismissedBy array fields if absent
  const arrayInitRes = await Notification.updateMany(
    { $or: [{ readBy: { $exists: false } }, { dismissedBy: { $exists: false } }] },
    {
      $set: {
        readBy: [],
        dismissedBy: []
      }
    }
  );

  console.log('\n✅ Migration complete:');
  console.log(`   • Payment records updated:  ${paymentRes.modifiedCount}`);
  console.log(`   • System records updated:   ${systemRes.modifiedCount}`);
  console.log(`   • Lead records updated:     ${leadRes.modifiedCount}`);
  console.log(`   • Proposal records updated: ${proposalRes.modifiedCount}`);
  console.log(`   • Arrays initialized:       ${arrayInitRes.modifiedCount}`);

  await mongoose.disconnect();
}

migrateNotifications().catch(err => {
  console.error('Migration failed:', err?.message || err);
  process.exit(1);
});
