# Database Migration Guide: ProjectId Index

## Quick Reference

| Action | Command |
|--------|---------|
| **Run Migration** | `npx tsx scripts/create-projectid-index.ts` |
| **Verify Index** | `npx tsx scripts/verify-index.ts` |
| **Rollback** | `npx tsx scripts/rollback-projectid-index.ts` |

## Overview

This guide documents the database migration for creating the `projectId` index on the Transaction collection. This index is part of the Marketplace Integration feature and improves query performance for transactions linked to marketplace projects.

## Migration Details

- **Migration Script**: `scripts/create-projectid-index.ts`
- **Target Collection**: `transactions`
- **Index Created**: `{ projectId: 1 }`
- **Purpose**: Optimize queries for project-transaction relationships
- **Feature**: Marketplace Integration
- **Date Created**: 2026-05-28

## Prerequisites

Before running the migration:

1. Ensure you have access to the database
2. Verify `.env.local` file contains valid `MONGODB_URI`
3. Ensure Node.js and npm are installed
4. Backup your database (recommended for production)

## Running the Migration

### Development Environment

```bash
npx tsx scripts/create-projectid-index.ts
```

### Production Environment

1. **Backup the database first**:
   ```bash
   mongodump --uri="your-mongodb-uri" --out=backup-$(date +%Y%m%d)
   ```

2. **Run the migration**:
   ```bash
   npx tsx scripts/create-projectid-index.ts
   ```

3. **Verify the migration**:
   The script includes automatic verification. Look for:
   ```
   ✅ ProjectId index verified successfully!
   Migration Status: COMPLETED SUCCESSFULLY
   ```

## Expected Output

### If Index Already Exists

```
🚀 Starting projectId Index Migration

============================================================
Migration: Create projectId index on Transaction collection
Date: 2026-05-28T17:33:34.879Z
============================================================

📡 Connecting to database...
✅ Database connected

🔍 Checking if projectId index already exists...
✅ ProjectId index already exists - no action needed

============================================================
Migration Status: SKIPPED (index already exists)
============================================================

🔍 Verifying index creation...

📊 All Transaction Collection Indexes:
  _id_:
    - _id: 1
  platform_1_date_-1:
    - platform: 1
    - date: -1
  type_1_date_-1:
    - type: 1
    - date: -1
  date_-1:
    - date: -1
  projectId_1:
    - projectId: 1

✅ ProjectId index verified successfully!
```

### If Index Needs to be Created

```
🚀 Starting projectId Index Migration

============================================================
Migration: Create projectId index on Transaction collection
Date: 2026-05-28T17:33:34.879Z
============================================================

📡 Connecting to database...
✅ Database connected

🔍 Checking if projectId index already exists...
⚠️ ProjectId index does not exist - will create

📋 Creating projectId index...
✅ Index created successfully

🔍 Verifying index creation...

📊 All Transaction Collection Indexes:
  [... list of indexes ...]
  projectId_1:
    - projectId: 1

✅ ProjectId index verified successfully!

============================================================
Migration Status: COMPLETED SUCCESSFULLY
============================================================

✅ ProjectId index has been created on Transaction collection
✅ This will improve query performance for:
   - Finding transactions linked to a specific project
   - Populating project details in transaction lists
   - Validating project references
```

## Verification Steps

After running the migration, verify the index was created successfully:

### Option 1: Using the Verification Script (Recommended)

```bash
npx tsx scripts/verify-index.ts
```

**What it checks:**
- Database connectivity
- Index existence
- Index structure and fields
- All indexes on the Transaction collection

**Expected output:**
```
🔍 Verifying Database Index

✅ Database connected

📋 Triggering index creation with a query...
✅ Query executed

📋 Checking Transaction collection indexes...

📊 Available Indexes:
  _id_:
    - _id: 1
  platform_1_date_-1:
    - platform: 1
    - date: -1
  type_1_date_-1:
    - type: 1
    - date: -1
  date_-1:
    - date: -1
  projectId_1:
    - projectId: 1

✅ ProjectId index exists!
```

### Option 2: Using MongoDB Shell

```bash
mongosh "your-connection-string"
use your-database-name
db.transactions.getIndexes()
```

Look for an index named `projectId_1` in the output.

### Option 3: Using MongoDB Compass

1. Open MongoDB Compass
2. Connect to your database
3. Navigate to the `transactions` collection
4. Click on the "Indexes" tab
5. Verify `projectId_1` index is listed

## Post-Migration Checklist

After successfully running the migration, complete these steps:

- [ ] **Verify index creation** - Run `npx tsx scripts/verify-index.ts`
- [ ] **Check application logs** - Ensure no errors when the application starts
- [ ] **Test transaction queries** - Verify transactions with projectId load correctly
- [ ] **Test project details page** - Ensure "Add Transaction" button works
- [ ] **Test Money page** - Verify transactions display with project links
- [ ] **Monitor performance** - Check query performance improvements in production
- [ ] **Document completion** - Update deployment logs with migration timestamp

## Performance Impact

### Before Index

- Queries filtering by `projectId`: **Collection scan** (slow)
- Populate operations: **O(n)** complexity
- Large datasets: **Significant performance degradation**

### After Index

- Queries filtering by `projectId`: **Index scan** (fast)
- Populate operations: **O(log n)** complexity
- Large datasets: **Consistent performance**

### Expected Improvements

- Transaction list with project population: **50-90% faster**
- Project-to-transactions queries: **80-95% faster**
- Validation queries: **70-90% faster**

## Rollback Instructions

If you need to remove the projectId index (for example, if the migration causes issues or needs to be reverted):

### When to Rollback

Consider rolling back the migration if:
- The index creation causes performance issues during creation
- You need to modify the index structure
- You're troubleshooting database issues
- You're reverting the Marketplace Integration feature

### Option 1: Using the Rollback Script (Recommended)

A dedicated rollback script is provided at `scripts/rollback-projectid-index.ts`.

**To run the rollback:**

```bash
npx tsx scripts/rollback-projectid-index.ts
```

**Expected output:**

```
🔄 Starting projectId Index Rollback

============================================================
Rollback: Remove projectId index from Transaction collection
Date: 2026-05-28T17:33:34.879Z
============================================================

⚠️ WARNING: This will remove the projectId index
⚠️ Query performance for project-linked transactions may decrease

📡 Connecting to database...
✅ Database connected

🔍 Checking if projectId index exists...
⚠️ ProjectId index exists - will remove

🗑️ Dropping projectId index...
✅ Index dropped successfully

🔍 Verifying index removal...

📊 Remaining Transaction Collection Indexes:
  [... list of remaining indexes ...]

✅ ProjectId index successfully removed!

============================================================
Rollback Status: COMPLETED SUCCESSFULLY
============================================================

✅ ProjectId index has been removed from Transaction collection

⚠️ IMPORTANT NOTES:
   - Queries will still work, but may be slower
   - The index is defined in models/Transaction.ts
   - MongoDB may recreate it when the application starts
   - To permanently prevent recreation, remove this line:
     TransactionSchema.index({ projectId: 1 });
```

### Option 2: Using MongoDB Shell

```bash
mongosh "your-connection-string"
use your-database-name
db.transactions.dropIndex("projectId_1")
db.transactions.getIndexes()  # Verify removal
```

### Option 3: Using MongoDB Compass (GUI Method)

1. Open MongoDB Compass
2. Connect to your database
3. Navigate to the `transactions` collection
4. Click on the "Indexes" tab
5. Find `projectId_1` index
6. Click the trash icon
7. Confirm deletion

### Verifying Rollback Success

After running the rollback, verify the index was removed:

```bash
# Using the verification script
npx tsx scripts/verify-index.ts

# Or using MongoDB shell
mongosh "your-connection-string"
use your-database-name
db.transactions.getIndexes()
```

The `projectId_1` index should no longer appear in the list.

## Important Notes

### About Index Recreation

- The index is defined in `models/Transaction.ts`
- MongoDB may recreate it automatically when the application starts
- To permanently prevent the index, remove this line from the model:
  ```typescript
  TransactionSchema.index({ projectId: 1 });
  ```

### About Data Safety

- Creating an index does **NOT** modify any data
- Dropping an index does **NOT** delete any data
- Queries will work without the index, but may be slower
- The migration is **safe to run multiple times** (idempotent)

### About Downtime

- Index creation is **non-blocking** in MongoDB 4.2+
- No downtime required for this migration
- Queries can continue during index creation
- For very large collections (millions of documents), index creation may take several minutes

## Troubleshooting

### Error: "Could not load .env.local file"

**Solution**: Ensure `.env.local` exists in the project root with `MONGODB_URI` defined.

### Error: "Database connection failed"

**Solution**: 
1. Verify `MONGODB_URI` is correct
2. Check network connectivity
3. Verify database credentials
4. Check if database server is running

### Error: "Index creation failed"

**Solution**:
1. Check database user has index creation permissions
2. Verify sufficient disk space
3. Check MongoDB server logs for details

### Migration Hangs or Times Out

**Solution**:
1. Check database connectivity
2. For large collections, increase timeout
3. Run during low-traffic periods
4. Monitor MongoDB server resources

## Related Files

- **Migration Script**: `scripts/create-projectid-index.ts`
- **Verification Script**: `scripts/verify-index.ts`
- **Transaction Model**: `models/Transaction.ts`
- **Design Document**: `.kiro/specs/marketplace-integration/design.md`
- **Requirements**: `.kiro/specs/marketplace-integration/requirements.md`

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review MongoDB server logs
3. Verify all prerequisites are met
4. Contact the development team with:
   - Error messages
   - Migration output
   - MongoDB version
   - Environment (dev/staging/production)
