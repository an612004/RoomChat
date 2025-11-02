import React, { useState } from "react";
import EmojiPicker from "./../EmojiPicker";
import { MessageCircle, Smile } from "lucide-react";
interface ShareModalProps {
  open: boolean;
  user: any;
  shareContent: string;
  sharePrivacy: string;
  onClose: () => void;
  onContentChange: (v: string) => void;
  onPrivacyChange?: (v: string) => void;
  onShare: (content: string, privacy: string) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({
  open,
  user,
  shareContent,
  sharePrivacy,
  onClose,
  onContentChange,
  onPrivacyChange,
  onShare,
}) => {
  const [showEmoji, setShowEmoji] = React.useState(false);
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.18)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "max(12px, 2vw)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 8px 32px #0002",
          width: "100%",
          maxWidth: "420px",
          minWidth: "min(280px, 90vw)",
          padding: "clamp(18px, 5vw, 32px) clamp(12px, 4vw, 24px)",
          position: "relative",
          fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "#f6f7fb",
            border: "1px solid #e5e7eb",
            color: "#222",
            borderRadius: 8,
            padding: "6px 18px",
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
            zIndex: 100,
            boxShadow: "0 2px 8px #0001",
            transition: "background .2s, color .2s",
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#e5e7eb'; e.currentTarget.style.color = '#2563eb'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#f6f7fb'; e.currentTarget.style.color = '#222'; }}
          onClick={onClose}
          aria-label="Đóng"
        >
          X
        </button>
        <h2
          style={{
            textAlign: "center",
            fontWeight: 700,
            fontSize: "clamp(18px, 5vw, 22px)",
            marginBottom: "clamp(12px, 4vw, 20px)",
            letterSpacing: 0.5,
          }}
        >
          Chia sẻ bài viết
        </h2>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 18,
            justifyContent: "flex-start",
          }}
        >
          <img
            src={user?.avatar}
            alt="Ảnh đại diện"
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              objectFit: "cover",
              background: "#eee",
            }}
          />
          <div style={{ fontWeight: 600, fontSize: 16 }}>{user?.name}</div>
        </div>
        <div style={{ width: "100%" }}>
          <textarea
            value={shareContent}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Nói gì đó về nội dung này..."
            style={{
              width: "100%",
              minHeight: "clamp(70px, 18vw, 110px)",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              padding: "clamp(8px, 2vw, 14px)",
              fontSize: "clamp(15px, 4vw, 17px)",
              marginBottom: "clamp(8px, 2vw, 12px)",
              resize: "vertical",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 24,
              marginBottom: 10,
              color: "#6366f1",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 500,
            }}
            onClick={() => setShowEmoji((v) => !v)}
            aria-label="Chọn emoji"
          >
            <Smile size={24} /> <span style={{ fontSize: 15 }}>Chèn emoji</span>
          </button>
          {showEmoji && (
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "calc(50% + 220px)",
                transform: "translateY(-50%)",
                zIndex: 99999,
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 8px 32px #0002",
                padding: 10,
                minWidth: 260,
                maxWidth: 340,
                border: "1px solid #e5e7eb",
              }}
            >
              <button
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "#f6f7fb",
                  border: "1px solid #e5e7eb",
                  color: "#222",
                  borderRadius: 8,
                  padding: "4px 14px",
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: "pointer",
                  zIndex: 100,
                  boxShadow: "0 2px 8px #0001",
                  transition: "background .2s, color .2s",
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#e5e7eb'; e.currentTarget.style.color = '#2563eb'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#f6f7fb'; e.currentTarget.style.color = '#222'; }}
                onClick={() => setShowEmoji(false)}
                aria-label="Đóng emoji"
              >
                Đóng
              </button>
              <EmojiPicker
                onEmojiClick={(e: any) => {
                  onContentChange(shareContent + (e.emoji || ""));
                  // Không đóng form emoji, cho phép chọn nhiều emoji liên tục
                }}
              />
            </div>
          )}
          <button
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "clamp(10px, 3vw, 16px) 0",
              fontWeight: 700,
              fontSize: "clamp(16px, 5vw, 18px)",
              width: "100%",
              marginTop: "clamp(8px, 2vw, 14px)",
              cursor: "pointer",
              boxShadow: "0 2px 8px #2563eb22",
              transition: "background .2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              touchAction: "manipulation",
            }}
            onClick={() => onShare(shareContent, sharePrivacy)}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>Chia sẻ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
