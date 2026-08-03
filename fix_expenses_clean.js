const fs = require('fs');
let code = fs.readFileSync('app/daily-expenses/DailyExpensesClient.tsx', 'utf-8');

// 1. Add props & state
code = code.replace(
  'interface ExpensesClientProps {\n  initialExpenses: Expense[];\n}',
  "interface ExpensesClientProps {\n  initialExpenses: Expense[];\n  initialLoans: any[];\n}\n\nimport BorrowLendTab from '@/components/expenses/BorrowLendTab';"
);
code = code.replace(
  'export default function DailyExpensesClient({ initialExpenses }: ExpensesClientProps) {',
  'export default function DailyExpensesClient({ initialExpenses, initialLoans }: ExpensesClientProps) {'
);
code = code.replace(
  'const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);',
  "const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);\n  const [activeTab, setActiveTab] = useState<'expenses' | 'loans'>('expenses');"
);

// 2. Fix Header text
code = code.replace(
  '<h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight font-jakarta mb-1.5">Expenses</h1>\n              <p className="text-sm font-medium text-[#94A3B8]">Track, categorize, and analyze business expenses.</p>',
  '<h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight font-jakarta mb-1.5">Finance</h1>\n              <p className="text-sm font-medium text-[#94A3B8]">Track expenses and manage your personal loans.</p>'
);

// 3. Add tabs to header & conditional Add Expense button
code = code.replace(
  '<div className="flex flex-wrap items-center gap-3 w-full md:w-auto">',
  `<div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="flex bg-slate-100 dark:bg-[#11131A] p-1 rounded-xl border border-slate-200 dark:border-[#232734] w-full sm:w-auto">
                <button 
                  onClick={() => setActiveTab('expenses')}
                  className={\`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all \${activeTab === 'expenses' ? 'bg-white dark:bg-[#232734] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'}\`}
                >
                  Daily Expenses
                </button>
                <button 
                  onClick={() => setActiveTab('loans')}
                  className={\`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all \${activeTab === 'loans' ? 'bg-white dark:bg-[#232734] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'}\`}
                >
                  Borrow & Lend
                </button>
              </div>`
);
code = code.replace(
  '<button onClick={openAddPanel} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#2563EB] hover:bg-[#2563EB]/90 text-white shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_28px_rgba(37,99,235,0.45)] transition-all border border-[#2563EB]/80">\n                <Plus size={16} strokeWidth={2.5} /> Add Expense\n              </button>',
  "{activeTab === 'expenses' && (\n                <button onClick={openAddPanel} className=\"flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#2563EB] hover:bg-[#2563EB]/90 text-white shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_28px_rgba(37,99,235,0.45)] transition-all border border-[#2563EB]/80\">\n                  <Plus size={16} strokeWidth={2.5} /> Add Expense\n                </button>\n              )}"
);

// 4. Close the header containerVariants early, and wrap the rest in a conditional block.
code = code.replace(
  '            </div>\n          </motion.div>\n\n          {/* ── KPI Cards ─────────────────────────────────────────────────── */}',
  `            </div>
          </motion.div>
        </motion.div>

        {activeTab === 'expenses' ? (
          <>
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            {/* ── KPI Cards ─────────────────────────────────────────────────── */}`
);

// 5. At the very end of the file, right before the Upload Receipt Modal, close the conditional block and add the else case.
code = code.replace(
  '        {/* ── Upload Receipt Modal ─────────────────────────────────────── */}',
  `          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <BorrowLendTab initialLoans={initialLoans} />
          </motion.div>
        )}

        {/* ── Upload Receipt Modal ─────────────────────────────────────── */}`
);

fs.writeFileSync('app/daily-expenses/DailyExpensesClient.tsx', code, 'utf-8');
console.log('Script completed');
