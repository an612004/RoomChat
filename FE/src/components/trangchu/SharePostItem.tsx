import React from "react";
import { Heart, Share2 } from "lucide-react";
import CommentSection from "./CommentSection";
import { Post } from "./types";

interface SharePostItemProps {
  post: Post;
  user: any;
  setActivePost: (post: Post) => void;
  setShowCommentModal: (v: boolean) => void;
  setSharePost: (post: Post) => void;
  setShowShareModal: (v: boolean) => void;
  setShareContent: (v: string) => void;
  setSharePrivacy: (v: string) => void;
  handleLike: (post: Post) => void;
  formatTime: (date: string | number | Date, justNowFlag?: boolean) => string;
}

const SharePostItem: React.FC<SharePostItemProps> = ({ post, user, setActivePost, setShowCommentModal, setSharePost, setShowShareModal, setShareContent, setSharePrivacy, handleLike, formatTime }) => {
  return (
    <div
      key={post._id}
      className="post-item share-post"
      style={{
        background: "#f7f8fa",
        border: "2px solid #2563eb22",
        borderRadius: 22,
        boxShadow: "0 4px 24px #b6b8c355",
        padding: "28px 24px 20px 24px",
        marginBottom: 28,
        width: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header người chia sẻ */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <img src={post.authorAvatar || "/default-avatar.png"} alt={post.authorName} style={{ width: 40, height: 40, borderRadius: "50%", boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#2563eb" }}>{post.authorName} <span style={{ fontWeight: 400, color: "#555", fontSize: 13 }}>đã chia sẻ một bài viết</span></div>
          <div style={{ fontSize: 12, color: "#65676b" }}>{formatTime(post.createdAt, post._justNow)}</div>
        </div>
      </div>
      {/* Nội dung chia sẻ */}
      {post.content && (
        <div style={{ margin: "10px 0 18px 0", fontSize: 16, color: "#222" }}>{post.content}</div>
      )}
      {/* Khung bài gốc */}
      <div style={{ background: "#fff", border: "1px solid #e4e6eb", borderRadius: 16, boxShadow: "0 2px 8px #2563eb11", padding: "18px 16px", marginTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <img src={post.originalPost?.authorAvatar || "/default-avatar.png"} alt={post.originalPost?.authorName || ""} style={{ width: 32, height: 32, borderRadius: "50%" }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>{post.originalPost?.authorName}</span>
          <span style={{ fontSize: 12, color: "#888" }}>{post.originalPost ? formatTime(post.originalPost.createdAt) : ""}</span>
        </div>
        <div style={{ fontSize: 15, color: "#222", marginBottom: 8 }}>{post.originalPost?.content}</div>
        {/* Ảnh/video bài gốc */}
        {post.originalPost?.images && post.originalPost.images.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            {post.originalPost.images.slice(0, 4).map((img: string, idx: number) => (
              <img key={idx} src={img.startsWith("/uploads/") ? `http://localhost:3000${img}` : img} alt={`img-${idx}`} style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 8, boxShadow: "0 1px 6px #0001" }} />
            ))}
            {post.originalPost.images.length > 4 && (
              <div style={{ width: 90, height: 90, display: "flex", alignItems: "center", justifyContent: "center", background: "#eee", borderRadius: 8, fontWeight: 700, color: "#2563eb" }}>+{post.originalPost.images.length - 4}</div>
            )}
          </div>
        )}
        {post.originalPost?.videos && post.originalPost.videos.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {post.originalPost.videos.map((vid: string, idx: number) => (
              <video key={idx} src={vid.startsWith("/uploads/") ? `http://localhost:3000${vid}` : vid} controls style={{ width: 120, height: 80, borderRadius: 8, background: "#000" }} />
            ))}
          </div>
        )}
      </div>
      {/* Like, share, comment cho post chia sẻ */}
      <div style={{ display: "flex", gap: 24, alignItems: "center", marginBottom: 8, marginTop: 16 }}>
        <button onClick={() => handleLike(post)} style={{ color: post.likes?.includes(user?.email) ? "#e11d48" : "#888", fontWeight: 700, fontSize: 17, background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 18px", transition: "background .2s", cursor: "pointer" }}>
          <Heart size={16} strokeWidth={1} /> {post.likes?.length || 0}
        </button>
        <button onClick={() => { setSharePost(post); setShowShareModal(true); setShareContent(""); setSharePrivacy("public"); }} style={{ color: "#6366f1", fontWeight: 700, fontSize: 17, background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 18px", transition: "background .2s", cursor: "pointer" }}>
          <Share2 size={16} strokeWidth={1} /> {post.shares || 0}
        </button>
      </div>
      <CommentSection comments={post.comments || []} onShowModal={() => { setActivePost(post); setShowCommentModal(true); }} />
    </div>
  );
};

export default SharePostItem;
