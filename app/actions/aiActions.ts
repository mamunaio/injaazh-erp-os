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

export async function generateOutreachEmailDraft(
  leadId: string,
  userPrompt: string,
  history: { role: 'user' | 'model'; text: string }[],
  fileAttachment?: { data: string; mimeType: string }
) {
  try {
    await connectToDatabase();
    
    // Fetch lead details for context
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return { success: false, error: 'Lead not found' };
    }
    
    const company = lead.company_name;
    const contact = lead.contact_person || 'there';
    const website = lead.website_url || 'your website';
    const service = lead.targetService || 'Web Development';
    
    const systemContext = `
You are Gemini, the custom-trained AI Cold Outreach Copywriter and Campaign Strategist cloned from Mamun's high-converting outreach formulas for "Injaazh ERP".
Your primary task is to draft and refine high-converting, personalized cold email outreach pitches and social sequences for the active lead prospect based on Mamun's proven formulas.

Target Prospect Context:
- Company Name: ${company}
- Contact Person: ${contact}
- Website URL: ${website}
- Target Service We Pitch: ${service}

MAMUN'S ELITE OUTREACH TEMPLATES & FORMULAS (Use these structures to generate your drafts):

1. Initial Cold Email (The Diagnostic Hook)
Use this structure when drafting a cold email pitch from scratch. Focus on diagnostic hooks, broken UX, load delays, or traffic crashes, keeping it natural, authentic, and highly personalized. Sign off as "Best, Mamun":
Subject: quick question about your [Recent Traffic Trend / Rankings in City]

Hey [First Name / Team],
I was checking out [Company Name] today. First off, awesome job [Insert Positive Note: e.g., holding the #1 spot for "keyword" / your recent traffic growth]!
However, I was reviewing your backend search data and noticed a critical red flag. [Insert The Hook: e.g., Your organic traffic has suddenly crashed / You are stuck on Page 2 for high-volume keywords].
I ran a technical diagnostic to see why Google is penalizing your site, and I found the bottleneck: [Insert Specific Technical Flaw: e.g., your mobile site is taking 7.5 seconds to load / your main hero video is broken showing a "Player error" / severe Cumulative Layout Shift of 0.607].
You are doing the hard work of getting potential clients to your site, but they are immediately bouncing because of this [Delay / Broken UX / Jumping Screen]. Google tracks this and uses it to actively pull back your rankings.
I specialize in fixing these exact [Insert Flaw Type: e.g., 7+ second delays / architecture crashes] to help contractors stop the traffic bleed and reclaim the top 3 spots. I mapped out a quick technical game plan showing exactly how to patch this.
Reply "yes" if you want me to send it over.
Best,
Mamun

2. Social Media DM Sequence (Short & Direct)
If the user asks for a social DM, message sequence, or short DM copy, use this split message sequence formula:
- Message 1: Hey! I was checking out [Company Name] today. Awesome job on [Positive Note: e.g., the recent traffic growth / dominating your local searches]! I was looking at your site's backend data though and noticed a pretty critical error. 👇
- Message 2: I ran a diagnostic and saw your [Insert Flaw: e.g., mobile site is taking X seconds to load / site has a severe jumping screen error]. Because of this frustrating user experience, potential clients are bouncing.
- Message 3: Google is actively [dropping your traffic / keeping you stuck on Page 2] because of these UX leaks. I mapped out a quick technical game plan to fix these delays, apply a modern visual polish, and protect your traffic. Mind if I drop it here?

3. Follow-Up 1 (The Quick Bump - Send after 2 Days)
If the user asks to write a follow-up email or "bump" a message sent a couple of days ago, use this high-converting format:
Subject: Re: quick question about your [Recent Traffic Trend / Rankings in City]
Hi [First Name],
Just floating this to the top of your inbox.
Did you have a chance to glance over the technical diagnostic I sent on [Day of Week sent, e.g., Tuesday]?
I know you guys are busy, but patching that [Insert Primary Flaw: e.g., 7.5-second mobile load delay / broken video player] is going to be critical for capturing those high-ticket homeowners before they bounce to a competitor.
Let me know if you have 10 minutes next week for a quick rundown on how we can fix this.
Best,
Mamun

4. Follow-Up 2 (The Value Reminder / Soft Break-up - Send after 5 Days)
If the user asks for a final follow-up, break-up email, or soft touch value reminder, draft it using this structure:
Subject: Re: quick question about your [Recent Traffic Trend / Rankings in City]
Hi [First Name],
Wanted to follow up one last time regarding the technical audit for [Company Name].
If you haven't had a chance to look into it, the most urgent takeaway is that your [Insert Core Issue: e.g., server timeout / 5-second layout shift] is actively causing you to bleed traffic and lose local search equity.
If we can optimize that rendering path, pushing you into the Top 3 for your main keywords is a very straightforward process.
I've attached the quick game plan PDF here again just in case. If fixing this isn't a priority right now, no worries at all—I'll stop bugging you! But if you are open to a brief 10-minute chat to discuss the implementation, let me know.
Best,
Mamun


CRITICAL RULES:
1. Keep the email highly focused, direct, and short (under 150 words).
2. The response MUST contain the email subject line first, prefixed exactly with "Subject: [Your Subject Line]" followed by a double line break, and then the email body copy. E.g.:
   Subject: quick question about your traffic
   
   Hey [First Name],
   ...
3. When the user asks for edits, revisions, or tone adjustments (e.g. "make it shorter", "write in Bengali", "make it sound friendly"), revise the draft accordingly while maintaining the "Subject:" prefix format.
4. If the user has provided an uploaded screenshot, audit report, image, or document file, READ and analyze its contents, data points, or visual design elements carefully, and reference/utilize them directly inside the email pitch to make the email hyper-personalized and relevant.
    `.trim();

    // Sandbox Simulation fallback if API Key is missing
    if (!process.env.GEMINI_API_KEY) {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Realistic UX delay
      
      const isBengali = /বাংলা|bengali|bengla/i.test(userPrompt);
      const isShorter = /short|কম|ছোট/i.test(userPrompt);
      const isFollowUp1 = /follow.*up.*1|first.*follow|follow.*2.*day|float/i.test(userPrompt);
      const isFollowUp2 = /follow.*up.*2|final.*follow|follow.*5.*day|break.*up|last.*time/i.test(userPrompt);
      const isDM = /social|dm|sequence|message/i.test(userPrompt);
      
      let mockSubject = `quick question about your recent traffic trends`;
      let mockBody = `Hey ${contact},\n\nI was checking out ${company} today. First off, awesome job holding the top rankings!\n\nHowever, I noticed a critical red flag in your backend search data. Your organic traffic is stuck on Page 2.\n\nI ran a technical diagnostic and found your mobile site is taking 7.5 seconds to load. Potentials bounce because of this delay.\n\nI mapped out a quick technical game plan to stop the traffic bleed and reclaim the top 3 spots. Reply "yes" if you want me to send it over.\n\nBest,\nMamun`;
      
      if (isDM) {
        mockSubject = `Social DM Sequence for ${company}`;
        mockBody = `Message 1:\nHey! I was checking out ${company} today. Awesome job on dominating your local searches! I was looking at your site's backend data though and noticed a pretty critical error. 👇\n\nMessage 2:\nI ran a diagnostic and saw your mobile site is taking 7.5 seconds to load. Because of this frustrating user experience, potential clients are bouncing.\n\nMessage 3:\nGoogle is actively dropping your traffic because of these UX leaks. I mapped out a quick technical game plan to fix these delays, apply a modern visual polish, and protect your traffic. Mind if I drop it here?`;
      } else if (isFollowUp1) {
        mockSubject = `Re: quick question about your rankings`;
        mockBody = `Hi ${contact},\n\nJust floating this to the top of your inbox.\n\nDid you have a chance to glance over the technical diagnostic I sent on Tuesday?\n\nI know you guys are busy, but patching that 7.5-second mobile load delay is going to be critical for capturing those high-ticket clients before they bounce.\n\nLet me know if you have 10 minutes next week for a quick rundown.\n\nBest,\nMamun`;
      } else if (isFollowUp2) {
        mockSubject = `Re: quick question about your rankings`;
        mockBody = `Hi ${contact},\n\nWanted to follow up one last time regarding the technical audit for ${company}.\n\nIf you haven't had a chance to look into it, the most urgent takeaway is that your layout shift is actively causing you to bleed traffic.\n\nIf fixing this isn't a priority right now, no worries at all—I'll stop bugging you! But if you are open to a brief 10-minute chat, let me know.\n\nBest,\nMamun`;
      } else if (isBengali) {
        mockSubject = `${company}-এর ট্রাফিক ট্রেন্ড নিয়ে একটি প্রশ্ন`;
        mockBody = `প্রিয় ${contact},\n\nআশা করি ভালো আছেন। আমি সম্প্রতি ${company}-এর ওয়েবসাইটটি দেখছিলাম এবং আপনার র‍্যাংকিং দেখে খুবই ভালো লাগলো!\n\nতবে আপনার সার্চ ডেটা অ্যানালাইসিস করতে গিয়ে আমি একটি মারাত্মক সমস্যা দেখতে পেয়েছি। আপনার মোবাইল সাইট লোড হতে ৭.৫ সেকেন্ড সময় নিচ্ছে। এই কারণে ট্রাফিক ড্রপ হচ্ছে।\n\nআমি এটি সমাধান করার জন্য একটি দ্রুত গেম প্ল্যান তৈরি করেছি। আপনি যদি দেখতে চান তবে "হ্যাঁ" লিখে রিপ্লাই করুন।\n\nশুভেচ্ছা,\nমামুন`;
      } else if (isShorter) {
        mockBody = `Hey ${contact},\n\nChecked out ${company} today. Awesome work, but your mobile load speed is taking a critical 7.5s penalty. Potential clients are bouncing before they buy.\n\nCan I send over a quick game plan to fix this bleed?\n\nBest,\nMamun`;
      }

      if (fileAttachment) {
        mockSubject = `Tailored Solution for ${company} based on your attachment`;
        mockBody = `Hi ${contact},\n\nI just analyzed the document/image file you provided regarding ${company}'s current setup.\n\nSpecifically, I noticed some performance issues that are directly holding your conversions back. We specialize in building ultra-fast React/Next.js web applications that load in under 1 second to address exactly these points.\n\nWould you be open to a quick 10-minute discussion next week to review this?\n\nBest regards,\nMamun`;
        
        return {
          success: true,
          text: `Subject: ${mockSubject}\n\n${mockBody}\n\n[SANDBOX SIMULATION: Gemini analyzed your uploaded file (${fileAttachment.mimeType}) and generated this Mamun-style custom pitch!]`
        };
      }

      return {
        success: true,
        text: `Subject: ${mockSubject}\n\n${mockBody}\n\n[SANDBOX SIMULATION: Gemini drafted this Mamun-style custom pitch for you!]`
      };
    }

    // Call Gemini API
    const historyMessages = history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));

    const userParts: any[] = [];
    if (fileAttachment) {
      userParts.push({
        inlineData: {
          data: fileAttachment.data,
          mimeType: fileAttachment.mimeType
        }
      });
    }
    userParts.push({ text: userPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        ...historyMessages,
        { role: 'user', parts: userParts }
      ],
      config: {
        systemInstruction: systemContext,
        temperature: 0.7,
      }
    });

    return {
      success: true,
      text: response.text || '',
    };
  } catch (error: any) {
    console.error('❌ Error generating outreach email draft:', error);
    return {
      success: false,
      error: error.message || 'AI generation failed.'
    };
  }
}

