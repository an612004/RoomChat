import React from "react";
const EmojiPicker = React.lazy(() => import("./EmojiPicker"));
import {
  Heart,
  Smile,
  Camera,
  ChevronDown,
  ChevronUp,
  Crown,
  HeartPlus,
} from "lucide-react";

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
  // State for viewing media in comments/replies
  const [viewMedia, setViewMedia] = React.useState<{
    src: string;
    type: "image" | "video";
  } | null>(null);
  const [newComment, setNewComment] = React.useState("");
  // showEmoji for comment input
  const [showEmoji, setShowEmoji] = React.useState(false);
  // showEmojiReply for reply input (tracks replyKey or null)
  const [showEmojiReply, setShowEmojiReply] = React.useState<string | null>(null);
  const [newImages, setNewImages] = React.useState<File[]>([]);
  const [previewImages, setPreviewImages] = React.useState<string[]>([]);
  const emojiPickerRef = React.useRef<HTMLDivElement | null>(null);
  const [sending, setSending] = React.useState(false);
  const [activeReplyTo, setActiveReplyTo] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState("");
  const [comments, setComments] = React.useState<any[]>(post.comments || []);
  // Local reactions state: { [commentId]: number }
  const [commentHearts, setCommentHearts] = React.useState<{
    [key: string]: number;
  }>({});
  const [userReacted, setUserReacted] = React.useState<{
    [key: string]: boolean;
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
    if (!user || !newComment.trim()) return;
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
      const res = await fetch(
        `http://localhost:3000/post/${post._id}/comment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authorId: user.email,
            authorName: user.name,
            authorAvatar: user.avatar,
            content: newComment,
            images: uploadedImages,
          }),
        }
      );
      const data = await res.json();
      if (data?.success && data.comment) {
        setComments((prev) => {
          const next = [...prev, data.comment];
          try {
            onPostUpdate?.(post._id, { comments: next });
          } catch (e) { }
          return next;
        });
        setNewComment("");
        setNewImages([]);
        setPreviewImages([]);
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

  const submitReply = async (commentId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !replyText.trim()) return;
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

  React.useEffect(() => {
    const check = () => setIsNarrow(window.innerWidth < 900);
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

  // Poll comments for real-time-ish updates while modal is open
  React.useEffect(() => {
    let mounted = true;
    let intervalId: any = null;

    const fetchComments = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/post/${post._id}/comments`
        );
        const data = await res.json();
        if (!mounted || !data?.success) return;
        const latest: any[] = data.comments || [];
        // Merge new comments
        setComments((prev) => {
          const prevIds = new Set((prev || []).map((c: any) => c._id || c.id));
          let merged = [...(prev || [])];
          latest.forEach((lc: any) => {
            const id = lc._id || lc.id;
            const prevComment = merged.find((c: any) => (c._id || c.id) === id);
            if (!prevComment) {
              // mark as just arrived
              const newC = { ...lc, _justNow: true };
              merged.push(newC);
              setTimeout(() => {
                setComments((cur) =>
                  cur.map((cc) =>
                    cc._id === id ? { ...cc, _justNow: false } : cc
                  )
                );
              }, 30000);
            } else {
              // merge reactions.heart from backend, but preserve local changes if just updated
              merged = merged.map((c: any) => {
                if ((c._id || c.id) !== id) return c;
                // Merge replies
                let mergedReplies = c.replies || [];
                if (Array.isArray(lc.replies)) {
                  mergedReplies = lc.replies.map((r: any) => {
                    const prevReply = (c.replies || []).find(
                      (pr: any) => pr._id === r._id
                    );
                    if (!prevReply) return r;
                    // Merge reactions.heart for reply
                    return {
                      ...r,
                      reactions: {
                        ...r.reactions,
                        heart: Array.isArray(r.reactions?.heart)
                          ? r.reactions.heart
                          : prevReply.reactions?.heart || [],
                      },
                    };
                  });
                }
                return {
                  ...c,
                  ...lc,
                  reactions: {
                    ...lc.reactions,
                    heart: Array.isArray(lc.reactions?.heart)
                      ? lc.reactions.heart
                      : c.reactions?.heart || [],
                  },
                  replies: mergedReplies,
                };
              });
            }
          });
          return merged;
        });
      } catch (err) {
        // ignore polling errors silently
      }
    };

    // initial fetch
    fetchComments();
    intervalId = setInterval(fetchComments, 2000);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [post]);

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
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "95%",
          maxWidth: hasMedia ? 980 : 720,
          maxHeight: "90vh",
          background: "#fff",
          borderRadius: 12,
          overflow: "hidden",
          display: "flex",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
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
              paddingRight: 6,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {(comments || []).length === 0 ? (
              <div style={{ textAlign: "center", color: "#777" }}>
                Chưa có bình luận nào
              </div>
            ) : (
              <div>
                {(comments || []).map((c: any) => (
                  <div
                    key={c._id}
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
                    }}
                  >
                    {/* Heart reaction for comment */}
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        marginBottom: 2,
                        marginLeft: 48,
                      }}
                    >
                      <button
                        type="button"
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: 18,
                          cursor: "pointer",
                          color:
                            c.reactions?.heart &&
                              c.reactions.heart.includes(user?.email)
                              ? "#e11d48"
                              : "#888",
                        }}
                        onClick={async () => {
                          // Toggle heart: like/unlike
                          try {
                            const isLiked =
                              c.reactions?.heart &&
                              c.reactions.heart.includes(user?.email);
                            const res = await fetch(
                              `http://localhost:3000/post/comment/${c._id}/react`,
                              {
                                method: isLiked ? "DELETE" : "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  userId: user?.email,
                                  reaction: "heart",
                                }),
                              }
                            );
                            const data = await res.json();
                            if (data.success) {
                              setCommentHearts((prev) => ({
                                ...prev,
                                [c._id]: data.count,
                              }));
                              setUserReacted((prev) => ({
                                ...prev,
                                [c._id]: !isLiked,
                              }));
                              // Update local comment reactions
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
                            }
                          } catch { }
                        }}
                      ></button>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "flex-start",
                        width: "100%",
                      }}
                    >
                      <img
                        src={c.authorAvatar || "/default-avatar.png"}
                        alt={c.authorName}
                        style={{ width: 36, height: 36, borderRadius: 999 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            background: "#f3f5ff",
                            padding: 10,
                            borderRadius: 10,
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
                                fontSize: 15,
                              }}
                            >
                              {c.authorName}
                              {c.authorId === post.authorId && (
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
                              )}
                            </div>
                            {user?.email === c.authorId && (
                              <>
                                <div
                                  style={{ position: "relative" }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
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
                                      style={{
                                        position: "absolute",
                                        right: 0,
                                        top: 28,
                                        background: "#fff",
                                        border: "1px solid #eee",
                                        boxShadow:
                                          "0 6px 18px rgba(0,0,0,0.08)",
                                        borderRadius: 8,
                                        overflow: "hidden",
                                        zIndex: 200,
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
                                              const res = await fetch(
                                                `http://localhost:3000/post/comment/${c._id}/react`,
                                                {
                                                  method: "DELETE",
                                                  headers: {
                                                    "Content-Type":
                                                      "application/json",
                                                  },
                                                  body: JSON.stringify({
                                                    userId: user?.email,
                                                    reaction: "heart",
                                                  }),
                                                }
                                              );
                                              const data = await res.json();
                                              if (data.success) {
                                                setCommentHearts((prev) => ({
                                                  ...prev,
                                                  [c._id]: data.count,
                                                }));
                                                setUserReacted((prev) => ({
                                                  ...prev,
                                                  [c._id]: false,
                                                }));
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
                                        Gỡ cảm xúc tim
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
                                <div>{c.content}</div>
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
                                            const res = await fetch(
                                              `http://localhost:3000/post/comment/${c._id}/react`,
                                              {
                                                method: isLiked
                                                  ? "DELETE"
                                                  : "POST",
                                                headers: {
                                                  "Content-Type":
                                                    "application/json",
                                                },
                                                body: JSON.stringify({
                                                  userId: user?.email,
                                                  reaction: "heart",
                                                }),
                                              }
                                            );
                                            const data = await res.json();
                                            if (data.success) {
                                              setCommentHearts((prev) => ({
                                                ...prev,
                                                [c._id]: data.count,
                                              }));
                                              setComments((prev) =>
                                                prev.map((com) =>
                                                  com._id === c._id
                                                    ? {
                                                      ...com,
                                                      reactions: {
                                                        ...com.reactions,
                                                        heart: Array.isArray(
                                                          data.hearts
                                                        )
                                                          ? data.hearts
                                                          : [],
                                                      },
                                                    }
                                                    : com
                                                )
                                              );
                                            }
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
                          <div style={{ fontSize: 12, color: "#666" }}>
                            {formatTime(c.createdAt, c._justNow)}
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
                                    const res = await fetch(
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
                                    const data = await res.json();
                                    if (data.success) {
                                      setCommentHearts((prev) => ({
                                        ...prev,
                                        [c._id]: data.count,
                                      }));
                                      setComments((prev) =>
                                        prev.map((com) =>
                                          com._id === c._id
                                            ? {
                                              ...com,
                                              reactions: {
                                                ...com.reactions,
                                                heart: Array.isArray(
                                                  data.hearts
                                                )
                                                  ? data.hearts
                                                  : [],
                                              },
                                            }
                                            : com
                                        )
                                      );
                                    }
                                  } catch { }
                                }}
                              >
                                <div style={{ marginLeft: "420px" }}>
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
                          <div style={{ marginTop: 8, marginLeft: 46 }}>
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
                                    (r: any, idx: number) => {
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
                                            gap: 8,
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
                                              width: 28,
                                              height: 28,
                                              borderRadius: 999,
                                            }}
                                          />
                                          <div
                                            style={{
                                              background: "#fff",
                                              border: "1px solid #f0f0ff",
                                              padding: 8,
                                              borderRadius: 8,
                                              position: "relative",
                                              width: "100%",
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
                                                {latestReply.authorId ===
                                                  post.authorId && (
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
                                                  )}
                                              </div>
                                              <div style={{ marginTop: 4 }}>
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
                                                  }}
                                                >
                                                  {formatTime(
                                                    latestReply.createdAt,
                                                    latestReply._justNow
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
                                                    latestReply.reactions
                                                      ?.heart &&
                                                      latestReply.reactions.heart.includes(
                                                        user?.email
                                                      )
                                                      ? "Bỏ cảm xúc"
                                                      : "Thả tim"
                                                  }
                                                  onClick={async () => {
                                                    try {
                                                      const isLiked =
                                                        latestReply.reactions
                                                          ?.heart &&
                                                        latestReply.reactions.heart.includes(
                                                          user?.email
                                                        );
                                                      const res = await fetch(
                                                        `http://localhost:3000/post/comment/${c._id}/reply/${r._id}/react`,
                                                        {
                                                          method: isLiked
                                                            ? "DELETE"
                                                            : "POST",
                                                          headers: {
                                                            "Content-Type":
                                                              "application/json",
                                                          },
                                                          body: JSON.stringify({
                                                            userId: user?.email,
                                                            reaction: "heart",
                                                          }),
                                                        }
                                                      );
                                                      const data =
                                                        await res.json();
                                                      if (data.success) {
                                                        setComments((prev) =>
                                                          prev.map((pc) => {
                                                            if (
                                                              pc._id !== c._id
                                                            )
                                                              return pc;
                                                            return {
                                                              ...pc,
                                                              replies: (
                                                                pc.replies || []
                                                              ).map(
                                                                (rr: any) => {
                                                                  if (
                                                                    rr._id !==
                                                                    r._id
                                                                  )
                                                                    return rr;
                                                                  return {
                                                                    ...rr,
                                                                    reactions: {
                                                                      ...rr.reactions,
                                                                      heart:
                                                                        Array.isArray(
                                                                          data.hearts
                                                                        )
                                                                          ? data.hearts
                                                                          : [],
                                                                    },
                                                                  };
                                                                }
                                                              ),
                                                            };
                                                          })
                                                        );
                                                      }
                                                    } catch { }
                                                  }}
                                                >
                                                  <div
                                                    style={{
                                                      marginLeft: "300px",
                                                    }}
                                                  >
                                                    <HeartPlus strokeWidth={1} />{" "}
                                                    {Array.isArray(
                                                      latestReply.reactions
                                                        ?.heart
                                                    )
                                                      ? latestReply.reactions
                                                        .heart.length
                                                      : 0}
                                                  </div>
                                                </button>
                                                {user?.email === r.authorId && (
                                                  <div
                                                    style={{
                                                      position: "relative",
                                                    }}
                                                    onClick={(e) =>
                                                      e.stopPropagation()
                                                    }
                                                  >
                                                    <button
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
                                                        style={{
                                                          position: "absolute",
                                                          right: 0,
                                                          top: 26,
                                                          background: "#fff",
                                                          border:
                                                            "1px solid #eee",
                                                          boxShadow:
                                                            "0 6px 18px rgba(0,0,0,0.08)",
                                                          borderRadius: 8,
                                                          overflow: "hidden",
                                                          zIndex: 200,
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
                                                          Sửa trả lời
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
                                                                setCommentHearts(
                                                                  (prev) => ({
                                                                    ...prev,
                                                                    [c._id]:
                                                                      data.count,
                                                                  })
                                                                );
                                                                setComments(
                                                                  (prev) =>
                                                                    prev.map(
                                                                      (com) => {
                                                                        if (
                                                                          com._id !==
                                                                          c._id
                                                                        )
                                                                          return com;
                                                                        return {
                                                                          ...com,
                                                                          reactions:
                                                                          {
                                                                            ...com.reactions,
                                                                            heart:
                                                                              Array.isArray(
                                                                                data.hearts
                                                                              )
                                                                                ? data.hearts
                                                                                : [],
                                                                          },
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
                                                      {r.authorName}
                                                    </span>
                                                  </div>
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
                                                      type="submit"
                                                      disabled={
                                                        !user ||
                                                        sending ||
                                                        !replyText.trim()
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
                                                          onEmojiClick={(e, emojiObj) => {
                                                            setReplyText((prev) => prev + (e.emoji || ""));
                                                            // Không đóng picker khi chọn emoji, chỉ đóng khi nhấn nút Đóng
                                                          }}
                                                        />
                                                      </React.Suspense>
                                                    </div>
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
                            <div style={{ marginTop: 8, marginLeft: 46 }}>
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
                                  {(() => {
                                    if (
                                      typeof activeReplyTo === "string" &&
                                      activeReplyTo.startsWith("reply-")
                                    ) {
                                      const parts = activeReplyTo.split("-");
                                      const replyId = parts.slice(2).join("-");
                                      const reply = (c.replies || []).find(
                                        (r: any) => r._id === replyId
                                      );
                                      return reply
                                        ? reply.authorName
                                        : c.authorName;
                                    }
                                    // Nếu đang trả lời comment cha
                                    return c.authorName;
                                  })()}
                                </span>
                              </div>
                              <form
                                onSubmit={(e) => submitReply(c._id, e)}
                                style={{ display: "flex", gap: 8 }}
                              >
                                <input
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
                                            onEmojiClick={(e, emojiObj) => {
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
                                <button
                                  type="submit"
                                  disabled={
                                    !user || sending || !replyText.trim()
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
              gap: 8,
              alignItems: "flex-end",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                gap: 8,
              }}
            >
              <input
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
                  padding: 10,
                  borderRadius: 999,
                  border: "1px solid #e6e6ef",
                  fontSize: 15,
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
                  (!newComment.trim() && newImages.length === 0)
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
            {/*Phần emoji bên trong*/}
            {/* {showEmoji && (
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
                }}
              >
                <React.Suspense fallback={<div>Đang tải emoji...</div>}>
                  <EmojiPicker
                    onEmojiClick={(emojiData: any) => {
                      setNewComment(
                        (c) => c + (emojiData.emoji || emojiData.unified || "")
                      );
                    }}
                  />
                  <div style={{ textAlign: "right", marginTop: 6 }}>
                    <button
                      type="button"
                      style={{
                        background: "#eee",
                        border: "none",
                        borderRadius: 6,
                        padding: "4px 12px",
                        cursor: "pointer",
                      }}
                      onClick={() => setShowEmoji(false)}
                    >
                      Đóng
                    </button>
                  </div>
                </React.Suspense>
              </div>
            )} */}
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
        </div>
      </div>
    </div>
  );
};

export default CommentModal;
