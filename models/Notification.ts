import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  type: 'payment' | 'lead' | 'system' | 'proposal';
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema(
  {
    type: { 
      type: String, 
      required: true,
      enum: ['payment', 'lead', 'system', 'proposal']
    },
    message: { 
      type: String, 
      required: true 
    },
    isRead: { 
      type: Boolean, 
      default: false 
    },
  },
  { timestamps: true }
);

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
