const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'leads', 'OutreachComposerModal.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Fix Contact Name & Company Name inputs to look cleaner
content = content.replace(
  /className="w-full bg-slate-50 dark:bg-\[#09090B\] border border-slate-200 dark:border-\[#232734\] rounded-xl px-4 py-2\.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500\/50 focus:ring-2 focus:ring-indigo-500\/20 transition-all font-medium"/g,
  'className="w-full bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold shadow-sm"'
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed styling!');
