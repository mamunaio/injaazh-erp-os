import mongoose, { Schema, Document, models } from 'mongoose';

export interface ISeoProject extends Document {
  clientName: string;
  url: string;
  lastAudited: string;
  lighthouse: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  vitals: {
    lcp: { value: number; unit: string; status: 'Passed' | 'Needs Improvement' | 'Failed' };
    cls: { value: number; unit: string; status: 'Passed' | 'Needs Improvement' | 'Failed' };
    inp: { value: number; unit: string; status: 'Passed' | 'Needs Improvement' | 'Failed' };
  };
  aeo: {
    chatgptMentions: number;
    chatgptTrend: 'up' | 'down' | 'flat';
    chatgptTrendValue: number;
    perplexityScore: number;
    perplexityTrend: 'up' | 'down' | 'flat';
    perplexityTrendValue: number;
    historicalData: Array<{ date: string; chatgpt: number; perplexity: number }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SeoProjectSchema = new Schema<ISeoProject>(
  {
    clientName: { type: String, required: true },
    url: { type: String, required: true },
    lastAudited: { type: String, required: true },
    lighthouse: {
      performance: { type: Number, required: true, default: 90 },
      accessibility: { type: Number, required: true, default: 90 },
      bestPractices: { type: Number, required: true, default: 90 },
      seo: { type: Number, required: true, default: 90 }
    },
    vitals: {
      lcp: {
        value: { type: Number, required: true, default: 2.0 },
        unit: { type: String, required: true, default: 's' },
        status: { type: String, enum: ['Passed', 'Needs Improvement', 'Failed'], required: true, default: 'Passed' }
      },
      cls: {
        value: { type: Number, required: true, default: 0.05 },
        unit: { type: String, required: false, default: '' },
        status: { type: String, enum: ['Passed', 'Needs Improvement', 'Failed'], required: true, default: 'Passed' }
      },
      inp: {
        value: { type: Number, required: true, default: 150 },
        unit: { type: String, required: true, default: 'ms' },
        status: { type: String, enum: ['Passed', 'Needs Improvement', 'Failed'], required: true, default: 'Needs Improvement' }
      }
    },
    aeo: {
      chatgptMentions: { type: Number, required: true, default: 100 },
      chatgptTrend: { type: String, enum: ['up', 'down', 'flat'], required: true, default: 'up' },
      chatgptTrendValue: { type: Number, required: true, default: 10 },
      perplexityScore: { type: Number, required: true, default: 80 },
      perplexityTrend: { type: String, enum: ['up', 'down', 'flat'], required: true, default: 'up' },
      perplexityTrendValue: { type: Number, required: true, default: 5 },
      historicalData: [{
        date: { type: String, required: true },
        chatgpt: { type: Number, required: true },
        perplexity: { type: Number, required: true }
      }]
    }
  },
  { timestamps: true }
);

const SeoProject = models.SeoProject || mongoose.model<ISeoProject>('SeoProject', SeoProjectSchema);
export default SeoProject;
