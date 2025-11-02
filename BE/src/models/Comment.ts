import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  images?: string[];
  videos?: string[];
  imagePublicIds?: string[];
  videoPublicIds?: string[];
  replies?: Array<{
    _id?: any;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    emoji?: string;
    images?: string[];
    videos?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    reactions?: { heart?: string[] };
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
  updatedAt: { type: Date },
  images: { type: [String], default: [] },
  videos: { type: [String], default: [] },
  imagePublicIds: { type: [String], default: [] },
  videoPublicIds: { type: [String], default: [] },
  replies: [
    {
      _id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
      authorId: String,
      authorName: String,
      authorAvatar: String,
      content: String,
      emoji: String,
      images: { type: [String], default: [] },
      videos: { type: [String], default: [] },
      imagePublicIds: { type: [String], default: [] },
      videoPublicIds: { type: [String], default: [] },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date },
      reactions: {
        heart: { type: [String], default: [] }
      }
    }
  ],
  reactions: {
    heart: { type: [String], default: [] }
  }
});

export default mongoose.model<IComment>('Comment', CommentSchema);
