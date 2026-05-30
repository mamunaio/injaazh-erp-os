'use server';

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// Islamic Hadith/Quotes Database
const islamicQuotes = [
  {
    text: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    translation: "নিশ্চয়ই আল্লাহ ধৈর্যশীলদের সাথে আছেন।",
    reference: "সূরা আল-বাকারা, ২:১৫৩",
    category: "patience"
  },
  {
    text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا",
    translation: "যে আল্লাহকে ভয় করে, তিনি তার জন্য পথ বের করে দেন।",
    reference: "সূরা আত-তালাক, ৬৫:২",
    category: "taqwa"
  },
  {
    text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    translation: "নিশ্চয়ই কষ্টের সাথে সুখ আছে।",
    reference: "সূরা আশ-শারহ, ৯৪:৬",
    category: "hope"
  },
  {
    text: "الدُّنْيَا سِجْنُ الْمُؤْمِنِ وَجَنَّةُ الْكَافِرِ",
    translation: "দুনিয়া মুমিনের জন্য কারাগার এবং কাফিরের জন্য জান্নাত।",
    reference: "সহীহ মুসলিম",
    category: "worldview"
  },
  {
    text: "مَنْ عَمِلَ صَالِحًا فَلِنَفْسِهِ",
    translation: "যে সৎকর্ম করে, সে নিজের জন্যই করে।",
    reference: "সূরা ফুসসিলাত, ৪১:৪৬",
    category: "deeds"
  },
  {
    text: "خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ",
    translation: "সর্বোত্তম মানুষ সে, যে মানুষের জন্য সবচেয়ে উপকারী।",
    reference: "হাদিস - মুসনাদ আহমাদ",
    category: "service"
  },
  {
    text: "اطْلُبُوا الْعِلْمَ مِنَ الْمَهْدِ إِلَى اللَّحْدِ",
    translation: "দোলনা থেকে কবর পর্যন্ত জ্ঞান অর্জন করো।",
    reference: "হাদিস",
    category: "knowledge"
  },
  {
    text: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ",
    translation: "নিশ্চয়ই কাজ নিয়তের উপর নির্ভরশীল।",
    reference: "সহীহ বুখারী",
    category: "intention"
  },
  {
    text: "تَفَكَّرُوا فِي آلَاءِ اللَّهِ وَلَا تَفَكَّرُوا فِي اللَّهِ",
    translation: "আল্লাহর সৃষ্টি নিয়ে চিন্তা করো, আল্লাহর সত্তা নিয়ে নয়।",
    reference: "হাদিস",
    category: "reflection"
  },
  {
    text: "الْمُؤْمِنُ الْقَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ مِنَ الْمُؤْمِنِ الضَّعِيفِ",
    translation: "শক্তিশালী মুমিন দুর্বল মুমিনের চেয়ে উত্তম এবং আল্লাহর কাছে অধিক প্রিয়।",
    reference: "সহীহ মুসলিম",
    category: "strength"
  },
  {
    text: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
    translation: "তোমাদের কেউ ততক্ষণ পর্যন্ত মুমিন হতে পারবে না, যতক্ষণ না সে তার ভাইয়ের জন্য তা পছন্দ করে যা সে নিজের জন্য পছন্দ করে।",
    reference: "সহীহ বুখারী",
    category: "brotherhood"
  },
  {
    text: "الصَّبْرُ ضِيَاءٌ",
    translation: "ধৈর্য হলো আলো।",
    reference: "সহীহ মুসলিম",
    category: "patience"
  }
];

/**
 * Get daily Islamic quote/hadith
 */
export async function getDailyIslamicQuote() {
  try {
    // Get quote based on day of year (so it changes daily but is consistent throughout the day)
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    const quoteIndex = dayOfYear % islamicQuotes.length;
    const quote = islamicQuotes[quoteIndex];
    
    return {
      success: true,
      quote
    };
  } catch (error: any) {
    console.error('❌ Error fetching Islamic quote:', error);
    return {
      success: false,
      error: error.message,
      quote: islamicQuotes[0] // Fallback to first quote
    };
  }
}

/**
 * Generate AI daily insights based on dashboard data
 */
export async function generateDailyInsights(dashboardData: any) {
  // Helper function to generate fallback insights
  const getFallbackInsights = (isRateLimited = false) => {
    const { stats } = dashboardData;
    return {
      summary: isRateLimited 
        ? "⚠️ AI insights temporarily unavailable due to daily quota limit. Using standard business summary instead."
        : "Your business operations are running smoothly today. Review your project pipeline and revenue trends for optimization opportunities.",
      highlights: [
        `Your total income is ${stats.totalIncome > 0 ? 'positive' : 'needs review'}`,
        `${stats.activeProjects} projects are currently active`,
        `${stats.pendingProposals} proposals awaiting decision`
      ],
      recommendations: [
        "Follow up on pending proposals today",
        "Reach out to new leads in your pipeline",
        "Review project deadlines and milestones"
      ],
      mood: "positive"
    };
  };

  try {
    if (!process.env.GEMINI_API_KEY) {
      // Fallback insights when API key is not configured
      return {
        success: true,
        insights: getFallbackInsights()
      };
    }

    const { stats } = dashboardData;
    
    // Build context for AI
    const context = `
Today's Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}

Business Data:
- Total Income: $${stats.totalIncome}
- Net Profit: $${stats.netProfit}
- Active Projects: ${stats.activeProjects}
- Pending Proposals: ${stats.pendingProposals}
- Total Leads: ${stats.totalLeads}
- This Month's Income: $${stats.thisMonthIncome}

You are an AI Business Advisor. Analyze the above data and provide a brief daily insight for today.

Respond in the following JSON format:
{
  "summary": "A brief summary (2-3 sentences, in English)",
  "highlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "mood": "positive/neutral/attention" (based on business status)
}

Important:
- Write in English
- Keep it concise and actionable
- Use professional tone
- Return only JSON, nothing else
    `.trim();

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: context,
        config: {
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      });

      const insights = JSON.parse(response.text || '{}');

      return {
        success: true,
        insights
      };
    } catch (apiError: any) {
      // If Gemini API fails (quota, network, etc.), use fallback
      console.warn('⚠️ Gemini API failed, using fallback insights:', apiError.message);
      return {
        success: true,
        insights: getFallbackInsights()
      };
    }
  } catch (error: any) {
    console.error('❌ Error generating daily insights:', error);
    
    // Check if it's a rate limit error
    const isRateLimited = 
      error.message?.includes('429') ||
      error.message?.includes('quota') ||
      error.message?.includes('RESOURCE_EXHAUSTED') ||
      error.status === 429 ||
      error.code === 429;
    
    if (isRateLimited) {
      console.warn('⚠️ Gemini API rate limit reached. Using fallback insights.');
    }
    
    // Return fallback insights (always successful to prevent page crash)
    return {
      success: true, // Changed to true so page doesn't crash
      isRateLimited,
      error: error.message,
      insights: getFallbackInsights(isRateLimited)
    };
  }
}
