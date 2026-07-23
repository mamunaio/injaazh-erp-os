const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'leads', 'OutreachComposerModal.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// The dynamic variables block starts with {detectedVariables.length > 0 && ( and ends before {/* Composer Form */}
const dynamicVarsRegex = /\{detectedVariables\.length > 0 && \([\s\S]*?\)\}\s*<\/div>\s*<\/div>/;

// Wait, the regex needs to be precise. 
// Let's replace from `{detectedVariables.length > 0 && (` up to the ending `)}` inside the grid.
const dynamicVarsBlockRegex = /\{detectedVariables\.length > 0 && \([\s\S]*?\}\s*\)\s*\}/;

content = content.replace(dynamicVarsBlockRegex, '');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Removed dynamic variables!');
