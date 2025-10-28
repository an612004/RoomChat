import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: Date;
  images?: string[];
  videos?: string[];
  imagePublicIds?: string[];
  videoPublicIds?: string[];
  replies?: Array<{
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    emoji?: string;
    images?: string[];
    videos?: string[];
    createdAt?: Date;
  }>;
  reactions?: { heart?: string[] };
}

const CommentSchema: Schema = new Schema({
  postId: { type: String, required: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  authorAvatar: { type: String },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  images: { type: [String], default: [] },
  videos: { type: [String], default: [] },
  imagePublicIds: { type: [String], default: [] },
  videoPublicIds: { type: [String], default: [] },
  replies: [
    {
      authorId: String,
      authorName: String,
      authorAvatar: String,
      content: String,
      emoji: String,
      images: { type: [String], default: [] },
      videos: { type: [String], default: [] },
      imagePublicIds: { type: [String], default: [] },
      videoPublicIds: { type: [String], default: [] },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  reactions: { type: Object, default: {} }
});

export default mongoose.model<IComment>('Comment', CommentSchema);
