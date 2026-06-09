import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRoadmapLog {
  _id?: string;
  text: string;
  date: Date;
  completed: boolean;
}

export interface IRoadmapProject extends Document {
  title: string;
  category: string;
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Completed';
  logs: IRoadmapLog[];
  orderIndex: number; // to maintain sorting
  createdAt: Date;
  updatedAt: Date;
}

const RoadmapLogSchema = new Schema<IRoadmapLog>({
  text: { type: String, required: true },
  date: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false }
});

const RoadmapProjectSchema = new Schema<IRoadmapProject>({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, index: true },
  status: { 
    type: String, 
    enum: ['Planning', 'In Progress', 'On Hold', 'Completed'],
    default: 'Planning',
    index: true
  },
  logs: [RoadmapLogSchema],
  orderIndex: { type: Number, default: 0 }
}, { timestamps: true });

export const RoadmapProject: Model<IRoadmapProject> = mongoose.models.RoadmapProject || mongoose.model<IRoadmapProject>('RoadmapProject', RoadmapProjectSchema);
