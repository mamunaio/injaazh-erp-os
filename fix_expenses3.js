const fs = require('fs');
let code = fs.readFileSync('app/daily-expenses/DailyExpensesClient.tsx', 'utf-8');

// The issue is that the first `</motion.div>` closes itemVariants, and the second `</motion.div>` on line 352 closes the missing containerVariants.
// But wait, the original file had `</motion.div>\n</motion.div>` at line 351!
// My previous script put `<>` at line 316. So I need to replace that `</motion.div>\n</motion.div>` with `</motion.div>` ONLY, because we opened `<>` instead of `<motion.div>`.
// Wait, I opened `<>`! So it should be `</motion.div>` followed by NOTHING? No, `<>` cannot be closed by `</motion.div>`.
// Let's just restore the file again, and use a robust regex.

code = code.replace(
  `              <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">{formatCurrency(avgExpense)}</p>\n            </div>\n          </motion.div>\n        </motion.div>`,
  `              <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">{formatCurrency(avgExpense)}</p>\n            </div>\n          </motion.div>`
);

// We need to also close the `<>` before Charts. But wait, we want charts to be inside the expenses tab!
// The entire rest of the file is wrapped in `<>`. So the `</>` should be at the end.
// Let's check lines 640-655 to see what is around line 649.
