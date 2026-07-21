import connectDB from '@/lib/mongodb';
import { AiKey } from '@/models/AiKey';
import { GoogleGenAI } from '@google/genai';

interface GenerateOptions {
  prompt: string;
  systemInstruction?: string;
  jsonMode?: boolean;
  useSearch?: boolean;
}

async function getAvailableAiKey(excludeKeys: string[] = []) {
  await connectDB();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // LAZY RESET: Reset sentToday for accounts that weren't reset today
  await AiKey.updateMany(
    { $or: [{ lastResetDate: { $lt: today } }, { lastResetDate: { $exists: false } }] },
    { $set: { sentToday: 0, lastResetDate: new Date() } }
  );

  // Find an active key where sentToday < dailyLimit, excluding any keys that just failed
  const keys = await AiKey.find({
    isActive: true,
    _id: { $nin: excludeKeys },
    $expr: { $lt: ['$sentToday', '$dailyLimit'] },
  });

  if (!keys || keys.length === 0) {
    return null;
  }

  // Randomly select one
  const selectedKey = keys[Math.floor(Math.random() * keys.length)];
  
  // Increment usage immediately to avoid race conditions as much as possible
  await AiKey.findByIdAndUpdate(selectedKey._id, { $inc: { sentToday: 1 } });
  
  return selectedKey;
}

export async function generateAIContent(options: GenerateOptions, excludeKeys: string[] = []): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const aiKey = await getAvailableAiKey(excludeKeys);
    
    if (!aiKey) {
      // Fallback to environment variable if database is exhausted
      if (process.env.GEMINI_API_KEY) {
        return callGemini(process.env.GEMINI_API_KEY, options);
      }
      return { success: false, error: 'No active AI Keys with remaining quota available.' };
    }

    try {
      if (aiKey.provider === 'gemini') {
        return await callGemini(aiKey.apiKey, options);
      } else if (aiKey.provider === 'openai' || aiKey.provider === 'groq' || aiKey.provider === 'deepseek' || aiKey.provider === 'openrouter') {
        return await callOpenAICompatible(aiKey, options);
      } else if (aiKey.provider === 'anthropic') {
        return await callAnthropic(aiKey.apiKey, options);
      } else {
        return { success: false, error: `Unsupported provider: ${aiKey.provider}` };
      }
    } catch (apiError: any) {
      const errorMsg = apiError.message || '';
      if (errorMsg.includes('Insufficient Balance') || errorMsg.includes('requires more credits') || errorMsg.includes('402')) {
        // Auto-deactivate out-of-balance keys
        await AiKey.findByIdAndUpdate(aiKey._id, { $set: { isActive: false } });
      } else {
        // Revert quota if API call fails for other reasons
        await AiKey.findByIdAndUpdate(aiKey._id, { $inc: { sentToday: -1 } });
      }
      
      // Auto-Rotate: Try the next available key!
      console.warn(`[AI ROTATION] Key ${aiKey.provider} failed. Retrying with another key... Error: ${errorMsg}`);
      return generateAIContent(options, [...excludeKeys, aiKey._id.toString()]);
    }

  } catch (error: any) {
    console.error('AI Generation Error:', error);
    return { success: false, error: error.message || 'AI Generation Failed' };
  }
}

async function callGemini(apiKey: string, options: GenerateOptions) {
  const ai = new GoogleGenAI({ apiKey });
  
  // Combine system instruction into prompt for basic gemini handling if needed,
  // or use the new GenAI SDK correctly.
  let fullPrompt = options.prompt;
  if (options.systemInstruction) {
    fullPrompt = options.systemInstruction + "\n\n" + options.prompt;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: fullPrompt,
    config: options.jsonMode ? { responseMimeType: 'application/json' } : undefined,
  });

  const text = response.text;
  if (!text) throw new Error('Empty response from Gemini');
  
  return { success: true, text };
}

async function callOpenAICompatible(keyDoc: any, options: GenerateOptions) {
  let endpoint = '';
  let model = '';

  if (keyDoc.provider === 'openai') {
    endpoint = 'https://api.openai.com/v1/chat/completions';
    model = keyDoc.modelId || 'gpt-4o-mini';
  } else if (keyDoc.provider === 'groq') {
    endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    model = keyDoc.modelId || 'llama-3.1-8b-instant';
  } else if (keyDoc.provider === 'deepseek') {
    endpoint = 'https://api.deepseek.com/chat/completions';
    model = keyDoc.modelId || 'deepseek-chat';
  } else if (keyDoc.provider === 'openrouter') {
    endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    model = keyDoc.modelId || 'meta-llama/llama-3.1-8b-instruct:free'; // Use a default fast/free model for openrouter
  }

  const messages = [];
  if (options.systemInstruction) {
    messages.push({ role: 'system', content: options.systemInstruction });
  }
  messages.push({ role: 'user', content: options.prompt });

  const body: any = {
    model,
    messages,
  };

  if (options.jsonMode) {
    // Some OpenRouter models (like tencent/hy3) do not support the json_object format natively.
    // So we only enforce the strict API json_object format for providers that universally support it.
    if (keyDoc.provider !== 'openrouter') {
      body.response_format = { type: 'json_object' };
    }
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${keyDoc.apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${keyDoc.provider} API Error: ${errText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`Empty response from ${keyDoc.provider}`);

  return { success: true, text };
}

async function callAnthropic(apiKey: string, options: GenerateOptions) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: options.systemInstruction || '',
      messages: [{ role: 'user', content: options.prompt }]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API Error: ${errText}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error('Empty response from Anthropic');

  return { success: true, text };
}
