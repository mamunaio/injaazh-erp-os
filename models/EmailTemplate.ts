import mongoose from 'mongoose';

const EmailTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: 'FileText'
  },
  color: {
    type: String,
    default: 'indigo'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export const EmailTemplate = mongoose.models.EmailTemplate || mongoose.model('EmailTemplate', EmailTemplateSchema);
