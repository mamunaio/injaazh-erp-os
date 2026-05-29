import { SeoProject } from '@/types/seo';

// Generate 30 days of data
const generateHistoricalData = (baseChatGpt: number, basePerplexity: number) => {
  const data = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // Add some random noise to create realistic looking trends
    const noise1 = Math.floor(Math.random() * 15) - 5;
    const noise2 = Math.floor(Math.random() * 10) - 3;
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      chatgpt: Math.max(0, baseChatGpt + noise1 - Math.floor(i / 2)),
      perplexity: Math.max(0, Math.min(100, basePerplexity + noise2 - Math.floor(i / 3))),
    });
  }
  return data;
};

export const mockSeoProjects: SeoProject[] = [
  {
    id: 'proj-1',
    clientName: 'TechFlow SaaS',
    url: 'https://techflow.io',
    lastAudited: new Date().toISOString(),
    lighthouse: {
      performance: 92,
      accessibility: 98,
      bestPractices: 100,
      seo: 96,
    },
    vitals: {
      lcp: { value: 1.8, unit: 's', status: 'Passed' },
      cls: { value: 0.04, unit: '', status: 'Passed' },
      inp: { value: 120, unit: 'ms', status: 'Needs Improvement' },
    },
    aeo: {
      chatgptMentions: 142,
      chatgptTrend: 'up',
      chatgptTrendValue: 18,
      perplexityScore: 84,
      perplexityTrend: 'up',
      perplexityTrendValue: 5,
      historicalData: generateHistoricalData(120, 75),
    }
  },
  {
    id: 'proj-2',
    clientName: 'Nexus Global',
    url: 'https://nexusglobal.net',
    lastAudited: new Date(Date.now() - 86400000 * 2).toISOString(),
    lighthouse: {
      performance: 64,
      accessibility: 82,
      bestPractices: 75,
      seo: 88,
    },
    vitals: {
      lcp: { value: 3.2, unit: 's', status: 'Needs Improvement' },
      cls: { value: 0.15, unit: '', status: 'Failed' },
      inp: { value: 85, unit: 'ms', status: 'Passed' },
    },
    aeo: {
      chatgptMentions: 45,
      chatgptTrend: 'down',
      chatgptTrendValue: 12,
      perplexityScore: 32,
      perplexityTrend: 'flat',
      perplexityTrendValue: 0,
      historicalData: generateHistoricalData(55, 30),
    }
  },
  {
    id: 'proj-3',
    clientName: 'Verve Agency',
    url: 'https://verve-agency.co',
    lastAudited: new Date(Date.now() - 86400000 * 5).toISOString(),
    lighthouse: {
      performance: 42,
      accessibility: 65,
      bestPractices: 50,
      seo: 72,
    },
    vitals: {
      lcp: { value: 5.1, unit: 's', status: 'Failed' },
      cls: { value: 0.22, unit: '', status: 'Failed' },
      inp: { value: 350, unit: 'ms', status: 'Failed' },
    },
    aeo: {
      chatgptMentions: 12,
      chatgptTrend: 'flat',
      chatgptTrendValue: 2,
      perplexityScore: 15,
      perplexityTrend: 'down',
      perplexityTrendValue: 8,
      historicalData: generateHistoricalData(10, 20),
    }
  }
];
