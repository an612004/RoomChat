import React, { useEffect } from 'react';

interface PostUpdateNotificationProps {
  show: boolean;
  onClose: () => void;
}

const PostUpdateNotification: React.FC<PostUpdateNotificationProps> = ({ show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Tự động ẩn sau 3 giây

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      backgroundColor: '#10b981',
      color: 'white',
      padding: '12px 20px',
      borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      animation: 'slideIn 0.3s ease-out',
      fontSize: 14,
      fontWeight: 500
    }}>
      <span role="img" aria-label="success">✅</span>
      Bài viết mới đã được cập nhật!
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          marginLeft: 8,
          fontSize: 16,
          padding: 0
        }}
      >
        ×
      </button>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default PostUpdateNotification;