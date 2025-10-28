import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  images?: string[];
  videos?: string[];
  imagePublicIds?: string[];
  videoPublicIds?: string[];
  likes: string[]; // userId array
  shares: number;
  createdAt: Date;
  originalPost?: any;
}

const PostSchema: Schema = new Schema({
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  authorAvatar: { type: String },
  content: { type: String, required: true },
  images: [{ type: String }],
  videos: [{ type: String }],
  imagePublicIds: [{ type: String }],
  videoPublicIds: [{ type: String }],
  likes: [{ type: String }],
  shares: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  originalPost: { type: Schema.Types.Mixed, default: null }
});

export default mongoose.model<IPost>('Post', PostSchema);
