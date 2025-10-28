"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Post_1 = __importDefault(require("../models/Post"));
const Comment_1 = __importDefault(require("../models/Comment"));
const fileHelpers_1 = require("../utils/fileHelpers");
const getPostsWithComments_1 = require("../utils/getPostsWithComments");
const router = express_1.default.Router();
// Trả lời bình luận
router.post('/comment/:id/reply', async (req, res) => {
    try {
        const { id } = req.params;
        const { authorId, authorName, authorAvatar, content, emoji, images, videos, imagePublicIds, videoPublicIds } = req.body;
        if (!authorId || !authorName || !content) {
            return res.status(400).json({ success: false });
        }
        const comment = await Comment_1.default.findById(id);
        if (!comment)
            return res.status(404).json({ success: false });
        const reply = { authorId, authorName, authorAvatar, content, emoji, images: images || [], videos: videos || [], imagePublicIds: imagePublicIds || [], videoPublicIds: videoPublicIds || [], createdAt: new Date() };
        comment.replies = comment.replies || [];
        comment.replies.push(reply);
        await comment.save();
        return res.json({ success: true, reply });
    }
    catch (err) {
        return res.status(500).json({ success: false });
    }
});
// Chọn cảm xúc cho bình luận
router.post('/comment/:id/react', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, reaction } = req.body;
        if (!userId || !reaction)
            return res.status(400).json({ success: false });
        const comment = await Comment_1.default.findById(id);
        if (!comment)
            return res.status(404).json({ success: false });
        comment.reactions = comment.reactions || {};
        comment.reactions[reaction] = (comment.reactions[reaction] || 0) + 1;
        await comment.save();
        return res.json({ success: true, reactions: comment.reactions });
    }
    catch (err) {
        return res.status(500).json({ success: false });
    }
});
// Tạo bài viết mới (có thể có ảnh và video)
router.post('/', async (req, res) => {
    try {
        const { authorId, authorName, authorAvatar, content, images, videos, imagePublicIds, videoPublicIds } = req.body;
        if (!authorId || !authorName || !content) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
        }
        const post = new Post_1.default({
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
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi khi tạo bài viết' });
    }
});
// Lấy danh sách bài viết (mới nhất trước)
router.get('/', async (req, res) => {
    try {
        const posts = await (0, getPostsWithComments_1.getPostsWithComments)();
        return res.json({ success: true, posts });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi khi lấy bài viết' });
    }
});
// Xóa bài viết (chỉ authorId được xóa)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userEmail } = req.body;
        if (!userEmail)
            return res.status(400).json({ success: false, message: 'Thiếu userEmail' });
        const post = await Post_1.default.findById(id);
        if (!post)
            return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
        if (post.authorId !== userEmail)
            return res.status(403).json({ success: false, message: 'Không có quyền xóa' });
        // delete post media files (prefer public ids if available)
        try {
            const toDelete = [];
            if (Array.isArray(post.imagePublicIds) && post.imagePublicIds.length)
                toDelete.push(...post.imagePublicIds);
            if (Array.isArray(post.videoPublicIds) && post.videoPublicIds.length)
                toDelete.push(...post.videoPublicIds);
            if (toDelete.length === 0) {
                toDelete.push(...(post.images || []));
                toDelete.push(...(post.videos || []));
            }
            await (0, fileHelpers_1.deleteFiles)(toDelete);
        }
        catch (e) {
            console.warn('Error deleting post files', e);
        }
        // delete comment media files for this post
        try {
            const comments = await Comment_1.default.find({ postId: id }).lean();
            for (const c of comments) {
                const ct = [];
                if (Array.isArray(c.imagePublicIds) && c.imagePublicIds.length)
                    ct.push(...c.imagePublicIds);
                if (Array.isArray(c.videoPublicIds) && c.videoPublicIds.length)
                    ct.push(...c.videoPublicIds);
                if (ct.length === 0)
                    ct.push(...(c.images || []), ...(c.videos || []));
                await (0, fileHelpers_1.deleteFiles)(ct);
                if (Array.isArray(c.replies)) {
                    for (const r of c.replies) {
                        const rt = [];
                        if (Array.isArray(r.imagePublicIds) && r.imagePublicIds.length)
                            rt.push(...r.imagePublicIds);
                        if (Array.isArray(r.videoPublicIds) && r.videoPublicIds.length)
                            rt.push(...r.videoPublicIds);
                        if (rt.length === 0)
                            rt.push(...(r.images || []), ...(r.videos || []));
                        await (0, fileHelpers_1.deleteFiles)(rt);
                    }
                }
            }
        }
        catch (e) {
            console.warn('Error deleting comment files for post', e);
        }
        await Post_1.default.findByIdAndDelete(id);
        await Comment_1.default.deleteMany({ postId: id });
        return res.json({ success: true });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi khi xóa bài viết' });
    }
});
// Chỉnh sửa bài viết (chỉ authorId được sửa)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userEmail, content, images, videos, imagePublicIds, videoPublicIds } = req.body;
        if (!userEmail || !content)
            return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
        const post = await Post_1.default.findById(id);
        if (!post)
            return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
        if (post.authorId !== userEmail)
            return res.status(403).json({ success: false, message: 'Không có quyền sửa' });
        post.content = content;
        // replace media arrays if provided
        if (Array.isArray(images))
            post.images = images;
        if (Array.isArray(videos))
            post.videos = videos;
        if (Array.isArray(imagePublicIds))
            post.imagePublicIds = imagePublicIds;
        if (Array.isArray(videoPublicIds))
            post.videoPublicIds = videoPublicIds;
        await post.save();
        return res.json({ success: true, post });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi khi sửa bài viết' });
    }
});
// Like/Unlike bài viết
router.post('/:id/like', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        if (!userId)
            return res.status(400).json({ success: false });
        const post = await Post_1.default.findById(id);
        if (!post)
            return res.status(404).json({ success: false });
        const liked = post.likes.includes(userId);
        if (liked) {
            post.likes = post.likes.filter((uid) => uid !== userId);
        }
        else {
            post.likes.push(userId);
        }
        await post.save();
        return res.json({ success: true, liked: !liked, likes: post.likes.length });
    }
    catch (err) {
        return res.status(500).json({ success: false });
    }
});
// Share bài viết
router.post('/:id/share', async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post_1.default.findById(id);
        if (!post)
            return res.status(404).json({ success: false });
        post.shares += 1;
        await post.save();
        return res.json({ success: true, shares: post.shares });
    }
    catch (err) {
        return res.status(500).json({ success: false });
    }
});
// Thêm comment vào bài viết
router.post('/:id/comment', async (req, res) => {
    try {
        const { id } = req.params;
        const { authorId, authorName, authorAvatar, content, images, videos, imagePublicIds, videoPublicIds } = req.body;
        if (!authorId || !authorName || !content) {
            return res.status(400).json({ success: false });
        }
        const comment = new Comment_1.default({ postId: id, authorId, authorName, authorAvatar, content, images: images || [], videos: videos || [], imagePublicIds: imagePublicIds || [], videoPublicIds: videoPublicIds || [] });
        await comment.save();
        return res.json({ success: true, comment });
    }
    catch (err) {
        return res.status(500).json({ success: false });
    }
});
// Lấy comment của bài viết
router.get('/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        const comments = await Comment_1.default.find({ postId: id }).sort({ createdAt: 1 });
        res.json({ success: true, comments });
    }
    catch (err) {
        res.status(500).json({ success: false });
    }
});
// Chỉnh sửa comment (chỉ author được sửa)
router.put('/comment/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userEmail, content, images, videos, imagePublicIds, videoPublicIds } = req.body;
        if (!userEmail || !content)
            return res.status(400).json({ success: false });
        const comment = await Comment_1.default.findById(id);
        if (!comment)
            return res.status(404).json({ success: false });
        if (comment.authorId !== userEmail)
            return res.status(403).json({ success: false });
        comment.content = content;
        // update media arrays if provided (replace existing arrays)
        if (Array.isArray(images))
            comment.images = images;
        if (Array.isArray(videos))
            comment.videos = videos;
        if (Array.isArray(imagePublicIds))
            comment.imagePublicIds = imagePublicIds;
        if (Array.isArray(videoPublicIds))
            comment.videoPublicIds = videoPublicIds;
        comment.createdAt = new Date();
        await comment.save();
        return res.json({ success: true, comment });
    }
    catch (err) {
        return res.status(500).json({ success: false });
    }
});
// Xóa comment (chỉ author được xóa)
router.delete('/comment/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userEmail } = req.body;
        if (!userEmail)
            return res.status(400).json({ success: false });
        const comment = await Comment_1.default.findById(id);
        if (!comment)
            return res.status(404).json({ success: false });
        if (comment.authorId !== userEmail)
            return res.status(403).json({ success: false });
        // delete comment media files
        try {
            const ct = [];
            if (Array.isArray(comment.imagePublicIds) && comment.imagePublicIds.length)
                ct.push(...comment.imagePublicIds);
            if (Array.isArray(comment.videoPublicIds) && comment.videoPublicIds.length)
                ct.push(...comment.videoPublicIds);
            if (ct.length === 0)
                ct.push(...(comment.images || []), ...(comment.videos || []));
            await (0, fileHelpers_1.deleteFiles)(ct);
        }
        catch (e) {
            console.warn('Failed delete comment files', e);
        }
        // delete media in replies
        try {
            for (const r of comment.replies || []) {
                const rt = [];
                if (Array.isArray(r.imagePublicIds) && r.imagePublicIds.length)
                    rt.push(...r.imagePublicIds);
                if (Array.isArray(r.videoPublicIds) && r.videoPublicIds.length)
                    rt.push(...r.videoPublicIds);
                if (rt.length === 0)
                    rt.push(...(r.images || []), ...(r.videos || []));
                await (0, fileHelpers_1.deleteFiles)(rt);
            }
        }
        catch (e) {
            console.warn('Failed delete reply files', e);
        }
        await Comment_1.default.findByIdAndDelete(id);
        return res.json({ success: true });
    }
    catch (err) {
        return res.status(500).json({ success: false });
    }
});
// Chỉnh sửa reply (chỉ author của reply được sửa)
router.put('/comment/:commentId/reply/:replyId', async (req, res) => {
    try {
        const { commentId, replyId } = req.params;
        const { userEmail, content, images, videos } = req.body;
        if (!userEmail || !content)
            return res.status(400).json({ success: false });
        const comment = await Comment_1.default.findById(commentId);
        if (!comment)
            return res.status(404).json({ success: false });
        const reply = (comment.replies || []).find((r) => (r._id || r.id)?.toString() === replyId.toString());
        if (!reply)
            return res.status(404).json({ success: false });
        if (reply.authorId !== userEmail)
            return res.status(403).json({ success: false });
        reply.content = content;
        if (Array.isArray(images))
            reply.images = images;
        if (Array.isArray(videos))
            reply.videos = videos;
        reply.createdAt = new Date();
        await comment.save();
        return res.json({ success: true, reply });
    }
    catch (err) {
        return res.status(500).json({ success: false });
    }
});
// Xóa reply (chỉ author của reply được xóa)
router.delete('/comment/:commentId/reply/:replyId', async (req, res) => {
    try {
        const { commentId, replyId } = req.params;
        const { userEmail } = req.body;
        if (!userEmail)
            return res.status(400).json({ success: false });
        const comment = await Comment_1.default.findById(commentId);
        if (!comment)
            return res.status(404).json({ success: false });
        const replyIndex = (comment.replies || []).findIndex((r) => (r._id || r.id)?.toString() === replyId.toString());
        if (replyIndex === -1)
            return res.status(404).json({ success: false });
        const replies = comment.replies || [];
        const reply = replies[replyIndex];
        if (reply.authorId !== userEmail)
            return res.status(403).json({ success: false });
        // delete files referenced by this reply
        try {
            const rt = [];
            if (Array.isArray(reply.imagePublicIds) && reply.imagePublicIds.length)
                rt.push(...reply.imagePublicIds);
            if (Array.isArray(reply.videoPublicIds) && reply.videoPublicIds.length)
                rt.push(...reply.videoPublicIds);
            if (rt.length === 0)
                rt.push(...(reply.images || []), ...(reply.videos || []));
            await (0, fileHelpers_1.deleteFiles)(rt);
        }
        catch (e) {
            console.warn('Failed delete reply files', e);
        }
        replies.splice(replyIndex, 1);
        comment.replies = replies;
        await comment.save();
        return res.json({ success: true });
    }
    catch (err) {
        return res.status(500).json({ success: false });
    }
});
exports.default = router;
