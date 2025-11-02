import Post from '../models/Post';
import Comment from '../models/Comment';

export const getPostsWithComments = async () => {
  const posts = await Post.find().sort({ createdAt: -1 }).lean();
  // Lấy danh sách user để map email -> id
  const users = await import('../config/firebaseConfig').then(mod => mod.db.collection('users').get());
  const userMap: Record<string, string> = {};
  users.forEach((doc: any) => {
    const data = doc.data();
    if (data.email) userMap[data.email] = doc.id;
  });
  const postIds = posts.map(p => p._id?.toString());
  const comments = await Comment.find({ postId: { $in: postIds } }).sort({ createdAt: 1 }).lean();
  const commentsByPost = comments.reduce((acc: any, c: any) => {
    const pid = c.postId?.toString();
    acc[pid] = acc[pid] || [];
    acc[pid].push(c);
    return acc;
  }, {});
  // Nếu authorId là email, thay bằng id Firestore
  return posts.map(p => {
    let authorId = p.authorId;
    if (authorId && authorId.includes('@') && userMap[authorId]) {
      authorId = userMap[authorId];
    }
    return { ...p, authorId, comments: commentsByPost[p._id?.toString()] || [] };
  });
};
