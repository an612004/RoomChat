import React, { useState, useEffect } from "react";
import { Tag, MapPin, Laugh, Heart, Share2 } from "lucide-react";
import CommentSection from "./CommentSection";
import CommentModal from "./CommentModal";
const EmojiPicker = React.lazy(() => import("./EmojiPicker"));
import "./Trangchu.css";
import useAuth from "../../hooks/useAuth";
import ShareModal from "./share_post/ShareModal";

const Trangchu = () => {
  // State cho modal chia sẻ bài viết
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareContent, setShareContent] = useState("");
  const [sharePrivacy, setSharePrivacy] = useState("public");
  const [sharePost, setSharePost] = useState<any | null>(null);
  // State cho modal xem nhiều ảnh
  const [modalImageIndex, setModalImageIndex] = useState<number>(0);
  // State cho modal xem ảnh lớn
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState<string>("");
  // Comment modal state
  const [showCommentModal, setShowCommentModal] = useState(false);
  // Emoji picker state
  const [showEmoji, setShowEmoji] = React.useState(false);
  const emojiPickerRef = React.useRef<HTMLDivElement | null>(null);

  const [activePost, setActivePost] = useState<any | null>(null);
  const { user } = useAuth();
  const [showPostForm, setShowPostForm] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [postContent, setPostContent] = useState("");
  const [postImages, setPostImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [postVideos, setPostVideos] = useState<File[]>([]);
  const [previewVideos, setPreviewVideos] = useState<string[]>([]);

  // Fetch posts
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/post");
      const data = await res.json();
      if (data.success) setPosts(data.posts);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Poll for new posts and merge them into the feed without reload
  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const res = await fetch("http://localhost:3000/post");
        const data = await res.json();
        if (!mounted || !data?.success) return;
        const latest = data.posts || [];
        setPosts((prev) => {
          const prevIds = new Set(prev.map((p: any) => p._id));
          const merged = [...prev];
          latest.forEach((lp: any) => {
            if (!prevIds.has(lp._id)) {
              const p = { ...lp, _justNow: true };
              merged.unshift(p);
              // clear justNow after 30s
              setTimeout(
                () =>
                  setPosts((cur) =>
                    cur.map((x: any) =>
                      x._id === p._id ? { ...x, _justNow: false } : x
                    )
                  ),
                30000
              );
            } else {
              // update existing post inplace if changed (merge by id)
              const idx = merged.findIndex((m: any) => m._id === lp._id);
              if (idx !== -1) merged[idx] = { ...merged[idx], ...lp };
            }
          });
          return merged;
        });
      } catch (err) {
        // ignore
      }
    };
    const id = setInterval(poll, 3000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  // State for editing post
  const [editing, setEditing] = useState<{ [key: string]: boolean }>({});
  const [editContent, setEditContent] = useState<{ [key: string]: string }>({});
  // Apply small patch to a post in local state
  const handlePostUpdate = (postId: string, patch: Partial<any>) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === postId ? { ...p, ...patch } : p))
    );
    setActivePost((prev: any | null) =>
      prev && prev._id === postId ? { ...prev, ...patch } : prev
    );
  };
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
  const [openPostMenu, setOpenPostMenu] = useState<string | null>(null);
  // Media edit state keyed by post id
  const [editExistingImages, setEditExistingImages] = useState<{
    [key: string]: string[];
  }>({});
  const [editExistingVideos, setEditExistingVideos] = useState<{
    [key: string]: string[];
  }>({});
  const [editNewImages, setEditNewImages] = useState<{ [key: string]: File[] }>(
    {}
  );
  const [editNewVideos, setEditNewVideos] = useState<{ [key: string]: File[] }>(
    {}
  );
  const [editPreviewImages, setEditPreviewImages] = useState<{
    [key: string]: string[];
  }>({});
  const [editPreviewVideos, setEditPreviewVideos] = useState<{
    [key: string]: string[];
  }>({});

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f0f2f5",
        paddingTop: 32,
        paddingBottom: 32,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Container 1 - Phần đăng bài */}
      <div
        className="container"
        style={{ width: "100%", maxWidth: 600, margin: "0 auto" }}
      >
        <div className="post-box">
          <img src={user?.avatar} alt="Avatar" className="avatar" />
          <button
            onClick={() => setShowPostForm(!showPostForm)}
            className="thought-btn"
          >
            {user?.name}, bạn đang nghĩ gì thế?
          </button>
        </div>
        {showPostForm && (
          <div className="post-form-container">
            <form
              className="post-form"
              onSubmit={async (e) => {
                e.preventDefault();
                setUploadError(null);
                setUploadSuccess(null);
                if (!user || !postContent.trim()) return;
                setUploading(true);
                let uploadedImages: string[] = [];
                let uploadedVideos: string[] = [];
                let uploadData: any = undefined;
                try {
                  if (postImages.length > 0 || postVideos.length > 0) {
                    const formData = new FormData();
                    postImages.forEach((img) => formData.append("images", img));
                    postVideos.forEach((video) =>
                      formData.append("videos", video)
                    );
                    const uploadRes = await fetch(
                      "http://localhost:3000/upload",
                      {
                        method: "POST",
                        body: formData,
                      }
                    );
                    uploadData = await uploadRes.json();
                    if (uploadData && uploadData.success) {
                      uploadedImages = uploadData.imageUrls || [];
                      uploadedVideos = uploadData.videoUrls || [];
                      setPreviewImages([]);
                      setPreviewVideos([]);
                    } else {
                      throw new Error(uploadData?.message || "Upload thất bại");
                    }
                  }
                  const res = await fetch("http://localhost:3000/post", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      authorId: user.email,
                      authorName: user.name,
                      authorAvatar: user.avatar,
                      content: postContent,
                      images: uploadedImages,
                      videos: uploadedVideos,
                      imagePublicIds:
                        uploadData && uploadData.imageMeta
                          ? uploadData.imageMeta.map((m: any) => m.public_id)
                          : [],
                      videoPublicIds:
                        uploadData && uploadData.videoMeta
                          ? uploadData.videoMeta.map((m: any) => m.public_id)
                          : [],
                    }),
                  });
                  const data = await res.json();
                  if (data.success && data.post) {
                    setPostContent("");
                    setPostImages([]);
                    setPostVideos([]);
                    setShowPostForm(false);
                    setUploadSuccess("Đăng bài thành công!");
                    const p = { ...data.post, _justNow: true };
                    setPosts((prev) => [p, ...prev]);
                    setTimeout(
                      () =>
                        setPosts((prev) =>
                          prev.map((x) =>
                            x._id === p._id ? { ...x, _justNow: false } : x
                          )
                        ),
                      30000
                    );
                  } else {
                    throw new Error(data?.message || "Đăng bài thất bại");
                  }
                } catch (err: any) {
                  setUploadError(err?.message || "Upload thất bại");
                } finally {
                  setUploading(false);
                }
              }}
            >
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowPostForm(false)}
              >
                ✕
              </button>
              <textarea
                placeholder="Bạn đang nghĩ gì?"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                disabled={uploading}
              />
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                disabled={uploading}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  // Cho phép chọn nhiều ảnh và nhiều video cùng lúc
                  const imageFiles = files.filter((f) =>
                    f.type.startsWith("image/")
                  );
                  const videoFiles = files.filter((f) =>
                    f.type.startsWith("video/")
                  );
                  setPostImages((prev) => [...prev, ...imageFiles]);
                  setPostVideos((prev) => [...prev, ...videoFiles]);
                  // Preview images
                  const imageReaders = imageFiles.map((file) => {
                    return new Promise<string>((resolve) => {
                      const reader = new FileReader();
                      reader.onload = (ev) =>
                        resolve(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    });
                  });
                  Promise.all(imageReaders).then((imgs) =>
                    setPreviewImages((prev) => [...prev, ...imgs])
                  );
                  // Preview videos
                  const videoReaders = videoFiles.map((file) => {
                    return new Promise<string>((resolve) => {
                      const reader = new FileReader();
                      reader.onload = (ev) =>
                        resolve(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    });
                  });
                  Promise.all(videoReaders).then((vids) =>
                    setPreviewVideos((prev) => [...prev, ...vids])
                  );
                }}
              />
              {/* Preview images */}
              {previewImages.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    margin: "8px 0",
                    flexWrap: "wrap",
                  }}
                >
                  {previewImages.map((img, idx) => (
                    <div
                      key={idx}
                      style={{ position: "relative", width: 80, height: 80 }}
                    >
                      <img
                        src={img}
                        alt="preview"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                      />
                      {/* Nút gỡ ảnh */}
                      <button
                        type="button"
                        style={{
                          position: "absolute",
                          top: 2,
                          right: 2,
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: "rgba(0,0,0,0.7)",
                          color: "#fff",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 16,
                          zIndex: 2,
                          transition: "background 0.2s",
                        }}
                        onClick={() => {
                          setPreviewImages(
                            previewImages.filter((_, i) => i !== idx)
                          );
                          setPostImages(postImages.filter((_, i) => i !== idx));
                        }}
                        aria-label="Gỡ ảnh"
                      >
                        ×
                      </button>
                      {/* Nút zoom ảnh */}
                      <button
                        type="button"
                        style={{
                          position: "absolute",
                          bottom: 2,
                          right: 2,
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "#e5e7eb",
                          color: "#222",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          zIndex: 2,
                          boxShadow: "0 2px 8px #0002",
                        }}
                        onClick={() => {
                          setShowImageModal(true);
                          setModalImageSrc(img);
                        }}
                        aria-label="Xem chi tiết ảnh"
                      >
                        <span
                          role="img"
                          aria-label="Zoom"
                          style={{ fontSize: 20 }}
                        >
                          🔍
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Loading, error, success */}
              {uploading && (
                <div style={{ color: "#2563eb", margin: "8px 0" }}>
                  Đang upload ảnh/video...
                </div>
              )}
              {uploadError && (
                <div style={{ color: "red", margin: "8px 0" }}>
                  {uploadError}
                </div>
              )}
              {uploadSuccess && (
                <div style={{ color: "green", margin: "8px 0" }}>
                  {uploadSuccess}
                </div>
              )}
              {/* Preview videos */}
              {/* Modal xem chi tiết ảnh */}
              {showImageModal && (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.7)",
                    zIndex: 1000,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 12,
                  }}
                  onClick={() => setShowImageModal(false)}
                >
                  <img
                    src={modalImageSrc}
                    alt="zoom"
                    style={{
                      maxWidth: "92vw",
                      maxHeight: "86vh",
                      borderRadius: 12,
                      boxShadow: "0 8px 32px #0008",
                    }}
                  />
                </div>
              )}

              {/* Preview videos */}
              {previewVideos.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    margin: "8px 0",
                    flexWrap: "wrap",
                  }}
                >
                  {previewVideos.map((vid, idx) => (
                    <video
                      key={idx}
                      src={vid}
                      controls
                      style={{
                        width: 120,
                        height: 80,
                        borderRadius: 8,
                        background: "#000",
                      }}
                    />
                  ))}
                </div>
              )}
              <div className="post-actions">
                <span className="post-actions-title">
                  Thêm vào bài viết của bạn
                </span>
                <div className="post-icons">
                  <button
                    title="Gắn thẻ"
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: 22,
                      cursor: "pointer",
                      color: "#3810fe",
                    }}
                  >
                    <Tag size={25} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEmoji((v) => !v)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: 22,
                      cursor: "pointer",
                      color: "#facc15",
                    }}
                    title="Chèn emoji"
                  >
                    <Laugh size={25} strokeWidth={2} color="#facc15" />
                  </button>

                  {showEmoji && (
                    <div
                      ref={emojiPickerRef}
                      style={{
                        position: "fixed",
                        left: "50%",
                        bottom: 32,
                        transform: "translateX(-50%)",
                        zIndex: 100,
                        background: "#fff",
                        border: "1px solid #e4e6eb",
                        borderRadius: 14,
                        padding: "12px 0 0 0",
                        boxShadow: "0 8px 32px #0002",
                        width: 360,
                        minHeight: 480,
                        maxHeight: "70vh",
                        display: "flex",
                        flexDirection: "column",
                        overflowY: "auto",
                      }}
                    >
                      <style>{`
                        .EmojiPickerReact {
                          background: #fff !important;
                          border-radius: 14px !important;
                          box-shadow: none !important;
                          border: none !important;
                          padding: 0 !important;
                        }
                        .EmojiPickerReact .epr-search-container {
                          background: #fff !important;
                          border: none !important;
                        }
                        .EmojiPickerReact .epr-search {
                          background: #fff !important;
                          border: 1px solid #e4e6eb !important;
                          color: #222 !important;
                        }
                        .EmojiPickerReact .epr-search input {
                          background: #fff !important;
                          color: #222 !important;
                          border: none !important;
                        }
                        .EmojiPickerReact .epr-search button {
                          background: #fff !important;
                          border: none !important;
                        }
                        .EmojiPickerReact .epr-category-nav, .EmojiPickerReact .epr-emoji-category-label {
                          background: #fff !important;
                          border: none !important;
                        }
                        .EmojiPickerReact .epr-category {
                          background: #fff !important;
                          border: none !important;
                          box-shadow: none !important;
                          color: #222 !important;
                        }
                        .EmojiPickerReact .epr-category svg {
                          background: #fff !important;
                          color: #222 !important;
                        }
                        .EmojiPickerReact .epr-category button {
                          background: #fff !important;
                          color: #222 !important;
                          border: none !important;
                        }
                        .EmojiPickerReact .epr-category.epr-active,
                        .EmojiPickerReact .epr-category.epr-active svg,
                        .EmojiPickerReact .epr-category.epr-active button {
                          background: #f3f4f6 !important;
                          border-radius: 8px !important;
                          color: #222 !important;
                          box-shadow: none !important;
                        }
                        .EmojiPickerReact .epr-category:hover,
                        .EmojiPickerReact .epr-category:hover svg,
                        .EmojiPickerReact .epr-category:hover button {
                          background: #f3f4f6 !important;
                          color: #222 !important;
                        }
                        .EmojiPickerReact .epr-emoji {
                          background: transparent !important;
                          border: none !important;
                          box-shadow: none !important;
                          margin: 2px !important;
                          padding: 2px !important;
                        }
                        .EmojiPickerReact .epr-emoji[aria-selected="true"] {
                          background: #f3f4f6 !important;
                        }
                        .EmojiPickerReact .epr-emoji-category-content {
                          padding-bottom: 24px !important;
                        }
                      `}</style>
                      <React.Suspense fallback={<div>Đang tải emoji...</div>}>
                        <EmojiPicker
                          onEmojiClick={(emojiData: any) => {
                            setPostContent(
                              (c) =>
                                c + (emojiData.emoji || emojiData.unified || "")
                            );
                          }}
                        />
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            padding: "8px 12px 8px 0",
                          }}
                        >
                          <button
                            type="button"
                            style={{
                              background: "#f3f4f6",
                              border: "none",
                              borderRadius: 8,
                              padding: "6px 18px",
                              cursor: "pointer",
                              color: "#222",
                              fontWeight: 500,
                              fontSize: 16,
                              boxShadow: "0 2px 8px #0001",
                            }}
                            onClick={() => setShowEmoji(false)}
                          >
                            Đóng
                          </button>
                        </div>
                      </React.Suspense>
                    </div>
                  )}
                  <button
                    title="Vị trí"
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: 22,
                      cursor: "pointer",
                      color: "#fe3110",
                    }}
                  >
                    <MapPin size={25} />
                  </button>
                </div>
              </div>
              <button type="submit">Đăng</button>
            </form>
          </div>
        )}
      </div>
      {/* Container 2 - Phần hiển thị nội dung khác */}
      <div
        className="container1"
        style={{ width: "100%", maxWidth: 600, margin: "0 auto" }}
      >
        <div className="post-box">
          {loading ? (
            <p>Đang tải...</p>
          ) : posts.length === 0 ? (
            <p className="text-center">Các bảng tin đang được tải...</p>
          ) : (
            posts.map((post) => {
              const isAuthor = user && post.authorId === user.email;
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
                  onMouseOver={(e) =>
                    (e.currentTarget.style.boxShadow = "0 8px 32px #b6b8c355")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.boxShadow = "0 4px 24px #b6b8c355")
                  }
                >
                  <div
                    className="post-header"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 8,
                      justifyContent: "flex-start",
                    }}
                  >
                    <img
                      className="post-header-avatar"
                      src={post.authorAvatar || "/default-avatar.png"}
                      alt={post.authorName}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
                      }}
                    />
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
                          fontSize: 15,
                          color: "#1b1b1b",
                        }}
                      >
                        {post.authorName}
                      </div>
                      <div style={{ fontSize: 12, color: "#65676b" }}>
                        {formatTime(post.createdAt, post._justNow)}
                      </div>
                    </div>
                    {isAuthor && (
                      <div
                        style={{
                          marginLeft: "auto",
                          display: "flex",
                          gap: 8,
                          position: "relative",
                        }}
                      >
                        <button
                          aria-label="Post options"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenPostMenu(
                              openPostMenu === post._id ? null : post._id
                            );
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#6366f1",
                            cursor: "pointer",
                            fontSize: 20,
                            padding: 6,
                          }}
                        >
                          ⋯
                        </button>
                        {openPostMenu === post._id && (
                          <div
                            style={{
                              position: "absolute",
                              right: 0,
                              top: "120%",
                              background: "#fff",
                              border: "1px solid #e6e6f0",
                              borderRadius: 8,
                              boxShadow: "0 6px 18px #0002",
                              zIndex: 50,
                              overflow: "hidden",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setOpenPostMenu(null);
                                // initialize edit state
                                setEditing((prev) => ({
                                  ...prev,
                                  [post._id]: true,
                                }));
                                setEditContent((prev) => ({
                                  ...prev,
                                  [post._id]: post.content,
                                }));
                                setEditExistingImages((prev) => ({
                                  ...prev,
                                  [post._id]: post.images
                                    ? [...post.images]
                                    : [],
                                }));
                                setEditExistingVideos((prev) => ({
                                  ...prev,
                                  [post._id]: post.videos
                                    ? [...post.videos]
                                    : [],
                                }));
                                setEditNewImages((prev) => ({
                                  ...prev,
                                  [post._id]: [],
                                }));
                                setEditNewVideos((prev) => ({
                                  ...prev,
                                  [post._id]: [],
                                }));
                                setEditPreviewImages((prev) => ({
                                  ...prev,
                                  [post._id]: [],
                                }));
                                setEditPreviewVideos((prev) => ({
                                  ...prev,
                                  [post._id]: [],
                                }));
                              }}
                              style={{
                                display: "block",
                                padding: "8px 14px",
                                background: "none",
                                border: "none",
                                width: 220,
                                textAlign: "left",
                                cursor: "pointer",
                                color: "#6366f1",
                              }}
                            >
                              Sửa
                            </button>
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setOpenPostMenu(null);
                                if (
                                  !confirm(
                                    "Bạn chắc chắn muốn xóa bài viết này?"
                                  )
                                )
                                  return;
                                await fetch(
                                  `http://localhost:3000/post/${post._id}`,
                                  {
                                    method: "DELETE",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      userEmail: user.email,
                                    }),
                                  }
                                );
                                fetchPosts();
                              }}
                              style={{
                                display: "block",
                                padding: "8px 14px",
                                background: "none",
                                border: "none",
                                width: 220,
                                textAlign: "left",
                                cursor: "pointer",
                                color: "#e11d48",
                              }}
                            >
                              Xóa
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      margin: "18px 0",
                      fontSize: 18,
                      lineHeight: 1.7,
                      color: "#222",
                      wordBreak: "break-word",
                    }}
                  >
                    {editing[post._id] ? (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!user) return;
                          // Prepare upload for new media
                          let uploadedImages: string[] = [];
                          let uploadedVideos: string[] = [];
                          const newImgs = editNewImages[post._id] || [];
                          const newVids = editNewVideos[post._id] || [];
                          if (newImgs.length > 0 || newVids.length > 0) {
                            const formData = new FormData();
                            newImgs.forEach((f) =>
                              formData.append("images", f)
                            );
                            newVids.forEach((f) =>
                              formData.append("videos", f)
                            );
                            const uploadRes = await fetch(
                              "http://localhost:3000/upload",
                              { method: "POST", body: formData }
                            );
                            const uploadData = await uploadRes.json();
                            if (uploadData.success) {
                              uploadedImages = uploadData.imageUrls || [];
                              uploadedVideos = uploadData.videoUrls || [];
                              // attach public ids if available
                              var uploadedImagePublicIds = (
                                uploadData.imageMeta || []
                              ).map((m: any) => m.public_id);
                              var uploadedVideoPublicIds = (
                                uploadData.videoMeta || []
                              ).map((m: any) => m.public_id);
                            }
                          }
                          const finalImages = (
                            editExistingImages[post._id] || []
                          ).concat(uploadedImages);
                          const finalVideos = (
                            editExistingVideos[post._id] || []
                          ).concat(uploadedVideos);
                          await fetch(
                            `http://localhost:3000/post/${post._id}`,
                            {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                userEmail: user.email,
                                content: editContent[post._id],
                                images: finalImages,
                                videos: finalVideos,
                                imagePublicIds: uploadedImagePublicIds || [],
                                videoPublicIds: uploadedVideoPublicIds || [],
                              }),
                            }
                          );
                          setEditing((e) => ({ ...e, [post._id]: false }));
                          // clear edit media buffers
                          setEditNewImages((prev) => ({
                            ...prev,
                            [post._id]: [],
                          }));
                          setEditNewVideos((prev) => ({
                            ...prev,
                            [post._id]: [],
                          }));
                          setEditPreviewImages((prev) => ({
                            ...prev,
                            [post._id]: [],
                          }));
                          setEditPreviewVideos((prev) => ({
                            ...prev,
                            [post._id]: [],
                          }));
                          fetchPosts();
                        }}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <textarea
                          value={editContent[post._id] || ""}
                          onChange={(e) =>
                            setEditContent((c) => ({
                              ...c,
                              [post._id]: e.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            padding: 8,
                            borderRadius: 10,
                            border: "1px solid #e0e7ff",
                            fontSize: 16,
                            minHeight: 100,
                          }}
                        />
                        {/* Existing images */}
                        {(editExistingImages[post._id] || []).length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            {(editExistingImages[post._id] || []).map(
                              (img: string, idx: number) => {
                                const src = img.startsWith("/uploads/")
                                  ? `http://localhost:3000${img}`
                                  : img;
                                return (
                                  <div
                                    key={idx}
                                    style={{
                                      position: "relative",
                                      width: 100,
                                      height: 100,
                                    }}
                                  >
                                    <img
                                      src={src}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        borderRadius: 8,
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        // Only delete from Cloudinary if not local
                                        if (!img.startsWith("/uploads/")) {
                                          try {
                                            const publicId = img
                                              .split("/")
                                              .pop()
                                              ?.split(".")[0]; // crude extraction, expects public_id in URL
                                            const res = await fetch(
                                              "http://localhost:3000/media/delete",
                                              {
                                                method: "DELETE",
                                                headers: {
                                                  "Content-Type":
                                                    "application/json",
                                                },
                                                body: JSON.stringify({
                                                  public_id: publicId,
                                                  resource_type: "image",
                                                }),
                                              }
                                            );
                                            const data = await res.json();
                                            if (!data.success)
                                              alert(
                                                "Xóa ảnh trên Cloudinary thất bại: " +
                                                  (data.message || "")
                                              );
                                          } catch (err) {
                                            alert("Lỗi xóa ảnh Cloudinary");
                                          }
                                        }
                                        setEditExistingImages((prev) => ({
                                          ...prev,
                                          [post._id]: (
                                            prev[post._id] || []
                                          ).filter((_, i) => i !== idx),
                                        }));
                                      }}
                                      style={{
                                        position: "absolute",
                                        top: 6,
                                        right: 6,
                                        width: 26,
                                        height: 26,
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
                                );
                              }
                            )}
                          </div>
                        )}
                        {/* Existing videos */}
                        {(editExistingVideos[post._id] || []).length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            {(editExistingVideos[post._id] || []).map(
                              (v: string, idx: number) => (
                                <div
                                  key={idx}
                                  style={{
                                    position: "relative",
                                    width: 160,
                                    height: 90,
                                  }}
                                >
                                  <video
                                    src={
                                      v.startsWith("/uploads/")
                                        ? `http://localhost:3000${v}`
                                        : v
                                    }
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      borderRadius: 8,
                                      background: "#000",
                                    }}
                                    controls
                                  />
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      // Only delete from Cloudinary if not local
                                      if (!v.startsWith("/uploads/")) {
                                        try {
                                          const publicId = v
                                            .split("/")
                                            .pop()
                                            ?.split(".")[0]; // crude extraction, expects public_id in URL
                                          const res = await fetch(
                                            "http://localhost:3000/media/delete",
                                            {
                                              method: "DELETE",
                                              headers: {
                                                "Content-Type":
                                                  "application/json",
                                              },
                                              body: JSON.stringify({
                                                public_id: publicId,
                                                resource_type: "video",
                                              }),
                                            }
                                          );
                                          const data = await res.json();
                                          if (!data.success)
                                            alert(
                                              "Xóa video trên Cloudinary thất bại: " +
                                                (data.message || "")
                                            );
                                        } catch (err) {
                                          alert("Lỗi xóa video Cloudinary");
                                        }
                                      }
                                      setEditExistingVideos((prev) => ({
                                        ...prev,
                                        [post._id]: (
                                          prev[post._id] || []
                                        ).filter((_, i) => i !== idx),
                                      }));
                                    }}
                                    style={{
                                      position: "absolute",
                                      top: 6,
                                      right: 6,
                                      width: 26,
                                      height: 26,
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
                              )
                            )}
                          </div>
                        )}
                        {/* New media previews */}
                        {(editPreviewImages[post._id] || []).length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            {(editPreviewImages[post._id] || []).map(
                              (p, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    position: "relative",
                                    width: 100,
                                    height: 100,
                                  }}
                                >
                                  <img
                                    src={p}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                      borderRadius: 8,
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditPreviewImages((prev) => ({
                                        ...prev,
                                        [post._id]: (
                                          prev[post._id] || []
                                        ).filter((_, i) => i !== idx),
                                      }));
                                      setEditNewImages((prev) => ({
                                        ...prev,
                                        [post._id]: (
                                          prev[post._id] || []
                                        ).filter((_, i) => i !== idx),
                                      }));
                                    }}
                                    style={{
                                      position: "absolute",
                                      top: 6,
                                      right: 6,
                                      width: 26,
                                      height: 26,
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
                              )
                            )}
                          </div>
                        )}
                        {(editPreviewVideos[post._id] || []).length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            {(editPreviewVideos[post._id] || []).map(
                              (p, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    position: "relative",
                                    width: 160,
                                    height: 90,
                                  }}
                                >
                                  <video
                                    src={p}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      borderRadius: 8,
                                      background: "#000",
                                    }}
                                    controls
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditPreviewVideos((prev) => ({
                                        ...prev,
                                        [post._id]: (
                                          prev[post._id] || []
                                        ).filter((_, i) => i !== idx),
                                      }));
                                      setEditNewVideos((prev) => ({
                                        ...prev,
                                        [post._id]: (
                                          prev[post._id] || []
                                        ).filter((_, i) => i !== idx),
                                      }));
                                    }}
                                    style={{
                                      position: "absolute",
                                      top: 6,
                                      right: 6,
                                      width: 26,
                                      height: 26,
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
                              )
                            )}
                          </div>
                        )}
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              const imgs = files.filter((f) =>
                                f.type.startsWith("image/")
                              );
                              const vids = files.filter((f) =>
                                f.type.startsWith("video/")
                              );
                              if (imgs.length > 0) {
                                setEditNewImages((prev) => ({
                                  ...prev,
                                  [post._id]: (prev[post._id] || []).concat(
                                    imgs
                                  ),
                                }));
                                const readers = imgs.map(
                                  (file) =>
                                    new Promise<string>((resolve) => {
                                      const reader = new FileReader();
                                      reader.onload = (ev) =>
                                        resolve(ev.target?.result as string);
                                      reader.readAsDataURL(file);
                                    })
                                );
                                Promise.all(readers).then((results) =>
                                  setEditPreviewImages((prev) => ({
                                    ...prev,
                                    [post._id]: (prev[post._id] || []).concat(
                                      results
                                    ),
                                  }))
                                );
                              }
                              if (vids.length > 0) {
                                setEditNewVideos((prev) => ({
                                  ...prev,
                                  [post._id]: (prev[post._id] || []).concat(
                                    vids
                                  ),
                                }));
                                const readers = vids.map(
                                  (file) =>
                                    new Promise<string>((resolve) => {
                                      const reader = new FileReader();
                                      reader.onload = (ev) =>
                                        resolve(ev.target?.result as string);
                                      reader.readAsDataURL(file);
                                    })
                                );
                                Promise.all(readers).then((results) =>
                                  setEditPreviewVideos((prev) => ({
                                    ...prev,
                                    [post._id]: (prev[post._id] || []).concat(
                                      results
                                    ),
                                  }))
                                );
                              }
                            }}
                          />
                        </div>
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
                            onClick={() =>
                              setEditing((e) => ({ ...e, [post._id]: false }))
                            }
                          >
                            Hủy
                          </button>
                        </div>
                      </form>
                    ) : (
                      post.content
                    )}
                  </div>
                  {/* Hình ảnh lớn, rõ ràng, nằm dưới tên, avatar và nội dung */}
                  {post.images && post.images.length > 0 && (
                    <div
                      style={{
                        display: "grid",
                        gap: 8,
                        margin: "18px 0 0 0",
                        gridTemplateColumns:
                          post.images.length === 1
                            ? "1fr"
                            : post.images.length === 2
                            ? "1fr 1fr"
                            : "2fr 1fr",
                        gridTemplateRows:
                          post.images.length <= 2
                            ? "1fr"
                            : post.images.length === 3
                            ? "1fr 1fr"
                            : "1fr 1fr",
                        gridAutoFlow: "dense",
                        justifyContent: "center",
                        alignItems: "center",
                        maxWidth: "700px",
                        minHeight: "340px",
                        position: "relative",
                      }}
                    >
                      {post.images.map((img: string, idx: number) => {
                        const src = img.startsWith("/uploads/")
                          ? `http://localhost:3000${img}`
                          : img;
                        let style: React.CSSProperties = {
                          width: "100%",
                          height:
                            post.images.length === 1
                              ? "420px"
                              : post.images.length === 2
                              ? "340px"
                              : idx === 0
                              ? "340px"
                              : "165px",
                          objectFit: "cover",
                          borderRadius: 16,
                          boxShadow: "0 4px 24px #b6b8c355",
                          cursor: "zoom-in",
                          gridColumn:
                            post.images.length === 1
                              ? "1/2"
                              : post.images.length === 2
                              ? idx === 0
                                ? "1/2"
                                : "2/3"
                              : idx === 0
                              ? "1/2"
                              : "2/3",
                          gridRow:
                            post.images.length <= 2
                              ? "1/2"
                              : idx === 0
                              ? "1/3"
                              : idx === 1
                              ? "1/2"
                              : "2/3",
                          position: "relative",
                        };
                        // Nếu là ảnh thứ 4 và còn dư, hiện +N
                        if (idx === 3 && post.images.length > 4) {
                          return (
                            <div key={idx} style={{ position: "relative" }}>
                              <img
                                className="post-img"
                                src={src}
                                alt={`post-img-${idx}`}
                                style={style}
                                onClick={() => {
                                  setModalImageIndex(idx);
                                  setModalImageSrc(src);
                                  setShowImageModal(true);
                                }}
                              />
                              <div
                                className="plusN-overlay"
                                onClick={() => {
                                  setModalImageIndex(idx);
                                  setModalImageSrc(src);
                                  setShowImageModal(true);
                                }}
                              >
                                +{post.images.length - 4}
                              </div>
                            </div>
                          );
                        }
                        // Chỉ hiển thị 4 ảnh đầu, các ảnh sau không render
                        if (idx > 3) return null;
                        return (
                          <img
                            key={idx}
                            className="post-img"
                            src={src}
                            alt={`post-img-${idx}`}
                            style={style}
                            onClick={() => {
                              setModalImageIndex(idx);
                              setModalImageSrc(src);
                              setShowImageModal(true);
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                  {/* Modal xem nhiều ảnh, có mũi tên chuyển ảnh */}
                  {showImageModal && (
                    <div
                      style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.92)",
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animation: "fadeIn .2s",
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {/* Mũi tên trái */}
                        <button
                          style={{
                            position: "absolute",
                            left: 24,
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: 38,
                            color: "#fff",
                            background: "rgba(0,0,0,0.6)",
                            border: "none",
                            borderRadius: "50%",
                            cursor: "pointer",
                            zIndex: 10001,
                            width: 56,
                            height: 56,
                            display: modalImageIndex > 0 ? "flex" : "none",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 8px #222",
                            transition: "background 0.2s",
                          }}
                          onClick={() => {
                            if (modalImageIndex > 0) {
                              const newIdx = modalImageIndex - 1;
                              setModalImageIndex(newIdx);
                              const src = post.images[newIdx].startsWith(
                                "/uploads/"
                              )
                                ? `http://localhost:3000${post.images[newIdx]}`
                                : post.images[newIdx];
                              setModalImageSrc(src);
                            }
                          }}
                          aria-label="Trước"
                        >
                          &#8592;
                        </button>
                        <img
                          src={modalImageSrc}
                          alt="large"
                          style={{
                            maxWidth: "80vw",
                            maxHeight: "90vh",
                            borderRadius: "18px",
                            boxShadow: "0 8px 32px #222",
                            background: "#fff",
                            margin: "0 auto",
                            display: "block",
                            objectFit: "contain",
                            animation: "zoomIn .3s cubic-bezier(.4,0,.2,1)",
                          }}
                        />
                        {/* Mũi tên phải */}
                        <button
                          style={{
                            position: "absolute",
                            right: 24,
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: 38,
                            color: "#fff",
                            background: "rgba(0,0,0,0.6)",
                            border: "none",
                            borderRadius: "50%",
                            cursor: "pointer",
                            zIndex: 10001,
                            width: 56,
                            height: 56,
                            display:
                              modalImageIndex < post.images.length - 1
                                ? "flex"
                                : "none",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 8px #222",
                            transition: "background 0.2s",
                          }}
                          onClick={() => {
                            if (modalImageIndex < post.images.length - 1) {
                              const newIdx = modalImageIndex + 1;
                              setModalImageIndex(newIdx);
                              const src = post.images[newIdx].startsWith(
                                "/uploads/"
                              )
                                ? `http://localhost:3000${post.images[newIdx]}`
                                : post.images[newIdx];
                              setModalImageSrc(src);
                            }
                          }}
                          aria-label="Tiếp"
                        >
                          &#8594;
                        </button>
                        <button
                          style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            fontSize: 32,
                            color: "#fff",
                            background: "rgba(0,0,0,0.5)",
                            border: "none",
                            borderRadius: "50%",
                            cursor: "pointer",
                            zIndex: 10001,
                            padding: "2px 10px",
                            lineHeight: 1,
                            transition: "color 0.2s",
                          }}
                          onClick={() => setShowImageModal(false)}
                          aria-label="Đóng"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Hiển thị video nếu có */}
                  {post.videos && post.videos.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: 16,
                        margin: "18px 0 0 0",
                        flexWrap: "wrap",
                        justifyContent: "center",
                      }}
                    >
                      {post.videos.map((vid: string, idx: number) => {
                        const src = vid.startsWith("/uploads/")
                          ? `http://localhost:3000${vid}`
                          : vid;
                        return (
                          <video
                            key={idx}
                            src={src}
                            controls
                            style={{
                              width: 340,
                              height: 340,
                              borderRadius: 16,
                              boxShadow: "0 4px 24px #b6b8c355",
                              background: "#000",
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      gap: 24,
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <button
                      onClick={async () => {
                        if (!user) return;
                        // Cập nhật UI ngay lập tức
                        setPosts((prev) =>
                          prev.map((p) => {
                            if (p._id !== post._id) return p;
                            const liked = p.likes?.includes(user.email);
                            let newLikes;
                            if (liked) {
                              newLikes = p.likes.filter(
                                (id: string) => id !== user.email
                              );
                            } else {
                              newLikes = [...(p.likes || []), user.email];
                            }
                            return { ...p, likes: newLikes };
                          })
                        );
                        // Gọi API đồng bộ lại
                        try {
                          const res = await fetch(
                            `http://localhost:3000/post/${post._id}/like`,
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ userId: user.email }),
                            }
                          );
                          const data = await res.json();
                          if (data.success && Array.isArray(data.likes)) {
                            setPosts((prev) =>
                              prev.map((p) =>
                                p._id === post._id
                                  ? { ...p, likes: data.likes }
                                  : p
                              )
                            );
                          } else if (data?.message) {
                            alert(data.message);
                          }
                        } catch (err) {
                          alert(
                            "Không thể kết nối máy chủ. Vui lòng thử lại!\n" +
                              (err instanceof Error ? err.message : "")
                          );
                        }
                      }}
                      style={{
                        color: post.likes?.includes(user?.email)
                          ? "#e11d48"
                          : "#888",
                        fontWeight: 700,
                        fontSize: 17,
                        background: "#f3f4f6",
                        border: "none",
                        borderRadius: 8,
                        padding: "4px 18px",
                        transition: "background .2s",
                        cursor: "pointer",
                      }}
                    >
                      <Heart size={16} strokeWidth={1} />{" "}
                      {post.likes?.length || 0}
                    </button>
                    <button
                      onClick={() => {
                        setSharePost(post);
                        setShowShareModal(true);
                        setShareContent("");
                        setSharePrivacy("public");
                      }}
                      style={{
                        color: "#6366f1",
                        fontWeight: 700,
                        fontSize: 17,
                        background: "#f3f4f6",
                        border: "none",
                        borderRadius: 8,
                        padding: "4px 18px",
                        transition: "background .2s",
                        cursor: "pointer",
                      }}
                    >
                      <Share2 size={16} strokeWidth={1} /> {post.shares || 0}
                    </button>
                  </div>
                  {/* Comment section - refactored */}
                  <CommentSection
                    comments={post.comments || []}
                    onShowModal={() => {
                      setActivePost(post);
                      setShowCommentModal(true);
                    }}
                  />
                  {/* Modal chia sẻ bài viết */}
                  {showShareModal && (
                    <ShareModal
                      open={showShareModal}
                      user={user}
                      shareContent={shareContent}
                      sharePrivacy={sharePrivacy}
                      onClose={() => setShowShareModal(false)}
                      onContentChange={setShareContent}
                      onShare={async (content, privacy) => {
                        if (!user || !sharePost) return;
                        try {
                          const res = await fetch(
                            `http://localhost:3000/post/${sharePost._id}/share`,
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                userId: user.email,
                                authorName: user.name,
                                authorAvatar: user.avatar,
                                content,
                                privacy,
                              }),
                            }
                          );
                          const data = await res.json();
                          if (data.success && data.sharedPost) {
                            setPosts((prev) => [data.sharedPost, ...prev]);
                          }
                        } catch (err) {
                          // TODO: Hiển thị thông báo lỗi
                        }
                        setShowShareModal(false);
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      {/* Global Comment Modal */}
      {showCommentModal && activePost && (
        <CommentModal
          post={activePost}
          onClose={() => setShowCommentModal(false)}
          user={user}
          onPostUpdate={handlePostUpdate}
        />
      )}
      {/* Modal chia sẻ bài viết */}
      {showShareModal && sharePost && (
        <ShareModal
          open={showShareModal}
          user={user}
          shareContent={shareContent}
          sharePrivacy={sharePrivacy}
          onClose={() => setShowShareModal(false)}
          onContentChange={setShareContent}
          onPrivacyChange={setSharePrivacy}
          onShare={async (content: string, privacy: string) => {
            if (!user || !content.trim()) return;
            await fetch(`http://localhost:3000/post/${sharePost._id}/share`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.email,
                content,
                privacy,
              }),
            });
            setShowShareModal(false);
            setShareContent("");
            setSharePrivacy("public");
            setSharePost(null);
            fetchPosts();
          }}
        />
      )}
    </div>
  );
};

export default Trangchu;
