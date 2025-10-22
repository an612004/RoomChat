import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: Date;
  replies?: Array<{
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    emoji?: string;
    image?: string;
    createdAt?: Date;
  }>;
  reactions?: { [emoji: string]: number };
}

const CommentSchema: Schema = new Schema({
  postId: { type: String, required: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  authorAvatar: { type: String },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  replies: [
    {
      authorId: String,
      authorName: String,
      authorAvatar: String,
      content: String,
      emoji: String,
      image: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  reactions: { type: Object, default: {} }
});

export default mongoose.model<IComment>('Comment', CommentSchema);
