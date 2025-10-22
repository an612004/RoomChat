import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  title: string;
  content: string;
  link?: string;
  userId?: string; // null: thông báo chung, có userId: thông báo cá nhân
  isRead?: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  link: { type: String },
  userId: { type: String, default: null },
  isRead: { type: Boolean, default: false },
  readBy: { type: [String], default: [] }, // list of userIds who have read this notification
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<INotification>('Notification', NotificationSchema);
