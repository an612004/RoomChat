import React from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';

interface ProfilePostActionsProps {
  isLiked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
}

const ProfilePostActions: React.FC<ProfilePostActionsProps> = ({
  isLiked = false,
  onLike,
  onComment,
  onShare
}) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
      paddingTop: 12,
      borderTop: '1px solid #e4e6eb'
    }}>
      <button
        onClick={onLike}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: 'none',
          padding: '8px 16px',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 15,
          fontWeight: 600,
          color: isLiked ? '#e11d48' : '#65676b',
          transition: 'all 0.2s',
          flex: 1,
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f3f4f6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Heart 
          size={20} 
          fill={isLiked ? '#e11d48' : 'none'}
          stroke={isLiked ? '#e11d48' : '#65676b'}
        />
        {isLiked ? 'Đã thích' : 'Thích'}
      </button>

      <button
        onClick={onComment}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: 'none',
          padding: '8px 16px',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 15,
          fontWeight: 600,
          color: '#65676b',
          transition: 'all 0.2s',
          flex: 1,
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f3f4f6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <MessageCircle size={20} />
        Bình luận
      </button>

      <button
        onClick={onShare}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: 'none',
          padding: '8px 16px',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 15,
          fontWeight: 600,
          color: '#65676b',
          transition: 'all 0.2s',
          flex: 1,
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f3f4f6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Share2 size={20} />
        Chia sẻ
      </button>
    </div>
  );
};

export default ProfilePostActions;