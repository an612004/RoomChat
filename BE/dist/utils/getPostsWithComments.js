"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPostsWithComments = void 0;
const Post_1 = __importDefault(require("../models/Post"));
const Comment_1 = __importDefault(require("../models/Comment"));
const getPostsWithComments = async () => {
    const posts = await Post_1.default.find().sort({ createdAt: -1 }).lean();
    const postIds = posts.map(p => p._id?.toString());
    const comments = await Comment_1.default.find({ postId: { $in: postIds } }).sort({ createdAt: 1 }).lean();
    const commentsByPost = comments.reduce((acc, c) => {
        const pid = c.postId?.toString();
        acc[pid] = acc[pid] || [];
        acc[pid].push(c);
        return acc;
    }, {});
    return posts.map(p => ({ ...p, comments: commentsByPost[p._id?.toString()] || [] }));
};
exports.getPostsWithComments = getPostsWithComments;
