export interface Post {
  _id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  images?: string[];
  videos?: string[];
  likes: string[];
  shares: number;
  createdAt: string;
  comments?: any[];
  originalPost?: Post;
  _justNow?: boolean;
  commentsDisabled?: boolean;
}

export interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
  likes: string[];
  replies?: Comment[];
  isPinned?: boolean;
}
