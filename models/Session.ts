import mongoose, { Schema, Document, models } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  lastActive: Date;
  isValid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: String, required: true, unique: true },
    device: { type: String, default: 'Unknown Device' },
    browser: { type: String, default: 'Unknown Browser' },
    os: { type: String, default: 'Unknown OS' },
    ip: { type: String, default: 'Unknown IP' },
    lastActive: { type: Date, default: Date.now },
    isValid: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Session = models.Session || mongoose.model<ISession>('Session', SessionSchema);

export default Session;
