import React, { useState, useEffect } from 'react';
import './NotificationManager.css';

interface User {
  id?: string;
  name: string;
  email: string;
  avatar: string;
  provider: string;
  createdAt?: { seconds: number };
  isVerified?: boolean;
}

interface Notification {
  _id?: string;
  id?: string;
  title: string;
  content: string;
  link?: string;
  sendType: 'all' | 'selected';
  recipients?: string[];
  createdAt?: string | Date;
  date?: { seconds: number; _seconds?: number };
}

interface NotificationManagerProps {
  users: User[];
  onRefreshNotifications?: () => void;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ 
  users, 
  onRefreshNotifications 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifyForm, setNotifyForm] = useState({ 
    title: '', 
    content: '', 
    link: '',
    sendType: 'all' as 'all' | 'selected'
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');

  // Helper: extract first link from content
  const extractFirstLink = (content: string) => {
    const match = content.match(/(https?:\/\/[^\s]+)/);
    return match ? match[1] : null;
  };

  // Filter users based on search term and verification status
  const filteredUsers = users.filter(user => {
    // Search filter
    const searchMatch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Verification filter
    const verificationMatch = 
      filterVerified === 'all' ||
      (filterVerified === 'verified' && user.isVerified) ||
      (filterVerified === 'unverified' && !user.isVerified);
    
    return searchMatch && verificationMatch;
  });

  // Get user info by ID
  const getUserInfo = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? { name: user.name, email: user.email } : { name: 'Unknown', email: 'Unknown' };
  };

  // Handle form input
  const handleNotifyInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNotifyForm({ ...notifyForm, [name]: value });
    
    // Show/hide user selector based on send type
    if (name === 'sendType') {
      setShowUserSelector(value === 'selected');
      if (value === 'all') {
        setSelectedUsers([]);
      }
    }
  };



  // Handle user selection for targeted notifications
  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Select all filtered users
  const handleSelectAllUsers = () => {
    const allUserIds = filteredUsers.map(user => user.id!).filter(id => id);
    setSelectedUsers(allUserIds);
  };

  // Clear all selections
  const handleClearAllUsers = () => {
    setSelectedUsers([]);
  };

  // Add notification
  const handleAddNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyForm.title || !notifyForm.content) return;
    
    // Validate selected users if sendType is 'selected'
    if (notifyForm.sendType === 'selected' && selectedUsers.length === 0) {
      alert('Vui lòng chọn ít nhất một user để gửi thông báo!');
      return;
    }
    
    const notificationData = {
      ...notifyForm,
      recipients: notifyForm.sendType === 'all' ? [] : selectedUsers
    };
    
    try {
      const res = await fetch('http://localhost:3000/auth/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData)
      });
      const data = await res.json();
      if (data.success) {
        setNotifyForm({ title: '', content: '', link: '', sendType: 'all' });
        setSelectedUsers([]);
        setShowUserSelector(false);
        fetchNotifications();
        onRefreshNotifications?.();
        alert('✅ Thông báo đã được gửi thành công!');
      } else {
        alert('❌ Lỗi khi tạo thông báo!');
      }
    } catch (err) {
      alert('❌ Lỗi khi tạo thông báo!');
    }
  };

  // Delete notification
  const handleDeleteNotify = async (idx: number) => {
    const notify = notifications[idx];
    const notifyId = notify._id || notify.id;
    if (!notifyId) return;
    
    if (!confirm('Bạn có chắc muốn xóa thông báo này?')) return;
    
    try {
      const res = await fetch(`http://localhost:3000/auth/notifications/${notifyId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchNotifications();
        onRefreshNotifications?.();
        alert('✅ Đã xóa thông báo thành công!');
      } else {
        alert('❌ Lỗi khi xóa thông báo!');
      }
    } catch (err) {
      alert('❌ Lỗi khi xóa thông báo!');
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch('http://localhost:3000/auth/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      setNotifications([]);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <section className="notification-manager">
      <div className="manager-header">
        <h2>📢 Quản lý Thông báo</h2>
        <div className="header-stats">
          <span className="stat-item">
            👥 {users.length} người dùng
          </span>
          <span className="stat-item">
            📋 {notifications.length} thông báo
          </span>
        </div>
      </div>
      
      {/* Horizontal Layout */}
      <div className="manager-content">
        {/* Left Panel - Create Form */}
        <div className="create-panel">
          <div className="panel-header">
            <h3>✨ Tạo thông báo</h3>
          </div>
          
          <form onSubmit={handleAddNotify} className="notify-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">
                <span className="label-icon">📝</span>
                <span className="label-text">Tiêu đề thông báo</span>
                <span className="required">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={notifyForm.title}
                onChange={handleNotifyInput}
                placeholder="VD: Cập nhật tính năng mới..."
                required
                className="title-input"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="content">
              <span className="label-icon">✍️</span>
              <span className="label-text">Nội dung thông báo</span>
              <span className="required">*</span>
            </label>
            <div className="content-editor">
              <textarea
                name="content"
                value={notifyForm.content}
                onChange={handleNotifyInput}
                placeholder="Nhập nội dung chi tiết thông báo của bạn..."
                rows={4}
                required
                className="content-textarea"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="link">
                <span className="label-icon">🔗</span>
                <span className="label-text">Liên kết (tùy chọn)</span>
              </label>
              <input
                type="url"
                name="link"
                value={notifyForm.link}
                onChange={handleNotifyInput}
                placeholder="https://example.com"
                className="link-input"
              />
            </div>
          </div>
          
          {/* Recipient Selection */}
          <div className="recipient-section">
            <label className="recipient-label">
              <span className="label-icon">📤</span>
              <span className="label-text">Người nhận</span>
            </label>
            
            <div className="recipient-options">
              <div className="radio-option">
                <input
                  type="radio"
                  id="send-all"
                  name="sendType"
                  value="all"
                  checked={notifyForm.sendType === 'all'}
                  onChange={handleNotifyInput}
                />
                <label htmlFor="send-all" className="radio-label">
                  <div className="radio-content">
                    <span className="radio-icon">🌍</span>
                    <div className="radio-text">
                      <span className="radio-title">Tất cả người dùng</span>
                      <span className="radio-desc">Gửi đến toàn bộ {users.length} người dùng</span>
                    </div>
                  </div>
                </label>
              </div>
              
              <div className="radio-option">
                <input
                  type="radio"
                  id="send-selected"
                  name="sendType"
                  value="selected"
                  checked={notifyForm.sendType === 'selected'}
                  onChange={handleNotifyInput}
                />
                <label htmlFor="send-selected" className="radio-label">
                  <div className="radio-content">
                    <span className="radio-icon">👥</span>
                    <div className="radio-text">
                      <span className="radio-title">Người dùng được chọn</span>
                      <span className="radio-desc">Chọn những người dùng cụ thể</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* User Selector */}
          {showUserSelector && (
            <div className="user-selector-card">
              <div className="selector-header">
                <div className="selector-title">
                  <span className="selector-icon">👥</span>
                  <h4>Chọn người nhận</h4>
                </div>
                <div className="selector-actions">
                  <button 
                    type="button" 
                    onClick={handleSelectAllUsers}
                    className="compact-btn select-all"
                    title="Chọn tất cả người dùng hiện tại"
                  >
                    ✅ Tất cả
                  </button>
                  <button 
                    type="button" 
                    onClick={handleClearAllUsers}
                    className="compact-btn clear-all"
                    title="Bỏ chọn tất cả"
                  >
                    🔄 Xóa chọn
                  </button>
                </div>
              </div>
              
              {/* Search Input */}
              <div className="search-section">
                <div className="search-input-wrapper">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên hoặc email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="clear-search"
                    >
                      ✖
                    </button>
                  )}
                </div>
                
                {/* Verification Filter */}
                <div className="filter-section">
                  <div className="filter-label">
                    <span className="filter-icon">🔍</span>
                    <span>Lọc tài khoản:</span>
                  </div>
                  <div className="filter-buttons">
                    <button
                      type="button"
                      onClick={() => setFilterVerified('all')}
                      className={`filter-btn ${filterVerified === 'all' ? 'active' : ''}`}
                    >
                      👥 Tất cả ({users.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterVerified('verified')}
                      className={`filter-btn ${filterVerified === 'verified' ? 'active' : ''}`}
                    >
                      ✅ Tích xanh ({users.filter(u => u.isVerified).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterVerified('unverified')}
                      className={`filter-btn ${filterVerified === 'unverified' ? 'active' : ''}`}
                    >
                      ⚪ Chưa xác thực ({users.filter(u => !u.isVerified).length})
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="user-grid-horizontal">
                {filteredUsers.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">👤</div>
                    <div className="empty-text">
                      {searchTerm ? 'Không tìm thấy người dùng nào' : 'Chưa có người dùng nào'}
                    </div>
                  </div>
                ) : (
                  filteredUsers.map(user => (
                    <div 
                      key={user.id} 
                      className={`user-card-horizontal ${selectedUsers.includes(user.id!) ? 'selected' : ''}`}
                      onClick={() => handleUserSelect(user.id!)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id!)}
                        onChange={() => handleUserSelect(user.id!)}
                        className="user-checkbox-hidden"
                      />
                      <div className="user-avatar-section">
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="user-avatar-small"
                        />
                        {user.isVerified && (
                          <div className="verified-icon">✓</div>
                        )}
                      </div>
                      <div className="user-info-compact">
                        <div className="user-name-compact">{user.name}</div>
                        <div className="user-email-compact">{user.email}</div>
                      </div>
                      <div className="user-provider-badge">
                        {user.provider}
                      </div>
                      <div className="selection-check">
                        <div className="checkmark-small">✓</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="selection-summary">
                <div className="summary-stats">
                  <span className="selected-count">
                    Đã chọn: <strong>{selectedUsers.length}</strong>
                  </span>
                  <span className="total-count">
                    Tổng: <strong>{filteredUsers.length}</strong>
                  </span>
                  {searchTerm && (
                    <span className="filtered-count">
                      (Từ {users.length} người dùng)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            <div className="preview-section">
              <div className="preview-info">
                <span className="preview-icon">
                  {notifyForm.sendType === 'all' ? '🌍' : '👥'}
                </span>
                <div className="preview-text">
                  <div className="preview-title">
                    {notifyForm.sendType === 'all' 
                      ? `Gửi đến tất cả người dùng`
                      : `Gửi đến ${selectedUsers.length} người dùng được chọn`
                    }
                  </div>
                  <div className="preview-subtitle">
                    {notifyForm.title && `"${notifyForm.title}"`}
                  </div>
                </div>
              </div>
            </div>
            
            <button type="submit" className="submit-btn" disabled={!notifyForm.title || !notifyForm.content}>
              <span className="btn-icon">🚀</span>
              <span className="btn-text">Gửi thông báo</span>
            </button>
          </div>
        </form>
        </div> {/* End create-panel */}
        
        {/* Right Panel - Notifications List */}
        <div className="notifications-panel">
          <div className="notifications-list-card">
        <div className="list-header">
          <h3>📋 Danh sách thông báo</h3>
          <div className="list-stats">
            <span className="notification-count">{notifications.length} thông báo</span>
            <button 
              type="button" 
              onClick={fetchNotifications}
              className="refresh-btn"
              title="Làm mới"
            >
              🔄
            </button>
          </div>
        </div>
        
        {Array.isArray(notifications) && notifications.length === 0 ? (
          <div className="empty-notifications">
            <div className="empty-icon">📭</div>
            <div className="empty-title">Chưa có thông báo nào</div>
            <div className="empty-subtitle">Tạo thông báo đầu tiên của bạn</div>
          </div>
        ) : (
          Array.isArray(notifications) && notifications
            .sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.date && a.date.seconds ? a.date.seconds * 1000 : 0);
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.date && b.date.seconds ? b.date.seconds * 1000 : 0);
              return dateB - dateA;
            })
            .map((notify: Notification, idx: number) => {
              const link = notify.link || extractFirstLink(notify.content);
              let dateStr = '';
              if (notify.createdAt) {
                const d = new Date(notify.createdAt);
                dateStr = isNaN(d.getTime()) ? '' : d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
              } else if (notify.date && typeof notify.date === 'object' && (notify.date.seconds || notify.date._seconds)) {
                const sec = notify.date.seconds || notify.date._seconds;
                if (sec) {
                  dateStr = new Date(sec * 1000).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
                }
              }
              return (
                <div key={notify._id || idx} className="notification-card">
                  <div className="notification-header">
                    <div className="notification-type">
                      {notify.sendType === 'all' ? (
                        <span className="type-badge broadcast">
                          <span className="badge-icon">🌍</span>
                          <span>Tất cả</span>
                        </span>
                      ) : (
                        <span className="type-badge targeted">
                          <span className="badge-icon">👥</span>
                          <span>{notify.recipients?.length || 0}</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="notification-actions">
                      {link && (
                        <button
                          className="action-btn link-btn"
                          title="Mở liên kết"
                          onClick={() => window.open(link, '_blank', 'noopener,noreferrer')}
                        >
                          🔗
                        </button>
                      )}
                      <button
                        className="action-btn delete-btn"
                        title="Xóa thông báo"
                        onClick={() => handleDeleteNotify(notifications.findIndex((n: Notification) => (n._id || n.id) === (notify._id || notify.id)))}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="notification-body">
                    <h4 className="notification-title">{notify.title}</h4>
                    <div 
                      className="notification-content" 
                      dangerouslySetInnerHTML={{ 
                        __html: notify.content.replace(
                          /(https?:\/\/[^\s]+)/g, 
                          '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#3b82f6;text-decoration:underline">$1</a>'
                        ) 
                      }} 
                    />
                  </div>
                  
                  {/* Recipients Details */}
                  {notify.sendType === 'selected' && notify.recipients && notify.recipients.length > 0 && (
                    <div className="recipients-section">
                      <div className="recipients-header">
                        <span className="recipients-title">Người nhận:</span>
                        <span className="recipients-count">{notify.recipients.length} người</span>
                      </div>
                      <div className="recipients-list">
                        {notify.recipients.slice(0, 3).map((recipientId: string) => {
                          const userInfo = getUserInfo(recipientId);
                          return (
                            <div key={recipientId} className="recipient-chip">
                              <span className="recipient-name">{userInfo.name}</span>
                            </div>
                          );
                        })}
                        {notify.recipients.length > 3 && (
                          <div className="recipient-chip more">
                            +{notify.recipients.length - 3} khác
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="notification-footer">
                    <div className="notification-date">
                      <span className="date-icon">📅</span>
                      <span>{dateStr}</span>
                    </div>
                  </div>
                </div>
              );
            })
        )}
        </div>
        </div> {/* End notifications-panel */}
      </div> {/* End manager-content */}
    </section>
  );
};

export default NotificationManager;