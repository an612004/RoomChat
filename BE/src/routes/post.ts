
import express, { Request, Response, Router } from 'express';
import Post from '../models/Post';
import Comment from '../models/Comment';
import { getPostsWithComments } from '../utils/getPostsWithComments';

const router: Router = express.Router();

// Trả lời bình luận
router.post('/comment/:id/reply', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { authorId, authorName, authorAvatar, content, emoji, image } = req.body;
    if (!authorId || !authorName || !content) {
      return res.status(400).json({ success: false });
    }
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ success: false });
    const reply = { authorId, authorName, authorAvatar, content, emoji, image, createdAt: new Date() };
    comment.replies = comment.replies || [];
    comment.replies.push(reply);
    await comment.save();
    return res.json({ success: true, reply });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

// Chọn cảm xúc cho bình luận
router.post('/comment/:id/react', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, reaction } = req.body;
    if (!userId || !reaction) return res.status(400).json({ success: false });
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ success: false });
    comment.reactions = comment.reactions || {};
    comment.reactions[reaction] = (comment.reactions[reaction] || 0) + 1;
    await comment.save();
    return res.json({ success: true, reactions: comment.reactions });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

// Tạo bài viết mới (có thể có ảnh và video)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { authorId, authorName, authorAvatar, content, images, videos } = req.body;
    if (!authorId || !authorName || !content) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
    }
    const post = new Post({
      authorId,
      authorName,
      authorAvatar,
      content,
      images: images || [],
      videos: videos || [],
      likes: [],
      shares: 0,
      createdAt: new Date()
    });
    await post.save();
    return res.json({ success: true, post });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi khi tạo bài viết' });
  }
});

// Lấy danh sách bài viết (mới nhất trước)
router.get('/', async (req: Request, res: Response) => {
  try {
    const posts = await getPostsWithComments();
    return res.json({ success: true, posts });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi khi lấy bài viết' });
  }
});

// Xóa bài viết (chỉ authorId được xóa)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;
    if (!userEmail) return res.status(400).json({ success: false, message: 'Thiếu userEmail' });
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    if (post.authorId !== userEmail) return res.status(403).json({ success: false, message: 'Không có quyền xóa' });
    await Post.findByIdAndDelete(id);
    await Comment.deleteMany({ postId: id });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi khi xóa bài viết' });
  }
});

// Chỉnh sửa bài viết (chỉ authorId được sửa)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userEmail, content } = req.body;
    if (!userEmail || !content) return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    if (post.authorId !== userEmail) return res.status(403).json({ success: false, message: 'Không có quyền sửa' });
    post.content = content;
    await post.save();
    return res.json({ success: true, post });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi khi sửa bài viết' });
  }
});

// Like/Unlike bài viết
router.post('/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
  if (!userId) return res.status(400).json({ success: false });
  const post = await Post.findById(id);
  if (!post) return res.status(404).json({ success: false });
    const liked = post.likes.includes(userId);
    if (liked) {
      post.likes = post.likes.filter((uid: string) => uid !== userId);
    } else {
      post.likes.push(userId);
    }
    await post.save();
  return res.json({ success: true, liked: !liked, likes: post.likes.length });
  } catch (err) {
  return res.status(500).json({ success: false });
  }
});

// Share bài viết
router.post('/:id/share', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
  if (!post) return res.status(404).json({ success: false });
    post.shares += 1;
    await post.save();
  return res.json({ success: true, shares: post.shares });
  } catch (err) {
  return res.status(500).json({ success: false });
  }
});

// Thêm comment vào bài viết
router.post('/:id/comment', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { authorId, authorName, authorAvatar, content } = req.body;
    if (!authorId || !authorName || !content) {
      return res.status(400).json({ success: false });
    }
    const comment = new Comment({ postId: id, authorId, authorName, authorAvatar, content });
    await comment.save();
    return res.json({ success: true, comment });
  } catch (err) {
  return res.status(500).json({ success: false });
  }
});

// Lấy comment của bài viết
router.get('/:id/comments', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const comments = await Comment.find({ postId: id }).sort({ createdAt: 1 });
    res.json({ success: true, comments });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

export default router;
