import mongoose from 'mongoose';

const workSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  lastActiveTime: {
    type: Date,
    required: true,
  },
  totalSeconds: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Ensure unique session per user per day (date is midnight)
workSessionSchema.index({ userId: 1, date: 1 }, { unique: true });

const WorkSession = mongoose.models.WorkSession || mongoose.model('WorkSession', workSessionSchema);

export default WorkSession;
