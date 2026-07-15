const fs = require('fs');

const path = 'app/prospects/LeadsClient.tsx';
let content = fs.readFileSync(path, 'utf8');

const startStr = '              {/* Progress Indicator */}';
const endStr = '              </form>';
const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr, startIndex) + endStr.length;

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find start or end string');
    process.exit(1);
}

const replacement = `              <form className="space-y-6 overflow-y-auto pr-2 flex-1 pb-8 mt-4">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800/50">
                      <Building2 size={16} strokeWidth={2.5} />
                      Basic Information
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">
                          Company Name <span className="text-red-500">*</span>
                        </label>
                        <input 
                          required 
                          type="text" 
                          value={formData.company_name}
                          onChange={e => setFormData({...formData, company_name: e.target.value})}
                          className="w-full px-4 py-3 neu-pressed rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all font-medium"
                          placeholder="e.g. Acme Corp"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Contact Person</label>
                        <input 
                          type="text" 
                          value={formData.contact_person}
                          onChange={e => setFormData({...formData, contact_person: e.target.value})}
                          className="w-full px-4 py-3 neu-pressed rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all font-medium"
                          placeholder="John Doe"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Email</label>
                        <input 
                          type="email" 
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          className="w-full px-4 py-3 neu-pressed rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all font-medium"
                          placeholder="john@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Source</label>
                        <input 
                          type="text" 
                          value={formData.source}
                          onChange={e => setFormData({...formData, source: e.target.value})}
                          className="w-full px-4 py-3 bg-white dark:bg-black/40 border-2 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                          placeholder="e.g. LinkedIn"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Phone</label>
                        <input 
                          type="tel" 
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                          className="w-full px-4 py-3 bg-white dark:bg-black/40 border-2 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                          placeholder="+1234567890"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Website URL</label>
                        <input 
                          type="url" 
                          value={formData.website_url}
                          onChange={e => setFormData({...formData, website_url: e.target.value})}
                          className="w-full px-4 py-3 bg-white dark:bg-black/40 border-2 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800/50">
                      <Tag size={16} strokeWidth={2.5} />
                      Target Service
                    </h3>
                    <select 
                      value={formData.targetService}
                      onChange={e => setFormData({...formData, targetService: e.target.value})}
                      className="w-full px-4 py-3 neu-pressed rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent cursor-pointer font-medium"
                    >
                      {['High-end Web Development', 'Next.js / Laravel App', 'WordPress Development', 'Custom ERP / SaaS', 'Technical SEO', 'Answer Engine Optimization (AEO)', 'Generative Engine Optimization (GEO)', 'UI/UX Design'].map(srv => (
                        <option key={srv} value={srv}>{srv}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800/50 sticky bottom-0 bg-transparent pb-2 mt-auto flex gap-4">
                  <button 
                    type="button" 
                    onClick={handleCreateLead}
                    disabled={isCreating}
                    className="w-full px-6 py-4 neu-button text-purple-500 font-black text-base rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-wide"
                  >
                    {isCreating ? (
                      <><Loader2 size={22} className="animate-spin" strokeWidth={2.5} /> Creating...</>
                    ) : (
                      <><Sparkles size={22} strokeWidth={2.5} /> Create Lead</>
                    )}
                  </button>
                </div>
              </form>`;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated LeadsClient.tsx');
