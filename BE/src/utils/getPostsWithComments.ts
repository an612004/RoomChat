import Post from '../models/Post';
import Comment from '../models/Comment';

export const getPostsWithComments = async () => {
  const posts = await Post.find().sort({ createdAt: -1 }).lean();
  const postIds = posts.map(p => p._id?.toString());
  const comments = await Comment.find({ postId: { $in: postIds } }).sort({ createdAt: 1 }).lean();
  const commentsByPost = comments.reduce((acc: any, c: any) => {
    const pid = c.postId?.toString();
    acc[pid] = acc[pid] || [];
    acc[pid].push(c);
    return acc;
  }, {});
  return posts.map(p => ({ ...p, comments: commentsByPost[p._id?.toString()] || [] }));
};
