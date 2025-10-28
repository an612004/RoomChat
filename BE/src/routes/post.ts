
import express, { Request, Response, Router } from 'express';
import Post from '../models/Post';
import Comment from '../models/Comment';
import { deleteFiles } from '../utils/fileHelpers';
import { getPostsWithComments } from '../utils/getPostsWithComments';

const router: Router = express.Router();

// Trả lời bình luận
router.post('/comment/:id/reply', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { authorId, authorName, authorAvatar, content, emoji, images, videos, imagePublicIds, videoPublicIds } = req.body;
    if (!authorId || !authorName || !content) {
      return res.status(400).json({ success: false });
    }
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ success: false });
    const reply = { authorId, authorName, authorAvatar, content, emoji, images: images || [], videos: videos || [], imagePublicIds: imagePublicIds || [], videoPublicIds: videoPublicIds || [], createdAt: new Date() };
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
    if (!userId || reaction !== 'heart') return res.status(400).json({ success: false });
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ success: false });
    comment.reactions = comment.reactions || {};
    comment.reactions.heart = comment.reactions.heart || [];
    if (!comment.reactions.heart.includes(userId)) {
      comment.reactions.heart.push(userId);
      await comment.save();
    }
    return res.json({ success: true, count: comment.reactions.heart.length });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

// Tạo bài viết mới (có thể có ảnh và video)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { authorId, authorName, authorAvatar, content, images, videos, imagePublicIds, videoPublicIds } = req.body;
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
      imagePublicIds: imagePublicIds || [],
      videoPublicIds: videoPublicIds || [],
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
    // delete post media files (prefer public ids if available)
    try {
      const toDelete = [] as string[];
      if (Array.isArray(post.imagePublicIds) && post.imagePublicIds.length) toDelete.push(...post.imagePublicIds);
      if (Array.isArray(post.videoPublicIds) && post.videoPublicIds.length) toDelete.push(...post.videoPublicIds);
      if (toDelete.length === 0) {
        toDelete.push(...(post.images || []));
        toDelete.push(...(post.videos || []));
      }
      await deleteFiles(toDelete);
    } catch (e) { console.warn('Error deleting post files', e); }

    // delete comment media files for this post
    try {
      const comments = await Comment.find({ postId: id }).lean();
      for (const c of comments) {
        const ct = [] as string[];
        if (Array.isArray(c.imagePublicIds) && c.imagePublicIds.length) ct.push(...c.imagePublicIds);
        if (Array.isArray(c.videoPublicIds) && c.videoPublicIds.length) ct.push(...c.videoPublicIds);
        if (ct.length === 0) ct.push(...(c.images || []), ...(c.videos || []));
        await deleteFiles(ct);
        if (Array.isArray(c.replies)) {
          for (const r of c.replies) {
            const rt = [] as string[];
            if (Array.isArray((r as any).imagePublicIds) && (r as any).imagePublicIds.length) rt.push(...(r as any).imagePublicIds);
            if (Array.isArray((r as any).videoPublicIds) && (r as any).videoPublicIds.length) rt.push(...(r as any).videoPublicIds);
            if (rt.length === 0) rt.push(...(r.images || []), ...(r.videos || []));
            await deleteFiles(rt);
          }
        }
      }
    } catch (e) { console.warn('Error deleting comment files for post', e); }

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
    const { userEmail, content, images, videos, imagePublicIds, videoPublicIds } = req.body;
    if (!userEmail || !content) return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    if (post.authorId !== userEmail) return res.status(403).json({ success: false, message: 'Không có quyền sửa' });
    post.content = content;
    // replace media arrays if provided
    if (Array.isArray(images)) post.images = images;
    if (Array.isArray(videos)) post.videos = videos;
    if (Array.isArray(imagePublicIds)) post.imagePublicIds = imagePublicIds;
    if (Array.isArray(videoPublicIds)) post.videoPublicIds = videoPublicIds;
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
    const { userId, content, privacy } = req.body;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false });
    post.shares += 1;
    await post.save();
    // Tạo post chia sẻ mới
    const sharedPost = new Post({
      authorId: userId,
      authorName: req.body.authorName || "",
      authorAvatar: req.body.authorAvatar || "",
      content: content,
      images: [],
      videos: [],
      likes: [],
      shares: 0,
      createdAt: new Date(),
      originalPost: {
        _id: post._id,
        authorId: post.authorId,
        authorName: post.authorName,
        authorAvatar: post.authorAvatar,
        content: post.content,
        images: post.images,
        videos: post.videos,
        createdAt: post.createdAt,
      },
      privacy: privacy || "public"
    });
    await sharedPost.save();
    return res.json({ success: true, sharedPost });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

// Thêm comment vào bài viết
router.post('/:id/comment', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { authorId, authorName, authorAvatar, content, images, videos, imagePublicIds, videoPublicIds } = req.body;
    if (!authorId || !authorName || !content) {
      return res.status(400).json({ success: false });
    }
    const comment = new Comment({ postId: id, authorId, authorName, authorAvatar, content, images: images || [], videos: videos || [], imagePublicIds: imagePublicIds || [], videoPublicIds: videoPublicIds || [] });
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

// Chỉnh sửa comment (chỉ author được sửa)
router.put('/comment/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userEmail, content, images, videos, imagePublicIds, videoPublicIds } = req.body;
    if (!userEmail || !content) return res.status(400).json({ success: false });
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ success: false });
    if (comment.authorId !== userEmail) return res.status(403).json({ success: false });
    comment.content = content;
    // update media arrays if provided (replace existing arrays)
    if (Array.isArray(images)) comment.images = images;
    if (Array.isArray(videos)) comment.videos = videos;
    if (Array.isArray(imagePublicIds)) comment.imagePublicIds = imagePublicIds;
    if (Array.isArray(videoPublicIds)) comment.videoPublicIds = videoPublicIds;
    comment.createdAt = new Date();
    await comment.save();
    return res.json({ success: true, comment });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

// Xóa comment (chỉ author được xóa)
router.delete('/comment/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;
    if (!userEmail) return res.status(400).json({ success: false });
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ success: false });
    if (comment.authorId !== userEmail) return res.status(403).json({ success: false });
    // delete comment media files
    try {
      const ct = [] as string[];
      if (Array.isArray(comment.imagePublicIds) && comment.imagePublicIds.length) ct.push(...comment.imagePublicIds);
      if (Array.isArray(comment.videoPublicIds) && comment.videoPublicIds.length) ct.push(...comment.videoPublicIds);
      if (ct.length === 0) ct.push(...(comment.images || []), ...(comment.videos || []));
      await deleteFiles(ct);
    } catch (e) { console.warn('Failed delete comment files', e); }
    // delete media in replies
    try {
      for (const r of comment.replies || []) {
        const rt = [] as string[];
  if (Array.isArray((r as any).imagePublicIds) && (r as any).imagePublicIds.length) rt.push(...(r as any).imagePublicIds);
  if (Array.isArray((r as any).videoPublicIds) && (r as any).videoPublicIds.length) rt.push(...(r as any).videoPublicIds);
        if (rt.length === 0) rt.push(...(r.images || []), ...(r.videos || []));
        await deleteFiles(rt);
      }
    } catch (e) { console.warn('Failed delete reply files', e); }

    await Comment.findByIdAndDelete(id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

// Chỉnh sửa reply (chỉ author của reply được sửa)
router.put('/comment/:commentId/reply/:replyId', async (req: Request, res: Response) => {
  try {
    const { commentId, replyId } = req.params;
    const { userEmail, content, images, videos } = req.body;
    if (!userEmail || !content) return res.status(400).json({ success: false });
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ success: false });
    const reply = (comment.replies || []).find((r:any) => (r._id || r.id)?.toString() === replyId.toString());
    if (!reply) return res.status(404).json({ success: false });
    if (reply.authorId !== userEmail) return res.status(403).json({ success: false });
    reply.content = content;
    if (Array.isArray(images)) reply.images = images;
    if (Array.isArray(videos)) reply.videos = videos;
    reply.createdAt = new Date();
    await comment.save();
    return res.json({ success: true, reply });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

// Xóa reply (chỉ author của reply được xóa)
router.delete('/comment/:commentId/reply/:replyId', async (req: Request, res: Response) => {
  try {
    const { commentId, replyId } = req.params;
    const { userEmail } = req.body;
    if (!userEmail) return res.status(400).json({ success: false });
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ success: false });
    const replyIndex = (comment.replies || []).findIndex((r:any) => (r._id || r.id)?.toString() === replyId.toString());
    if (replyIndex === -1) return res.status(404).json({ success: false });
  const replies = comment.replies || [];
  const reply = replies[replyIndex];
  if (reply.authorId !== userEmail) return res.status(403).json({ success: false });
  // delete files referenced by this reply
  try {
    const rt = [] as string[];
  if (Array.isArray((reply as any).imagePublicIds) && (reply as any).imagePublicIds.length) rt.push(...(reply as any).imagePublicIds);
  if (Array.isArray((reply as any).videoPublicIds) && (reply as any).videoPublicIds.length) rt.push(...(reply as any).videoPublicIds);
    if (rt.length === 0) rt.push(...(reply.images || []), ...(reply.videos || []));
    await deleteFiles(rt);
  } catch (e) { console.warn('Failed delete reply files', e); }
  replies.splice(replyIndex, 1);
  comment.replies = replies;
    await comment.save();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

export default router;
