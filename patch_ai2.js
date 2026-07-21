const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'actions', 'aiActions.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Update the prompt to tell it to search
const oldPrompt = `STRICT RULES:
1. Provide a realistic, context-aware value for each requested variable based on the target company and the template's context.
2. If you are highly confident based on general knowledge (e.g., if the company is in a specific city, or you know a major competitor in that niche/city), provide the value.
3. If you DO NOT know the answer or are guessing blindly (especially for variables like 'competitor', 'city' if location is unknown, or 'niche'), DO NOT hallucinate. Return "[NEEDS REVIEW]" for that variable.`;

const newPrompt = `STRICT RULES:
1. You have access to Google Search. You MUST search the web for the company's location (city) if unknown, and actively search Google for the top competitor in their exact city and niche.
2. Provide a factual, accurate value for each requested variable based on your search results.
3. If you still DO NOT know the answer after searching (e.g., you cannot find their city or cannot determine a competitor), DO NOT hallucinate. Return "[NEEDS REVIEW]" for that variable.`;

content = content.replace(oldPrompt, newPrompt);

// 2. Pass useSearch to generateAIContent
const oldCall = `    const response = await generateAIContent({
      prompt,
      jsonMode: true
    });`;

const newCall = `    const response = await generateAIContent({
      prompt,
      jsonMode: true,
      useSearch: true
    });`;

content = content.replace(oldCall, newCall);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Patched aiActions.ts successfully');
