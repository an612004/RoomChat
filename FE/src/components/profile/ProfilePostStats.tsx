import React from 'react';

interface ProfilePostStatsProps {
  likes: number;
  shares: number;
  comments: number;
}

const ProfilePostStats: React.FC<ProfilePostStatsProps> = ({ 
  likes, 
  shares, 
  comments 
}) => {
  return (
    <>
      {/* Like và Share counts */}
      <div style={{ 
        display: 'flex', 
        gap: 24, 
        alignItems: 'center', 
        marginBottom: 8 
      }}>
        <span style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 6, 
          color: '#e11d48', 
          fontWeight: 700, 
          fontSize: 17, 
          background: '#f3f4f6', 
          borderRadius: 8, 
          padding: '4px 18px' 
        }}>
          ❤️ {likes}
        </span>
        <span style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 6, 
          color: '#6366f1', 
          fontWeight: 700, 
          fontSize: 17, 
          background: '#f3f4f6', 
          borderRadius: 8, 
          padding: '4px 18px' 
        }}>
          <span role="img" aria-label="share">🔄</span> {shares}
        </span>
      </div>
      
      {/* Comment count */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 6, 
        color: '#888', 
        fontSize: 15 
      }}>
        <span role="img" aria-label="comment">💬</span> {comments} bình luận
      </div>
    </>
  );
};

export default ProfilePostStats;