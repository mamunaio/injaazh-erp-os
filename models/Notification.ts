import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  type: 'payment' | 'lead' | 'system' | 'proposal';
  message: string;
  isRead: boolean;
  link?: string;
  userId?: mongoose.Types.ObjectId | null;
  targetRoles: ('owner' | 'admin' | 'editor' | 'marketplace_team' | 'viewer')[];
  createdBy?: mongoose.Types.ObjectId | null;
  readBy: mongoose.Types.ObjectId[];
  dismissedBy: mongoose.Types.ObjectId[];
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
    link: {
      type: String,
      default: ''
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    targetRoles: {
      type: [String],
      enum: ['owner', 'admin', 'editor', 'marketplace_team', 'viewer'],
      default: [],
      index: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    readBy: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
      index: true
    },
    dismissedBy: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
      index: true
    }
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ targetRoles: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
