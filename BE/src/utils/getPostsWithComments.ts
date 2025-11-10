import Post from '../models/Post';
import Comment from '../models/Comment';

export const getPostsWithComments = async () => {
  const posts = await Post.find().sort({ createdAt: -1 }).lean();
  // Lấy danh sách user để map email -> id và lấy thông tin verified
  const users = await import('../config/firebaseConfig').then(mod => mod.db.collection('users').get());
  const userMap: Record<string, string> = {};
  const verifiedMap: Record<string, boolean> = {};
  users.forEach((doc: any) => {
    const data = doc.data();
    if (data.email) {
      userMap[data.email] = doc.id;
      verifiedMap[data.email] = data.isVerified || false;
    }
  });
  const postIds = posts.map(p => p._id?.toString());
  const comments = await Comment.find({ postId: { $in: postIds } }).sort({ createdAt: 1 }).lean();
  const commentsByPost = comments.reduce((acc: any, c: any) => {
    const pid = c.postId?.toString();
    acc[pid] = acc[pid] || [];
    acc[pid].push(c);
    return acc;
  }, {});
  // Nếu authorId là email, thay bằng id Firestore và thêm thông tin verified
  return posts.map(p => {
    let authorId = p.authorId;
    let authorVerified = false;
    if (authorId && authorId.includes('@') && userMap[authorId]) {
      authorVerified = verifiedMap[authorId] || false;
      authorId = userMap[authorId];
    }
    return { ...p, authorId, authorVerified, comments: commentsByPost[p._id?.toString()] || [] };
  });
};
