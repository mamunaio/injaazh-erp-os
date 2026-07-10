import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/aiProvider';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: Request) {
  // Force cache invalidation for Turbopack
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
    }

    // Authenticate user
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Format prompt from chat history
    // We will pass the conversation context to generateAIContent
    const contextStr = messages.slice(0, -1).map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const lastUserMessage = messages[messages.length - 1].content;
    
    const prompt = `You are a helpful, professional AI Business Assistant for an ERP system called "Injaazh Global". 
You assist the user with business metrics, writing emails, managing leads, and general questions.
Keep your answers concise, accurate, and format them nicely in Markdown.

CONVERSATION HISTORY:
${contextStr}

LATEST USER MESSAGE:
${lastUserMessage}

Please respond to the latest user message contextually. Return ONLY the response text.`;

    const result = await generateAIContent({ prompt, jsonMode: false });

    if (!result.success || !result.text) {
      return NextResponse.json({ error: result.error || 'Failed to generate response' }, { status: 500 });
    }

    return NextResponse.json({ text: result.text });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
