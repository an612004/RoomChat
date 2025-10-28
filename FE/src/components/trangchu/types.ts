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
}
