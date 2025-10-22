import React from "react";
import { MessageCircle } from 'lucide-react';

interface CommentModalProps {
  comments: any[];
  onClose: () => void;
}

const CommentModal: React.FC<CommentModalProps> = ({ comments, onClose }) => {
  return (
    <div style={{
      position:'fixed',
      top:0,
      left:0,
      width:'100vw',
      height:'100vh',
      background:'rgba(0,0,0,0.7)',
      zIndex:1000,
      display:'flex',
      alignItems:'center',
      justifyContent:'center'
    }}
      onClick={onClose}
    >
      <div style={{
        background:'#fff',
        borderRadius:20,
        width:520,
        margin:'auto',
        maxHeight:'80vh',
        overflowY:'auto',
        boxShadow:'0 8px 32px #0008',
        display:'flex',
        flexDirection:'column',
        alignItems:'center',
        justifyContent:'center',
        padding:'32px 0 24px 0',
        gap:18
      }} onClick={e=>e.stopPropagation()}>
        <div  style={{fontWeight:700,fontSize:24,textAlign:'center',marginBottom:12}}> <MessageCircle /> Bình luận <button onClick={onClose} style={{fontSize:22,background:'none',border:'none',cursor:'pointer',float:'right'}}>&times;</button></div>
        <div style={{width:'100%',display:'flex',flexDirection:'column',alignItems:'center',gap:18}}>
          {comments && comments.length > 0 ? (
            comments.map((cmt:any, idx:number) => (
              <div key={cmt._id || idx} style={{display:'flex',alignItems:'flex-start',gap:16,width:'80%',background:'#f6f7fb',borderRadius:16,padding:'12px 18px',boxShadow:'0 2px 8px #e0e7ff33'}}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',width:56}}>
                  <div style={{width:48,height:48,borderRadius:'50%',background:'linear-gradient(135deg,#a78bfa,#f472b6)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:20,color:'#fff',boxShadow:'0 2px 8px #e0e7ff33'}}>
                    {cmt.authorName?.slice(0,2) || 'An'}
                  </div>
                  <div style={{marginTop:6,fontWeight:600,fontSize:15,color:'#222'}}>{cmt.authorName}</div>
                </div>
                <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center'}}>
                  <div style={{color:'#444',fontSize:15,marginBottom:4}}>{cmt.content}</div>
                  <div style={{display:'flex',gap:16,fontSize:15,marginTop:4}}>
                    <span style={{color:'#6366f1',cursor:'pointer'}}>Thả icon</span>
                    <span style={{color:'#6366f1',cursor:'pointer'}}>Trả lời</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{textAlign:'center',marginTop:32}}>
              <img src="/icon-empty-comment.png" alt="empty" style={{width:64,height:64,marginBottom:12,opacity:0.7}} />
              <div style={{fontWeight:600,fontSize:18,color:'#555'}}>Chưa có bình luận nào</div>
              <div style={{color:'#888',fontSize:15,marginTop:4}}>Hãy là người đầu tiên bình luận.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const emojiList = ["❤️","😂","👍","😮","😢","😡"];
const CommentItem: React.FC<{comment:any}> = ({ comment }) => {
  const [showReply, setShowReply] = React.useState(false);
  const [replyText, setReplyText] = React.useState("");
  const [showEmoji, setShowEmoji] = React.useState(false);
  return (
    <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:16,width:'100%'}}>
      <img src={comment.authorAvatar || '/default-avatar.png'} alt={comment.authorName} style={{width:36,height:36,borderRadius:'50%'}} />
      <div style={{background:'#f3f4f6',borderRadius:10,padding:'8px 14px',flex:1}}>
        <div style={{fontWeight:500,color:'#222'}}>{comment.authorName}</div>
        <div style={{color:'#444',fontSize:15,marginBottom:4}}>{comment.content}</div>
        {/* Emoji/image in comment */}
        {comment.emoji && <span style={{fontSize:20,marginRight:6}}>{comment.emoji}</span>}
        {comment.image && <img src={comment.image} alt="comment-img" style={{width:48,height:48,borderRadius:8,marginRight:6}} />}
        {/* Actions: emoji, reply */}
        <div style={{display:'flex',alignItems:'center',gap:16,fontSize:14,marginTop:4}}>
          <span style={{color:'#6366f1',cursor:'pointer'}} onClick={()=>setShowEmoji(e=>!e)}>Thả icon</span>
          <span style={{color:'#6366f1',cursor:'pointer'}} onClick={()=>setShowReply(r=>!r)}>Trả lời</span>
        </div>
        {/* Emoji picker */}
        {showEmoji && (
          <div style={{marginTop:6,display:'flex',gap:8}}>
            {emojiList.map(e=>(
              <span key={e} style={{fontSize:22,cursor:'pointer'}}>{e}</span>
            ))}
          </div>
        )}
        {/* Reply input */}
        {showReply && (
          <form style={{marginTop:8,display:'flex',gap:8}} onSubmit={e=>{e.preventDefault();setReplyText("");}}>
            <input type="text" value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="Viết trả lời..." style={{flex:1,padding:7,borderRadius:10,border:'1px solid #e0e7ff',fontSize:15}} />
            <button type="submit" style={{background:'#4f46e5',color:'#fff',border:'none',borderRadius:8,padding:'0 16px',fontWeight:600}}>Gửi</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CommentModal;
