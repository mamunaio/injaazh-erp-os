import mongoose from 'mongoose';

export interface ITimeLog {
  _id?: string;
  userId: mongoose.Types.ObjectId;
  project: string;
  task: string;
  date: Date;
  startTime: string; // e.g. "09:00 AM" or "09:00"
  endTime: string;   // e.g. "01:30 PM" or "17:00"
  durationSeconds: number;
  hourlyRate: number; // e.g. 25, 50, etc.
  billable: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const timeLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  project: {
    type: String,
    required: true,
  },
  task: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  durationSeconds: {
    type: Number,
    required: true,
  },
  hourlyRate: {
    type: Number,
    default: 25,
  },
  billable: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

const TimeLog = mongoose.models.TimeLog || mongoose.model('TimeLog', timeLogSchema);

export default TimeLog;
