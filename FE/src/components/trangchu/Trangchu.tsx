import React, { useState, useEffect } from 'react';
import { Tag , MapPin , Laugh , Trash } from 'lucide-react';
import CommentSection from './CommentSection';
import CommentModal from './CommentModal';
import './Trangchu.css';
import useAuth from "../../hooks/useAuth";

const Trangchu = () => {
  // State cho modal xem nhiều ảnh
  const [modalImageIndex, setModalImageIndex] = useState<number>(0);
  // State cho modal xem ảnh lớn
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState<string>('');
  // Comment modal state
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [activeComments, setActiveComments] = useState<any[]>([]);
  const { user } = useAuth();
  const [showPostForm, setShowPostForm] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [postImages, setPostImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [postVideos, setPostVideos] = useState<File[]>([]);
  const [previewVideos, setPreviewVideos] = useState<string[]>([]);
  

  // Fetch posts
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/post');
      const data = await res.json();
      if (data.success) setPosts(data.posts);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  // State for editing post
  const [editing, setEditing] = useState<{[key:string]: boolean}>({});
  const [editContent, setEditContent] = useState<{[key:string]: string}>({});

  

  return (
    <div style={{
      minHeight:'100vh',
      background:'#f0f2f5',
      paddingTop:32,
      paddingBottom:32,
      display:'flex',
      flexDirection:'column',
      alignItems:'center',
    }}>
      {/* Container 1 - Phần đăng bài */}
      <div className="container" style={{width:'100%',maxWidth:600,margin:'0 auto'}}>
        <div className="post-box">
          <img src={user?.avatar} alt="Avatar" className="avatar" />
          <button onClick={() => setShowPostForm(!showPostForm)} className="thought-btn">
            {user?.name}, bạn đang nghĩ gì thế?
          </button>
        </div>
        {showPostForm && (
          <div className="post-form-container">
            <form className="post-form" onSubmit={async e => {
              e.preventDefault();
              if (!user || !postContent.trim()) return;
              // Upload images and videos to server first
              let uploadedImages: string[] = [];
              let uploadedVideos: string[] = [];
              if (postImages.length > 0 || postVideos.length > 0) {
                const formData = new FormData();
                postImages.forEach(img => formData.append('images', img));
                postVideos.forEach(video => formData.append('videos', video));
                const uploadRes = await fetch('http://localhost:3000/upload', {
                  method: 'POST',
                  body: formData
                });
                const uploadData = await uploadRes.json();
                if (uploadData.success) {
                  uploadedImages = uploadData.imageUrls || [];
                  uploadedVideos = uploadData.videoUrls || [];
                }
              }
              const res = await fetch('http://localhost:3000/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  authorId: user.email,
                  authorName: user.name,
                  authorAvatar: user.avatar,
                  content: postContent,
                  images: uploadedImages,
                  videos: uploadedVideos
                })
              });
              const data = await res.json();
              if (data.success) {
                setPostContent('');
                setPostImages([]);
                setPreviewImages([]);
                setPostVideos([]);
                setPreviewVideos([]);
                setShowPostForm(false);
                fetchPosts();
              }
            }}>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowPostForm(false)}
              >
                ✕
              </button>
              <textarea
                placeholder="Bạn đang nghĩ gì?"
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
              />
              <input type="file" multiple accept="image/*,video/*" onChange={e => {
                const files = Array.from(e.target.files || []);
                // Cho phép chọn nhiều ảnh và nhiều video cùng lúc
                const imageFiles = files.filter(f => f.type.startsWith('image/'));
                const videoFiles = files.filter(f => f.type.startsWith('video/'));
                setPostImages(prev => [...prev, ...imageFiles]);
                setPostVideos(prev => [...prev, ...videoFiles]);
                // Preview images
                const imageReaders = imageFiles.map(file => {
                  return new Promise<string>(resolve => {
                    const reader = new FileReader();
                    reader.onload = ev => resolve(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  });
                });
                Promise.all(imageReaders).then(imgs => setPreviewImages(prev => [...prev, ...imgs]));
                // Preview videos
                const videoReaders = videoFiles.map(file => {
                  return new Promise<string>(resolve => {
                    const reader = new FileReader();
                    reader.onload = ev => resolve(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  });
                });
                Promise.all(videoReaders).then(vids => setPreviewVideos(prev => [...prev, ...vids]));
              }} />
              {/* Preview images */}
              {previewImages.length > 0 && (
                <div style={{display:'flex',gap:8,margin:'8px 0',flexWrap:'wrap'}}>
                  {previewImages.map((img,idx) => (
                    <div key={idx} style={{position:'relative',width:80,height:80}}>
                      <img src={img} alt="preview" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:8}} />
                      {/* Nút gỡ ảnh */}
                      <button
                        type="button"
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 16,
                          zIndex: 2,
                          transition: 'background 0.2s',
                        }}
                        onClick={() => {
                          setPreviewImages(previewImages.filter((_, i) => i !== idx));
                          setPostImages(postImages.filter((_, i) => i !== idx));
                        }}
                        aria-label="Gỡ ảnh"
                      >×</button>
                      {/* Nút zoom ảnh */}
                      <button
                        type="button"
                        style={{
                          position: 'absolute',
                          bottom: 2,
                          right: 2,
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: '#e5e7eb',
                          color: '#222',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          zIndex: 2,
                          boxShadow: '0 2px 8px #0002',
                        }}
                        onClick={() => {
                          setShowImageModal(true);
                          setModalImageSrc(img);
                        }}
                        aria-label="Xem chi tiết ảnh"
                      >
                        <span role="img" aria-label="Zoom" style={{fontSize:20}}>🔍</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Preview videos */}
      {/* Modal xem chi tiết ảnh */}
      {showImageModal && (
        <div style={{
          position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.7)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'
        }}
          onClick={()=>setShowImageModal(false)}
        >
          <img src={modalImageSrc} alt="zoom" style={{maxWidth:'80vw',maxHeight:'80vh',borderRadius:12,boxShadow:'0 8px 32px #0008'}} />
        </div>
      )}
              
              {/* Preview videos */}
              {previewVideos.length > 0 && (
                <div style={{display:'flex',gap:8,margin:'8px 0',flexWrap:'wrap'}}>
                  {previewVideos.map((vid,idx) => (
                    <video key={idx} src={vid} controls style={{width:120,height:80,borderRadius:8,background:'#000'}} />
                  ))}
                </div>
              )}
              <div className="post-actions">
                <span className="post-actions-title">Thêm vào bài viết của bạn</span>
                <div className="post-icons">
                   <button title="Gắn thẻ"><Tag size={18} /></button>
                  <button type="button" title="Cảm xúc/Hoạt động" className="icon-btn"><Laugh size={18} /></button>
                  <button title="Vị trí"><MapPin size={18} /></button>
                </div>
              </div>
              <button type="submit">Đăng</button>
            </form>
          </div>
        )}
      </div>
      {/* Container 2 - Phần hiển thị nội dung khác */}
  <div className="container1" style={{width:'100%',maxWidth:600,margin:'0 auto'}}>
        <div className="post-box">
          
          {loading ? <p>Đang tải...</p> : (
            posts.length === 0 ? <p className='text-center'>Các bảng tin đang được tải...</p> : (
              posts.map(post => {
                const isAuthor = user && post.authorId === user.email;
                return (
                  <div
                    key={post._id}
                    className="post-item"
                    style={{
                      background:'rgba(255,255,255,0.85)',
                      border:'1px solid #e4e6eb',
                      borderRadius:20,
                      boxShadow:'0 4px 24px #b6b8c355',
                      padding:'28px 24px 20px 24px',
                      marginBottom:28,
                      transition:'box-shadow .18s',
                      width:'100%',
                      position:'relative',
                      cursor:'pointer',
                      overflow:'hidden',
                    }}
                    onMouseOver={e=>e.currentTarget.style.boxShadow='0 8px 32px #b6b8c355'}
                    onMouseOut={e=>e.currentTarget.style.boxShadow='0 4px 24px #b6b8c355'}
                  >
                    <div className="post-header" style={{display:'flex',alignItems:'center',gap:12,marginBottom:8,justifyContent:'flex-start'}}>
                      <img className="post-header-avatar" src={post.authorAvatar || '/default-avatar.png'} alt={post.authorName} style={{width:40,height:40,borderRadius:'50%',boxShadow:'0 1px 6px rgba(0,0,0,0.08)'}} />
                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start'}}>
                        <div style={{fontWeight:700,fontSize:15,color:'#1b1b1b'}}>{post.authorName}</div>
                        <div style={{fontSize:12,color:'#65676b'}}>{new Date(post.createdAt).toLocaleString('vi-VN')}</div>
                      </div>
                      {isAuthor && (
                        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
                          <button style={{color:'#e11d48',background:'none',border:'none',cursor:'pointer',fontSize:20}} onClick={async()=>{
                            if(window.confirm('Bạn chắc chắn muốn xóa bài viết này?')){
                              await fetch(`http://localhost:3000/post/${post._id}`,{
                                method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({userEmail:user.email})
                              });
                              fetchPosts();
                            }
                          }}><Trash /></button>
                          <button style={{color:'#6366f1',background:'none',border:'none',cursor:'pointer',fontSize:20}} onClick={()=>{
                            setEditing(e=>({...e,[post._id]:true}));
                            setEditContent(c=>({...c,[post._id]:post.content}));
                          }}>✏️</button>
                        </div>
                      )}
                    </div>
                    <div style={{margin:'18px 0',fontSize:18,lineHeight:1.7,color:'#222',wordBreak:'break-word'}}>
                      {editing[post._id] ? (
                        <form onSubmit={async e=>{
                          e.preventDefault();
                          if (!user) return;
                          await fetch(`http://localhost:3000/post/${post._id}`,{
                            method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({userEmail:user.email,content:editContent[post._id]})
                          });
                          setEditing(e=>({...e,[post._id]:false}));
                          fetchPosts();
                        }} style={{display:'flex',gap:8}}>
                          <input value={editContent[post._id]||''} onChange={e=>setEditContent(c=>({...c,[post._id]:e.target.value}))} style={{flex:1,padding:8,borderRadius:10,border:'1px solid #e0e7ff',fontSize:16}} />
                          <button type="submit" style={{background:'#6366f1',color:'#fff',border:'none',borderRadius:8,padding:'0 16px',fontWeight:600}}>Lưu</button>
                          <button type="button" style={{background:'#f3f4f6',color:'#222',border:'none',borderRadius:8,padding:'0 16px'}} onClick={()=>setEditing(e=>({...e,[post._id]:false}))}>Hủy</button>
                        </form>
                      ) : post.content}
                    </div>
                    {/* Hình ảnh lớn, rõ ràng, nằm dưới tên, avatar và nội dung */}
                    {post.images && post.images.length > 0 && (
                      <div style={{
                        display: 'grid',
                        gap: 8,
                        margin: '18px 0 0 0',
                        gridTemplateColumns: post.images.length === 1 ? '1fr' : post.images.length === 2 ? '1fr 1fr' : '2fr 1fr',
                        gridTemplateRows: post.images.length <= 2 ? '1fr' : post.images.length === 3 ? '1fr 1fr' : '1fr 1fr',
                        gridAutoFlow: 'dense',
                        justifyContent: 'center',
                        alignItems: 'center',
                        maxWidth: '700px',
                        minHeight: '340px',
                        position: 'relative',
                      }}>
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
                          // Nếu là ảnh thứ 4 và còn dư, hiện +N
                          if (idx === 3 && post.images.length > 4) {
                            return (
                              <div key={idx} style={{position:'relative'}}>
                                <img
                                  className="post-img"
                                  src={src}
                                  alt={`post-img-${idx}`}
                                  style={style}
                                  onClick={() => {
                                    setModalImageIndex(idx);
                                    setModalImageSrc(src);
                                    setShowImageModal(true);
                                  }}
                                />
                                <div
                                  className="plusN-overlay"
                                  onClick={() => {
                                    setModalImageIndex(idx);
                                    setModalImageSrc(src);
                                    setShowImageModal(true);
                                  }}
                                >+{post.images.length-4}</div>
                              </div>
                            );
                          }
                          // Chỉ hiển thị 4 ảnh đầu, các ảnh sau không render
                          if (idx > 3) return null;
                          return (
                            <img
                              key={idx}
                              className="post-img"
                              src={src}
                              alt={`post-img-${idx}`}
                              style={style}
                              onClick={() => {
                                setModalImageIndex(idx);
                                setModalImageSrc(src);
                                setShowImageModal(true);
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
      {/* Modal xem nhiều ảnh, có mũi tên chuyển ảnh */}
      {showImageModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn .2s',
          }}
        >
          <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {/* Mũi tên trái */}
            <button
              style={{
                position:'absolute',
                left: 24,
                top: '50%',
                transform:'translateY(-50%)',
                fontSize: 38,
                color:'#fff',
                background:'rgba(0,0,0,0.6)',
                border:'none',
                borderRadius:'50%',
                cursor:'pointer',
                zIndex:10001,
                width: 56,
                height: 56,
                display: modalImageIndex > 0 ? 'flex' : 'none',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px #222',
                transition: 'background 0.2s',
              }}
              onClick={() => {
                if (modalImageIndex > 0) {
                  const newIdx = modalImageIndex-1;
                  setModalImageIndex(newIdx);
                  const src = post.images[newIdx].startsWith('/uploads/') ? `http://localhost:3000${post.images[newIdx]}` : post.images[newIdx];
                  setModalImageSrc(src);
                }
              }}
              aria-label="Trước"
            >&#8592;</button>
            <img
              src={modalImageSrc}
              alt="large"
              style={{
                maxWidth: '80vw',
                maxHeight: '90vh',
                borderRadius: '18px',
                boxShadow: '0 8px 32px #222',
                background: '#fff',
                margin: '0 auto',
                display: 'block',
                objectFit: 'contain',
                animation: 'zoomIn .3s cubic-bezier(.4,0,.2,1)',
              }}
            />
            {/* Mũi tên phải */}
            <button
              style={{
                position:'absolute',
                right: 24,
                top: '50%',
                transform:'translateY(-50%)',
                fontSize: 38,
                color:'#fff',
                background:'rgba(0,0,0,0.6)',
                border:'none',
                borderRadius:'50%',
                cursor:'pointer',
                zIndex:10001,
                width: 56,
                height: 56,
                display: modalImageIndex < post.images.length-1 ? 'flex' : 'none',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px #222',
                transition: 'background 0.2s',
              }}
              onClick={() => {
                if (modalImageIndex < post.images.length-1) {
                  const newIdx = modalImageIndex+1;
                  setModalImageIndex(newIdx);
                  const src = post.images[newIdx].startsWith('/uploads/') ? `http://localhost:3000${post.images[newIdx]}` : post.images[newIdx];
                  setModalImageSrc(src);
                }
              }}
              aria-label="Tiếp"
            >&#8594;</button>
            <button
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                fontSize: 32,
                color: '#fff',
                background: 'rgba(0,0,0,0.5)',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                zIndex: 10001,
                padding: '2px 10px',
                lineHeight: 1,
                transition: 'color 0.2s',
              }}
              onClick={() => setShowImageModal(false)}
              aria-label="Đóng"
            >×</button>
          </div>
        </div>
      )}
                    {/* Hiển thị video nếu có */}
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
                      <button onClick={async()=>{
                        if(!user) return;
                        await fetch(`http://localhost:3000/post/${post._id}/like`,{
                          method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:user.email})
                        });
                        fetchPosts();
                      }} style={{color:post.likes?.includes(user?.email)?'#e11d48':'#888',fontWeight:700,fontSize:17,background:'#f3f4f6',border:'none',borderRadius:8,padding:'4px 18px',transition:'background .2s',cursor:'pointer'}}>
                        ❤️ {post.likes?.length||0}
                      </button>
                      <button onClick={async()=>{
                        await fetch(`http://localhost:3000/post/${post._id}/share`,{method:'POST'});
                        fetchPosts();
                      }} style={{color:'#6366f1',fontWeight:700,fontSize:17,background:'#f3f4f6',border:'none',borderRadius:8,padding:'4px 18px',transition:'background .2s',cursor:'pointer'}}>
                        🔄 {post.shares||0}
                      </button>
                    </div>
                    {/* Comment section - refactored */}
                    <CommentSection
                      comments={post.comments || []}
                      postId={post._id}
                      user={user}
                      fetchPosts={fetchPosts}
                      onShowModal={() => {
                        setActiveComments(post.comments || []);
                        setShowCommentModal(true);
                      }}
                    />
      {/* Comment modal - refactored */}
      {showCommentModal && (
        <CommentModal
          comments={activeComments}
          onClose={() => setShowCommentModal(false)}
        />
      )}
                  </div>
                );
              })
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Trangchu;
