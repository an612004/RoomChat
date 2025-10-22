import React, { useState } from 'react';
import './HeaderNotify.css';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LogOut , Bell , House , TvMinimalPlay , Blocks , MessageCircleMore } from 'lucide-react';

const Header: React.FC = () => {
  // ...existing code...
  // Đã khai báo các biến này ở đầu component, không cần lặp lại

  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [showNotify, setShowNotify] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const unreadCount = notifications.filter((n:any) => {
    const readBy = Array.isArray(n.readBy) ? n.readBy : [];
  const uid = user?.email ?? null;
    return !readBy.includes(uid);
  }).length;

  // Lấy thông báo từ Firestore
  const fetchNotifications = async () => {
    try {
      const res = await fetch('http://localhost:3000/auth/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setHasUnread(data.notifications.length > 0);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      setNotifications([]);
    }
  };

  React.useEffect(() => {
    fetchNotifications();
  }, []);

  React.useEffect(() => {
    if (showNotify && hasUnread) {
      setHasUnread(false);
    }
  }, [showNotify, hasUnread]);
  React.useEffect(() => {
    if (showNotify && hasUnread) {
      setHasUnread(false);
    }
  }, [showNotify, hasUnread]);
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
      <button
        className={`nav-item${location.pathname === '/home' ? ' active' : ''}`}
        onClick={() => navigate('/home')}
      >
        <span className="nav-icon"><House size={16} /></span>
        <span className="nav-text">Trang Chủ</span>
      </button>
      <button
        className={`nav-item${location.pathname === '/entertainment' ? ' active' : ''}`}
        onClick={() => navigate('/entertainment/home')}
      >
        <span className="nav-icon"><TvMinimalPlay size={16} /></span>
        <span className="nav-text">Giải Trí</span>
      </button>
      <button
        className={`nav-item${location.pathname === '/community' ? ' active' : ''}`}
        onClick={() => navigate('/community')}
      >
        <span className="nav-icon"><Blocks size={16} /></span>
        <span className="nav-text">Cộng Đồng</span>
      </button>
      <button
        className={`nav-item${location.pathname === '/Chat' ? ' active' : ''}`}
        onClick={() => navigate('/Chat')}
      >
        <span className="nav-icon"><MessageCircleMore size={16} /></span>
        <span className="nav-text">Chat Riêng</span>
      </button>
    </nav>
        
        {/* User Actions */}
        <div className="header-actions">
          {isLoggedIn && user ? (
            <>
              {/* Notification Bell */}
              <button
                className="action-btn notification-btn"
                title="Thông báo"
                onClick={async () => {
                  // when opening (showing) popup, mark unread as read on server
                  const willOpen = !showNotify;
                  if (willOpen) {
                    const uid = user?.email ?? null;
                    const unreadIds = notifications.filter((n:any) => { const readBy = Array.isArray(n.readBy) ? n.readBy : []; return !readBy.includes(uid); }).map((n:any) => n._id || n.id).filter(Boolean);
                    if (unreadIds.length > 0 && uid) {
                      try {
                        await fetch('http://localhost:3000/auth/notifications/mark-read', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ids: unreadIds, userId: uid })
                        });
                      } catch (err) {
                        // ignore
                      }
                      // refresh
                      fetchNotifications();
                    }
                    setHasUnread(false);
                  }
                  setShowNotify(v => !v);
                }}
              >
                <Bell size={18} />
                {unreadCount > 0 ? (
                  <span className="notification-badge">{unreadCount}</span>
                ) : null}
              </button>
              {/* Notification Popup */}
              {showNotify && (
                <div className="notify-popup" onClick={e => e.stopPropagation()}>
                  <div className="notify-popup-header">
                    <span className="font-bold text-purple-700 text-lg">Thông báo 📢</span>
                    <button className="notify-close" onClick={() => setShowNotify(false)}>&times;</button>
                  </div>
                  <div className="notify-popup-list" style={{textAlign:'left'}}>
                    {notifications.length === 0 ? (
                      <div className="text-gray-500 p-3">Không có thông báo nào !</div>
                    ) : (
                      notifications
                        .sort((a, b) => {
                          // Ưu tiên sort theo createdAt (MongoDB), fallback sang date (Firestore)
                          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.date && a.date.seconds ? a.date.seconds * 1000 : 0);
                          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.date && b.date.seconds ? b.date.seconds * 1000 : 0);
                          return dateB - dateA;
                        })
                        .slice(0, 5)
                        .map((notify: any, idx: number) => {
                          const link = notify.link || (notify.content.match(/(https?:\/\/[^\s]+)/)?.[1] ?? null);
                          let dateStr = '';
                          if (notify.createdAt) {
                            const d = new Date(notify.createdAt);
                            dateStr = isNaN(d.getTime()) ? '' : d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
                          } else if (notify.date && typeof notify.date === 'object' && (notify.date.seconds || notify.date._seconds)) {
                            const sec = notify.date.seconds || notify.date._seconds;
                            dateStr = new Date(sec * 1000).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
                          } else if (notify.date) {
                            const d = new Date(notify.date);
                            dateStr = isNaN(d.getTime()) ? '' : d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
                          }
                          return (
                            <div key={idx} className="notify-popup-item" style={{borderRadius:16, boxShadow:'0 2px 8px #e0e7ff', background:'#fff', margin:'10px 0', padding:'16px 18px 14px 18px', position:'relative', textAlign:'left', minWidth:220, maxWidth:340}}>
                              <div className="notify-popup-title" style={{fontWeight:600, fontSize:17, color:'#6d28d9', marginBottom:4}}>{notify.title}</div>
                              <div className="notify-popup-content" style={{fontSize:15, marginBottom:14, lineHeight:1.6}} dangerouslySetInnerHTML={{__html: notify.content.replace(/(https?:\/\/[^\s]+)/g, '<a href=\"$1\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color:#e11d48;text-decoration:underline\">$1</a>')}} />
                              <div className="notify-popup-date" style={{fontSize:13, color:'#888', marginTop:10}}>{dateStr}</div>
                              {link && (
                                <button
                                  className="notify-link-btn"
                                  style={{position:'absolute', top:12, right:18, background:'linear-gradient(90deg,#a78bfa,#f472b6)', color:'#fff', border:'none', borderRadius:8, padding:'4px 12px', fontWeight:500, fontSize:13, cursor:'pointer', boxShadow:'0 1px 4px #e0e7ff'}}
                                  onClick={() => window.open(link, '_blank', 'noopener,noreferrer')}
                                >
                                  Xem Ngay !
                                </button>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              )}
              
              {/* User Profile */}
              <div onClick={() => navigate('/profile')} className="user-profile">
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