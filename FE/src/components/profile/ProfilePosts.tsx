import React, { useState, useEffect } from 'react';
import ProfilePostItem from './ProfilePostItem';
import CommentModal from '../trangchu/CommentModal';
import ShareModal from '../trangchu/share_post/ShareModal';
import EditPostModal from './EditPostModal';
import PostUpdateNotification from './PostUpdateNotification';
import { usePostsRefreshSafe } from '../../hooks/usePostsRefreshSafe';

// Interface Post chung
interface ProfilePost {
  _id: string;
  content: string;
  createdAt: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  images?: string[];
  videos?: string[];
  likes?: string[];
  shares?: number;
  comments?: any[];
}

interface User {
  email?: string;
  name?: string;
  avatar?: string;
  id?: string;
  _id?: string;
}

interface ProfilePostsProps {
  user: User;
}

const ProfilePosts: React.FC<ProfilePostsProps> = ({ user }) => {
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  // Posts refresh context
  const { refreshTrigger } = usePostsRefreshSafe();

  // Modal states
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activePost, setActivePost] = useState<ProfilePost | null>(null);
  const [sharePost, setSharePost] = useState<ProfilePost | null>(null);
  const [editPost, setEditPost] = useState<ProfilePost | null>(null);
  const [shareContent, setShareContent] = useState("");
  const [sharePrivacy, setSharePrivacy] = useState("public");

  useEffect(() => {
    console.log('📱 ProfilePosts: useEffect triggered, refreshTrigger:', refreshTrigger);
    
    const fetchPosts = async () => {
      try {
        // Chỉ show loading cho lần đầu tiên, không show khi refresh
        if (posts.length === 0) {
          setLoading(true);
        }
        setError(null);
        
        const res = await fetch('http://localhost:3000/post');
        const data = await res.json();
        
        if (data.success) {
          console.log('📱 ProfilePosts: Fetched posts:', data.posts?.length || 0);
          console.log('📱 ProfilePosts: User email:', user?.email);
          console.log('🔍 First 3 posts structure:', data.posts?.slice(0, 3).map((p: any) => ({
            id: p._id,
            authorId: p.authorId,
            authorEmail: p.authorEmail,
            author: p.author,
            content: p.content?.slice(0, 50) + '...'
          })));
          setPosts(data.posts);
          // Hiện notification nếu không phải lần fetch đầu tiên
          if (refreshTrigger > 0 && posts.length > 0) {
            setShowUpdateNotification(true);
          }
        } else {
          setError('Không thể tải bài viết');
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Lỗi khi tải bài viết');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lọc các bài viết của user hiện tại
  // Backend chuyển đổi email -> Firebase UID, vì vậy cần dùng user.id
  const userPosts = posts.filter(post => {
    // Từ debug log, user có id = Firebase UID = 'ajTFfTPFbrQjuyelGYBxcz9L02H2'
    // Backend chuyển authorId từ email sang Firebase UID trong getPostsWithComments
    const isMatch = post.authorId === user?.id || 
                   post.authorId === user?.email ||
                   post.authorId === user?._id;
    
    if (posts.indexOf(post) < 3) { // Debug first 3 posts
      console.log(`🔍 Post ${post._id}:`, {
        postAuthorId: post.authorId,
        userFirebaseId: user?.id,
        userEmail: user?.email,
        userMongoId: user?._id,
        isMatch: isMatch ? '✅ MATCH' : '❌ NO MATCH'
      });
    }
    
    return isMatch;
  });
  
  console.log('📱 ProfilePosts Debug:');
  console.log('- All posts:', posts.length);
  console.log('- User posts found:', userPosts.length);
  console.log('- User info:', { email: user?.email, id: user?.id, _id: user?._id });
  console.log('- All post authorIds:', posts.map(p => p.authorId));
  console.log('- User posts:', userPosts.map(p => ({ id: p._id, authorId: p.authorId })));

  // Xử lý like bài viết
  const handleLike = async (post: ProfilePost) => {
    if (!user?.email) return;

    try {
      const isLiked = post.likes?.includes(user.email);
      const method = isLiked ? 'DELETE' : 'POST';
      
      const res = await fetch(`http://localhost:3000/post/${post._id}/like`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.email }),
      });

      if (res.ok) {
        // Cập nhật local state
        setPosts(prevPosts => 
          prevPosts.map(p => {
            if (p._id === post._id) {
              const updatedLikes: string[] = isLiked 
                ? (p.likes?.filter((id: string) => id !== user.email) || [])
                : [...(p.likes || []), user.email!];
              return { ...p, likes: updatedLikes };
            }
            return p;
          })
        );
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  // Xử lý mở comment modal
  const handleComment = (post: ProfilePost) => {
    setActivePost(post);
    setShowCommentModal(true);
  };

  // Xử lý mở share modal
  const handleShare = (post: ProfilePost) => {
    setSharePost(post);
    setShowShareModal(true);
    setShareContent("");
    setSharePrivacy("public");
  };

  // Xử lý chỉnh sửa bài viết
  const handleEdit = (post: ProfilePost) => {
    setEditPost(post);
    setShowEditModal(true);
  };

  // Xử lý lưu bài viết sau khi edit
  const handleEditSave = async (postId: string, newContent: string) => {
    try {
      const res = await fetch(`http://localhost:3000/post/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newContent,
          userEmail: user?.email
        })
      });

      if (res.ok) {
        // Cập nhật local state
        setPosts(prevPosts => 
          prevPosts.map(p => 
            p._id === postId ? { ...p, content: newContent } : p
          )
        );
        setShowEditModal(false);
        setEditPost(null);
      } else {
        const data = await res.json();
        alert(data.message || 'Không thể cập nhật bài viết');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Lỗi khi cập nhật bài viết');
    }
  };

  // Xử lý xóa bài viết
  const handleDelete = async (post: ProfilePost) => {
    try {
      const res = await fetch(`http://localhost:3000/post/${post._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: user?.email
        })
      });

      if (res.ok) {
        // Xóa khỏi local state
        setPosts(prevPosts => prevPosts.filter(p => p._id !== post._id));
        alert('Đã xóa bài viết thành công');
      } else {
        const data = await res.json();
        alert(data.message || 'Không thể xóa bài viết');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Lỗi khi xóa bài viết');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        width: '100%', 
        margin: '0 auto', 
        marginTop: 32 
      }}>
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          boxShadow: '0 2px 8px #0002', 
          padding: '20px 24px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#888' }}>Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        width: '100%', 
        margin: '0 auto', 
        marginTop: 32 
      }}>
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          boxShadow: '0 2px 8px #0002', 
          padding: '20px 24px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#e11d48' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      margin: '0 auto', 
      marginTop: 32 
    }}>
      <div style={{ 
        background: '#fff', 
        borderRadius: 12, 
        boxShadow: '0 2px 8px #0002', 
        padding: '20px 24px' 
      }}>
        <h2 style={{ 
          fontSize: '1.1rem', 
          fontWeight: 600, 
          color: '#222', 
          marginBottom: 8 
        }}>
          Bài viết của bạn
        </h2>
        
        {userPosts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#888'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📝</div>
            <p style={{ 
              fontSize: '1.1rem', 
              marginBottom: '8px',
              fontWeight: 500 
            }}>
              Bạn chưa đăng bài viết nào
            </p>
            <p style={{ fontSize: '0.9rem' }}>
              Hãy chia sẻ những khoảnh khắc đặc biệt của bạn!
            </p>
          </div>
        ) : (
          <>
            <p style={{ 
              color: '#666', 
              fontSize: '0.9rem', 
              marginBottom: 20 
            }}>
              {userPosts.length} bài viết
            </p>
            
            <div>
              {userPosts.map(post => (
                <ProfilePostItem 
                  key={post._id}
                  post={post} 
                  user={user}
                  onLike={handleLike}
                  onComment={handleComment}
                  onShare={handleShare}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Comment Modal */}
      {showCommentModal && activePost && (
        <CommentModal
          post={activePost}
          user={user}
          onClose={() => {
            setShowCommentModal(false);
            setActivePost(null);
          }}
        />
      )}

      {/* Share Modal */}
      {showShareModal && sharePost && (
        <ShareModal
          open={showShareModal}
          user={user}
          sharePost={sharePost}
          shareContent={shareContent}
          sharePrivacy={sharePrivacy}
          onClose={() => {
            setShowShareModal(false);
            setSharePost(null);
            setShareContent("");
            setSharePrivacy("public");
          }}
          onContentChange={setShareContent}
          onPrivacyChange={setSharePrivacy}
          onShare={(content: string, privacy: string) => {
            // Handle share logic here
            console.log('Sharing post:', { content, privacy });
            setShowShareModal(false);
          }}
        />
      )}

      {/* Edit Post Modal */}
      {showEditModal && editPost && (
        <EditPostModal
          post={editPost}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditPost(null);
          }}
          onSave={handleEditSave}
        />
      )}

      {/* Update Notification */}
      <PostUpdateNotification 
        show={showUpdateNotification}
        onClose={() => setShowUpdateNotification(false)}
      />
    </div>
  );
};

export default ProfilePosts;