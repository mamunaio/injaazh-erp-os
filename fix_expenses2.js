const fs = require('fs');
let code = fs.readFileSync('app/daily-expenses/DailyExpensesClient.tsx', 'utf-8');

code = code.replace(
  `        {activeTab === 'expenses' ? (\n          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">\n          {/* ── KPI Cards ─────────────────────────────────────────────────── */}`,
  `        {activeTab === 'expenses' ? (\n          <>\n          {/* ── KPI Cards ─────────────────────────────────────────────────── */}`
);

code = code.replace(
  `          </motion.div>\n        ) : (\n          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>`,
  `          </>\n        ) : (\n          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>`
);

fs.writeFileSync('app/daily-expenses/DailyExpensesClient.tsx', code, 'utf-8');
console.log('Fixed wrapper');
