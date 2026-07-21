const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'actions', 'warmupActions.ts');
let content = fs.readFileSync(filePath, 'utf-8');

const newAction = `
export async function triggerCronJobsLocally() {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) return { success: false, error: 'No CRON_SECRET found' };
    
    // In dev mode, we know it's localhost:3000. For production, we'd use an absolute URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Fire and forget
    fetch(\`\${baseUrl}/api/cron/send-warmup\`, {
      headers: { authorization: \`Bearer \${secret}\` }
    }).catch(console.error);
    
    fetch(\`\${baseUrl}/api/cron/receive-warmup\`, {
      headers: { authorization: \`Bearer \${secret}\` }
    }).catch(console.error);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
`;

content += newAction;
fs.writeFileSync(filePath, content, 'utf-8');
console.log('Appended triggerCronJobsLocally to warmupActions.ts');
