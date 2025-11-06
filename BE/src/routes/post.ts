
import express, { Request, Response, Router } from 'express';
import Post from '../models/Post';
import Comment from '../models/Comment';
import { deleteFiles } from '../utils/fileHelpers';
import { getPostsWithComments } from '../utils/getPostsWithComments';
import socketService from '../services/socketService';

const router: Router = express.Router();

// Trả lời bình luận
router.post('/comment/:id/reply', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { authorId, authorName, authorAvatar, content, stickers, emoji, images, videos, imagePublicIds, videoPublicIds } = req.body;
    if (!authorId || !authorName || !content) {
      return res.status(400).json({ success: false });
    }
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ success: false });
    const reply = { authorId, authorName, authorAvatar, content, stickers: stickers || [], emoji, images: images || [], videos: videos || [], imagePublicIds: imagePublicIds || [], videoPublicIds: videoPublicIds || [], createdAt: new Date() };
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
      
      // 🔌 Emit real-time comment reaction event
      socketService.emitToPost(comment.postId, 'comment_reaction', {
        postId: comment.postId,
        commentId: id,
        userId,
        reaction: 'heart',
        hearts: comment.reactions.heart
      });
    }
    return res.json({ success: true, hearts: comment.reactions.heart });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

// Bỏ cảm xúc cho bình luận
router.delete('/comment/:id/react', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.query; // Lấy từ query string
    if (!userId) return res.status(400).json({ success: false });
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ success: false });
    comment.reactions = comment.reactions || {};
    comment.reactions.heart = comment.reactions.heart || [];
    comment.reactions.heart = comment.reactions.heart.filter((email: string) => email !== userId);
    await comment.save();
    return res.json({ success: true, hearts: comment.reactions.heart });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});
// Cảm xúc cho reply của bình luận
router.post('/comment/:commentId/reply/:replyId/react', async (req: Request, res: Response) => {
  try {
    const { commentId, replyId } = req.params;
    const { userId, reaction } = req.body;
    if (!userId || reaction !== 'heart') return res.status(400).json({ success: false });
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ success: false });
    comment.replies = comment.replies || [];
    const reply = comment.replies.find(r => r._id?.toString() === replyId);
    if (!reply) return res.status(404).json({ success: false });
    reply.reactions = reply.reactions || {};
    reply.reactions.heart = reply.reactions.heart || [];
    if (!reply.reactions.heart.includes(userId)) {
      reply.reactions.heart.push(userId);
      await comment.save();
    }
    return res.json({ success: true, hearts: reply.reactions.heart });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

// Bỏ cảm xúc cho reply của bình luận
router.delete('/comment/:commentId/reply/:replyId/react', async (req: Request, res: Response) => {
  try {
    const { commentId, replyId } = req.params;
    const { userId } = req.query; // Lấy từ query string
    if (!userId) return res.status(400).json({ success: false });
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ success: false });
    comment.replies = comment.replies || [];
    const reply = comment.replies.find(r => r._id?.toString() === replyId);
    if (!reply) return res.status(404).json({ success: false });
    reply.reactions = reply.reactions || {};
    reply.reactions.heart = reply.reactions.heart || [];
    reply.reactions.heart = reply.reactions.heart.filter((id: string) => id !== userId);
    await comment.save();
    return res.json({ success: true, hearts: reply.reactions.heart });
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
    
    // 🔌 Emit real-time like event to all users viewing this post
    socketService.emitToPost(id, 'post_liked', {
      postId: id,
      userId,
      liked: !liked,
      totalLikes: post.likes.length
    });
    
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
    const { authorId, authorName, authorAvatar, content, stickers, images, videos, imagePublicIds, videoPublicIds } = req.body;
    console.log('📝 Creating comment with:', { authorId, authorName, content, stickers: stickers?.length, images: images?.length });
    console.log('🔍 Full stickers array:', stickers);
    if (!authorId || !authorName || (!content && (!stickers || stickers.length === 0) && (!images || images.length === 0))) {
      console.log('❌ Validation failed:', { content: !!content, stickers: stickers?.length || 0, images: images?.length || 0 });
      return res.status(400).json({ success: false, message: 'Content, stickers, or images required' });
    }
    const comment = new Comment({ postId: id, authorId, authorName, authorAvatar, content, stickers: stickers || [], images: images || [], videos: videos || [], imagePublicIds: imagePublicIds || [], videoPublicIds: videoPublicIds || [] });
    await comment.save();
    console.log('💾 Comment saved:', { _id: comment._id, content: comment.content, stickers: comment.stickers?.length });
    
    // 🔌 Emit real-time event to all users viewing this post
    socketService.emitToPost(id, 'new_comment', {
      postId: id,
      comment: comment.toObject()
    });
    
    return res.json({ success: true, comment });
  } catch (err) {
    console.error('❌ Error creating comment:', err);
    return res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
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
    comment.updatedAt = new Date();
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
    reply.updatedAt = new Date();
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

// Chia sẻ bài viết
router.post('/:id/share', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, content, privacy = 'public' } = req.body;
    if (!userId || !content) return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
    
    // Lấy bài viết gốc
    const originalPost = await Post.findById(id);
    if (!originalPost) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    
    // Lấy thông tin user từ email
    const userRes = await fetch(`${process.env.FIREBASE_AUTH_URL || 'http://localhost:3000'}/user/profile/${userId}`);
    let authorName = 'Unknown User';
    let authorAvatar = '';
    
    if (userRes.ok) {
      const userData = await userRes.json();
      if (userData.success) {
        authorName = userData.user.name || 'Unknown User';
        authorAvatar = userData.user.avatar || '';
      }
    }
    
    // Tạo shared post mới
    const sharedPost = new Post({
      authorId: userId,
      authorName,
      authorAvatar,
      content,
      sharedPost: {
        originalPostId: originalPost._id,
        originalAuthorId: originalPost.authorId,
        originalAuthorName: originalPost.authorName,
        originalAuthorAvatar: originalPost.authorAvatar,
        originalContent: originalPost.content,
        originalImages: originalPost.images || [],
        originalVideos: originalPost.videos || [],
        originalCreatedAt: originalPost.createdAt,
      },
      privacy,
      likes: [],
      shares: 0,
      createdAt: new Date()
    });
    
    await sharedPost.save();
    
    // Tăng số lượng share của bài viết gốc
    originalPost.shares = (originalPost.shares || 0) + 1;
    await originalPost.save();
    
    return res.json({ success: true, post: sharedPost });
  } catch (err) {
    console.error('Share post error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi khi chia sẻ bài viết' });
  }
});

// Debug endpoint để kiểm tra post data
router.get('/debug-post/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('🔍 Debug post ID:', id);
    
    const post = await Post.findById(id);
    if (!post) {
      return res.json({ found: false, message: 'Post not found' });
    }
    
    return res.json({
      found: true,
      postId: post._id,
      authorId: post.authorId,
      authorName: post.authorName,
      content: post.content?.substring(0, 100) + '...',
      likes: post.likes,
      likesCount: post.likes?.length || 0,
      shares: post.shares,
      createdAt: post.createdAt
    });
  } catch (err) {
    console.error('Debug error:', err);
    return res.status(500).json({ error: 'Debug failed' });
  }
});

// API lấy danh sách người đã like bài viết
router.get('/:id/likes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('🔍 GET /post/:id/likes called with postID:', id);
    
    // Tìm bài viết theo ID
    const post = await Post.findById(id);
    if (!post) {
      console.log('❌ Post not found:', id);
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }
    
    // Lấy danh sách user emails đã like
    const likedUserEmails = post.likes || [];
    console.log('📋 Post likes array:', likedUserEmails);
    
    if (likedUserEmails.length === 0) {
      console.log('ℹ️ No likes found for post:', id);
      return res.json({ success: true, users: [] });
    }
    
    // Import Firestore để lấy thông tin user thật
    const { db } = require('../config/firebaseConfig');
    
    const users = [];
    for (const email of likedUserEmails) {
      try {
        console.log(`🔍 Looking up user: ${email}`);
        
        // Thử lấy user bằng document ID (email làm ID)
        let userDoc = await db.collection('users').doc(email).get();
        let userData = null;
        
        if (userDoc.exists) {
          userData = userDoc.data();
          console.log(`✅ Found user by doc ID: ${email}`, userData);
        } else {
          // Nếu không tìm thấy bằng doc ID, thử query bằng field email
          const userSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();
          if (!userSnapshot.empty) {
            userData = userSnapshot.docs[0].data();
            console.log(`✅ Found user by email query: ${email}`, userData);
          }
        }
        
        if (userData) {
          users.push({
            id: userData.uid || userData.id || email,
            email: email,
            name: userData.displayName || userData.name || userData.fullName || email.split('@')[0],
            avatar: userData.photoURL || userData.avatar || userData.profilePicture || 'https://via.placeholder.com/40x40?text=' + (userData.name?.charAt(0) || 'U')
          });
        } else {
          console.log(`❌ User not found: ${email}`);
          // Fallback nếu không tìm thấy user trong Firestore
          users.push({
            id: email,
            email: email,
            name: email.split('@')[0],
            avatar: 'https://via.placeholder.com/40x40?text=' + email.charAt(0).toUpperCase()
          });
        }
      } catch (userError) {
        console.error(`❌ Error fetching user ${email}:`, userError);
        // Fallback cho user có lỗi
        users.push({
          id: email,
          email: email,
          name: email.split('@')[0],
          avatar: 'https://via.placeholder.com/40x40?text=' + email.charAt(0).toUpperCase()
        });
      }
    }
    
    console.log(`✅ Returning ${users.length} users for post ${id}`);
    return res.json({ success: true, users });
  } catch (err) {
    console.error('❌ Get likes error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách like' });
  }
});

// API lấy danh sách người đã share bài viết  
router.get('/:id/shares', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('🔍 GET /post/:id/shares called with postID:', id);
    
    // Tìm tất cả bài viết có sharedPost._id === id
    const sharedPosts = await Post.find({ 'sharedPost._id': id });
    console.log(`📋 Found ${sharedPosts.length} shares for post ${id}`);
    
    const { db } = require('../config/firebaseConfig');
    
    const shares = [];
    for (const post of sharedPosts) {
      try {
        console.log(`🔍 Looking up shared user: ${post.authorId}`);
        
        // Thử lấy user bằng document ID (email làm ID)  
        let userDoc = await db.collection('users').doc(post.authorId).get();
        let userData = null;
        
        if (userDoc.exists) {
          userData = userDoc.data();
          console.log(`✅ Found shared user by doc ID: ${post.authorId}`, userData);
        } else {
          // Nếu không tìm thấy bằng doc ID, thử query bằng field email
          const userSnapshot = await db.collection('users').where('email', '==', post.authorId).limit(1).get();
          if (!userSnapshot.empty) {
            userData = userSnapshot.docs[0].data();
            console.log(`✅ Found shared user by email query: ${post.authorId}`, userData);
          }
        }
        
        if (userData) {
          shares.push({
            id: userData.uid || userData.id || post.authorId,
            email: post.authorId,
            name: userData.displayName || userData.name || userData.fullName || post.authorName || post.authorId.split('@')[0],
            avatar: userData.photoURL || userData.avatar || userData.profilePicture || post.authorAvatar || 'https://via.placeholder.com/40x40?text=' + (userData.name?.charAt(0) || 'U'),
            sharedAt: post.createdAt
          });
        } else {
          console.log(`❌ Shared user not found: ${post.authorId}`);
          // Fallback với thông tin từ post
          shares.push({
            id: post.authorId,
            email: post.authorId,
            name: post.authorName || post.authorId.split('@')[0],
            avatar: post.authorAvatar || 'https://via.placeholder.com/40x40?text=' + (post.authorName?.charAt(0) || post.authorId.charAt(0).toUpperCase()),
            sharedAt: post.createdAt
          });
        }
      } catch (userError) {
        console.error(`❌ Error fetching shared user ${post.authorId}:`, userError);
        // Fallback với thông tin có sẵn
        shares.push({
          id: post.authorId,
          email: post.authorId,
          name: post.authorName || post.authorId.split('@')[0],
          avatar: post.authorAvatar || 'https://via.placeholder.com/40x40?text=' + (post.authorName?.charAt(0) || post.authorId.charAt(0).toUpperCase()),
          sharedAt: post.createdAt
        });
      }
    }
    
    console.log(`✅ Returning ${shares.length} shares for post ${id}`);
    return res.json({ success: true, shares });
  } catch (err) {
    console.error('❌ Get shares error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách chia sẻ' });
  }
});

export default router;
