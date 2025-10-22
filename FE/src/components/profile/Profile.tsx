import React from 'react';
import './Profile.css';
import Header from '../Header';
import useAuth from "../../hooks/useAuth";

const Profile = () => {
  const { user } = useAuth();
  const [about, setAbout] = React.useState({
    intro: "",
    bio: ""
  });
  const [editing, setEditing] = React.useState(false);

  return (
    <div>
      <Header />
      <div className="container-profile">
        <div className="profile-left">
          <img src={user?.avatar} alt="Avatar" className="avatar-profile" />
          <button className="add-story-btn">Thêm vào tin của bạn</button>
        </div>
        <div className="profile-right">
          <h1 className='user-profile'>{user?.name}</h1>
          {user?.email && <p className="email-profile">{user.email}</p>}
          <div className="profile-info-box">
            <div className="profile-info-content">
              <p className="profile-info-intro">
                {about.intro || about.bio
                  ? `${about.intro}${about.intro && about.bio ? ' | ' : ''}${about.bio}`
                  : "Chưa có giới thiệu/mô tả."}
              </p>
            </div>
            <button className="edit-profile-btn" onClick={() => setEditing(!editing)}>
              {editing ? "Lưu" : "Chỉnh sửa"}
            </button>
          </div>
          {editing && (
            <div className="profile-section">
              <label htmlFor="intro" className="profile-label">Giới thiệu bản thân:</label>
              <textarea
                id="intro"
                className="profile-input"
                value={about.intro}
                onChange={e => setAbout({...about, intro: e.target.value})}
                placeholder="Viết vài dòng giới thiệu về bạn..."
              />
              <label htmlFor="bio" className="profile-label">Mô tả bản thân:</label>
              <textarea
                id="bio"
                className="profile-input"
                value={about.bio}
                onChange={e => setAbout({...about, bio: e.target.value})}
                placeholder="Bạn thích gì, sở thích, mục tiêu..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


export default Profile
