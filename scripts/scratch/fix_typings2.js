const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/leads/LeadsClient.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix remaining onImportSuccess
content = content.replace(/onImportSuccess=\{\(newLeads\) => \{[\s\S]*?\}\}/g, `onSuccess={() => {
            router.refresh();
          }}`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed typings in LeadsClient.tsx');
