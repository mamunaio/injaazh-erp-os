const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'leads', 'OutreachComposerModal.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// The block to remove is the entire Dynamic Template Variables section.
// It starts with `{detectedVariables.length > 0 && (`
// and ends with `)}` just before `</div>\n                </div>\n\n                {/* Composer Form */}`

const blockToRemoveRegex = /\{detectedVariables\.length > 0 && \([\s\S]*?\}\s*\)\s*\}/;
content = content.replace(blockToRemoveRegex, '');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Removed dynamic vars block successfully.');
