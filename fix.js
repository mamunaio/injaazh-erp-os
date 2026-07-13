const fs = require('fs');
let c = fs.readFileSync('components/leads/OutreachComposerModal.tsx', 'utf8');
c = c.replace(/\\`/g, '`');
c = c.replace(/\\\$/g, '$');
fs.writeFileSync('components/leads/OutreachComposerModal.tsx', c);
