const fs = require('fs');
const path = require('path');

const panelPath = path.join(__dirname, 'components', 'leads', 'ui', 'LeadSlidePanel.tsx');
let panelContent = fs.readFileSync(panelPath, 'utf-8');

// 1. Add state variable
if (!panelContent.includes('const [isStatusMenuOpen')) {
  panelContent = panelContent.replace(
    "const [activeTab, setActiveTab] = useState<TabKey>('overview');",
    "const [activeTab, setActiveTab] = useState<TabKey>('overview');\n  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);"
  );
}

// 2. Replace dropdown
const selectHtml = `<select
                    value={status}
                    onChange={(e) => {
                      if (onStatusChange) {
                        onStatusChange(lead._id, e.target.value);
                      }
                    }}
                    className={\`appearance-none cursor-pointer flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border \${statusStyle.bg} \${statusStyle.border} \${statusStyle.text} focus:outline-none transition-all hover:brightness-110\`}
                  >
                    <option value="New">New</option>
                    <option value="Queued">Queued</option>
                    <option value="Email Sent">Email Sent</option>
                    <option value="Replied">Replied</option>
                    <option value="Meeting Booked">Meeting Booked</option>
                    <option value="Closed">Closed</option>
                    <option value="Not Interested">Not Interested</option>
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>`;

const customDropdownHtml = `<button
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
                  </AnimatePresence>`;

panelContent = panelContent.replace(selectHtml, customDropdownHtml);

fs.writeFileSync(panelPath, panelContent, 'utf-8');
console.log('Successfully replaced native select with custom dropdown in LeadSlidePanel.tsx');
