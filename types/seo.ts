export interface LighthouseScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

export interface CoreWebVitals {
  lcp: { value: number; unit: string; status: 'Passed' | 'Needs Improvement' | 'Failed' };
  cls: { value: number; unit: string; status: 'Passed' | 'Needs Improvement' | 'Failed' };
  inp: { value: number; unit: string; status: 'Passed' | 'Needs Improvement' | 'Failed' };
}

export interface AeoTrendPoint {
  date: string;
  chatgpt: number;
  perplexity: number;
}

export interface AeoMetrics {
  chatgptMentions: number;
  chatgptTrend: 'up' | 'down' | 'flat';
  chatgptTrendValue: number;
  perplexityScore: number;
  perplexityTrend: 'up' | 'down' | 'flat';
  perplexityTrendValue: number;
  historicalData: AeoTrendPoint[];
}

export interface SeoProject {
  id: string;
  clientName: string;
  url: string;
  lastAudited: string;
  lighthouse: LighthouseScores;
  vitals: CoreWebVitals;
  aeo: AeoMetrics;
}
