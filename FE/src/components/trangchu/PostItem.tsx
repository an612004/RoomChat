import React, { useState, useEffect } from "react";
import { Heart, Share2, MoreHorizontal } from "lucide-react";
import CommentSection from "./CommentSection";

import { Post } from "./types";

interface PostItemProps {
  post: Post;
  user: any;
  setActivePost: (post: Post) => void;
  setShowCommentModal: (v: boolean) => void;
  setSharePost: (post: Post) => void;
  setShowShareModal: (v: boolean) => void;
  setShareContent: (v: string) => void;
  setSharePrivacy: (v: string) => void;
  handleLike: (post: Post) => void;
  onToggleComments?: (postId: string) => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, user, setActivePost, setShowCommentModal, setSharePost, setShowShareModal, setShareContent, setSharePrivacy, handleLike, onToggleComments }) => {
  const [showMenu, setShowMenu] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowMenu(false);
    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu]);

  const PostMenuDropdown = () => (
    <div style={{ position: "relative" }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "8px",
          borderRadius: "50%",
          transition: "background-color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <MoreHorizontal size={20} color="#65676b" />
      </button>
      
      {showMenu && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: "0",
            background: "white",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            minWidth: "180px",
            zIndex: 1000,
            border: "1px solid #e4e6eb",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={async (e) => {
              e.stopPropagation();
              setShowMenu(false);
              if (onToggleComments) {
                await onToggleComments(post._id);
              }
            }}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "none",
              border: "none",
              textAlign: "left",
              cursor: "pointer",
              fontSize: "14px",
              color: "#1c1e21",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f2f3f5")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            {post.commentsDisabled ? "🔓 Bật bình luận" : "🔒 Tắt bình luận"}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div
      key={post._id}
      className="post-item"
      style={{
        background: "rgba(255,255,255,0.85)",
        border: "1px solid #e4e6eb",
        borderRadius: 20,
        boxShadow: "0 4px 24px #b6b8c355",
        padding: "28px 24px 20px 24px",
        marginBottom: 28,
        transition: "box-shadow .18s",
        width: "100%",
        position: "relative",
        cursor: "pointer",
        overflow: "hidden",
      }}
      onMouseOver={e => (e.currentTarget.style.boxShadow = "0 8px 32px #b6b8c355")}
      onMouseOut={e => (e.currentTarget.style.boxShadow = "0 4px 24px #b6b8c355")}
    >
      <div className="post-header" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img className="post-header-avatar" src={post.authorAvatar || "/default-avatar.png"} alt={post.authorName} style={{ width: 40, height: 40, borderRadius: "50%", boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1b1b1b" }}>{post.authorName}</div>
            <div style={{ fontSize: 12, color: "#65676b" }}>{post.createdAt}</div>
          </div>
        </div>
        
        {/* Menu 3 chấm cho tác giả bài viết */}
        {user?.email === post.authorId && (
          <PostMenuDropdown />
        )}
      </div>
      <div style={{ margin: "18px 0", fontSize: 18, lineHeight: 1.7, color: "#222", wordBreak: "break-word" }}>{post.content}</div>
      {/* ...hiển thị ảnh/video nếu có... */}
      <div style={{ display: "flex", gap: 24, alignItems: "center", marginBottom: 8 }}>
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

export default PostItem;
