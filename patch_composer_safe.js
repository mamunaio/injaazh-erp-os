const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'leads', 'OutreachComposerModal.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Remove the "Send From Account" from the top variables grid
const senderBlockRegex = /<div className="space-y-1\.5 md:col-span-2">\s*<label className="text-\[10px\] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Send From Account<\/label>\s*<CustomSelect[\s\S]*?\/>\s*<\/div>/;
content = content.replace(senderBlockRegex, '');

// 2. Inject Send From into Footer safely before the Cancel/Send buttons wrapper
const footerInjectRegex = /<div className="flex items-center gap-3">/;
const footerReplacement = `<div className="flex items-center gap-2 mr-auto sm:mr-4 ml-4 sm:ml-0">
                  <div className="w-[130px] sm:w-[180px]">
                    <CustomSelect 
                      value={selectedSenderId} 
                      onChange={setSelectedSenderId} 
                      dropdownUp={true}
                      options={[
                        { value: 'auto', label: '🚀 Auto-select' },
                        ...activeAccounts.map(a => ({ value: a._id.toString(), label: \`\${a.email}\` }))
                      ]}
                      className="bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold shadow-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">`;
content = content.replace(footerInjectRegex, footerReplacement);

// 3. Make Contact & Company Name inputs look good (not black box)
content = content.replace(
  /className="w-full bg-slate-50 dark:bg-\[#09090B\] border border-slate-200 dark:border-\[#232734\] rounded-xl px-4 py-2\.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500\/50 focus:ring-2 focus:ring-indigo-500\/20 transition-all font-medium"/g,
  'className="w-full bg-white dark:bg-[#11131A] border border-slate-200 dark:border-[#232734] rounded-xl px-4 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"'
);

// Make the Dynamic Variables container clean and remove heavy bg
content = content.replace(
  /className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 bg-indigo-50\/50 dark:bg-indigo-500\/5 rounded-2xl border border-indigo-100 dark:border-indigo-500\/20"/,
  'className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3 mt-2 p-4 bg-slate-50 dark:bg-[#161923] rounded-2xl border border-slate-200 dark:border-[#232734]"'
);

// 4. Move AI Generate Button inside Dynamic Template Variables
// First remove the whole AI Generate Bar block
const aiGenerateBarRegex = /\{\/\* AI Generate Bar \*\/\}\s*<div className="flex items-center justify-between p-3 neu-flat rounded-xl border border-slate-200 dark:border-\[#232734\] bg-indigo-50 dark:bg-indigo-500\/5">[\s\S]*?<\/button>\s*<\/div>/;
content = content.replace(aiGenerateBarRegex, '');

// Now inject the compact AI Generate Button inside Dynamic Template Variables
const dynamicHeaderRegex = /<span className="text-\[9px\] font-bold text-indigo-400 bg-indigo-100 dark:bg-indigo-500\/20 px-2 py-0\.5 rounded-md">Auto-Detected<\/span>\s*<\/div>/;
const compactAiBtn = `<span className="text-[9px] font-bold text-indigo-400 bg-indigo-100 dark:bg-indigo-500/20 px-2 py-0.5 rounded-md hidden sm:block">Auto-Detected</span>
                          <button
                            onClick={handleAIGenerate}
                            disabled={isGeneratingAI}
                            className="ml-auto px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {isGeneratingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            Auto-generate
                          </button>
                        </div>`;
content = content.replace(dynamicHeaderRegex, compactAiBtn);

// Fix the Dynamic Inputs to look like normal inputs and not huge blobs
content = content.replace(
  /className=\{`w-full bg-white dark:bg-\[#11131A\] border rounded-xl px-4 py-2\.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 transition-all font-bold shadow-sm \$\{aiReviewNeeded\.includes\(v\) \? 'border-orange-400 dark:border-orange-500 bg-orange-50\/50 dark:bg-orange-500\/10 focus:border-orange-500 focus:ring-orange-500\/20' : 'border-indigo-200 dark:border-indigo-500\/30 focus:border-indigo-500 focus:ring-indigo-500\/20'\}`\}/g,
  'className={`w-full bg-white dark:bg-[#11131A] border rounded-lg px-3 py-1.5 text-[11px] text-slate-900 dark:text-white outline-none focus:ring-2 transition-all font-bold shadow-sm ${aiReviewNeeded.includes(v) ? \'border-orange-400 dark:border-orange-500 ring-2 ring-orange-500/20\' : \'border-slate-200 dark:border-[#232734] focus:border-indigo-500 focus:ring-indigo-500/20\'}`}'
);

// One last check for flex-1 overflow in footer wrapping.
const footerWrapperRegex = /<div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-\[#232734\] bg-white dark:bg-\[#11131A\] shrink-0">/;
const newFooterWrapper = `<div className="flex flex-wrap sm:flex-nowrap items-center justify-between p-4 border-t border-slate-200 dark:border-[#232734] bg-white dark:bg-[#11131A] shrink-0 gap-y-3">`;
content = content.replace(footerWrapperRegex, newFooterWrapper);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Safe patch applied!');
