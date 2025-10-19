import React, { useState } from 'react';
import './Trangchu.css';
import useAuth from "../../hooks/useAuth";
import { useNavigate } from 'react-router-dom';


const Trangchu = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPostForm, setShowPostForm] = useState(false);

  const PostFormModal: React.FC<{ open: boolean; onClose: () => void; user: any }> = ({ open, onClose, user }) => {
    const [content, setContent] = useState('');
    if (!open) return null;
    return (
      <div className="post-modal-bg">
        <div className="post-modal">
          {/* Header */}
          <div className="post-modal-header">
            <h2 className="post-modal-title">Tạo bài viết mới</h2>
            <button className="post-modal-close" onClick={onClose}>×</button>
          </div>
          {/* Content Container */}
          <div className="post-modal-content">
            {/* User Info */}
            <div className="post-modal-user">
              <img src={user?.avatar || '/default-avatar.png'} alt={user?.name} />
              <div className="post-modal-user-info">
                <div className="post-modal-user-name">{user?.name || 'User'}</div>
                <select className="post-modal-select">
                  <option>Công khai</option>
                  <option>Bạn bè</option>
                  <option>Riêng tư</option>
                </select>
              </div>
            </div>
            {/* Content Input */}
            <textarea
              className="post-modal-textarea"
              placeholder={user?.name ? `${user.name} ơi, bạn đang nghĩ gì thế?` : 'Bạn đang nghĩ gì thế?'}
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            {/* Add to post bar - all in one container */}
            <div className="post-modal-addbar">
              <span>Thêm vào bài viết của bạn</span>
              <button><span className="text-2xl" style={{background:'linear-gradient(90deg,#ff80b5,#9089fc)',WebkitBackgroundClip:'text',color:'transparent'}}>Aa</span></button>
              <button><img src="/icon-image.png" alt="Ảnh" /></button>
              <button><img src="/icon-tag.png" alt="Gắn thẻ" /></button>
              <button><img src="/icon-messenger.png" alt="Messenger" /></button>
              <button><img src="/icon-emoji.png" alt="Cảm xúc" /></button>
              <button><img src="/icon-location.png" alt="Vị trí" /></button>
              <button><img src="/icon-more.png" alt="Thêm" /></button>
            </div>
          </div>
          {/* Footer */}
          <div className="post-modal-footer">
            <button className="post-modal-submit">Đăng</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Container 1 - Phần đăng bài */}
      <div className="container">
        <div className="post-box">
          <img src={user?.avatar} alt="Avatar" className="avatar" />
          <button onClick={() => setShowPostForm(!showPostForm)} className="thought-btn">
            {user?.name}, bạn đang nghĩ gì thế?
          </button>
        </div>
      </div>
    {showPostForm && (
  <div className="post-form-container">
    <form className="post-form">
      <button
        type="button"
        className="close-btn"
        onClick={() => setShowPostForm(false)}
      >
        ✕
      </button>

      {/* Phần nhập nội dung */}
      <textarea placeholder="Bạn đang nghĩ gì?" />

      {/* Thanh công cụ thêm vào bài viết */}
      <div className="post-actions">
        <span className="post-actions-title">Thêm vào bài viết của bạn</span>
        <div className="post-icons">
          <button type="button" title="Ảnh/Video" className="icon-btn">📷</button>
          <button type="button" title="Gắn thẻ bạn bè" className="icon-btn">👥</button>
          <button type="button" title="Cảm xúc/Hoạt động" className="icon-btn">😊</button>
          <button type="button" title="Vị trí" className="icon-btn">📍</button>
          <button type="button" title="Thêm" className="icon-btn">⋯</button>
        </div>
      </div>

      {/* Nút đăng */}
      <button type="submit">Đăng</button>
    </form>
  </div>
)}



      {/* Container 2 - Phần hiển thị nội dung khác */}
      <div className="container1">
        <div className="post-box">
          <h3>Bài viết mới nhất</h3>
          <p>Hiển thị danh sách bài viết, bình luận hoặc video...</p>
        </div>
      </div>
      
    </>
  );
};

export default Trangchu;
