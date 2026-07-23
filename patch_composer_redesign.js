const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'leads', 'OutreachComposerModal.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Replace the entire "Variables & Sender Section" and "AI Generate Bar" (lines ~753 to 834)
const sectionToReplaceRegex = /\{\/\* Variables & Sender Section \*\/\}[\s\S]*?\{\/\* Composer Form \*\/\}/;

const newSectionHtml = `{/* Contact & Variables Section */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Contact Name <span className="text-indigo-400 font-normal">{"{contactName}"}</span></label>
                      <input 
                        type="text" 
                        value={contactName} 
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#09090B] border-b-2 border-transparent focus:border-indigo-500 rounded-none px-2 py-1.5 text-sm text-slate-900 dark:text-white outline-none transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Company Name <span className="text-indigo-400 font-normal">{"{companyName}"}</span></label>
                      <input 
                        type="text" 
                        value={companyName} 
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#09090B] border-b-2 border-transparent focus:border-indigo-500 rounded-none px-2 py-1.5 text-sm text-slate-900 dark:text-white outline-none transition-all font-medium"
                      />
                    </div>
                  </div>

                  {detectedVariables.length > 0 && (
                    <div className="p-3 bg-slate-50 dark:bg-[#09090B] rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border border-slate-100 dark:border-[#232734]/50">
                      <div className="flex-1 w-full grid grid-cols-2 md:flex md:flex-wrap md:items-center gap-3">
                        <div className="col-span-2 md:w-full flex items-center gap-2 mb-1">
                           <Sparkles size={12} className="text-indigo-500" />
                           <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dynamic Variables</span>
                        </div>
                        {detectedVariables.map(v => (
                          <div key={v} className="flex flex-col min-w-[120px]">
                            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1 mb-0.5">
                              {v.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                            <input 
                              type="text" 
                              value={customVars[v] || ''} 
                              onChange={(e) => {
                                setCustomVars(prev => ({...prev, [v]: e.target.value}));
                                setAiReviewNeeded(prev => prev.filter(k => k !== v));
                              }}
                              className={\`w-full bg-white dark:bg-[#11131A] border-b \${aiReviewNeeded.includes(v) ? 'border-orange-500 text-orange-500' : 'border-slate-200 dark:border-[#232734]'} px-2 py-1 text-xs outline-none focus:border-indigo-500 transition-all font-medium\`}
                            />
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleAIGenerate}
                        disabled={isGeneratingAI}
                        className="flex-shrink-0 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 mt-2 md:mt-0 shadow-sm"
                      >
                        {isGeneratingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        Auto-generate
                      </button>
                    </div>
                  )}
                </div>

                {/* Composer Form */}`;

content = content.replace(sectionToReplaceRegex, newSectionHtml);

// 2. Inject Send From Account to footer
// The footer looks like this:
// <button
//   onClick={onClose}
//   disabled={isSending || isScheduling}
//   className="hidden sm:flex px-6 py-2.5 ...

const footerButtonsRegex = /<button\s*onClick=\{onClose\}\s*disabled=\{isSending \|\| isScheduling\}\s*className="hidden sm:flex px-6 py-2\.5/;

const senderDropdownHtml = `<div className="flex items-center gap-2 mr-4">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase hidden md:inline">Send from:</span>
                  <div className="w-[180px]">
                    <CustomSelect 
                      value={selectedSenderId} 
                      onChange={setSelectedSenderId} 
                      dropdownUp={true}
                      options={[
                        { value: 'auto', label: '🚀 Auto-select best sender' },
                        ...activeAccounts.map(a => ({ value: a._id.toString(), label: \`\${a.email} (\${a.sentToday}/\${a.dailyLimit} sent)\` }))
                      ]}
                      className="bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-[#232734] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white font-medium shadow-sm"
                    />
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  disabled={isSending || isScheduling}
                  className="hidden sm:flex px-6 py-2.5`;

content = content.replace(footerButtonsRegex, senderDropdownHtml);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully redesigned Composer UI.');
