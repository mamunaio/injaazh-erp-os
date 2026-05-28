'use server';

import { GoogleGenAI } from '@google/genai';
import connectToDatabase from '@/lib/mongodb';
import { Transaction } from '@/models/Transaction';
import MarketplaceProject from '@/models/MarketplaceProject';
import { Lead } from '@/models/Lead';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

export async function askAssistant(userMessage: string) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return {
        success: false,
        error: 'GEMINI_API_KEY is not configured in the environment variables.',
      };
    }

    // Connect to database to fetch context
    await connectToDatabase();

    // Fetch basic context data
    const [transactions, activeProjects, totalLeads] = await Promise.all([
      Transaction.find({}).lean(),
      MarketplaceProject.countDocuments({ status: { $in: ['Planning', 'In Progress', 'In Review'] } }),
      Lead.countDocuments({}),
    ]);

    // Calculate totals
    const totalIncome = transactions
      .filter((t: any) => t.type === 'Income')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t: any) => t.type === 'Expense')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const netProfit = totalIncome - totalExpense;

    // Build the system context
    const systemContext = `
You are the built-in AI Assistant for "Injaazh ERP", a premium, professional agency management software.
Your primary role is to assist the agency owner by answering questions based on their real-time ERP data.

CRITICAL INSTRUCTIONS FOR TONE & FORMATTING:
1. ALWAYS maintain a highly professional, polite, and agency-standard tone. 
2. Address the user with respect (e.g., "Certainly!", "Here is the data you requested", "I'd be happy to help").
3. Be concise and precise. Avoid overly long explanations unless asked.
4. Do not use markdown headers (# or ##) unless absolutely necessary. Keep responses conversational but structured.
5. You may use **bold** for emphasis and * for bullet points.

Here is the current real-time data from the ERP system:
- Total Earnings / Income: $${totalIncome.toFixed(2)}
- Total Expenses / Spending: $${totalExpense.toFixed(2)}
- Net Profit: $${netProfit.toFixed(2)}
- Active Projects (In Progress/Planning/Review): ${activeProjects}
- Total Leads in CRM: ${totalLeads}

If the user asks something not related to this data or ERP management, politely answer as best as you can but remind them you are their ERP assistant.
    `.trim();

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: systemContext,
        temperature: 0.7,
      }
    });

    return {
      success: true,
      text: response.text,
    };
  } catch (error: any) {
    console.error('❌ Error in AI Assistant:', error);
    return {
      success: false,
      error: error.message || 'An unknown error occurred while processing your request.',
    };
  }
}
