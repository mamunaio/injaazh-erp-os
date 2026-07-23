const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'leads', 'OutreachComposerModal.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Fix Contact Name & Company Name fields
content = content.replace(
  /className="w-full bg-slate-50 dark:bg-\[#09090B\] border-b-2 border-transparent focus:border-indigo-500 rounded-none px-2 py-1.5 text-sm text-slate-900 dark:text-white outline-none transition-all font-medium"/g,
  'className="w-full bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition-all shadow-sm"'
);

// Fix Dynamic Variables Section
// Replace the outer container to have a border
content = content.replace(
  /className="p-3 bg-slate-50 dark:bg-\[#09090B\] rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border border-slate-100 dark:border-\[#232734\]\/50"/,
  'className="p-4 bg-slate-100 dark:bg-[#161923] rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border border-slate-200 dark:border-[#232734]"'
);

// Fix Dynamic Variables Inputs
content = content.replace(
  /className=\{`w-full bg-white dark:bg-\[#11131A\] border-b \$\{aiReviewNeeded\.includes\(v\) \? 'border-orange-500 text-orange-500' : 'border-slate-200 dark:border-\[#232734\]'\} px-2 py-1 text-xs outline-none focus:border-indigo-500 transition-all font-medium`\}/g,
  'className={`w-full bg-white dark:bg-[#11131A] border rounded-lg ${aiReviewNeeded.includes(v) ? \'border-orange-500 text-orange-500 ring-2 ring-orange-500/20\' : \'border-slate-200 dark:border-[#232734] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20\'} px-3 py-2 text-xs outline-none transition-all shadow-sm font-semibold`}'
);

// Fix Auto-generate Button
content = content.replace(
  /className="flex-shrink-0 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-\[11px\] font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 mt-2 md:mt-0 shadow-sm"/,
  'className="flex-shrink-0 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50 mt-2 md:mt-0"'
);

// Fix Footer Select layout
content = content.replace(
  /<div className="w-\[180px\]">/,
  '<div className="w-[200px] flex-shrink-0">'
);
content = content.replace(
  /<div className="flex items-center gap-2 mr-4">/,
  '<div className="flex items-center gap-2 mr-auto sm:mr-4">'
);
// Also fix the select styling in footer
content = content.replace(
  /className="bg-slate-50 dark:bg-\[#09090B\] border border-slate-200 dark:border-\[#232734\] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white font-medium shadow-sm"/,
  'className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white font-bold shadow-sm"'
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed layout styling!');
