import React, { useState } from 'react';
import { X } from 'lucide-react';

interface EditPostModalProps {
  post: {
    _id: string;
    content: string;
    images?: string[];
    videos?: string[];
  };
  isOpen: boolean;
  onClose: () => void;
  onSave: (postId: string, newContent: string) => void;
}

const EditPostModal: React.FC<EditPostModalProps> = ({
  post,
  isOpen,
  onClose,
  onSave
}) => {
  const [content, setContent] = useState(post.content);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    
    setSaving(true);
    try {
      await onSave(post._id, content.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: 12,
        width: '100%',
        maxWidth: 500,
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #e4e6eb'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
            Chỉnh sửa bài viết
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: 8,
              borderRadius: '50%',
              cursor: 'pointer',
              color: '#65676b'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 20 }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Bạn đang nghĩ gì?"
            style={{
              width: '100%',
              minHeight: 120,
              border: 'none',
              resize: 'vertical',
              fontSize: 16,
              fontFamily: 'inherit',
              outline: 'none'
            }}
          />
          
          {/* Show existing media (read-only for now) */}
          {(post.images?.length || post.videos?.length) && (
            <div style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: '#f8f9fa',
              borderRadius: 8,
              fontSize: 14,
              color: '#65676b'
            }}>
              📎 Bài viết có {post.images?.length || 0} ảnh và {post.videos?.length || 0} video
              <br />
              <small>Hiện tại chưa thể chỉnh sửa media</small>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          padding: '16px 20px',
          borderTop: '1px solid #e4e6eb'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #ccd0d5',
              borderRadius: 6,
              background: 'white',
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim() || saving}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: 6,
              background: content.trim() && !saving ? '#1877f2' : '#ccd0d5',
              color: 'white',
              cursor: content.trim() && !saving ? 'pointer' : 'not-allowed',
              fontSize: 14
            }}
          >
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;