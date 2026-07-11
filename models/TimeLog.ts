import mongoose from 'mongoose';

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
    type: String, // e.g. "09:00 AM"
    required: true,
  },
  endTime: {
    type: String, // e.g. "01:30 PM"
    required: true,
  },
  durationSeconds: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

const TimeLog = mongoose.models.TimeLog || mongoose.model('TimeLog', timeLogSchema);

export default TimeLog;
