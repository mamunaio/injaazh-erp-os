const fs = require('fs');
const path = require('path');

const panelPath = path.join(__dirname, 'components', 'leads', 'ui', 'LeadSlidePanel.tsx');
let content = fs.readFileSync(panelPath, 'utf-8');

// 1. Add state variable
if (!content.includes('const [isStatusMenuOpen')) {
  content = content.replace(
    /const\s+\[activeTab,\s*setActiveTab\]\s*=\s*useState<TabKey>\('overview'\);/,
    "const [activeTab, setActiveTab] = useState<TabKey>('overview');\n  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);"
  );
}

// 2. Replace dropdown
const selectRegex = /<div className="relative group\/status ml-auto">[\s\S]*?<\/select>\s*<div className="absolute right-2 top-1\/2 -translate-y-1\/2 pointer-events-none opacity-50">[\s\S]*?<\/div>\s*<\/div>/;

const customDropdownHtml = `<div className="relative group/status ml-auto">
                  <button
                    onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                    className={\`flex-shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold border \${statusStyle.bg} \${statusStyle.border} \${statusStyle.text} focus:outline-none transition-all hover:brightness-110\`}
                  >
                    {status}
                    <svg className={\`w-3 h-3 transition-transform \${isStatusMenuOpen ? 'rotate-180' : ''}\`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </button>

                  <AnimatePresence>
                    {isStatusMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-40 bg-[#11131A] border border-[#232734] rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col py-1"
                      >
                        {['New', 'Queued', 'Email Sent', 'Replied', 'Meeting Booked', 'Closed', 'Not Interested'].map((opt) => {
                          const sStyle = STATUS_STYLES[opt] || STATUS_STYLES['New'];
                          return (
                            <button
                              key={opt}
                              onClick={() => {
                                if (onStatusChange) onStatusChange(lead._id, opt);
                                setIsStatusMenuOpen(false);
                              }}
                              className={\`w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 \${sStyle.text}\`}
                            >
                              <span className={\`w-1.5 h-1.5 rounded-full flex-shrink-0 \${sStyle.dot}\`} />
                              {opt}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>`;

content = content.replace(selectRegex, customDropdownHtml);

// 3. Remove Lead Score
const scoreRegex = /\{\/\*\s*Lead Score\s*\*\/\}\s*<div className="mt-4 flex items-center gap-3">[\s\S]*?<\/div>\s*<span className="text-xs font-bold font-mono" style=\{\{ color \}\}>Score: \{score\}<\/span>\s*<\/div>/;
content = content.replace(scoreRegex, '');

fs.writeFileSync(panelPath, content, 'utf-8');
console.log('Successfully patched LeadSlidePanel.tsx');
