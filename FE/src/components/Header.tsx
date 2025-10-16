import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LogOut , Bell , House , TvMinimalPlay , Blocks , MessageCircleMore } from 'lucide-react';

const Header: React.FC = () => {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  const handleLogout = (): void => {
    logout();
    navigate('/login');
    setShowConfirm(false);
  };

  return (
    <header className='header'>
      <div className="header-content">
        {/* Logo Section */}
        <div className="header-brand">
          <div className='logo-img animate-jelly'>
            <img src="/logo.png" alt="Anbi Logo" />
          </div>
          <div className="brand-info">
            <h2 className="brand-title">Anbi</h2>
            <span className="brand-tagline">Connect & Chat</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="header-nav">
          <button className="nav-item active" onClick={() => navigate('/home')}>
            <span className="nav-icon"><House size={16} /></span>
            <span className="nav-text">Trang Chủ</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/entertainment')}>
            <span className="nav-icon"><TvMinimalPlay size={16} /></span>
            <span className="nav-text">Giải Trí</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/community')}>
            <span className="nav-icon"><Blocks size={16} /></span>
            <span className="nav-text">Cộng Đồng</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/Chat')}>
            <span className="nav-icon"><MessageCircleMore size={16} /></span>
            <span className="nav-text">Chat Riêng</span>
          </button>
        </nav>
        
        {/* User Actions */}
        <div className="header-actions">
          {isLoggedIn && user ? (
            <>
              {/* Notification Bell */}
              <button className="action-btn notification-btn" title="Thông báo">
                <Bell size={18} />
              </button>
              
              {/* User Profile */}
              <div className="user-profile">
                <div className="user-avatar">
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="avatar-img"
                  />
                  <div className="online-indicator"></div>
                </div>
                <div className="user-info">
                  <span className="user-greeting">Xin chào</span>
                 <span className="user-name text-black font-semibold">{user.name}</span>

                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={() => setShowConfirm(true)}
                className="action-btn logout-btn"
                title="Đăng xuất"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button onClick={() => navigate('/login')} className="login-btn">
              Đăng nhập
            </button> 
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showConfirm && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <div className="logout-modal-header">
              <h3>Confirm logout</h3>
            </div>
            <div className="logout-modal-body">
              <p>Are you sure you want to log out of your account?</p>
              {user && (
                <div className="user-info-confirm">
                  <img src={user.avatar} alt={user.name} className="avatar-small" />
                  <span>{user.name}</span>
                </div>
              )}
            </div>
            <div className="logout-modal-footer">
              <button 
                onClick={() => setShowConfirm(false)} 
                className="btn btn-cancel"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout} 
                className="btn btn-confirm"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;