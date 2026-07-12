const fs = require('fs');
let content = fs.readFileSync('app/dashboard/DashboardClient.tsx', 'utf8');

content = content.replace(/tickFormatter=\{\(val\) => `\\\$\{val\/1000\}k`\}/g, "tickFormatter={(val) => `${val/1000}k`}");
content = content.replace(/key=\{`cell-\\\$\{index\}`\}/g, "key={`cell-${index}`}");

fs.writeFileSync('app/dashboard/DashboardClient.tsx', content);
