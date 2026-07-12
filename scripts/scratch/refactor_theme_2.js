const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
        callback(dirPath);
      }
    }
  });
}

const replacements = [
  { regex: /(?<!dark:)bg-\[\#121214\]/g, replacement: 'bg-white dark:bg-[#121214]' },
  { regex: /(?<!dark:)bg-\[\#0E0E10\]/g, replacement: 'bg-slate-50 dark:bg-[#0E0E10]' },
  { regex: /(?<!dark:)border-white\/5(?!0)/g, replacement: 'border-slate-200 dark:border-white/5' },
  { regex: /(?<!dark:)border-white\/10/g, replacement: 'border-slate-200 dark:border-white/10' },
  { regex: /(?<!dark:)border-slate-800\/50/g, replacement: 'border-slate-200 dark:border-slate-800/50' },
  { regex: /(?<!dark:)border-slate-800/g, replacement: 'border-slate-200 dark:border-slate-800' },
  { regex: /(?<!dark:)hover:bg-white\/5(?!0)/g, replacement: 'hover:bg-slate-100 dark:hover:bg-white/5' },
  { regex: /(?<!dark:)hover:bg-white\/10/g, replacement: 'hover:bg-slate-100 dark:hover:bg-white/10' },
];

let changedFiles = 0;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  replacements.forEach(r => {
    content = content.replace(r.regex, r.replacement);
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    changedFiles++;
    console.log(`Updated ${filePath}`);
  }
}

['app', 'components'].forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    walkDir(fullPath, processFile);
  }
});

console.log(`Successfully updated ${changedFiles} files with second pass.`);
