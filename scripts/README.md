# Scripts Directory

This directory contains utility scripts for database migrations, testing, and verification.

## Available Scripts

### Migration Scripts

#### `create-projectid-index.ts`
Creates the `projectId` index on the Transaction collection for the Marketplace Integration feature.

**Usage:**
```bash
npx tsx scripts/create-projectid-index.ts
```

**Features:**
- ✅ Checks if index already exists (idempotent)
- ✅ Creates index if needed
- ✅ Automatic verification
- ✅ Detailed logging with status indicators
- ✅ Includes rollback instructions

**Documentation:** See `scripts/MIGRATION_GUIDE.md` for detailed instructions.

---

### Verification Scripts

#### `verify-index.ts`
Verifies that database indexes are properly created on the Transaction collection.

**Usage:**
```bash
npx tsx scripts/verify-index.ts
```

**Output:**
- Lists all indexes on Transaction collection
- Confirms projectId index exists
- Provides index details

---

### Testing Scripts

#### `test-auto-transaction.ts`
Tests the automatic transaction creation feature when a project is marked as completed.

**Usage:**
```bash
npx tsx scripts/test-auto-transaction.ts
```

#### `test-manual-transaction.ts`
Tests the manual transaction creation from project details feature.

**Usage:**
```bash
npx tsx scripts/test-manual-transaction.ts
```

#### `verify-marketplace-integration.ts`
Comprehensive verification of the Marketplace Integration feature.

**Usage:**
```bash
npx tsx scripts/verify-marketplace-integration.ts
```

---

### Legacy Scripts

#### `fix-proposal-index.js`
Legacy script for fixing proposal indexes.

**Usage:**
```bash
node scripts/fix-proposal-index.js
```

---

## Quick Start

### Running a Migration

1. Ensure `.env.local` is configured with `MONGODB_URI`
2. Run the migration script:
   ```bash
   npx tsx scripts/create-projectid-index.ts
   ```
3. Verify the migration:
   ```bash
   npx tsx scripts/verify-index.ts
   ```

### Testing Integration Features

1. Test automatic transaction creation:
   ```bash
   npx tsx scripts/test-auto-transaction.ts
   ```

2. Test manual transaction creation:
   ```bash
   npx tsx scripts/test-manual-transaction.ts
   ```

3. Run comprehensive verification:
   ```bash
   npx tsx scripts/verify-marketplace-integration.ts
   ```

## Prerequisites

- Node.js 18+ installed
- npm or yarn installed
- `.env.local` file with valid `MONGODB_URI`
- Database access credentials

## Script Conventions

### Exit Codes
- `0`: Success
- `1`: Error/Failure

### Logging Conventions
- ✅ Success indicator
- ❌ Error indicator
- ⚠️ Warning indicator
- 🔍 Verification/checking
- 📋 Processing/working
- 📊 Results/data display
- 🚀 Starting operation
- 📡 Connection/network operation

### Output Format
Scripts use consistent formatting:
```
🚀 Starting [Operation Name]

============================================================
[Operation Details]
============================================================

[Step-by-step progress with indicators]

============================================================
Status: [SUCCESS/FAILED/SKIPPED]
============================================================
```

## Environment Variables

All scripts require the following environment variables (loaded from `.env.local`):

- `MONGODB_URI`: MongoDB connection string

Example `.env.local`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

## Troubleshooting

### "Could not load .env.local file"
- Ensure `.env.local` exists in project root
- Check file permissions

### "Database connection failed"
- Verify `MONGODB_URI` is correct
- Check network connectivity
- Verify database credentials

### "Module not found" errors
- Run `npm install` to install dependencies
- Ensure you're in the project root directory

### TypeScript errors
- Ensure TypeScript is installed: `npm install -D typescript`
- Check `tsconfig.json` is present

## Adding New Scripts

When adding new scripts to this directory:

1. Use TypeScript (`.ts`) for new scripts
2. Follow the logging conventions above
3. Include error handling with try-catch
4. Add usage documentation to this README
5. Use the environment variable loading pattern
6. Include verification steps where applicable
7. Make scripts idempotent when possible

### Template for New Scripts

```typescript
/**
 * Script Name: [Description]
 * 
 * Purpose: [What this script does]
 * 
 * Usage:
 *   npx tsx scripts/your-script.ts
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

async function main() {
  console.log('🚀 Starting [Operation]\n');
  
  try {
    await connectToDatabase();
    console.log('✅ Database connected\n');
    
    // Your script logic here
    
    console.log('\n✅ Operation completed successfully');
  } catch (error) {
    console.error('\n❌ Operation failed:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

## Related Documentation

- **Migration Guide**: `scripts/MIGRATION_GUIDE.md` - Detailed migration instructions
- **Design Document**: `.kiro/specs/marketplace-integration/design.md` - Feature design
- **Requirements**: `.kiro/specs/marketplace-integration/requirements.md` - Feature requirements
- **Tasks**: `.kiro/specs/marketplace-integration/tasks.md` - Implementation tasks

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review related documentation
3. Check MongoDB server logs
4. Contact the development team
