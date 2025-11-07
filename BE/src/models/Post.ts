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
  privacy?: string;
  commentsDisabled?: boolean;
  sharedPost?: {
    originalPostId: string;
    originalAuthorId: string;
    originalAuthorName: string;
    originalAuthorAvatar?: string;
    originalContent: string;
    originalImages?: string[];
    originalVideos?: string[];
    originalCreatedAt: Date;
  };
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
  privacy: { type: String, default: 'public' },
  commentsDisabled: { type: Boolean, default: false },
  sharedPost: {
    originalPostId: { type: String },
    originalAuthorId: { type: String },
    originalAuthorName: { type: String },
    originalAuthorAvatar: { type: String },
    originalContent: { type: String },
    originalImages: [{ type: String }],
    originalVideos: [{ type: String }],
    originalCreatedAt: { type: Date }
  }
});

export default mongoose.model<IPost>('Post', PostSchema);
