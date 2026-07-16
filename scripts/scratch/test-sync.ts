import { checkAllInboxes } from '../../app/services/imapListener';

async function run() {
  console.log('Starting sync test...');
  await checkAllInboxes();
  console.log('Sync test completed.');
  process.exit(0);
}

run();
