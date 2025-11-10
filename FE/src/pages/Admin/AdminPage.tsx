import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NotificationManager from '../../components/admin/NotificationManager';
import './AdminPage.css'; // 👈 Import CSS riêng

interface User {
  id?: string;
  name: string;
  email: string;
  avatar: string;
  provider: string;
  createdAt?: { seconds: number };
  isVerified?: boolean;
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



  // Toggle verified status
  const handleToggleVerified = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`http://localhost:3000/auth/users/${userId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        // Cập nhật local state
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, isVerified: !currentStatus }
            : user
        ));
      } else {
        alert('Lỗi khi cập nhật trạng thái tích xanh!');
      }
    } catch (err) {
      alert('Lỗi khi cập nhật trạng thái tích xanh!');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

      {/* Notification Manager */}
      <NotificationManager 
        users={users}
        onRefreshNotifications={() => {
          // Optional: Refresh any parent data if needed
        }}
      />

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
                <th>Tích xanh</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id || i}>
                  <td><img src={u.avatar} alt={u.name} className="avatar" /></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {u.name}
                      {u.isVerified && (
                        <span 
                          title="Tài khoản đã xác minh"
                          style={{ 
                            color: '#10B981', 
                            fontSize: '16px',
                            fontWeight: 'bold'
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td><span className="tag blue">{u.provider}</span></td>
                  <td>
                    <label className="verified-toggle">
                      <input 
                        type="checkbox" 
                        checked={u.isVerified || false}
                        onChange={() => handleToggleVerified(u.id || '', u.isVerified || false)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
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

      {/* Test Notifications Section */}
      <div className="data-section">
        <h2>🧪 Test thông báo cho user</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            id="testUserId" 
            style={{ 
              padding: '0.5rem', 
              borderRadius: '0.5rem', 
              border: '1px solid #ddd',
              minWidth: '200px'
            }}
          >
            <option value="">Chọn user để test...</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          <button 
            onClick={async () => {
              const select = document.getElementById('testUserId') as HTMLSelectElement;
              const userId = select.value;
              if (!userId) {
                alert('Vui lòng chọn user!');
                return;
              }
              
              try {
                const res = await fetch(`http://localhost:3000/auth/test/notifications/${userId}`);
                const data = await res.json();
                if (data.success) {
                  alert(`User ${userId} có ${data.debug.userNotifications} thông báo\n\nChi tiết:\n${JSON.stringify(data.debug, null, 2)}`);
                } else {
                  alert('Lỗi: ' + data.message);
                }
              } catch (err) {
                alert('Lỗi kết nối!');
              }
            }}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            🔍 Test notifications
          </button>
        </div>
      </div>

      <div className="refresh-container">
        <button onClick={fetchData} className="refresh-btn">🔄 Làm mới dữ liệu</button>
      </div>
    </div>
  );
};

export default AdminPage;
