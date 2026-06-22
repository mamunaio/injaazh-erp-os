import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IIslamicInsight extends Document {
  dayNumber: number;
  ayah: {
    arabic: string;
    translation: string;
    reference: string;
    asbabAlNuzul?: string;
  };
  hadith: {
    arabic: string;
    translation: string;
    reference: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const IslamicInsightSchema = new Schema<IIslamicInsight>(
  {
    dayNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    ayah: {
      arabic: { type: String, required: true },
      translation: { type: String, required: true },
      reference: { type: String, required: true },
      asbabAlNuzul: { type: String, default: '' },
    },
    hadith: {
      arabic: { type: String, required: true },
      translation: { type: String, required: true },
      reference: { type: String, required: true },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model overwrite error in Next.js hot-reloading
export const IslamicInsight: Model<IIslamicInsight> =
  mongoose.models.IslamicInsight || mongoose.model<IIslamicInsight>('IslamicInsight', IslamicInsightSchema);
