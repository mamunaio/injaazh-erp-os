'use server';

import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateAIEmailDraft(leadData: any) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured in the environment.');
    }

    const { company_name, contact_person, targetService, website_url, lead_context } = leadData;
    const name = contact_person && contact_person !== company_name ? contact_person : 'there';
    
    // We construct a specific prompt forcing anti-AI, human-like behavior
    const prompt = `
You are a top 1% B2B Sales SDR. You need to write a highly personalized, casual, and human-sounding cold email icebreaker and pitch.
    
Target Company: ${company_name}
Contact Person: ${name}
Their Website: ${website_url || 'Unknown'}
Service we are pitching: ${targetService || 'Custom Software Solutions'}
CRITICAL LEAD CONTEXT: ${lead_context || 'None provided'}

STRICT RULES:
1. Write in a casual, concise, and highly human tone. Like you are sending a quick message to a colleague.
2. DO NOT use typical AI jargon like: Synergy, Elevate, Innovative, Delve, Transformative, Landscape, Paradigm, Unleash, Foster.
3. DO NOT use generic AI intro phrases like "In today's fast-paced digital world", "I hope this email finds you well", "I wanted to reach out", or "I was impressed by". Start directly with something relevant.
3. If "CRITICAL LEAD CONTEXT" is provided above, you MUST base the email heavily on those notes. Address their specific pain points mentioned.
4. Briefly mention how Injaazh Global can help them with the "Service to Pitch".
5. Keep it conversational, short, and to the point.
6. Write a catchy, personalized, and casual Subject Line as well.
7. Return ONLY a valid JSON object matching this schema:
{
  "subject": "The generated subject line",
  "body": "The generated email body text (without the subject line)"
}
8. Sign off the body as:
   Best,
   Injaazh Global`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini returned empty response');
    }
    const data = JSON.parse(text);

    return {
      success: true,
      data: data
    };

  } catch (error: any) {
    console.error('Error generating AI email:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate AI email'
    };
  }
}

export async function enrichLeadData(companyName: string, websiteUrl: string) {
  try {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing');
    
    const prompt = `You are an expert Data Enrichment AI. Based on your training data, fill in the missing details for the company "${companyName}" (Website: ${websiteUrl || 'unknown'}).
    Provide reasonable and accurate guesses for the following fields if you know them. If completely unknown, return empty strings. Do not invent fake names for people.
    Return ONLY a valid JSON object matching this exact schema:
    {
      "contact_person": "Name of CEO/Founder or HR (if known, else empty)",
      "facebook_url": "facebook link (if known, else empty)",
      "linkedin_url": "linkedin company link (if known, else empty)",
      "instagram_url": "instagram link (if known, else empty)"
    }`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
    });
    
    const text = response.text;
    if (!text) {
      throw new Error('Gemini returned empty response');
    }
    const data = JSON.parse(text);
    return { success: true, data };
  } catch(error: any) {
    console.error('Enrichment error:', error);
    return { success: false, error: error.message };
  }
}

export async function generateQuickAction(actionType: string, leadData: any) {
  try {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing');
    
    let prompt = '';
    if (actionType === 'linkedin') {
      prompt = `Write a short, engaging LinkedIn connection request note (max 300 characters) for ${leadData.contact_person || leadData.company_name} at ${leadData.company_name}. Keep it casual, professional, and no AI jargon.`;
    } else if (actionType === 'summarize') {
      prompt = `Summarize the following interaction history with ${leadData.company_name} into 2-3 brief bullet points. Focus on key decisions or statuses:\n\n${JSON.stringify(leadData.outreach_logs)}`;
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    const text = response.text;
    if (!text) throw new Error('Gemini returned empty response');
    
    return { success: true, data: text };
  } catch(error: any) {
    console.error('Quick action error:', error);
    return { success: false, error: error.message };
  }
}
