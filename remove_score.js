const fs = require('fs');
const path = require('path');

// 1. Patch LeadsTable.tsx
const tablePath = path.join(__dirname, 'components', 'leads', 'ui', 'LeadsTable.tsx');
let tableContent = fs.readFileSync(tablePath, 'utf-8');

// Remove header
tableContent = tableContent.replace('<Th col="leadScore" className="min-w-[120px]">Score</Th>', '');

// Remove table cell
const tableCellRegex = /\{\/\* Lead Score \*\/\}\s*<td className="pr-4 py-4">\s*<div className="flex items-center gap-3">\s*<div className="w-16 h-1\.5 bg-slate-50 dark:bg-\[#09090B\] rounded-full overflow-hidden border border-slate-200 dark:border-\[#232734\]">\s*<div\s*className="h-full rounded-full"\s*style=\{\{\s*width: `\$\{score\}%`,\s*backgroundColor: score >= 70 \? '#10B981' : score >= 40 \? '#F59E0B' : '#EF4444'\s*\}\}\s*\/>\s*<\/div>\s*<span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">\{score\}<\/span>\s*<\/div>\s*<\/td>/;
tableContent = tableContent.replace(tableCellRegex, '');

// Remove card view score
const cardScoreRegex = /<div className="flex items-center gap-2">\s*<div className="w-12 h-1\.5 bg-slate-50 dark:bg-\[#09090B\] rounded-full overflow-hidden">\s*<div\s*className="h-full rounded-full"\s*style=\{\{\s*width: `\$\{score\}%`,\s*backgroundColor: score >= 70 \? '#10B981' : score >= 40 \? '#F59E0B' : '#EF4444'\s*\}\}\s*\/>\s*<\/div>\s*<span className="text-\[11px\] font-bold text-slate-500 dark:text-slate-400 font-mono">\{score\}<\/span>\s*<\/div>/;
tableContent = tableContent.replace(cardScoreRegex, '');

fs.writeFileSync(tablePath, tableContent, 'utf-8');

// 2. Patch LeadSlidePanel.tsx
const panelPath = path.join(__dirname, 'components', 'leads', 'ui', 'LeadSlidePanel.tsx');
let panelContent = fs.readFileSync(panelPath, 'utf-8');

const panelScoreRegex = /\{\/\* Lead Score \*\/\}\s*<div className="mt-5 bg-slate-50 dark:bg-\[#09090B\] rounded-xl p-4 border border-slate-200 dark:border-\[#232734\]">\s*<div className="flex items-center justify-between mb-2">\s*<span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Engagement Score<\/span>\s*<span className="text-xs font-bold font-mono" style=\{\{ color \}\}>Score: \{score\}<\/span>\s*<\/div>\s*<div className="h-1\.5 w-full bg-slate-200 dark:bg-\[#232734\] rounded-full overflow-hidden">\s*<motion\.div\s*initial=\{\{ width: 0 \}\}\s*animate=\{\{ width: `\$\{score\}%` \}\}\s*transition=\{\{ duration: 1, ease: 'easeOut' \}\}\s*className="h-full rounded-full"\s*style=\{\{ backgroundColor: color \}\}\s*\/>\s*<\/div>\s*<\/div>/;

panelContent = panelContent.replace(panelScoreRegex, '');
fs.writeFileSync(panelPath, panelContent, 'utf-8');

console.log('Removed Score from LeadsTable and LeadSlidePanel');
