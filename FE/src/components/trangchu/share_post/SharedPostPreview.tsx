import React from "react";

interface SharedPostPreviewProps {
  open: boolean;
  sharedPost: any;
  onClose: () => void;
}

const SharedPostPreview: React.FC<SharedPostPreviewProps> = ({
  open,
  sharedPost,
  onClose,
}) => {
  if (!open || !sharedPost) return null;

  const formatTime = (iso: string | Date) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: 24,
          width: "100%",
          maxWidth: 480,
          padding: 32,
          position: "relative",
          boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
          color: "#fff",
          fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif",
          animation: "slideIn 0.4s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng */}
        <button
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(255,255,255,0.2)",
            border: "none",
            color: "#fff",
            borderRadius: "50%",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: 18,
            fontWeight: 600,
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
          onClick={onClose}
          aria-label="Đóng"
        >
          ×
        </button>

        {/* Tiêu đề */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            🎉 Chia sẻ thành công!
          </div>
          <div style={{ fontSize: 16, opacity: 0.9 }}>
            Bài viết đã được chia sẻ lên timeline của bạn
          </div>
        </div>

        {/* Thông tin người chia sẻ */}
        <div
          style={{
            background: "rgba(255,255,255,0.15)",
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <img
              src={sharedPost.authorAvatar || "/default-avatar.png"}
              alt={sharedPost.authorName}
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: "3px solid rgba(255,255,255,0.3)",
              }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>
                {sharedPost.authorName}
              </div>
              <div style={{ fontSize: 14, opacity: 0.8 }}>
                {formatTime(sharedPost.createdAt)} • Đã chia sẻ
              </div>
            </div>
          </div>
          {sharedPost.content && (
            <div style={{ fontSize: 16, lineHeight: 1.5, opacity: 0.95 }}>
              {sharedPost.content}
            </div>
          )}
        </div>

        {/* Bài viết gốc */}
        {sharedPost.sharedPost && (
          <div
            style={{
              background: "rgba(255,255,255,0.95)",
              borderRadius: 16,
              padding: 18,
              color: "#333",
              boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <img
                src={sharedPost.sharedPost.originalAuthorAvatar || "/default-avatar.png"}
                alt={sharedPost.sharedPost.originalAuthorName}
                style={{ width: 36, height: 36, borderRadius: "50%" }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: "#1a1a1a" }}>
                  {sharedPost.sharedPost.originalAuthorName}
                </div>
                <div style={{ fontSize: 13, color: "#666" }}>
                  {formatTime(sharedPost.sharedPost.originalCreatedAt)}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 15, color: "#2a2a2a", marginBottom: 12, lineHeight: 1.4 }}>
              {sharedPost.sharedPost.originalContent}
            </div>
            {sharedPost.sharedPost.originalImages && sharedPost.sharedPost.originalImages.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {sharedPost.sharedPost.originalImages.slice(0, 3).map((img: string, idx: number) => (
                  <img
                    key={idx}
                    src={img.startsWith("/uploads/") ? `http://localhost:3000${img}` : img}
                    alt={`img-${idx}`}
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: "cover",
                      borderRadius: 12,
                      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    }}
                  />
                ))}
                {sharedPost.sharedPost.originalImages.length > 3 && (
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#f0f0f0",
                      borderRadius: 12,
                      fontWeight: 600,
                      fontSize: 14,
                      color: "#666",
                    }}
                  >
                    +{sharedPost.sharedPost.originalImages.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Nút hành động */}
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.2)",
              border: "2px solid rgba(255,255,255,0.3)",
              color: "#fff",
              borderRadius: 12,
              padding: "12px 20px",
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.3)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.2)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
            onClick={onClose}
          >
            Xem timeline
          </button>
          <button
            style={{
              flex: 1,
              background: "#fff",
              border: "none",
              color: "#667eea",
              borderRadius: 12,
              padding: "12px 20px",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(255,255,255,0.3)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(255,255,255,0.4)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(255,255,255,0.3)";
            }}
            onClick={onClose}
          >
            Hoàn tất
          </button>
        </div>

        <style>
          {`
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: scale(0.9) translateY(20px);
              }
              to {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default SharedPostPreview;