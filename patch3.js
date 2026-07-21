const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'lib', 'aiProvider.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add useSearch to GenerateOptions
content = content.replace(
  '  jsonMode?: boolean;\n}',
  '  jsonMode?: boolean;\n  useSearch?: boolean;\n}'
);

// 2. Modify callGemini to accept useSearch and pass it to tools
const oldCallGemini = `  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: fullPrompt,
    config: options.jsonMode ? { responseMimeType: 'application/json' } : undefined,
  });`;

const newCallGemini = `  const config: any = {};
  if (options.jsonMode && !options.useSearch) config.responseMimeType = 'application/json';
  if (options.useSearch) config.tools = [{ googleSearch: {} }];

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: fullPrompt,
    config: Object.keys(config).length > 0 ? config : undefined,
  });`;

content = content.replace(oldCallGemini, newCallGemini);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Patched aiProvider.ts successfully');
