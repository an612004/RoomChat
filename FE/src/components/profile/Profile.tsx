import React, { useState, useEffect } from 'react';
import './Profile.css';
import useAuth from "../../hooks/useAuth";
import Header from '../Header';

const Profile = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('http://localhost:3000/post');
        const data = await res.json();
        if (data.success) setPosts(data.posts);
      } catch {}
    };
    fetchPosts();
  }, []);

  const userPosts = posts.filter(p => p.authorId === user?.email);

  return (
    <div className="profile-container">
      <Header />
      <div style={{display:'flex',justifyContent:'center',width:'100%',marginTop:24}}>
        <div style={{width:'100%',maxWidth:900}}>
          {/* Cover photo */}
          <div className="cover-photo" style={{position:'relative',borderRadius:'18px 18px 0 0',overflow:'hidden',boxShadow:'0 2px 12px #0001'}}>
            <img
              src={(user as any)?.coverPhoto || "/default-cover.jpg"}
              alt="Cover"
              className="cover-image"
            />
            <button className="edit-cover-btn" style={{position:'absolute',right:24,bottom:18,background:'#fff',color:'#222',borderRadius:8,padding:'6px 16px',boxShadow:'0 2px 8px #0002',border:'none',fontWeight:600,cursor:'pointer'}}>Chỉnh sửa ảnh bìa</button>
          </div>
          {/* Profile card */}
          <div style={{background:'#fff',borderRadius:'0 0 18px 18px',boxShadow:'0 2px 12px #0001',padding:'0 32px 32px 32px',margin:'0 auto',position:'relative',top:-60}}>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',position:'relative'}}>
              {/* Avatar */}
              <div style={{position:'absolute',top:-90,left:'50%',transform:'translateX(-50%)'}}>
                <img
                  src={user?.avatar || "/default-avatar.png"}
                  alt="Avatar"
                  className="profile-avatar"
                  style={{width:180,height:180,borderRadius:'50%',border:'6px solid #fff',boxShadow:'0 2px 10px #0002',objectFit:'cover'}}
                />
                <button className="edit-avatar-btn" style={{position:'absolute',bottom:12,right:12,background:'#fff',borderRadius:'50%',width:38,height:38,boxShadow:'0 2px 8px #0002',border:'none',fontWeight:600,cursor:'pointer',fontSize:20}}>📷</button>
              </div>
              {/* Info */}
              <div style={{marginTop:110,textAlign:'center',width:'100%'}}>
                <h1 className="profile-name" style={{fontSize:'2.2rem',fontWeight:700,color:'#222',marginBottom:8}}>{user?.name}</h1>
                <p className="profile-email" style={{color:'#65676b',marginBottom:8}}>{user?.email}</p>
                <div className="profile-actions" style={{display:'flex',justifyContent:'center',gap:12,marginTop:10}}>
                  <button className="add-story-btn">+ Thêm vào tin</button>
                  <button className="edit-profile-btn">Chỉnh sửa</button>
                </div>
                {/* User introduction box below actions */}
                <div style={{width:'100%',margin:'0 auto',marginTop:24}}>
                  <div style={{background:'#f7f8fa',borderRadius:12,boxShadow:'0 2px 8px #0001',padding:'20px 24px',display:'flex',flexDirection:'column',alignItems:'flex-start'}}>
                    <h2 style={{fontSize:'1.1rem',fontWeight:600,color:'#222',marginBottom:8}}>Giới thiệu</h2>
                    <p style={{color:'#444',fontSize:'1rem',lineHeight:1.7}}>
                      {user?.bio || 'Chưa có thông tin giới thiệu.'}
                    </p>
                  </div>
                </div>
                {/* User's posts section */}
                <div style={{width:'100%',margin:'0 auto',marginTop:32}}>
                  <div style={{background:'#fff',borderRadius:12,boxShadow:'0 2px 8px #0002',padding:'20px 24px'}}>
                    <h2 style={{fontSize:'1.1rem',fontWeight:600,color:'#222',marginBottom:8}}>Bài viết của bạn</h2>
                    {userPosts.length === 0 ? (
                      <p style={{color:'#888'}}>Bạn chưa đăng bài viết nào.</p>
                    ) : (
                      userPosts.map(post => {
                        return (
                          <div key={post._id} className="post-item" style={{background:'#fff',border:'1px solid #e4e6eb',borderRadius:20,boxShadow:'0 4px 24px #b6b8c355',padding:'28px 24px 20px 24px',marginBottom:28,transition:'box-shadow .18s',width:'100%',position:'relative',overflow:'hidden'}}>
                            <div className="post-header" style={{display:'flex',alignItems:'center',gap:12,marginBottom:8,justifyContent:'flex-start'}}>
                              <img className="post-header-avatar" src={user?.avatar || '/default-avatar.png'} alt={user?.name} style={{width:40,height:40,borderRadius:'50%',boxShadow:'0 1px 6px rgba(0,0,0,0.08)'}} />
                              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start'}}>
                                <div style={{fontWeight:700,fontSize:15,color:'#1b1b1b'}}>{user?.name}</div>
                                <div style={{fontSize:12,color:'#65676b'}}>{new Date(post.createdAt).toLocaleString('vi-VN')}</div>
                              </div>
                            </div>
                            <div style={{margin:'18px 0',fontSize:18,lineHeight:1.7,color:'#222',wordBreak:'break-word'}}>{post.content}</div>
                            {/* Images */}
                            {post.images && post.images.length > 0 && (
                              <div style={{display:'grid',gap:8,margin:'18px 0 0 0',gridTemplateColumns: post.images.length === 1 ? '1fr' : post.images.length === 2 ? '1fr 1fr' : '2fr 1fr',gridTemplateRows: post.images.length <= 2 ? '1fr' : post.images.length === 3 ? '1fr 1fr' : '1fr 1fr',gridAutoFlow:'dense',justifyContent:'center',alignItems:'center',maxWidth:'700px',minHeight:'340px',position:'relative'}}>
                                {post.images.map((img:string,idx:number) => {
                                  const src = img.startsWith('/uploads/') ? `http://localhost:3000${img}` : img;
                                  let style: React.CSSProperties = {
                                    width: '100%',
                                    height: post.images.length === 1 ? '420px' : post.images.length === 2 ? '340px' : idx === 0 ? '340px' : '165px',
                                    objectFit: 'cover',
                                    borderRadius: 16,
                                    boxShadow: '0 4px 24px #b6b8c355',
                                    cursor: 'zoom-in',
                                    gridColumn: post.images.length === 1 ? '1/2' : post.images.length === 2 ? (idx === 0 ? '1/2' : '2/3') : (idx === 0 ? '1/2' : '2/3'),
                                    gridRow: post.images.length <= 2 ? '1/2' : (idx === 0 ? '1/3' : (idx === 1 ? '1/2' : '2/3')),
                                    position: 'relative',
                                  };
                                  if (idx > 3) return null;
                                  return (
                                    <img key={idx} className="post-img" src={src} alt={`post-img-${idx}`} style={style} />
                                  );
                                })}
                              </div>
                            )}
                            {/* Videos */}
                            {post.videos && post.videos.length > 0 && (
                              <div style={{display:'flex',gap:16,margin:'18px 0 0 0',flexWrap:'wrap',justifyContent:'center'}}>
                                {post.videos.map((vid:string,idx:number) => {
                                  const src = vid.startsWith('/uploads/') ? `http://localhost:3000${vid}` : vid;
                                  return (
                                    <video key={idx} src={src} controls style={{width:340,height:340,borderRadius:16,boxShadow:'0 4px 24px #b6b8c355',background:'#000'}} />
                                  );
                                })}
                              </div>
                            )}
                            <div style={{display:'flex',gap:24,alignItems:'center',marginBottom:8}}>
                              <span style={{display:'flex',alignItems:'center',gap:6,color:'#e11d48',fontWeight:700,fontSize:17,background:'#f3f4f6',borderRadius:8,padding:'4px 18px'}}>
                                ❤️ {post.likes?.length||0}
                              </span>
                              <span style={{display:'flex',alignItems:'center',gap:6,color:'#6366f1',fontWeight:700,fontSize:17,background:'#f3f4f6',borderRadius:8,padding:'4px 18px'}}>
                                <span role="img" aria-label="share">🔄</span> {post.shares||0}
                              </span>
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:6,color:'#888',fontSize:15}}>
                              <span role="img" aria-label="comment">💬</span> {post.comments?.length || 0} bình luận
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
