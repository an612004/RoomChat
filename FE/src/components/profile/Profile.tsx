import React, { useState, useEffect } from 'react';
import './Profile.css';
import useAuth from "../../hooks/useAuth";
import Header from '../Header';
import { useUserSync } from '../../contexts/UserSyncContext';
import VerifiedBadge from '../VerifiedBadge';
import { Pencil } from 'lucide-react';

import ProfilePosts from './ProfilePosts';
import ProfilePostsDebug from './ProfilePostsDebug';

// Hiển thị chi tiết user từ id/email nếu cần
const FollowerItem: React.FC<{ userId: string }> = ({ userId }) => {
  const [info, setInfo] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    if (userId.includes('@')) {
      setInfo({ email: userId });
      return;
    }
    setLoading(true);
    const fetchInfo = async () => {
      try {
        const res = await fetch(`http://localhost:3000/user/me/${userId}`);
        const data = await res.json();
        if (data.success && data.user) setInfo(data.user);
        else setInfo({ id: userId });
      } catch {
        setInfo({ id: userId });
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [userId]);
  if (loading) return <li style={{ color: '#888', padding: '8px 0', borderBottom: '1px solid #eee' }}>Đang tải...</li>;
  if (!info) return <li style={{ color: '#888', padding: '8px 0', borderBottom: '1px solid #eee' }}>{userId}</li>;
  if (info.email) {
    return (
      <li style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #eee' }}>
        <img src={info.avatar || '/default-avatar.png'} alt={info.name || info.email} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 1px 6px #0001' }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: '#222', fontSize: 15 }}>{info.name || info.email}</span>
          <span style={{ color: '#888', fontSize: 13 }}>{info.email}</span>
        </div>
      </li>
    );
  }
  return (
    <li style={{ color: '#888', padding: '8px 0', borderBottom: '1px solid #eee' }}>{info.id || userId}</li>
  );
};

const Profile = () => {
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const { user, setUser } = useAuth();
  const { triggerRefresh } = useUserSync();
  const [showEditBio, setShowEditBio] = useState(false);
  const [bioInput, setBioInput] = useState(user?.bio || "");
  const [savingBio, setSavingBio] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);
  const [bioSuccess, setBioSuccess] = useState<string | null>(null);

  // States cho chỉnh sửa profile
  const [showEditName, setShowEditName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || "");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Fetch user data một lần khi component mount
  useEffect(() => {
    const fetchLatestUserData = async () => {
      if (!user?.email) return;

      try {
        const res = await fetch(`http://localhost:3000/user/me/${user.email}`);
        const data = await res.json();
        if (data.success && data.user) {
          console.log("🔄 Fetched latest user data on mount:", data.user);
          setUser(data.user);
        }
      } catch (error) {
        console.error("❌ Error fetching user data:", error);
      }
    };

    // Chỉ fetch một lần khi component mount
    fetchLatestUserData();
  }, []); // Empty dependency để chỉ chạy một lần

  // Update nameInput khi user thay đổi
  useEffect(() => {
    setNameInput(user?.name || "");
  }, [user?.name]);


  useEffect(() => {
    if (!user || !(user.id || user._id || user.email)) return;
    const userId = user.id || user._id || user.email;
    fetch(`http://localhost:3000/user/me/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) setUser(data.user);
      });
  }, [user?.id]);

  // Function cập nhật tên
  const updateName = async () => {
    if (!nameInput.trim()) {
      setNameError("Tên không được để trống");
      return;
    }
    if (nameInput.trim().length > 10) {
      setNameError("Tên không được vượt quá 10 ký tự");
      return;
    }
    setSavingName(true);
    setNameError(null);
    try {
      const res = await fetch('http://localhost:3000/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          name: nameInput.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        console.log("✅ Name updated successfully:", data.user);
        setUser(data.user); // Sử dụng data từ server thay vì merge local
        triggerRefresh(); // 🔄 Trigger refresh cho các component khác
        setShowEditName(false);
      } else {
        setNameError(data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      setNameError("Không thể cập nhật tên");
    } finally {
      setSavingName(false);
    }
  };

  // Function cập nhật avatar
  const updateAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('images', file);

      const uploadRes = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();

      if (uploadData.success && uploadData.imageUrls?.[0]) {
        const res = await fetch('http://localhost:3000/user/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user?.email,
            avatar: uploadData.imageUrls[0]
          })
        });
        const data = await res.json();
        if (data.success) {
          console.log("✅ Avatar updated successfully:", data.user);
          setUser(data.user); // Sử dụng data từ server
          triggerRefresh(); // 🔄 Trigger refresh cho các component khác
        }
      }
    } catch (error) {
      alert('Không thể cập nhật ảnh đại diện');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Function cập nhật ảnh bìa
  const updateCoverPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('images', file);

      const uploadRes = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();

      if (uploadData.success && uploadData.imageUrls?.[0]) {
        const res = await fetch('http://localhost:3000/user/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user?.email,
            coverPhoto: uploadData.imageUrls[0]
          })
        });
        const data = await res.json();
        if (data.success) {
          console.log("✅ Cover photo updated successfully:", data.user);
          setUser(data.user); // Sử dụng data từ server
        }
      }
    } catch (error) {
      alert('Không thể cập nhật ảnh bìa');
    } finally {
      setUploadingCover(false);
    }
  };

  return (
    <div className="profile-container">
      <Header />
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: 24 }}>
        <div style={{ width: '100%', maxWidth: 900 }}>
          {/* Cover photo */}
          <div className="cover-photo" style={{ position: 'relative', borderRadius: '18px 18px 0 0', overflow: 'hidden', boxShadow: '0 2px 12px #0001' }}>
            {/* <img
              src={(user as any)?.coverPhoto || "/default-cover.jpg"}
              // alt="Cover"
              className="cover-image"
            /> */}
            <label className="edit-cover-btn" style={{ position: 'absolute', right: 24, bottom: 18, background: '#fff', color: '#222', borderRadius: 8, padding: '6px 16px', boxShadow: '0 2px 8px #0002', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'inline-block' }}>
              {uploadingCover ? "Đang tải..." : "Chỉnh sửa ảnh bìa"}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={updateCoverPhoto}
                disabled={uploadingCover}
              />
            </label>
          </div>
          {/* Profile card */}
          <div style={{ background: '#fff', borderRadius: '0 0 18px 18px', boxShadow: '0 2px 12px #0001', padding: '0 32px 32px 32px', margin: '0 auto', position: 'relative', top: -60 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              {/* Avatar */}
              <div style={{ position: 'absolute', top: -90, left: '50%', transform: 'translateX(-50%)' }}>
                <img
                  src={user?.avatar || "/default-avatar.png"}
                  alt="Avatar"
                  className="profile-avatar"
                  style={{ width: 180, height: 180, borderRadius: '50%', border: '6px solid #fff', boxShadow: '0 2px 10px #0002', objectFit: 'cover' }}
                />
                <label className="edit-avatar-btn" style={{ position: 'absolute', bottom: 12, right: 12, background: '#fff', borderRadius: '50%', width: 38, height: 38, boxShadow: '0 2px 8px #0002', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {uploadingAvatar ? "⏳" : "📷"}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={updateAvatar}
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
              {/* Info */}
              <div style={{ marginTop: 110, textAlign: 'center', width: '100%' }}>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
                  {!showEditName ? (
                    <>
                      <h1 className="profile-name" style={{ fontSize: '2.2rem', fontWeight: 700, color: '#222', margin: 0, display: 'flex', alignItems: 'center' }}>
                        {user?.name}
                        <VerifiedBadge isVerified={user?.isVerified} size="large" />
                      </h1>
                      <button
                        onClick={() => {
                          setShowEditName(true);
                          setNameInput(user?.name || "");
                        }}
                        style={{
                          position: 'absolute',
                          top: -5,
                          right: -30,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 18,
                          opacity: 0.7
                        }}
                      >
                        <Pencil strokeWidth={1} />
                      </button>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                      <div style={{ position: 'relative', width: 'auto' }}>
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => {
                            const value = e.target.value;
                            setNameInput(value);
                            // Real-time validation
                            if (value.trim().length > 10) {
                              setNameError("Tên không được vượt quá 10 ký tự");
                            } else if (nameError && value.trim().length <= 10) {
                              setNameError(null);
                            }
                          }}
                          style={{
                            fontSize: '2.2rem',
                            fontWeight: 700,
                            textAlign: 'center',
                            border: nameInput.trim().length > 10 ? '2px solid #ff4444' : '2px solid #1877f2',
                            borderRadius: 8,
                            padding: '4px 12px',
                            background: '#fff',
                            paddingRight: '50px'
                          }}
                          maxLength={15}
                          disabled={savingName}
                          placeholder="Nhập tên..."
                        />
                        <span style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '14px',
                          color: nameInput.trim().length > 10 ? '#ff4444' : '#888',
                          fontWeight: 500,
                          pointerEvents: 'none'
                        }}>
                          {nameInput.trim().length}/10
                        </span>
                      </div>
                      {nameError && <div style={{ color: 'red', fontSize: 14, fontWeight: 600 }}>{nameError}</div>}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={updateName}
                          disabled={savingName || nameInput.trim().length > 10 || !nameInput.trim()}
                          style={{
                            background: (savingName || nameInput.trim().length > 10 || !nameInput.trim()) ? '#ccc' : '#1877f2',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            padding: '6px 16px',
                            cursor: (savingName || nameInput.trim().length > 10 || !nameInput.trim()) ? 'not-allowed' : 'pointer',
                            fontSize: 14,
                            fontWeight: 600,
                            opacity: (savingName || nameInput.trim().length > 10 || !nameInput.trim()) ? 0.6 : 1
                          }}
                        >
                          {savingName ? "Đang lưu..." : "Lưu"}
                        </button>
                        <button
                          onClick={() => {
                            setShowEditName(false);
                            setNameError(null);
                            setNameInput(user?.name || "");
                          }}
                          style={{
                            background: '#e4e6ea',
                            color: '#050505',
                            border: 'none',
                            borderRadius: 6,
                            padding: '6px 16px',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 600
                          }}
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <p className="profile-email" style={{ color: '#65676b', marginBottom: 8 }}>{user?.email}</p>
                {/* Người theo dõi và đang theo dõi */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 24, margin: '12px 0' }}>
                  <div style={{ fontWeight: 600, color: '#1877f2', cursor: 'pointer' }} onClick={() => setShowFollowers(true)}>
                    <span style={{ fontSize: 18 }}>{user?.followers?.length || 0}</span> người theo dõi
                  </div>
                  <div style={{ fontWeight: 600, color: '#1877f2', cursor: 'pointer' }} onClick={() => setShowFollowing(true)}>
                    Đang theo dõi <span style={{ fontSize: 18 }}>{user?.following?.length || 0}</span>
                  </div>
                  {/* Modal danh sách người theo dõi */}
                  {/* Modal: Người theo dõi */}
                  {showFollowers && (
                    <div
                      style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 2000,
                        background: "rgba(0,0,0,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onClick={() => setShowFollowers(false)}
                    >
                      <div
                        style={{
                          background: "#fff",
                          borderRadius: 12,
                          minWidth: 320,
                          maxWidth: 400,
                          padding: 24,
                          boxShadow: "0 2px 16px #0002",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>
                          Người theo dõi
                        </h2>

                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {!user || !user.followers || user.followers.length === 0 ? (
                            <li style={{ color: "#888" }}>Chưa có người theo dõi</li>
                          ) :
                            typeof user.followers[0] === "object" ?
                              user.followers.map((f: any, idx: number) => (
                                <li
                                  key={idx}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "8px 0",
                                    borderBottom: "1px solid #eee",
                                  }}
                                >
                                  <img
                                    src={f.avatar || "/default-avatar.png"}
                                    alt={f.name || "Người dùng"}
                                    style={{
                                      width: 40,
                                      height: 40,
                                      borderRadius: "50%",
                                      objectFit: "cover",
                                    }}
                                  />
                                  <div>
                                    <p
                                      style={{
                                        margin: 0,
                                        fontWeight: 600,
                                        color: "#1b1b1b",
                                      }}
                                    >
                                      {f.name || "Người dùng"}
                                    </p>
                                    <p
                                      style={{
                                        margin: 0,
                                        color: "#777",
                                        fontSize: 13,
                                      }}
                                    >
                                      {f.email || ""}
                                    </p>
                                  </div>
                                </li>
                              ))
                              :
                              user.followers.map((f: string, idx: number) => <FollowerItem key={idx} userId={f} />)
                          }
                        </ul>

                        <button
                          style={{
                            marginTop: 18,
                            background: "#1877f2",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            padding: "6px 18px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                          onClick={() => setShowFollowers(false)}
                        >
                          Đóng
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Modal: Đang theo dõi */}
                  {showFollowing && (
                    <div
                      style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 2000,
                        background: "rgba(0,0,0,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onClick={() => setShowFollowing(false)}
                    >
                      <div
                        style={{
                          background: "#fff",
                          borderRadius: 12,
                          minWidth: 320,
                          maxWidth: 400,
                          padding: 24,
                          boxShadow: "0 2px 16px #0002",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>
                          Đang theo dõi
                        </h2>

                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {!user || !user.following || user.following.length === 0 ? (
                            <li style={{ color: "#888" }}>Chưa theo dõi ai</li>
                          ) :
                            typeof user.following[0] === "object" ?
                              user.following.map((f: any, idx: number) => (
                                <li
                                  key={idx}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "8px 0",
                                    borderBottom: "1px solid #eee",
                                  }}
                                >
                                  <img
                                    src={f.avatar || "/default-avatar.png"}
                                    alt={f.name || "Người dùng"}
                                    style={{
                                      width: 40,
                                      height: 40,
                                      borderRadius: "50%",
                                      objectFit: "cover",
                                    }}
                                  />
                                  <div>
                                    <p
                                      style={{
                                        margin: 0,
                                        fontWeight: 600,
                                        color: "#1b1b1b",
                                      }}
                                    >
                                      {f.name || "Người dùng"}
                                    </p>
                                    <p
                                      style={{
                                        margin: 0,
                                        color: "#777",
                                        fontSize: 13,
                                      }}
                                    >
                                      {f.email || ""}
                                    </p>
                                  </div>
                                </li>
                              ))
                              :
                              user.following.map((f: string, idx: number) => <FollowerItem key={idx} userId={f} />)
                          }
                        </ul>

                        <button
                          style={{
                            marginTop: 18,
                            background: "#1877f2",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            padding: "6px 18px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                          onClick={() => setShowFollowing(false)}
                        >
                          Đóng
                        </button>
                      </div>
                    </div>
                  )}

                </div>
                <div className="profile-actions" style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 10 }}>
                  <button className="add-story-btn">+ Thêm vào tin</button>
                  <button className="edit-profile-btn" onClick={() => {
                    setBioInput(user?.bio || "");
                    setShowEditBio(true);
                  }}>Chỉnh sửa tiểu sử</button>
                </div>
                {/* User introduction box below actions */}
                <div style={{ width: '100%', margin: '0 auto', marginTop: 24 }}>
                  <div style={{ background: '#f7f8fa', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: '20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#222', marginBottom: 8 }}>Giới thiệu</h2>
                    <div style={{ color: '#444', fontSize: '1rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                      {user?.bio || 'Chưa có thông tin giới thiệu.'}
                    </div>
                    {showEditBio && (
                      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 3000, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowEditBio(false)}>
                        <div style={{ background: '#fff', borderRadius: 12, minWidth: 320, maxWidth: 400, padding: 24, boxShadow: '0 2px 16px #0002' }} onClick={e => e.stopPropagation()}>
                          <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>Chỉnh sửa giới thiệu</h2>
                          <textarea
                            value={bioInput}
                            onChange={e => {
                              if (e.target.value.length <= 100) {
                                setBioInput(e.target.value);
                              }
                            }}
                            style={{ width: '100%', minHeight: 80, borderRadius: 8, border: '1px solid #e4e6eb', padding: 10, fontSize: 16, marginBottom: 12, resize: 'vertical', whiteSpace: 'pre-line' }}
                            placeholder="Nhập thông tin giới thiệu mới..."
                            disabled={savingBio}
                          />
                          <div style={{ fontSize: 13, color: bioInput.length === 100 ? 'red' : '#888', marginBottom: 8 }}>
                            {bioInput.length}/100 ký tự
                          </div>
                          {bioError && <div style={{ color: 'red', marginBottom: 8 }}>{bioError}</div>}
                          {bioSuccess && <div style={{ color: 'green', marginBottom: 8 }}>{bioSuccess}</div>}
                          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button style={{ background: '#e5e7eb', color: '#222', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 500, cursor: 'pointer' }} onClick={() => setShowEditBio(false)} disabled={savingBio}>Hủy</button>
                            <button style={{ background: '#1877f2', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 600, cursor: 'pointer' }}
                              disabled={savingBio}
                              onClick={async () => {
                                if (!user) {
                                  setBioError('Không tìm thấy thông tin người dùng');
                                  return;
                                }
                                if (bioInput.length > 100) {
                                  setBioError('Giới thiệu tối đa 100 ký tự');
                                  return;
                                }
                                setSavingBio(true);
                                setBioError(null);
                                setBioSuccess(null);
                                try {
                                  const userId = user._id || user.id || user.email;
                                  const res = await fetch('http://localhost:3000/user/bio', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ userId, bio: bioInput })
                                  });
                                  const data = await res.json();
                                  if (data.success && data.user) {
                                    // Lấy lại user mới nhất từ backend
                                    const userId = user._id || user.id || user.email;
                                    const resUser = await fetch(`http://localhost:3000/user/me/${userId}`);
                                    const userData = await resUser.json();
                                    if (userData.success && userData.user) {
                                      setUser && setUser(userData.user);
                                    }
                                    setBioSuccess('Lưu giới thiệu thành công!');
                                    setTimeout(() => {
                                      setShowEditBio(false);
                                      setBioSuccess(null);
                                    }, 1200);
                                  } else {
                                    setBioError(data.message || 'Lỗi khi lưu thông tin');
                                  }
                                } catch (err) {
                                  setBioError('Lỗi kết nối máy chủ');
                                } finally {
                                  setSavingBio(false);
                                }
                              }}
                            >Lưu</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Debug section - TEMPORARY */}
                {user && (
                  <div style={{ margin: '20px 0' }}>
                    <ProfilePostsDebug userEmail={user.email} />
                  </div>
                )}

                {/* User's posts section */}
                {user && <ProfilePosts user={user} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
