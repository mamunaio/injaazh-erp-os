import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAiKey extends Document {
  provider: 'gemini' | 'openai' | 'anthropic' | 'groq' | 'deepseek' | 'openrouter';
  apiKey: string;
  name?: string;
  modelId?: string;
  isActive: boolean;
  dailyLimit: number;
  sentToday: number;
  lastResetDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AiKeySchema = new Schema<IAiKey>({
  provider: { type: String, enum: ['gemini', 'openai', 'anthropic', 'groq', 'deepseek', 'openrouter'], required: true },
  apiKey: { type: String, required: true },
  name: { type: String },
  modelId: { type: String },
  isActive: { type: Boolean, default: true },
  dailyLimit: { type: Number, default: 50 },
  sentToday: { type: Number, default: 0 },
  lastResetDate: { type: Date, default: Date.now },
}, { timestamps: true });

// Prevent mongoose from using the old cached schema without openrouter
if (mongoose.models.AiKey) {
  delete mongoose.models.AiKey;
}

export const AiKey: Model<IAiKey> = mongoose.model<IAiKey>('AiKey', AiKeySchema);
