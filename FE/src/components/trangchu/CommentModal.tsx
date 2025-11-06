import React from "react";
const EmojiPicker = React.lazy(() => import("./EmojiPicker"));
import StickerPicker from "./StickerPicker";
import StickerDisplay from "./StickerDisplay";

import {
  Heart,
  Smile,
  Camera,
  ChevronDown,
  ChevronUp,
  Crown,
  HeartPlus,
  Sticker,
} from "lucide-react";
import { useSocket } from "../../contexts/SocketContext";

interface CommentModalProps {
  post: any;
  onClose: () => void;
  user: any;
  onPostUpdate?: (postId: string, patch: Partial<any>) => void;
}

const CommentModal: React.FC<CommentModalProps> = ({
  post,
  onClose,
  user,
  onPostUpdate,
}) => {
  const { socket, joinPost, leavePost } = useSocket();
  // State for viewing media in comments/replies
  const [viewMedia, setViewMedia] = React.useState<{
    src: string;
    type: "image" | "video";
  } | null>(null);
  const [newComment, setNewComment] = React.useState("");
  const [selectedStickers, setSelectedStickers] = React.useState<Array<{ url: string; name: string }>>([]);
  // showEmoji for comment input
  const [showEmoji, setShowEmoji] = React.useState(false);
  // showSticker for comment input
  const [showSticker, setShowSticker] = React.useState(false);
  // showEmojiReply for reply input (tracks replyKey or null)
  const [showEmojiReply, setShowEmojiReply] = React.useState<string | null>(null);
  // showStickerReply for reply input (tracks replyKey or null)
  const [showStickerReply, setShowStickerReply] = React.useState<string | null>(null);
  const [newImages, setNewImages] = React.useState<File[]>([]);
  const [previewImages, setPreviewImages] = React.useState<string[]>([]);
  const emojiPickerRef = React.useRef<HTMLDivElement | null>(null);
  const [sending, setSending] = React.useState(false);
  const [activeReplyTo, setActiveReplyTo] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState("");
  const [replyStickers, setReplyStickers] = React.useState<{ [key: string]: Array<{ url: string; name: string }> }>({});
  const [comments, setComments] = React.useState<any[]>(post.comments || []);
  const [userReacted, setUserReacted] = React.useState<{
    [key: string]: boolean;
  }>({});
  // Track recent heart actions to prevent socket updates from overriding them
  const recentHeartActions = React.useRef<{
    [key: string]: number; // timestamp
  }>({});
  const commentsRef = React.useRef<HTMLDivElement | null>(null);
  const postIdRef = React.useRef<string | null>(post?._id || null);
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);
  // Inline edit state for comments and replies
  const [editingComment, setEditingComment] = React.useState<string | null>(
    null
  );
  const [editCommentContent, setEditCommentContent] = React.useState<{
    [key: string]: string;
  }>({});
  const [editExistingImages, setEditExistingImages] = React.useState<{
    [key: string]: string[];
  }>({});
  const [editExistingVideos, setEditExistingVideos] = React.useState<{
    [key: string]: string[];
  }>({});
  const [editNewImages, setEditNewImages] = React.useState<{
    [key: string]: File[];
  }>({});
  const [editNewVideos, setEditNewVideos] = React.useState<{
    [key: string]: File[];
  }>({});
  const [editPreviewImages, setEditPreviewImages] = React.useState<{
    [key: string]: string[];
  }>({});
  const [editPreviewVideos, setEditPreviewVideos] = React.useState<{
    [key: string]: string[];
  }>({});
  // State để quản lý mở/đóng replies cho từng bình luận
  const [openReplies, setOpenReplies] = React.useState<{
    [key: string]: boolean;
  }>({});

  const submitComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    console.log('🚀 Submit comment called:', {
      user: !!user,
      newComment: newComment.trim(),
      selectedStickers: selectedStickers.length,
      newImages: newImages.length
    });
    if (!user || (!newComment.trim() && selectedStickers.length === 0 && newImages.length === 0)) return;
    setSending(true);
    setShowEmoji(false); // Đóng khung emoji khi gửi bình luận
    let uploadedImages: string[] = [];
    if (newImages.length > 0) {
      const form = new FormData();
      newImages.forEach((f) => form.append("images", f));
      const up = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: form,
      });
      const upData = await up.json();
      if (upData.success) {
        uploadedImages = upData.imageUrls || [];
      }
    }
    try {
      const requestData = {
        authorId: user.email,
        authorName: user.name,
        authorAvatar: user.avatar,
        content: newComment,
        stickers: selectedStickers,
        images: uploadedImages,
      };
      console.log('📤 Sending comment data:', requestData);
      console.log('🔍 Full selectedStickers array:', JSON.stringify(selectedStickers, null, 2));

      const res = await fetch(
        `http://localhost:3000/post/${post._id}/comment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        }
      );
      const data = await res.json();
      console.log('📨 Server response:', { status: res.status, data });
      if (data.success && data.comment) {
        // Don't add comment to state here - let Socket.IO handle it
        // This prevents duplicate comments from optimistic update + real-time
        setNewComment("");
        setSelectedStickers([]);
        setNewImages([]);
        setPreviewImages([]);
        console.log('✅ Comment sent successfully, waiting for Socket.IO update...');
      } else {
        console.error('❌ Failed to create comment:', data);
      }
    } catch (err) {
      console.error(err);
    }
    setSending(false);
  };

  const submitReply = async (commentId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || (!replyText.trim() && (!replyStickers[commentId] || replyStickers[commentId].length === 0))) return;
    setSending(true);
    try {
      // Xác định tên người được reply (comment cha hoặc reply)
      let replyToName = "";
      if (
        typeof activeReplyTo === "string" &&
        activeReplyTo.startsWith("reply-")
      ) {
        const parts = activeReplyTo.split("-");
        const replyId = parts.slice(2).join("-");
        const parentComment = comments.find(
          (c) => (c._id || c.id) === commentId
        );
        if (parentComment) {
          const reply = (parentComment.replies || []).find(
            (r: any) => r._id === replyId
          );
          replyToName = reply ? reply.authorName : parentComment.authorName;
        }
      } else {
        const parentComment = comments.find(
          (c) => (c._id || c.id) === commentId
        );
        replyToName = parentComment ? parentComment.authorName : "";
      }
      const res = await fetch(
        `http://localhost:3000/post/comment/${commentId}/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authorId: user.email,
            authorName: user.name,
            authorAvatar: user.avatar,
            content: replyText,
            stickers: replyStickers[commentId] || [],
            replyToName,
          }),
        }
      );
      const data = await res.json();
      if (data?.success && data.reply) {
        setComments((prev) => {
          const next = prev.map((c) => {
            if ((c._id || c.id) === commentId) {
              // Chỉ thêm reply nếu chưa tồn tại (theo _id)
              const exists = (c.replies || []).some(
                (r: any) => r._id === data.reply._id
              );
              if (!exists) {
                return { ...c, replies: [...(c.replies || []), data.reply] };
              } else {
                return c;
              }
            }
            return c;
          });
          try {
            onPostUpdate?.(post._id, { comments: next });
          } catch (e) { }
          return next;
        });
        setReplyText("");
        setActiveReplyTo(null);
        setReplyStickers((prev) => ({ ...prev, [commentId]: [] }));
        setTimeout(() => {
          if (commentsRef.current)
            commentsRef.current.scrollTop = commentsRef.current.scrollHeight;
        }, 50);
      }
    } catch (err) {
      console.error(err);
    }
    setSending(false);
  };

  const hasMedia =
    (post.images && post.images.length > 0) ||
    (post.videos && post.videos.length > 0);
  const [isNarrow, setIsNarrow] = React.useState<boolean>(false);
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const check = () => {
      setIsNarrow(window.innerWidth < 900);
      setIsMobile(window.innerWidth < 480);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const mediaSrc = (src: string) =>
    src && src.startsWith("/uploads/") ? `http://localhost:3000${src}` : src;
  const [activeMediaIndex, setActiveMediaIndex] = React.useState<number>(0);

  // helper: format timestamps: 'Vừa xong' for <30s, minutes/hours for <24h, date after 24h
  const formatTime = (iso: string | number | Date, justNowFlag?: boolean) => {
    try {
      const t = typeof iso === "number" ? iso : new Date(iso).getTime();
      const age = Date.now() - t;
      if (justNowFlag || age < 30_000) return "Vừa xong";
      const minutes = Math.max(1, Math.floor(age / 60000));
      if (minutes < 60) return `${minutes} phút trước`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} giờ trước`;
      return new Date(iso).toLocaleDateString("vi-VN");
    } catch (e) {
      return "";
    }
  };

  React.useEffect(() => {
    // reset active index when the post id changes
    // Only overwrite local comments when a different post is opened.
    // This avoids losing local optimistic comments or draft input when
    // the parent re-fetches posts and passes a new object reference.
    if (!post) return;
    setActiveMediaIndex(0);
    // sync only when post id changes
    if (!postIdRef.current || postIdRef.current !== post._id) {
      postIdRef.current = post._id;
      setComments(post.comments || []);
      setActiveReplyTo(null);
    }
  }, [post]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!hasMedia) return;
      if (e.key === "ArrowLeft") setActiveMediaIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight")
        setActiveMediaIndex((i) => {
          const count =
            (post.images && post.images.length) ||
            (post.videos && post.videos.length) ||
            0;
          return Math.min(count - 1, i + 1);
        });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasMedia, post]);

  // Initial comments load + Socket.IO real-time updates
  React.useEffect(() => {
    if (!post?._id) return;

    // Initial fetch of comments
    const fetchInitialComments = async () => {
      try {
        const res = await fetch(`http://localhost:3000/post/${post._id}/comments`);
        const data = await res.json();
        if (data?.success) {
          setComments(data.comments || []);
        }
      } catch (err) {
        console.error('Error fetching initial comments:', err);
      }
    };

    fetchInitialComments();

    // Join the post room for real-time updates
    if (socket) {
      joinPost(post._id);
      console.log(`🔌 Joined post ${post._id} for real-time comments`);
    }

    return () => {
      // Leave the post room when modal closes
      if (socket) {
        leavePost(post._id);
        console.log(`🔌 Left post ${post._id}`);
      }
    };
  }, [post?._id, socket, joinPost, leavePost]);

  // Socket.IO event listeners for real-time updates
  React.useEffect(() => {
    if (!socket) return;

    console.log('🔌 Setting up Socket.IO event listeners for post:', post._id);

    // Handle new comments
    const handleNewComment = (data: any) => {
      console.log('🔌 Real-time new comment received:', data);
      if (data.postId === post._id) {
        const newComment = { ...data.comment, _justNow: true };

        // Prevent duplicate comments
        setComments(prev => {
          const exists = prev.some(c => c._id === newComment._id);
          if (exists) {
            console.log('⚠️ Comment already exists, skipping duplicate:', newComment._id);
            return prev;
          }
          console.log('✅ Adding new comment via Socket.IO:', newComment._id);
          return [...prev, newComment];
        });

        // Remove "_justNow" flag after 30 seconds
        setTimeout(() => {
          setComments(cur =>
            cur.map(c =>
              c._id === newComment._id ? { ...c, _justNow: false } : c
            )
          );
        }, 30000);
      }
    };

    // Handle comment reactions
    const handleCommentReaction = (data: any) => {
      console.log('🔌 Real-time comment reaction received:', data);
      if (data.postId === post._id) {
        const now = Date.now();
        const recentAction = recentHeartActions.current[data.commentId];
        const shouldPreserveLocal = recentAction && (now - recentAction) < 15000; // 15 seconds

        if (shouldPreserveLocal) {
          console.log(`Ignoring socket reaction update for comment ${data.commentId} due to recent local action`);
          return;
        }

        setComments(prev =>
          prev.map(comment => {
            if (comment._id === data.commentId) {
              return {
                ...comment,
                reactions: {
                  ...comment.reactions,
                  heart: data.hearts || []
                }
              };
            }
            return comment;
          })
        );
      }
    };

    // Register event listeners
    socket.on('new_comment', handleNewComment);
    socket.on('comment_reaction', handleCommentReaction);

    return () => {
      // Cleanup event listeners
      console.log('🔌 Cleaning up Socket.IO event listeners for post:', post._id);
      socket.off('new_comment', handleNewComment);
      socket.off('comment_reaction', handleCommentReaction);
    };
  }, [socket, post?._id]);

  // Close dropdown menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenu && !(event.target as Element).closest('[data-dropdown-menu]')) {
        setOpenMenu(null);
      }
    };

    if (openMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openMenu]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? 0 : (isNarrow ? 8 : 20),
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: isMobile ? "100%" : (isNarrow ? "98%" : "95%"),
          maxWidth: hasMedia ? (isMobile ? "100vw" : (isNarrow ? "100vw" : 980)) : (isMobile ? "100vw" : (isNarrow ? "100vw" : 720)),
          maxHeight: isMobile ? "100vh" : (isNarrow ? "95vh" : "90vh"),
          background: "#fff",
          borderRadius: isMobile ? 0 : (isNarrow ? 8 : 12),
          overflow: "hidden",
          display: "flex",
          flexDirection: (hasMedia && (isNarrow || isMobile)) ? "column" : "row",
          boxShadow: isMobile ? "none" : "0 10px 30px rgba(0,0,0,0.2)",
        }}
      >
        {/* Left: media / post preview (render only when media exists) */}
        {hasMedia && !isNarrow && (
          <div
            style={{
              flex: 1,
              background: "#111",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 360,
              position: "relative",
            }}
          >
            {/* Left/Right arrows */}
            <button
              onClick={() => setActiveMediaIndex((i) => Math.max(0, i - 1))}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 5,
                background: "rgba(0,0,0,0.45)",
                border: "none",
                color: "#fff",
                width: 44,
                height: 44,
                borderRadius: 999,
                cursor: "pointer",
                display: activeMediaIndex > 0 ? "flex" : "none",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Previous"
            >
              &#8249;
            </button>
            <button
              onClick={() =>
                setActiveMediaIndex((i) => {
                  const count =
                    (post.images && post.images.length) ||
                    (post.videos && post.videos.length) ||
                    0;
                  return Math.min(count - 1, i + 1);
                })
              }
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 5,
                background: "rgba(0,0,0,0.45)",
                border: "none",
                color: "#fff",
                width: 44,
                height: 44,
                borderRadius: 999,
                cursor: "pointer",
                display:
                  (post.images && activeMediaIndex < post.images.length - 1) ||
                    (post.videos && activeMediaIndex < post.videos.length - 1)
                    ? "flex"
                    : "none",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Next"
            >
              &#8250;
            </button>

            {/* Media */}
            {post.images && post.images.length > 0 ? (
              <img
                src={mediaSrc(post.images[activeMediaIndex])}
                alt={`post-${activeMediaIndex}`}
                style={{
                  maxWidth: "100%",
                  maxHeight: "90vh",
                  objectFit: "contain",
                }}
              />
            ) : post.videos && post.videos.length > 0 ? (
              <video
                src={mediaSrc(post.videos[activeMediaIndex])}
                controls
                style={{ maxWidth: "100%", maxHeight: "90vh" }}
              />
            ) : null}

            {/* thumbnails */}
            {post.images && post.images.length > 1 && (
              <div
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: 8,
                }}
              >
                {post.images.map((im: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveMediaIndex(idx)}
                    style={{
                      width: 64,
                      height: 44,
                      overflow: "hidden",
                      padding: 0,
                      border:
                        activeMediaIndex === idx
                          ? "2px solid #6366f1"
                          : "2px solid transparent",
                      borderRadius: 6,
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <img
                      src={mediaSrc(im)}
                      alt={`thumb-${idx}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Right: comments list + input */}
        <div
          style={
            hasMedia && !isNarrow
              ? {
                width: 460,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: 12,
                boxSizing: "border-box",
                borderLeft: "1px solid #eee",
              }
              : {
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: 18,
                boxSizing: "border-box",
              }
          }
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              Bài viết của {post.authorName}
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: 22,
                cursor: "pointer",
                padding: 6,
              }}
            >
              ×
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <img
              src={post.authorAvatar || "/default-avatar.png"}
              alt={post.authorName}
              style={{ width: 44, height: 44, borderRadius: 999 }}
            />
            <div>
              {/* Author info */}
              <div style={{ fontWeight: 700 }}>{post.authorName}</div>
              <div style={{ fontSize: 12, color: "#666" }}>
                {formatTime(post.createdAt, post._justNow)}
              </div>
            </div>
          </div>

          <div style={{ padding: 10, background: "#f6f7fb", borderRadius: 8 }}>
            {post.content}
          </div>

          {/* If media exists and we're in narrow mode, show media above the comments area inside the same form */}
          {hasMedia && isNarrow && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#000",
                borderRadius: 8,
                padding: 8,
                gap: 8,
              }}
            >
              <div style={{ position: "relative", width: "100%" }}>
                <button
                  onClick={() => setActiveMediaIndex((i) => Math.max(0, i - 1))}
                  style={{
                    position: "absolute",
                    left: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 5,
                    background: "rgba(0,0,0,0.45)",
                    border: "none",
                    color: "#fff",
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    cursor: "pointer",
                    display: activeMediaIndex > 0 ? "flex" : "none",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-label="Previous"
                >
                  &#8249;
                </button>
                <button
                  onClick={() =>
                    setActiveMediaIndex((i) => {
                      const count =
                        (post.images && post.images.length) ||
                        (post.videos && post.videos.length) ||
                        0;
                      return Math.min(count - 1, i + 1);
                    })
                  }
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 5,
                    background: "rgba(0,0,0,0.45)",
                    border: "none",
                    color: "#fff",
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    cursor: "pointer",
                    display:
                      (post.images &&
                        activeMediaIndex < post.images.length - 1) ||
                        (post.videos && activeMediaIndex < post.videos.length - 1)
                        ? "flex"
                        : "none",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-label="Next"
                >
                  &#8250;
                </button>
                {post.images && post.images.length > 0 ? (
                  <img
                    src={mediaSrc(post.images[activeMediaIndex])}
                    alt={`post-${activeMediaIndex}`}
                    style={{
                      width: "100%",
                      maxHeight: 320,
                      objectFit: "contain",
                      borderRadius: 8,
                    }}
                  />
                ) : post.videos && post.videos.length > 0 ? (
                  <video
                    src={mediaSrc(post.videos[activeMediaIndex])}
                    controls
                    style={{ width: "100%", maxHeight: 320, borderRadius: 8 }}
                  />
                ) : null}
              </div>
              {post.images && post.images.length > 1 && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    overflowX: "auto",
                    paddingTop: 4,
                  }}
                >
                  {post.images.map((im: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveMediaIndex(idx)}
                      style={{
                        minWidth: 64,
                        height: 44,
                        overflow: "hidden",
                        padding: 0,
                        border:
                          activeMediaIndex === idx
                            ? "2px solid #6366f1"
                            : "2px solid transparent",
                        borderRadius: 6,
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <img
                        src={mediaSrc(im)}
                        alt={`thumb-${idx}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div
            ref={commentsRef}
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "visible",
              paddingRight: isNarrow ? 4 : 6,
              paddingLeft: isNarrow ? 8 : 0,
              display: "flex",
              flexDirection: "column",
              gap: isNarrow ? 8 : 10,
            }}
          >
            {(comments || []).length === 0 ? (
              <div style={{ textAlign: "center", color: "#777" }}>
                Chưa có bình luận nào
              </div>
            ) : (
              <div>
                {(comments || []).map((c: any, index: number) => (
                  <div
                    key={`comment-${c._id || c.id}-${index}`}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "flex-start",
                      flexDirection: "column",
                      border:
                        activeReplyTo === c._id
                          ? "2px solid #6366f1"
                          : undefined,
                      borderRadius: activeReplyTo === c._id ? 10 : undefined,
                      background:
                        activeReplyTo === c._id ? "#f0f4ff" : undefined,
                      boxShadow:
                        activeReplyTo === c._id
                          ? "0 2px 8px rgba(99,102,241,0.08)"
                          : undefined,
                      width: "100%",
                      minWidth: 0,
                      overflow: "hidden",
                    }}
                  >
                    {/* Heart reaction for comment */}
                    <div
                      style={{
                        display: "flex",
                        gap: isNarrow ? 4 : 6,
                        marginBottom: 2,
                        marginLeft: isNarrow ? 32 : 48,
                      }}
                    >
                      <button
                        type="button"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                        title={
                          c.reactions?.heart &&
                            c.reactions.heart.includes(user?.email)
                            ? "Bỏ cảm xúc"
                            : "Thả tim"
                        }
                        onClick={async () => {
                          // Toggle heart: like/unlike
                          try {
                            // Record this action to prevent socket override
                            recentHeartActions.current[c._id] = Date.now();

                            const isLiked =
                              c.reactions?.heart &&
                              c.reactions.heart.includes(user?.email);

                            let res;
                            if (isLiked) {
                              // DELETE request với userId trong query string
                              res = await fetch(
                                `http://localhost:3000/post/comment/${c._id}/react?userId=${encodeURIComponent(user?.email || '')}`,
                                {
                                  method: "DELETE",
                                }
                              );
                            } else {
                              // POST request với body
                              res = await fetch(
                                `http://localhost:3000/post/comment/${c._id}/react`,
                                {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    userId: user?.email,
                                    reaction: "heart",
                                  }),
                                }
                              );
                            }

                            const data = await res.json();
                            console.log('Heart API response:', data); // Debug log
                            if (data.success && Array.isArray(data.hearts)) {
                              console.log('Updating comment hearts to:', data.hearts);
                              setComments((prev) => {
                                const updated = prev.map((com) =>
                                  com._id === c._id
                                    ? {
                                      ...com,
                                      reactions: {
                                        ...com.reactions,
                                        heart: data.hearts,
                                      },
                                    }
                                    : com
                                );
                                console.log('Comments after heart update:', updated.find(com => com._id === c._id)?.reactions?.heart);
                                return updated;
                              });
                              // Don't force fetch immediately, let polling handle it
                            }
                          } catch { }
                        }}
                      >
                        <div
                        // style={{
                        //   display: "flex",
                        //   alignItems: "center",
                        //   gap: 6,
                        //   padding: "4px 12px",
                        //   borderRadius: 16,
                        //   background: c.reactions?.heart && c.reactions.heart.includes(user?.email) ? "#fee2e2" : "#f3f4f6",
                        //   color: c.reactions?.heart && c.reactions.heart.includes(user?.email) ? "#e11d48" : "#888",
                        //   fontWeight: 600,
                        //   fontSize: 14,
                        //   cursor: "pointer",
                        //   userSelect: "none",
                        //   transition: "background .2s, color .2s",
                        // }}
                        >
                          {/* <HeartPlus strokeWidth={1} size={18} /> */}
                          {/* <span>{Array.isArray(c.reactions?.heart) ? c.reactions.heart.length : 0}</span> */}
                        </div>
                      </button>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: isNarrow ? 6 : 8,
                        alignItems: "flex-start",
                        width: "100%",
                      }}
                    >
                      <img
                        src={c.authorAvatar || "/default-avatar.png"}
                        alt={c.authorName}
                        style={{
                          width: isNarrow ? 32 : 36,
                          height: isNarrow ? 32 : 36,
                          borderRadius: 999
                        }}
                      />
                      <div style={{
                        flex: 1,
                        minWidth: 0, // Allows flexbox item to shrink below content size
                        overflow: "hidden" // Prevents overflow
                      }}>
                        <div
                          style={{
                            background: "#f3f5ff",
                            padding: isNarrow ? 8 : 10,
                            borderRadius: isNarrow ? 8 : 10,
                            wordWrap: "break-word",
                            overflowWrap: "break-word",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 700,
                                color: "#2563eb",
                                fontSize: isNarrow ? 14 : 15,
                              }}
                            >
                              {c.authorName}
                              {(() => {
                                // Debug: Log the comparison
                                console.log('🔍 Author check:', {
                                  commentAuthorId: c.authorId,
                                  postAuthorId: post.authorId,
                                  commentAuthorName: c.authorName,
                                  postAuthorName: post.authorName,
                                  isMatch: c.authorId === post.authorId
                                });

                                // Check both authorId and authorName for flexibility
                                const isPostAuthor = c.authorId === post.authorId ||
                                  (c.authorName === post.authorName &&
                                    c.authorId && post.authorId);

                                return isPostAuthor && (
                                  <span
                                    style={{
                                      marginLeft: 8,
                                      fontWeight: 400,
                                      color: "#eab308",
                                      fontSize: 12,
                                      background: "#fffbe6",
                                      borderRadius: 4,
                                      padding: "2px 6px",
                                    }}
                                  >
                                    Tác giả
                                  </span>
                                );
                              })()}
                            </div>
                            {user?.email === c.authorId && (
                              <>
                                <div
                                  style={{ position: "relative", overflow: "visible" }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    data-dropdown-menu
                                    aria-label="Options"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenu(
                                        openMenu === `c-${c._id}`
                                          ? null
                                          : `c-${c._id}`
                                      );
                                    }}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      color: "#6366f1",
                                      cursor: "pointer",
                                      fontSize: 18,
                                      padding: 6,
                                    }}
                                  >
                                    ⋯
                                  </button>
                                  {openMenu === `c-${c._id}` && (
                                    <div
                                      data-dropdown-menu
                                      style={{
                                        position: "absolute",
                                        right: "0",
                                        top: "100%",
                                        marginTop: "4px",
                                        background: "#fff",
                                        border: "1px solid #ddd",
                                        boxShadow:
                                          "0 8px 25px rgba(0,0,0,0.15)",
                                        borderRadius: 8,
                                        overflow: "visible",
                                        zIndex: 9999,
                                        minWidth: "140px",
                                        whiteSpace: "nowrap",
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenMenu(null);
                                          setEditingComment(c._id);
                                          setEditCommentContent((prev) => ({
                                            ...prev,
                                            [c._id]: c.content,
                                          }));
                                          setEditExistingImages((prev) => ({
                                            ...prev,
                                            [c._id]: c.images
                                              ? [...c.images]
                                              : [],
                                          }));
                                          setEditExistingVideos((prev) => ({
                                            ...prev,
                                            [c._id]: c.videos
                                              ? [...c.videos]
                                              : [],
                                          }));
                                          setEditNewImages((prev) => ({
                                            ...prev,
                                            [c._id]: [],
                                          }));
                                          setEditNewVideos((prev) => ({
                                            ...prev,
                                            [c._id]: [],
                                          }));
                                          setEditPreviewImages((prev) => ({
                                            ...prev,
                                            [c._id]: [],
                                          }));
                                          setEditPreviewVideos((prev) => ({
                                            ...prev,
                                            [c._id]: [],
                                          }));
                                        }}
                                        style={{
                                          display: "block",
                                          padding: "8px 14px",
                                          background: "none",
                                          border: "none",
                                          width: "100%",
                                          textAlign: "left",
                                          cursor: "pointer",
                                          color: "#6366f1",
                                        }}
                                      >
                                        Sửa bình luận
                                      </button>
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          setOpenMenu(null);
                                          if (!confirm("Xóa bình luận này?"))
                                            return;
                                          try {
                                            const res = await fetch(
                                              `http://localhost:3000/post/comment/${c._id}`,
                                              {
                                                method: "DELETE",
                                                headers: {
                                                  "Content-Type":
                                                    "application/json",
                                                },
                                                body: JSON.stringify({
                                                  userEmail: user.email,
                                                }),
                                              }
                                            );
                                            const data = await res.json();
                                            if (data?.success) {
                                              setComments((prev) => {
                                                const next = prev.filter(
                                                  (pc) => pc._id !== c._id
                                                );
                                                try {
                                                  onPostUpdate?.(post._id, {
                                                    comments: next,
                                                  });
                                                } catch (e) { }
                                                return next;
                                              });
                                            }
                                          } catch (err) {
                                            console.error(err);
                                          }
                                        }}
                                        style={{
                                          display: "block",
                                          padding: "8px 14px",
                                          background: "none",
                                          border: "none",
                                          width: "100%",
                                          textAlign: "left",
                                          cursor: "pointer",
                                          color: "#e11d48",
                                        }}
                                      >
                                        Xóa bình luận
                                      </button>
                                      <button
                                        onClick={async () => {
                                          setOpenMenu(null);
                                          // Gỡ cảm xúc tim nếu đã thích
                                          if (
                                            c.reactions?.heart &&
                                            c.reactions.heart.includes(
                                              user?.email
                                            )
                                          ) {
                                            try {
                                              // Record this action to prevent socket override
                                              recentHeartActions.current[c._id] = Date.now();

                                              const res = await fetch(
                                                `http://localhost:3000/post/comment/${c._id}/react?userId=${encodeURIComponent(user?.email || '')}`,
                                                {
                                                  method: "DELETE",
                                                }
                                              );
                                              const data = await res.json();
                                              console.log('Heart API response (menu):', data); // Debug log
                                              if (data.success && Array.isArray(data.hearts)) {
                                                setComments((prev) =>
                                                  prev.map((com) =>
                                                    com._id === c._id
                                                      ? {
                                                        ...com,
                                                        reactions: {
                                                          ...com.reactions,
                                                          heart: data.hearts,
                                                        },
                                                      }
                                                      : com
                                                  )
                                                );
                                                // Don't force fetch immediately, let polling handle it
                                              }
                                            } catch { }
                                          }
                                        }}
                                        style={{
                                          display: "block",
                                          padding: "8px 14px",
                                          background: "none",
                                          border: "none",
                                          width: "100%",
                                          textAlign: "left",
                                          cursor: "pointer",
                                          color: "#e11d48",
                                        }}
                                      >
                                        {/* Gỡ cảm xúc tim */}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                          <div style={{ marginTop: 6 }}>
                            {editingComment === c._id ? (
                              <form
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  try {
                                    const res = await fetch(
                                      `http://localhost:3000/post/comment/${c._id}`,
                                      {
                                        method: "PUT",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          userEmail: user.email,
                                          content: editCommentContent[c._id],
                                          images:
                                            editExistingImages[c._id] || [],
                                        }),
                                      }
                                    );
                                    const data = await res.json();
                                    if (data.success && data.comment) {
                                      setComments((prev) =>
                                        prev.map((com) =>
                                          com._id === c._id ? data.comment : com
                                        )
                                      );
                                      setEditingComment(null);
                                    }
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 8,
                                }}
                              >
                                <textarea
                                  value={editCommentContent[c._id] || ""}
                                  onChange={(e) =>
                                    setEditCommentContent((prev) => ({
                                      ...prev,
                                      [c._id]: e.target.value,
                                    }))
                                  }
                                  style={{
                                    width: "100%",
                                    padding: 8,
                                    borderRadius: 8,
                                    border: "1px solid #e6e6ef",
                                    fontSize: 15,
                                    resize: "vertical",
                                    minHeight: "60px",
                                    wordWrap: "break-word",
                                    whiteSpace: "pre-wrap",
                                    overflowWrap: "break-word",
                                    textAlign: "left",
                                  }}
                                />
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button
                                    type="submit"
                                    style={{
                                      background: "#6366f1",
                                      color: "#fff",
                                      border: "none",
                                      borderRadius: 8,
                                      padding: "0 16px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    Lưu
                                  </button>
                                  <button
                                    type="button"
                                    style={{
                                      background: "#f3f4f6",
                                      color: "#222",
                                      border: "none",
                                      borderRadius: 8,
                                      padding: "0 16px",
                                    }}
                                    onClick={() => setEditingComment(null)}
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div>
                                <div style={{
                                  wordWrap: "break-word",
                                  wordBreak: "break-word",
                                  whiteSpace: "pre-wrap",
                                  overflowWrap: "break-word",
                                  hyphens: "auto",
                                  lineHeight: 1.4,
                                  textAlign: "left",
                                }}>{c.content}</div>
                                {/* Hiển thị stickers trong comment */}
                                {c.stickers && c.stickers.length > 0 && (
                                  <>
                                    {console.log('🖼️ Rendering stickers for comment:', c._id, c.stickers)}
                                    <StickerDisplay stickers={c.stickers} size="large" />
                                  </>
                                )}
                                {c.images && c.images.length > 0 && (
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: 6,
                                      marginTop: 6,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    {c.images.map((im: string, idx: number) => (
                                      <img
                                        key={idx}
                                        src={mediaSrc(im)}
                                        alt="comment-img"
                                        style={{
                                          width: 80,
                                          height: 80,
                                          objectFit: "cover",
                                          borderRadius: 8,
                                          border: "1px solid #eee",
                                          cursor: "pointer",
                                        }}
                                        onClick={() =>
                                          setViewMedia({
                                            src: mediaSrc(im),
                                            type: "image",
                                          })
                                        }
                                      />
                                    ))}
                                  </div>
                                )}
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 6,
                                    marginTop: 8,
                                  }}
                                >
                                  {(() => {
                                    const latestComment =
                                      comments.find(
                                        (com) => com._id === c._id
                                      ) || c;
                                    const isLiked =
                                      latestComment.reactions?.heart &&
                                      latestComment.reactions.heart.includes(
                                        user?.email
                                      );
                                    return (
                                      <button
                                        type="button"
                                        style={{
                                          background: "none",
                                          border: "none",
                                          fontSize: 18,
                                          cursor: "pointer",
                                          color: isLiked ? "#e11d48" : "#888",
                                        }}
                                        title={
                                          isLiked ? "Bỏ cảm xúc" : "Thả tim"
                                        }
                                        onClick={async () => {
                                          try {
                                            await fetch(
                                              `http://localhost:3000/post/comment/${c._id}/react`,
                                              {
                                                method: isLiked ? "DELETE" : "POST",
                                                headers: {
                                                  "Content-Type": "application/json",
                                                },
                                                body: JSON.stringify({
                                                  userId: user?.email,
                                                  reaction: "heart",
                                                }),
                                              }
                                            );
                                          } catch { }
                                        }}
                                      ></button>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 12,
                            marginTop: 6,
                            alignItems: "center",
                          }}
                        >
                          <div style={{ fontSize: 12, color: "#666", display: "flex", alignItems: "center", gap: 8 }}>
                            {formatTime(c.createdAt, c._justNow)}
                            {c.updatedAt && c.updatedAt !== c.createdAt && (
                              <span style={{ fontStyle: "italic", fontSize: 11, color: "#999" }}>
                                • đã chỉnh sửa
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setActiveReplyTo(c._id);
                              setReplyText("");
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#6366f1",
                              cursor: "pointer",
                              fontSize: 13,
                            }}
                          >
                            Trả lời
                          </button>
                          {(() => {
                            const latestComment =
                              comments.find((com) => com._id === c._id) || c;
                            const isLiked =
                              latestComment.reactions?.heart &&
                              latestComment.reactions.heart.includes(
                                user?.email
                              );
                            return (
                              <button
                                type="button"
                                style={{
                                  background: "none",
                                  border: "none",
                                  fontSize: 18,
                                  cursor: "pointer",
                                  color: isLiked ? "#e11d48" : "#888",
                                }}
                                title={isLiked ? "Bỏ cảm xúc" : "Thả tim"}
                                onClick={async () => {
                                  try {
                                    // Record this action to prevent socket override
                                    recentHeartActions.current[c._id] = Date.now();
                                    let res;
                                    if (isLiked) {
                                      // DELETE request với userId trong query string
                                      res = await fetch(
                                        `http://localhost:3000/post/comment/${c._id}/react?userId=${encodeURIComponent(user?.email || '')}`,
                                        {
                                          method: "DELETE",
                                        }
                                      );
                                    } else {
                                      // POST request với body
                                      res = await fetch(
                                        `http://localhost:3000/post/comment/${c._id}/react`,
                                        {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({
                                            userId: user?.email,
                                            reaction: "heart",
                                          }),
                                        }
                                      );
                                    }

                                    const data = await res.json();
                                    console.log('Heart API response (button 2):', data); // Debug log
                                    if (data.success && Array.isArray(data.hearts)) {
                                      setComments((prev) =>
                                        prev.map((com) =>
                                          com._id === c._id
                                            ? {
                                              ...com,
                                              reactions: {
                                                ...com.reactions,
                                                heart: data.hearts,
                                              },
                                            }
                                            : com
                                        )
                                      );
                                      // Don't force fetch immediately, let polling handle it
                                    }
                                  } catch { }
                                }}
                              >
                                <div style={{ marginLeft: "20px" }}>
                                  <HeartPlus strokeWidth={1} />{" "}
                                  {Array.isArray(latestComment.reactions?.heart)
                                    ? latestComment.reactions.heart.length
                                    : 0}
                                </div>
                              </button>
                            );
                          })()}
                        </div>
                        {/* replies: gọn lại, chỉ hiện khi mở */}
                        {(c.replies || []).length > 0 && (
                          <div style={{ marginTop: 8, marginLeft: isNarrow ? 32 : 46 }}>
                            {!openReplies[c._id] ? (
                              <button
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#6366f1",
                                  cursor: "pointer",
                                  fontSize: 13,
                                  padding: "4px 0",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4, // khoảng cách giữa chữ và icon
                                }}
                                onClick={() =>
                                  setOpenReplies((prev) => ({
                                    ...prev,
                                    [c._id]: true,
                                  }))
                                }
                              >
                                Xem {c.replies.length} phản hồi
                                <ChevronDown
                                  style={{ width: 14, height: 14 }}
                                />
                              </button>
                            ) : (
                              <>
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                  }}
                                >
                                  {(c.replies || []).map(
                                    (r: any) => {
                                      const replyKey = `reply-${c._id}-${r._id}`;
                                      const latestReply =
                                        (
                                          comments.find(
                                            (pc) => pc._id === c._id
                                          )?.replies || []
                                        ).find((rr: any) => rr._id === r._id) ||
                                        r;
                                      return (
                                        <div
                                          key={replyKey}
                                          style={{
                                            display: "flex",
                                            gap: isNarrow ? 6 : 8,
                                            alignItems: "flex-start",
                                          }}
                                        >
                                          <img
                                            src={
                                              latestReply.authorAvatar ||
                                              "/default-avatar.png"
                                            }
                                            alt={latestReply.authorName}
                                            style={{
                                              width: isNarrow ? 24 : 28,
                                              height: isNarrow ? 24 : 28,
                                              borderRadius: 999,
                                            }}
                                          />
                                          <div
                                            style={{
                                              background: "#fff",
                                              border: "1px solid #f0f0ff",
                                              padding: isNarrow ? 6 : 8,
                                              borderRadius: isNarrow ? 6 : 8,
                                              position: "relative",
                                              width: "100%",
                                              minWidth: 0,
                                              wordWrap: "break-word",
                                              overflowWrap: "break-word",
                                            }}
                                          >
                                            <div
                                              style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "flex-start",
                                              }}
                                            >
                                              <div
                                                style={{
                                                  fontWeight: 700,
                                                  fontSize: 13,
                                                  color: "#6366f1",
                                                }}
                                              >
                                                {latestReply.authorName}
                                                {(() => {
                                                  // Debug: Log the reply author comparison
                                                  console.log('🔍 Reply author check:', {
                                                    replyAuthorId: latestReply.authorId,
                                                    postAuthorId: post.authorId,
                                                    replyAuthorName: latestReply.authorName,
                                                    postAuthorName: post.authorName,
                                                    isMatch: latestReply.authorId === post.authorId
                                                  });

                                                  // Check both authorId and authorName for flexibility
                                                  const isPostAuthor = latestReply.authorId === post.authorId ||
                                                    (latestReply.authorName === post.authorName &&
                                                      latestReply.authorId && post.authorId);

                                                  return isPostAuthor && (
                                                    <span
                                                      style={{
                                                        marginLeft: 6,
                                                        fontWeight: 400,
                                                        color: "#eab308",
                                                        fontSize: 12,
                                                        background: "#fffbe6",
                                                        borderRadius: 4,
                                                        padding: "2px 6px",
                                                      }}
                                                    >
                                                      Tác giả
                                                    </span>
                                                  );
                                                })()}
                                              </div>
                                              <div style={{
                                                marginTop: 4,
                                                wordWrap: "break-word",
                                                wordBreak: "break-word",
                                                whiteSpace: "pre-wrap",
                                                overflowWrap: "break-word",
                                                hyphens: "auto",
                                                lineHeight: 1.4,
                                                textAlign: "left",
                                              }}>
                                                <span
                                                  style={{
                                                    fontWeight: 600,
                                                    color: "#2563eb",
                                                  }}
                                                >
                                                  {latestReply.replyToName ||
                                                    c.authorName}
                                                </span>{" "}
                                                {latestReply.content}
                                                {/* Hiển thị stickers trong reply */}
                                                {latestReply.stickers && latestReply.stickers.length > 0 && (
                                                  <StickerDisplay stickers={latestReply.stickers} size="medium" />
                                                )}
                                              </div>
                                              {latestReply.images &&
                                                latestReply.images.length >
                                                0 && (
                                                  <div
                                                    style={{
                                                      display: "flex",
                                                      gap: 6,
                                                      marginTop: 6,
                                                      flexWrap: "wrap",
                                                    }}
                                                  >
                                                    {latestReply.images.map(
                                                      (
                                                        im: string,
                                                        idx: number
                                                      ) => (
                                                        <img
                                                          key={idx}
                                                          src={mediaSrc(im)}
                                                          alt="reply-img"
                                                          style={{
                                                            width: 60,
                                                            height: 60,
                                                            objectFit: "cover",
                                                            borderRadius: 8,
                                                            border:
                                                              "1px solid #eee",
                                                            cursor: "pointer",
                                                          }}
                                                          onClick={() =>
                                                            setViewMedia({
                                                              src: mediaSrc(im),
                                                              type: "image",
                                                            })
                                                          }
                                                        />
                                                      )
                                                    )}
                                                  </div>
                                                )}
                                              {viewMedia && (
                                                <div
                                                  style={{
                                                    position: "fixed",
                                                    inset: 0,
                                                    zIndex: 2000,
                                                    background:
                                                      "rgba(0,0,0,0.85)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                  }}
                                                  onClick={() =>
                                                    setViewMedia(null)
                                                  }
                                                >
                                                  <div
                                                    style={{
                                                      position: "relative",
                                                      maxWidth: "90vw",
                                                      maxHeight: "90vh",
                                                      background: "transparent",
                                                    }}
                                                    onClick={(e) =>
                                                      e.stopPropagation()
                                                    }
                                                  >
                                                    <button
                                                      onClick={() =>
                                                        setViewMedia(null)
                                                      }
                                                      style={{
                                                        position: "absolute",
                                                        top: 12,
                                                        right: 12,
                                                        zIndex: 10,
                                                        background:
                                                          "rgba(0,0,0,0.7)",
                                                        color: "#fff",
                                                        border: "none",
                                                        borderRadius: 999,
                                                        padding: 8,
                                                        fontSize: 22,
                                                        cursor: "pointer",
                                                      }}
                                                    >
                                                      ×
                                                    </button>
                                                    {viewMedia.type ===
                                                      "image" ? (
                                                      <img
                                                        src={viewMedia.src}
                                                        alt="view-img"
                                                        style={{
                                                          maxWidth: "90vw",
                                                          maxHeight: "90vh",
                                                          borderRadius: 12,
                                                          boxShadow:
                                                            "0 2px 16px rgba(0,0,0,0.25)",
                                                        }}
                                                      />
                                                    ) : (
                                                      <video
                                                        src={viewMedia.src}
                                                        controls
                                                        autoPlay
                                                        style={{
                                                          maxWidth: "90vw",
                                                          maxHeight: "90vh",
                                                          borderRadius: 12,
                                                          boxShadow:
                                                            "0 2px 16px rgba(0,0,0,0.25)",
                                                        }}
                                                      />
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                              <div
                                                style={{
                                                  display: "flex",
                                                  gap: 12,
                                                  marginTop: 6,
                                                  alignItems: "center",
                                                }}
                                              >
                                                <div
                                                  style={{
                                                    fontSize: 12,
                                                    color: "#666",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                  }}
                                                >
                                                  {formatTime(
                                                    latestReply.createdAt,
                                                    latestReply._justNow
                                                  )}
                                                  {latestReply.updatedAt && latestReply.updatedAt !== latestReply.createdAt && (
                                                    <span style={{ fontStyle: "italic", fontSize: 11, color: "#999" }}>
                                                      • đã chỉnh sửa
                                                    </span>
                                                  )}
                                                </div>
                                                <button
                                                  onClick={() => {
                                                    setActiveReplyTo(replyKey);
                                                    setReplyText("");
                                                  }}
                                                  style={{
                                                    background: "none",
                                                    border: "none",
                                                    color: "#6366f1",
                                                    cursor: "pointer",
                                                    fontSize: 11,
                                                  }}
                                                >
                                                  Trả lời
                                                </button>
                                                <button
                                                  type="button"
                                                  style={{
                                                    background: "none",
                                                    border: "none",
                                                    fontSize: 16,
                                                    cursor: "pointer",
                                                    color:
                                                      latestReply.reactions
                                                        ?.heart &&
                                                        latestReply.reactions.heart.includes(
                                                          user?.email
                                                        )
                                                        ? "#e11d48"
                                                        : "#888",
                                                  }}
                                                  title={
                                                    (latestReply?.reactions?.heart || []).includes(user?.email || '')
                                                      ? "Bỏ cảm xúc"
                                                      : "Thả tim"
                                                  }
                                                  onClick={async () => {
                                                    try {
                                                      // Safety checks
                                                      if (!user?.email) {
                                                        console.error('User email not found');
                                                        return;
                                                      }

                                                      // Record this action to prevent socket override
                                                      const replyKey = `${c._id}-${r._id}`;
                                                      recentHeartActions.current[replyKey] = Date.now();

                                                      // Safe check for reactions
                                                      const hearts = latestReply.reactions?.heart || [];
                                                      const isLiked = hearts.includes(user.email);

                                                      console.log('Reply heart click:', {
                                                        replyId: r._id,
                                                        isLiked,
                                                        currentHearts: hearts,
                                                        userEmail: user.email
                                                      });

                                                      // Optimistic UI update
                                                      setComments((prev) =>
                                                        prev.map((pc) => {
                                                          if (pc._id !== c._id) return pc;
                                                          return {
                                                            ...pc,
                                                            replies: (pc.replies || []).map((rr: any) => {
                                                              if (rr._id !== r._id) return rr;

                                                              const currentHearts = rr.reactions?.heart || [];
                                                              const newHearts = isLiked
                                                                ? currentHearts.filter((email: string) => email !== user.email)
                                                                : [...currentHearts, user.email];

                                                              return {
                                                                ...rr,
                                                                reactions: {
                                                                  ...rr.reactions,
                                                                  heart: newHearts,
                                                                },
                                                              };
                                                            }),
                                                          };
                                                        })
                                                      );

                                                      // API call to backend
                                                      if (isLiked) {
                                                        await fetch(
                                                          `http://localhost:3000/post/comment/${c._id}/reply/${r._id}/react?userId=${encodeURIComponent(user.email)}`,
                                                          {
                                                            method: "DELETE",
                                                          }
                                                        );
                                                      } else {
                                                        await fetch(
                                                          `http://localhost:3000/post/comment/${c._id}/reply/${r._id}/react`,
                                                          {
                                                            method: "POST",
                                                            headers: {
                                                              "Content-Type": "application/json",
                                                            },
                                                            body: JSON.stringify({
                                                              userId: user.email,
                                                              reaction: "heart",
                                                            }),
                                                          }
                                                        );
                                                      }

                                                      console.log('✅ Reply heart API call completed');

                                                    } catch (err) {
                                                      console.error("❌ Reply heart error:", err);
                                                      // On error, refresh comments from server
                                                      try {
                                                        const res = await fetch(`http://localhost:3000/post/${post._id}/comments`);
                                                        const data = await res.json();
                                                        if (data?.success) {
                                                          setComments(data.comments || []);
                                                        }
                                                      } catch (refreshErr) {
                                                        console.error("Failed to refresh comments:", refreshErr);
                                                      }
                                                    }
                                                  }}
                                                >
                                                  <div
                                                    style={{
                                                      display: "flex",
                                                      alignItems: "center",
                                                      gap: 6,
                                                      marginLeft: 10,
                                                      padding: "2px 8px",
                                                      borderRadius: 16,
                                                      background: (latestReply?.reactions?.heart || []).includes(user?.email) ? "#fee2e2" : "#f3f4f6",
                                                      color: (latestReply?.reactions?.heart || []).includes(user?.email) ? "#e11d48" : "#888",
                                                      fontWeight: 600,
                                                      fontSize: 14,
                                                      cursor: "pointer",
                                                      userSelect: "none",
                                                      transition: "background .2s, color .2s",
                                                    }}
                                                  >
                                                    <HeartPlus strokeWidth={1} size={18} />
                                                    <span>{Array.isArray(latestReply?.reactions?.heart) ? latestReply.reactions.heart.length : 0}</span>
                                                  </div>
                                                </button>
                                                {user?.email === r.authorId && (
                                                  <div
                                                    style={{
                                                      position: "relative",
                                                      overflow: "visible",
                                                    }}
                                                    onClick={(e) =>
                                                      e.stopPropagation()
                                                    }
                                                  >
                                                    <button
                                                      data-dropdown-menu
                                                      aria-label="Options"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenu(
                                                          openMenu === replyKey
                                                            ? null
                                                            : replyKey
                                                        );
                                                      }}
                                                      style={{
                                                        background: "none",
                                                        border: "none",
                                                        color: "#6366f1",
                                                        cursor: "pointer",
                                                        fontSize: 16,
                                                        padding: 6,
                                                      }}
                                                    >
                                                      ⋯
                                                    </button>
                                                    {openMenu === replyKey && (
                                                      <div
                                                        data-dropdown-menu
                                                        style={{
                                                          position: "absolute",
                                                          right: "0",
                                                          top: "100%",
                                                          marginTop: "4px",
                                                          background: "#fff",
                                                          border:
                                                            "1px solid #ddd",
                                                          boxShadow:
                                                            "0 8px 25px rgba(0,0,0,0.15)",
                                                          borderRadius: 8,
                                                          overflow: "visible",
                                                          zIndex: 9999,
                                                          minWidth: "140px",
                                                          whiteSpace: "nowrap",
                                                        }}
                                                        onClick={(e) =>
                                                          e.stopPropagation()
                                                        }
                                                      >
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenMenu(null);
                                                            setEditingComment(
                                                              replyKey
                                                            );
                                                            setEditCommentContent(
                                                              (prev) => ({
                                                                ...prev,
                                                                [replyKey]:
                                                                  r.content,
                                                              })
                                                            );
                                                          }}
                                                          style={{
                                                            display: "block",
                                                            padding: "8px 14px",
                                                            background: "none",
                                                            border: "none",
                                                            width: "100%",
                                                            textAlign: "left",
                                                            cursor: "pointer",
                                                            color: "#6366f1",
                                                          }}
                                                        >
                                                          Sửa
                                                        </button>
                                                        <button
                                                          onClick={async (
                                                            e
                                                          ) => {
                                                            e.stopPropagation();
                                                            setOpenMenu(null);
                                                            if (
                                                              !confirm(
                                                                "Xóa trả lời này?"
                                                              )
                                                            )
                                                              return;
                                                            try {
                                                              const res =
                                                                await fetch(
                                                                  `http://localhost:3000/post/comment/${c._id}/reply/${r._id}`,
                                                                  {
                                                                    method:
                                                                      "DELETE",
                                                                    headers: {
                                                                      "Content-Type":
                                                                        "application/json",
                                                                    },
                                                                    body: JSON.stringify(
                                                                      {
                                                                        userEmail:
                                                                          user.email,
                                                                      }
                                                                    ),
                                                                  }
                                                                );
                                                              const data =
                                                                await res.json();
                                                              if (
                                                                data.success
                                                              ) {
                                                                setComments(
                                                                  (prev) =>
                                                                    prev.map(
                                                                      (com) => {
                                                                        if (
                                                                          com._id !==
                                                                          c._id
                                                                        )
                                                                          return com;
                                                                        // Xóa reply khỏi danh sách replies
                                                                        const updatedReplies = (com.replies || []).filter(
                                                                          (reply: any) => reply._id !== r._id
                                                                        );
                                                                        return {
                                                                          ...com,
                                                                          replies: updatedReplies,
                                                                        };
                                                                      }
                                                                    )
                                                                );
                                                              }
                                                            } catch (err) {
                                                              console.error(
                                                                err
                                                              );
                                                            }
                                                          }}
                                                          style={{
                                                            display: "block",
                                                            padding: "8px 14px",
                                                            background: "none",
                                                            border: "none",
                                                            width: "100%",
                                                            textAlign: "left",
                                                            cursor: "pointer",
                                                            color: "#e11d48",
                                                          }}
                                                        >
                                                          Xóa trả lời
                                                        </button>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                              {editingComment === replyKey && (
                                                <form
                                                  onSubmit={async (e) => {
                                                    e.preventDefault();
                                                    try {
                                                      const res = await fetch(
                                                        `http://localhost:3000/post/comment/${c._id}/reply/${r._id}`,
                                                        {
                                                          method: "PUT",
                                                          headers: {
                                                            "Content-Type":
                                                              "application/json",
                                                          },
                                                          body: JSON.stringify({
                                                            userEmail:
                                                              user.email,
                                                            content:
                                                              editCommentContent[
                                                              replyKey
                                                              ],
                                                          }),
                                                        }
                                                      );
                                                      const data =
                                                        await res.json();
                                                      if (
                                                        data.success &&
                                                        data.reply
                                                      ) {
                                                        setComments((prev) =>
                                                          prev.map((pc) =>
                                                            pc._id === c._id
                                                              ? {
                                                                ...pc,
                                                                replies: (
                                                                  pc.replies ||
                                                                  []
                                                                ).map(
                                                                  (rr: any) =>
                                                                    rr._id ===
                                                                      r._id
                                                                      ? data.reply
                                                                      : rr
                                                                ),
                                                              }
                                                              : pc
                                                          )
                                                        );
                                                        setEditingComment(null);
                                                      }
                                                    } catch (err) {
                                                      console.error(err);
                                                    }
                                                  }}
                                                  style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 8,
                                                    marginTop: 8,
                                                  }}
                                                >
                                                  <textarea
                                                    value={
                                                      editCommentContent[
                                                      replyKey
                                                      ] || ""
                                                    }
                                                    onChange={(e) =>
                                                      setEditCommentContent(
                                                        (prev) => ({
                                                          ...prev,
                                                          [replyKey]:
                                                            e.target.value,
                                                        })
                                                      )
                                                    }
                                                    style={{
                                                      width: "100%",
                                                      padding: 8,
                                                      borderRadius: 8,
                                                      border:
                                                        "1px solid #e6e6ef",
                                                      fontSize: 15,
                                                      resize: "vertical",
                                                      minHeight: "60px",
                                                      wordWrap: "break-word",
                                                      whiteSpace: "pre-wrap",
                                                      overflowWrap: "break-word",
                                                    }}
                                                  />
                                                  <div
                                                    style={{
                                                      display: "flex",
                                                      gap: 8,
                                                    }}
                                                  >
                                                    <button
                                                      type="submit"
                                                      style={{
                                                        background: "#6366f1",
                                                        color: "#fff",
                                                        border: "none",
                                                        borderRadius: 8,
                                                        padding: "0 16px",
                                                        fontWeight: 600,
                                                      }}
                                                    >
                                                      Lưu
                                                    </button>
                                                    <button
                                                      type="button"
                                                      style={{
                                                        background: "#f3f4f6",
                                                        color: "#222",
                                                        border: "none",
                                                        borderRadius: 8,
                                                        padding: "0 16px",
                                                      }}
                                                      onClick={() =>
                                                        setEditingComment(null)
                                                      }
                                                    >
                                                      Hủy
                                                    </button>
                                                  </div>
                                                </form>
                                              )}
                                              {activeReplyTo === replyKey && (
                                                <div style={{ marginTop: 8 }}>
                                                  <div
                                                    style={{
                                                      marginBottom: 6,
                                                      padding: "6px 12px",
                                                      background: "#e0e7ff",
                                                      borderRadius: 8,
                                                      color: "#3730a3",
                                                      fontWeight: 500,
                                                      fontSize: 13,
                                                    }}
                                                  >
                                                    Đang trả lời cho{" "}
                                                    <span
                                                      style={{
                                                        fontWeight: 700,
                                                      }}
                                                    >
                                                      {(() => {
                                                        console.log("Reply form - activeReplyTo:", activeReplyTo);
                                                        console.log("Reply form - replyKey:", replyKey);
                                                        console.log("Reply form - r.authorName:", r.authorName);
                                                        console.log("Reply form - r._id:", r._id);
                                                        return r.authorName;
                                                      })()}
                                                    </span>
                                                  </div>

                                                  {/* Hiển thị stickers đã chọn cho nested reply */}
                                                  {replyStickers[replyKey] && replyStickers[replyKey].length > 0 && (
                                                    <div style={{
                                                      marginBottom: "10px",
                                                      padding: "6px",
                                                      background: "#e0f2fe",
                                                      borderRadius: "4px",
                                                      border: "1px solid #0ea5e9"
                                                    }}>
                                                      <div style={{
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                        color: "#0c4a6e",
                                                        marginBottom: "4px"
                                                      }}>
                                                        💬 Stickers ({replyStickers[replyKey].length}):
                                                      </div>
                                                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
                                                        <StickerDisplay stickers={replyStickers[replyKey]} size="small" />
                                                        <button
                                                          type="button"
                                                          onClick={() => setReplyStickers((prev) => ({ ...prev, [replyKey]: [] }))}
                                                          style={{
                                                            background: "#ef4444",
                                                            color: "white",
                                                            border: "none",
                                                            borderRadius: "3px",
                                                            padding: "2px 6px",
                                                            fontSize: "10px",
                                                            cursor: "pointer",
                                                            fontWeight: 600
                                                          }}
                                                        >
                                                          ✕
                                                        </button>
                                                      </div>
                                                    </div>
                                                  )}

                                                  <form
                                                    onSubmit={(e) =>
                                                      submitReply(c._id, e)
                                                    }
                                                    style={{
                                                      display: "flex",
                                                      gap: 8,
                                                    }}
                                                  >
                                                    <input
                                                      value={replyText}
                                                      onChange={(e) =>
                                                        setReplyText(
                                                          e.target.value
                                                        )
                                                      }
                                                      placeholder={
                                                        user
                                                          ? "Viết trả lời..."
                                                          : "Đăng nhập để trả lời"
                                                      }
                                                      disabled={
                                                        !user || sending
                                                      }
                                                      style={{
                                                        flex: 1,
                                                        padding: 8,
                                                        borderRadius: 8,
                                                        border:
                                                          "1px solid #e6e6ef",
                                                        textAlign: "left",
                                                      }}
                                                    />
                                                    <button
                                                      type="button"
                                                      onClick={() => setShowEmojiReply(showEmojiReply === replyKey ? null : replyKey)}
                                                      style={{
                                                        background: "none",
                                                        border: "none",
                                                        fontSize: 22,
                                                        cursor: "pointer",
                                                      }}
                                                      title="Chèn emoji"
                                                    >
                                                      <Smile size={16} strokeWidth={2} />
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setShowStickerReply(showStickerReply === replyKey ? null : replyKey);
                                                        setShowEmojiReply(null); // Đóng emoji picker
                                                      }}
                                                      style={{
                                                        background: "none",
                                                        border: "none",
                                                        fontSize: 22,
                                                        cursor: "pointer",
                                                      }}
                                                      title="Chọn sticker GIF"
                                                    >
                                                      <Sticker size={16} strokeWidth={2} />
                                                    </button>
                                                    <button
                                                      type="submit"
                                                      disabled={
                                                        !user ||
                                                        sending ||
                                                        (!replyText.trim() && (!replyStickers[replyKey] || replyStickers[replyKey].length === 0))
                                                      }
                                                      style={{
                                                        background: "#4f46e5",
                                                        color: "#fff",
                                                        border: "none",
                                                        padding: "6px 12px",
                                                        borderRadius: 8,
                                                        cursor: "pointer",
                                                      }}
                                                    >
                                                      Gửi
                                                    </button>

                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        setActiveReplyTo(null)
                                                      }
                                                      style={{
                                                        background: "none",
                                                        border: "none",
                                                        color: "#888",
                                                        cursor: "pointer",
                                                      }}
                                                    >
                                                      Hủy
                                                    </button>
                                                  </form>
                                                  {showEmojiReply === replyKey && (
                                                    <div
                                                      style={{
                                                        position: "fixed",
                                                        right: 32,
                                                        top: "50%",
                                                        transform: "translateY(-50%)",
                                                        zIndex: 2000,
                                                        background: "#fff",
                                                        borderRadius: 12,
                                                        boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
                                                        padding: 16,
                                                        width: 340,
                                                        maxHeight: "80vh",
                                                        overflowY: "auto",
                                                      }}
                                                    >
                                                      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                                                        <button
                                                          type="button"
                                                          onClick={() => setShowEmojiReply(null)}
                                                          style={{
                                                            background: "#f3f4f6",
                                                            border: "none",
                                                            borderRadius: 6,
                                                            padding: "4px 10px",
                                                            color: "#222",
                                                            fontWeight: 600,
                                                            cursor: "pointer",
                                                            fontSize: 15,
                                                          }}
                                                        >
                                                          Đóng
                                                        </button>
                                                      </div>
                                                      <React.Suspense fallback={<div>Đang tải emoji...</div>}>
                                                        <EmojiPicker
                                                          onEmojiClick={(e, _emojiObj) => {
                                                            setReplyText((prev) => prev + (e.emoji || ""));
                                                            // Không đóng picker khi chọn emoji, chỉ đóng khi nhấn nút Đóng
                                                          }}
                                                        />
                                                      </React.Suspense>
                                                    </div>
                                                  )}

                                                  {/* Sticker Picker cho replies */}
                                                  {showStickerReply === replyKey && (
                                                    <>
                                                      {/* Backdrop */}
                                                      <div
                                                        style={{
                                                          position: "fixed",
                                                          inset: 0,
                                                          background: "rgba(0,0,0,0.1)",
                                                          zIndex: 2400
                                                        }}
                                                        onClick={() => setShowStickerReply(null)}
                                                      />
                                                      <div
                                                        style={{
                                                          position: "fixed",
                                                          right: "20px",
                                                          top: "50%",
                                                          transform: "translateY(-50%)",
                                                          zIndex: 2500,
                                                          width: "370px",
                                                          boxShadow: "0 15px 50px rgba(0,0,0,0.3)",
                                                          borderRadius: "12px",
                                                          overflow: "hidden"
                                                        }}
                                                      >
                                                        <StickerPicker
                                                          onStickerSelect={(sticker) => {
                                                            setReplyStickers((prev) => ({
                                                              ...prev,
                                                              [c._id]: [...(prev[c._id] || []), sticker]
                                                            }));
                                                            setShowStickerReply(null); // Đóng picker sau khi chọn
                                                          }}
                                                          onClose={() => setShowStickerReply(null)}
                                                        />
                                                      </div>
                                                    </>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                                <div className="text-center">
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <button
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        background: "none",
                                        border: "none",
                                        color: "#6b7280", // text-gray-500
                                        cursor: "pointer",
                                        fontSize: 13,
                                        padding: "4px",
                                        marginTop: 8,
                                      }}
                                      onClick={() =>
                                        setOpenReplies((prev) => ({
                                          ...prev,
                                          [c._id]: false,
                                        }))
                                      }
                                    >
                                      Thu gọn
                                      <ChevronUp
                                        style={{ width: 14, height: 14 }}
                                      />
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                        {activeReplyTo === c._id && (
                          <>
                            <div style={{ marginTop: 8, marginLeft: isNarrow ? 32 : 46, position: "relative" }}>
                              <div
                                style={{
                                  marginBottom: 6,
                                  padding: "6px 12px",
                                  background: "#e0e7ff",
                                  borderRadius: 8,
                                  color: "#3730a3",
                                  fontWeight: 500,
                                  fontSize: 13,
                                }}
                              >
                                Đang trả lời cho{" "}
                                <span style={{ fontWeight: 700 }}>
                                  {c.authorName}
                                </span>
                              </div>

                              {/* Hiển thị stickers đã chọn cho reply */}
                              {replyStickers[c._id] && replyStickers[c._id].length > 0 && (
                                <div style={{
                                  marginBottom: "12px",
                                  padding: "8px",
                                  background: "#fef3c7",
                                  borderRadius: "6px",
                                  border: "1px solid #fbbf24"
                                }}>
                                  <div style={{
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color: "#92400e",
                                    marginBottom: "6px"
                                  }}>
                                    💬 Stickers cho trả lời ({replyStickers[c._id].length}):
                                  </div>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                                    <StickerDisplay stickers={replyStickers[c._id]} size="small" />
                                    <button
                                      type="button"
                                      onClick={() => setReplyStickers((prev) => ({ ...prev, [c._id]: [] }))}
                                      style={{
                                        background: "#ef4444",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        padding: "4px 8px",
                                        fontSize: "11px",
                                        cursor: "pointer",
                                        fontWeight: 600
                                      }}
                                    >
                                      ✕ Xóa
                                    </button>
                                  </div>
                                </div>
                              )}


                              <form
                                onSubmit={(e) => submitReply(c._id, e)}
                                style={{ display: "flex", gap: 8 }}
                              >
                                <textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder={
                                    user
                                      ? "Viết trả lời..."
                                      : "Đăng nhập để trả lời"
                                  }
                                  disabled={!user || sending}
                                  style={{
                                    flex: 1,
                                    padding: 8,
                                    borderRadius: 8,
                                    border: "1px solid #e6e6ef",
                                    resize: "vertical",
                                    minHeight: "40px",
                                    maxHeight: "100px",
                                    wordWrap: "break-word",
                                    whiteSpace: "pre-wrap",
                                    overflowWrap: "break-word",
                                    fontFamily: "inherit",
                                    textAlign: "left",
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Nếu đang trả lời reply thì dùng activeReplyTo, nếu trả lời comment cha thì dùng c._id
                                    const key = activeReplyTo || c._id;
                                    setShowEmojiReply(showEmojiReply === key ? null : key);
                                  }}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: 22,
                                    cursor: "pointer",
                                  }}
                                  title="Chèn emoji"
                                >
                                  <Smile size={16} strokeWidth={2} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const key = activeReplyTo || c._id;
                                    setShowStickerReply(showStickerReply === key ? null : key);
                                    setShowEmojiReply(null); // Đóng emoji picker
                                  }}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: 22,
                                    cursor: "pointer",
                                  }}
                                  title="Chọn sticker GIF"
                                >
                                  <Sticker size={16} strokeWidth={2} />
                                </button>
                                {(() => {
                                  const key = activeReplyTo || c._id;
                                  if (showEmojiReply === key) {
                                    return (
                                      <div
                                        style={{
                                          position: "fixed",
                                          right: 32,
                                          top: "50%",
                                          transform: "translateY(-50%)",
                                          zIndex: 2000,
                                          background: "#fff",
                                          borderRadius: 12,
                                          boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
                                          padding: 16,
                                          width: 340,
                                          maxHeight: "80vh",
                                          overflowY: "auto",
                                        }}
                                      >
                                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                                          <button
                                            type="button"
                                            onClick={() => setShowEmojiReply(null)}
                                            style={{
                                              background: "#f3f4f6",
                                              border: "none",
                                              borderRadius: 6,
                                              padding: "4px 10px",
                                              color: "#222",
                                              fontWeight: 600,
                                              cursor: "pointer",
                                              fontSize: 15,
                                            }}
                                          >
                                            Đóng
                                          </button>
                                        </div>
                                        <React.Suspense fallback={<div>Đang tải emoji...</div>}>
                                          <EmojiPicker
                                            onEmojiClick={(e, _emojiObj) => {
                                              setReplyText((prev) => prev + (e.emoji || ""));
                                              // Không đóng picker khi chọn emoji, chỉ đóng khi nhấn nút Đóng
                                            }}
                                          />
                                        </React.Suspense>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}

                                {/* Sticker Picker cho reply */}
                                {(() => {
                                  const key = activeReplyTo || c._id;
                                  if (showStickerReply === key) {
                                    return (
                                      <>
                                        {/* Backdrop */}
                                        <div
                                          style={{
                                            position: "fixed",
                                            inset: 0,
                                            background: "rgba(0,0,0,0.1)",
                                            zIndex: 2400
                                          }}
                                          onClick={() => setShowStickerReply(null)}
                                        />
                                        <div
                                          style={{
                                            position: "fixed",
                                            right: "20px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            zIndex: 2500,
                                            width: "370px",
                                            boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
                                            borderRadius: "12px",
                                            overflow: "hidden"
                                          }}
                                        >
                                          <StickerPicker
                                            onStickerSelect={(sticker) => {
                                              setReplyStickers((prev) => ({
                                                ...prev,
                                                [key]: [...(prev[key] || []), sticker]
                                              }));
                                              setShowStickerReply(null); // Đóng picker sau khi chọn
                                            }}
                                            onClose={() => setShowStickerReply(null)}
                                          />
                                        </div>
                                      </>
                                    );
                                  }
                                  return null;
                                })()}

                                <button
                                  type="submit"
                                  disabled={
                                    !user || sending || (!replyText.trim() && (!activeReplyTo || !replyStickers[activeReplyTo] || replyStickers[activeReplyTo].length === 0))
                                  }
                                  style={{
                                    background: "#4f46e5",
                                    color: "#fff",
                                    border: "none",
                                    padding: "6px 12px",
                                    borderRadius: 8,
                                    cursor: "pointer",
                                  }}
                                >
                                  Gửi
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveReplyTo(null)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#888",
                                    cursor: "pointer",
                                  }}
                                >
                                  Hủy
                                </button>
                              </form>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <form
            onSubmit={submitComment}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: isNarrow ? 6 : 8,
              alignItems: "flex-end",
              position: "relative",
              padding: isNarrow ? "8px 12px" : "12px 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                gap: isNarrow ? 6 : 8,
              }}
            >
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={
                  user
                    ? "Viết bình luận dưới tên " + (user.name || "")
                    : "Đăng nhập để bình luận"
                }
                disabled={!user}
                style={{
                  flex: 1,
                  padding: isNarrow ? 8 : 10,
                  borderRadius: 16,
                  border: "1px solid #e6e6ef",
                  fontSize: isNarrow ? 14 : 15,
                  resize: "vertical",
                  minHeight: "44px",
                  maxHeight: "120px",
                  wordWrap: "break-word",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "break-word",
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
              />
              <button
                type="button"
                onClick={() => setShowEmoji((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  cursor: "pointer",
                }}
                title="Chèn emoji"
              >
                <Smile size={16} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log("Sticker button clicked, current showSticker:", showSticker);
                  // alert("Sticker button clicked!"); // Debug alert
                  setShowSticker((v) => !v);
                  setShowEmoji(false); // Đóng emoji picker
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  cursor: "pointer",
                }}
                title="Chọn sticker GIF"
              >
                <Sticker size={16} strokeWidth={2} />
              </button>
              <label
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  cursor: "pointer",
                }}
                title="Thêm ảnh"
              >
                <span role="img" aria-label="image">
                  <Camera size={16} strokeWidth={2} />
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setNewImages(files);
                    const readers = files.map(
                      (f) =>
                        new Promise<string>((resolve) => {
                          const r = new FileReader();
                          r.onload = (ev) =>
                            resolve(ev.target?.result as string);
                          r.readAsDataURL(f);
                        })
                    );
                    Promise.all(readers).then((res) => setPreviewImages(res));
                  }}
                />
              </label>
              <button
                type="submit"
                disabled={
                  !user ||
                  sending ||
                  (!newComment.trim() && newImages.length === 0 && selectedStickers.length === 0)
                }
                style={{
                  background: "#4f46e5",
                  color: "#fff",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Gửi
              </button>
            </div>

            {previewImages.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {previewImages.map((p, idx) => (
                  <div
                    key={idx}
                    style={{ position: "relative", width: 60, height: 60 }}
                  >
                    <img
                      src={p}
                      alt="preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #eee",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImages((arr) =>
                          arr.filter((_, i) => i !== idx)
                        );
                        setNewImages((arr) => arr.filter((_, i) => i !== idx));
                      }}
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </form>
          {showEmoji && (
            <div
              ref={emojiPickerRef}
              style={{
                position: "absolute",
                bottom: 50,
                right: 0,
                zIndex: 100,
                background: "#fff",
                border: "1px solid #eee",
                borderRadius: 8,
                padding: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                width: 340,
                maxHeight: "80vh",
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowEmoji(false)}
                  style={{
                    background: "#f3f4f6",
                    border: "none",
                    borderRadius: 6,
                    padding: "4px 10px",
                    color: "#222",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 15,
                  }}
                >
                  Đóng
                </button>
              </div>
              <React.Suspense fallback={<div>Đang tải emoji...</div>}>
                <EmojiPicker
                  onEmojiClick={(emojiData: any) => {
                    setNewComment(
                      (c) => c + (emojiData.emoji || emojiData.unified || "")
                    );
                    // Không đóng picker khi chọn emoji, chỉ đóng khi nhấn nút Đóng
                  }}
                />
              </React.Suspense>
            </div>
          )}

          {/* Sticker Picker cho comment input */}
          {showSticker && (
            <>
              {console.log("Rendering sticker picker, showSticker:", showSticker)}
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.1)",
                  zIndex: 2400
                }}
                onClick={() => setShowSticker(false)}
              />
              <div style={{
                position: "fixed",
                right: "20px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2500,
                width: "370px",
                boxShadow: "0 15px 50px rgba(0,0,0,0.3)",
                borderRadius: "12px",
                overflow: "hidden"
              }}>
                <StickerPicker
                  onStickerSelect={(sticker) => {
                    setSelectedStickers((prev) => [...prev, sticker]);
                    setShowSticker(false); // Đóng picker sau khi chọn
                  }}
                  onClose={() => setShowSticker(false)}
                />
              </div>
            </>
          )}

          {/* Hiển thị stickers đã chọn */}
          {selectedStickers.length > 0 && (
            <div style={{
              marginTop: "20px",
              padding: "20px",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "2px dashed #e2e8f0"
            }}>
              <div style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#475569",
                marginBottom: "8px"
              }}>
                📎 Stickers đã chọn ({selectedStickers.length}):
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                <StickerDisplay stickers={selectedStickers} size="medium" />
                <button
                  onClick={() => setSelectedStickers([])}
                  style={{
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                >
                  ✕ Xóa tất cả
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentModal;
