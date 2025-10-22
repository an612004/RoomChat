import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  images?: string[];
  videos?: string[];
  likes: string[]; // userId array
  shares: number;
  createdAt: Date;
}

const PostSchema: Schema = new Schema({
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  authorAvatar: { type: String },
  content: { type: String, required: true },
  images: [{ type: String }],
  videos: [{ type: String }],
  likes: [{ type: String }],
  shares: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IPost>('Post', PostSchema);
