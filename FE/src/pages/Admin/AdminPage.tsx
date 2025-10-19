import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AdminPage.css'; // 👈 Import CSS riêng

interface User {
  id?: string;
  name: string;
  email: string;
  avatar: string;
  provider: string;
  createdAt?: { seconds: number };
}

interface LoginHistory {
  id?: string;
  userId: string;
  provider: string;
  loginTime?: { seconds: number };
  ip: string;
}

interface ApiResponse<T> {
  success: boolean;
  users?: T;
  loginHistory?: T;
}

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [loading, setLoading] = useState(true);
  // Thông báo admin state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifyForm, setNotifyForm] = useState({ title: '', content: '', link: '' });

  // Helper: extract first link from content
  const extractFirstLink = (content: string) => {
    const match = content.match(/(https?:\/\/[^\s]+)/);
    return match ? match[1] : null;
  };

  // Delete notification
  const handleDeleteNotify = async (idx: number) => {
    const notify = notifications[idx];
    if (!notify.id) return;
    try {
      await fetch(`http://localhost:3000/auth/notifications/${notify.id}`, {
        method: 'DELETE'
      });
      fetchNotifications();
    } catch (err) {
      alert('Lỗi khi xóa thông báo!');
    }
  };

  const handleNotifyInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  setNotifyForm({ ...notifyForm, [e.target.name]: e.target.value });
  };
  const handleAddNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyForm.title || !notifyForm.content) return;
    try {
      const res = await fetch('http://localhost:3000/auth/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifyForm)
      });
      const data = await res.json();
      if (data.success) {
        setNotifyForm({ title: '', content: '', link: '' });
        fetchNotifications();
      } else {
        alert('Lỗi khi tạo thông báo!');
      }
    } catch (err) {
      alert('Lỗi khi tạo thông báo!');
    }
  };

  useEffect(() => {
    fetchData();
    fetchNotifications();
  }, []);

  // Lấy thông báo từ Firestore
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

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      const usersRes = await fetch('http://localhost:3000/auth/users');
      const usersData: ApiResponse<User[]> = await usersRes.json();

      const historyRes = await fetch('http://localhost:3000/auth/login-history');
      const historyData: ApiResponse<LoginHistory[]> = await historyRes.json();

      if (usersData.success && usersData.users) setUsers(usersData.users);
      if (historyData.success && historyData.loginHistory) setLoginHistory(historyData.loginHistory);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <Link to="/" className="back-home">← Quay về trang chủ</Link>
      </header>

      {/* Notification Admin Section */}
      <section className="admin-notify">
        <h2>🔔 Tạo thông báo</h2>
        <form className="notify-form" onSubmit={handleAddNotify}>
          <input
            type="text"
            name="title"
            value={notifyForm.title}
            onChange={handleNotifyInput}
            placeholder="Tiêu đề thông báo"
            required
          />
          <textarea
            name="content"
            value={notifyForm.content}
            onChange={handleNotifyInput}
            placeholder="Nội dung thông báo"
            rows={2}
            required
          />
          <input
            type="text"
            name="link"
            value={notifyForm.link}
            onChange={handleNotifyInput}
            placeholder="Đường dẫn (tuỳ chọn)"
            style={{marginTop:8}}
          />
          <button type="submit" className="notify-btn">Tạo thông báo</button>
        </form>
        <div className="notify-list">
          {Array.isArray(notifications) && notifications.length === 0 ? (
            <div className="empty-text">Chưa có thông báo nào</div>
          ) : (
            Array.isArray(notifications) && notifications.map((notify: any, idx: number) => {
              const link = notify.link || extractFirstLink(notify.content);
              // Format Firestore Timestamp or string date
              let dateStr = '';
              if (notify.date && typeof notify.date === 'object' && (notify.date.seconds || notify.date._seconds)) {
                const sec = notify.date.seconds || notify.date._seconds;
                dateStr = new Date(sec * 1000).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
              } else if (notify.date) {
                const d = new Date(notify.date);
                dateStr = isNaN(d.getTime()) ? '' : d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
              }
              return (
                <div key={idx} className="notify-item" style={{position: 'relative', minWidth: 220, margin: '8px', borderRadius: '16px', boxShadow: '0 2px 8px #eee', background: '#fff', padding: '18px 18px 12px 18px'}}>
                  <button
                    className="notify-delete-btn"
                    title="Xóa thông báo"
                    style={{position: 'absolute', top: 8, right: 12, background: 'none', border: 'none', color: '#e11d48', fontWeight: 'bold', fontSize: 14, cursor: 'pointer', zIndex: 2}}
                    onClick={() => handleDeleteNotify(idx)}
                  >
                    ✖
                  </button>
                  <button
                    className="notify-btn-item"
                    style={{width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: link ? 'pointer' : 'default', padding: 0}}
                    onClick={() => {
                      if (link) {
                        window.open(link, '_blank', 'noopener,noreferrer');
                      }
                    }}
                  >
                    <div className="notify-title" style={{fontWeight: 600, fontSize: 18, color: '#6d28d9', marginBottom: 4}}>{notify.title}</div>
                    <div className="notify-content" style={{fontSize: 15, marginBottom: 6}} dangerouslySetInnerHTML={{__html: notify.content.replace(/(https?:\/\/[^\s]+)/g, '<a href=\"$1\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color:#e11d48;text-decoration:underline\">$1</a>')}} />
                    <div className="notify-date" style={{fontSize: 13, color: '#888'}}>{dateStr}</div>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="admin-cards">
        <Link to="/admin/entertainment" className="admin-card pink">
          <h2>🎬 Quản lý Giải trí</h2>
          <p>Thêm, sửa, xóa slideshow, phim, show, thể loại...</p>
        </Link>

        <Link to="/admin/chat" className="admin-card blue">
          <h2>💬 Quản lý Chat</h2>
          <p>Quản lý phòng chat, thành viên, tin nhắn...</p>
        </Link>

        <Link to="/admin/community" className="admin-card green">
          <h2>🌐 Quản lý Cộng đồng</h2>
          <p>Quản lý bài viết, bình luận, sự kiện...</p>
        </Link>
      </section>

      <div className="data-section">
        <h2>👥 Danh sách người dùng ({users.length})</h2>
        {users.length === 0 ? (
          <p className="empty-text">Không có người dùng nào trong Firebase</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Tên</th>
                <th>Email</th>
                <th>Nhà cung cấp</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id || i}>
                  <td><img src={u.avatar} alt={u.name} className="avatar" /></td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className="tag blue">{u.provider}</span></td>
                  <td>{u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="data-section">
        <h2>🕒 Lịch sử đăng nhập ({loginHistory.length})</h2>
        {loginHistory.length === 0 ? (
          <p className="empty-text">Không có dữ liệu đăng nhập</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Nhà cung cấp</th>
                <th>Thời gian</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {loginHistory.map((l, i) => (
                <tr key={l.id || i}>
                  <td>{l.userId}</td>
                  <td><span className="tag green">{l.provider}</span></td>
                  <td>{l.loginTime ? new Date(l.loginTime.seconds * 1000).toLocaleString() : 'N/A'}</td>
                  <td>{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="refresh-container">
        <button onClick={fetchData} className="refresh-btn">🔄 Làm mới dữ liệu</button>
      </div>
    </div>
  );
};

export default AdminPage;
