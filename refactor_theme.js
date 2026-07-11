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
  { regex: /(?<!dark:)bg-\[\#09090B\]\/80/g, replacement: 'bg-white/80 dark:bg-[#09090B]/80' },
  { regex: /(?<!dark:)bg-\[\#09090B\](?!\/)/g, replacement: 'bg-slate-50 dark:bg-[#09090B]' },
  { regex: /(?<!dark:)bg-\[\#11131A\](?!\/)/g, replacement: 'bg-white dark:bg-[#11131A]' },
  { regex: /(?<!dark:)bg-\[\#232734\](?!\/)/g, replacement: 'bg-slate-200 dark:bg-[#232734]' },
  
  { regex: /(?<!dark:)border-\[\#232734\](?!\/)/g, replacement: 'border-slate-200 dark:border-[#232734]' },
  
  { regex: /(?<!dark:|hover:)text-white(?!\/)/g, replacement: 'text-slate-900 dark:text-white' },
  { regex: /(?<!dark:|hover:)text-slate-200(?!\/)/g, replacement: 'text-slate-800 dark:text-slate-200' },
  { regex: /(?<!dark:|hover:)text-slate-300(?!\/)/g, replacement: 'text-slate-700 dark:text-slate-300' },
  { regex: /(?<!dark:|hover:)text-slate-400(?!\/)/g, replacement: 'text-slate-500 dark:text-slate-400' },

  { regex: /(?<!dark:)hover:bg-\[\#11131A\](?!\/)/g, replacement: 'hover:bg-slate-100 dark:hover:bg-[#11131A]' },
  { regex: /(?<!dark:)hover:bg-\[\#09090B\](?!\/)/g, replacement: 'hover:bg-slate-50 dark:hover:bg-[#09090B]' },
  { regex: /(?<!dark:)hover:bg-\[\#323746\](?!\/)/g, replacement: 'hover:bg-slate-300 dark:hover:bg-[#323746]' },

  { regex: /(?<!dark:)hover:border-\[\#232734\](?!\/)/g, replacement: 'hover:border-slate-300 dark:hover:border-[#232734]' },
  
  { regex: /(?<!dark:)bg-black\/60/g, replacement: 'bg-white/60 dark:bg-black/60' },
  { regex: /(?<!dark:)bg-black\/50/g, replacement: 'bg-white/50 dark:bg-black/50' },
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

console.log(`Successfully updated ${changedFiles} files.`);
