import React from "react";

interface CommentSectionProps {
  comments: any[];
  onShowModal: () => void;
  postId: string;
  user: any;
  fetchPosts: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = (props) => {
  const { comments, onShowModal, postId, user, fetchPosts } = props;
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !input.trim()) return;
    setLoading(true);
    await fetch(`http://localhost:3000/post/${postId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorId: user?.email ?? '',
        authorName: user?.name ?? '',
        authorAvatar: user?.avatar ?? '',
        content: input
      })
    });
    setInput('');
    setLoading(false);
    fetchPosts();
  };
  return (
    <div style={{marginTop:14}}>
      <form onSubmit={handleSubmit} style={{display:'flex',gap:8,marginBottom:8}}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Viết bình luận..."
          style={{flex:1,padding:7,borderRadius:10,border:'1px solid #e0e7ff',fontSize:15}}
        />
        <button type="submit" style={{background:'#4f46e5',color:'#fff',border:'none',borderRadius:8,padding:'0 16px',fontWeight:600}} disabled={loading}>
          Bình luận
        </button>
      </form>
      <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end'}}>
        {comments && (
          <span style={{fontWeight:500,fontSize:15,color:'#555',cursor:'pointer'}} onClick={onShowModal}>
            <img src="/icon-comment.png" alt="Bình luận" style={{width:22,height:22,verticalAlign:'middle',marginRight:4}} />
            {comments.length.toLocaleString('vi-VN')} bình luận
          </span>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
