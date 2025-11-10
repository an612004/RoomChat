import React, { useState, useEffect, useRef } from 'react';
import { Heart, Share2, MessageCircle, MoreHorizontal, Edit2, Trash2, Lock } from 'lucide-react';
import ProfilePostMedia from './ProfilePostMedia';
import { getTotalComments } from '../../utils/commentUtils';
import VerifiedBadge from '../VerifiedBadge';

// Hàm format thời gian động
const formatTimeAgo = (createdAt: string): string => {
    const now = new Date();
    const postTime = new Date(createdAt);
    const diffMs = now.getTime() - postTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Vừa đăng (dưới 1 phút)
    if (diffMinutes < 1) {
        return 'Vừa xong';
    }

    // Dưới 1 giờ - hiển thị phút
    if (diffMinutes < 60) {
        return `${diffMinutes} phút`;
    }

    // Dưới 24 giờ - hiển thị giờ
    if (diffHours < 24) {
        return `${diffHours} giờ`;
    }

    // Trên 24 giờ - hiển thị ngày và giờ
    return postTime.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

interface Post {
    _id: string;
    content: string;
    createdAt: string;
    authorId: string;
    authorName?: string;
    authorAvatar?: string;
    authorVerified?: boolean;
    images?: string[];
    videos?: string[];
    likes?: string[];
    shares?: number;
    comments?: any[];
    commentsDisabled?: boolean;
}

interface User {
    email?: string;
    name?: string;
    avatar?: string;
    id?: string;
    _id?: string;
    isVerified?: boolean;
}

interface ProfilePostItemProps {
    post: Post;
    user: User;
    onLike?: (post: Post) => void;
    onComment?: (post: Post) => void;
    onShare?: (post: Post) => void;
    onEdit?: (post: Post) => void;
    onDelete?: (post: Post) => void;
    onToggleComments?: (postId: string) => void;
    onManagePinComments?: (post: Post) => void;
}

const ProfilePostItem: React.FC<ProfilePostItemProps> = ({
    post,
    user,
    onLike,
    onComment,
    onShare,
    onEdit,
    onDelete,
    onToggleComments,
    onManagePinComments
}) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [localLikes, setLocalLikes] = useState(post.likes || []);
    const [currentTime, setCurrentTime] = useState(new Date());
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Kiểm tra xem user có phải là người đăng bài không
    const isAuthor = post.authorId === user?.email ||
        post.authorId === user?.id ||
        post.authorId === user?._id;

    // Tính toán isLiked từ post data hoặc local state
    const actuallyLiked = localLikes.includes(user?.email || '') ||
        localLikes.includes(user?.id || '') ||
        localLikes.includes(user?._id || '');

    // Hàm toggle like
    const handleLikeToggle = async () => {
        const userId = user?.email || user?.id || user?._id;
        if (!userId) return;

        try {
            // Cập nhật UI ngay lập tức
            let newLikes;
            if (actuallyLiked) {
                // Bỏ like
                newLikes = localLikes.filter(id => id !== userId);
            } else {
                // Thêm like
                newLikes = [...localLikes, userId];
            }

            setLocalLikes(newLikes);

            // Gọi API để cập nhật backend
            if (onLike) {
                onLike(post);
            }
        } catch (error) {
            console.error('Lỗi khi toggle like:', error);
            // Rollback nếu có lỗi
            setLocalLikes(post.likes || []);
        }
    };

    // Đóng dropdown khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    // Cập nhật thời gian mỗi phút để hiển thị thời gian realtime
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Cập nhật mỗi 60 giây

        return () => clearInterval(timer);
    }, []);
    return (
        <div
            className="post-item"
            style={{
                background: 'rgba(255,255,255,0.85)',
                border: '1px solid #e4e6eb',
                borderRadius: 20,
                boxShadow: '0 4px 24px #b6b8c355',
                padding: '28px 24px 20px 24px',
                marginBottom: 28,
                transition: 'box-shadow .18s',
                width: '100%',
                position: 'relative',
                cursor: 'pointer',
                overflow: 'hidden'
            }}
            onMouseOver={e => (e.currentTarget.style.boxShadow = "0 8px 32px #b6b8c355")}
            onMouseOut={e => (e.currentTarget.style.boxShadow = "0 4px 24px #b6b8c355")}
        >
            {/* Post Header */}
            <div
                className="post-header"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 8,
                    justifyContent: 'space-between'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img
                        className="post-header-avatar"
                        src={post.authorAvatar || user?.avatar || '/default-avatar.png'}
                        alt={post.authorName || user?.name}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            boxShadow: '0 1px 6px rgba(0,0,0,0.08)'
                        }}
                    />
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start'
                    }}>
                        <div style={{
                            fontWeight: 700,
                            fontSize: 15,
                            color: '#1b1b1b',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            {post.authorName || user?.name}
                            <VerifiedBadge isVerified={post.authorVerified || user?.isVerified} size="small" />
                        </div>
                        <div style={{
                            fontSize: 12,
                            color: '#65676b'
                        }}>
                            {formatTimeAgo(post.createdAt)}
                        </div>
                    </div>
                </div>

                {/* Menu dropdown cho người đăng bài */}
                {isAuthor && (
                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: 8,
                                borderRadius: '50%',
                                cursor: 'pointer',
                                color: '#65676b',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f3f4f6';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            <MoreHorizontal size={20} />
                        </button>

                        {showDropdown && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                background: 'white',
                                border: '1px solid #e4e6eb',
                                borderRadius: 8,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                zIndex: 10,
                                minWidth: 120
                            }}>
                                <button
                                    onClick={() => {
                                        onEdit?.(post);
                                        setShowDropdown(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: 'none',
                                        background: 'none',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontSize: 14,
                                        color: '#1b1b1b'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <Edit2 size={16} />
                                    Chỉnh sửa
                                </button>

                                {/* Tắt/Bật bình luận */}
                                <button
                                    onClick={() => {
                                        onToggleComments?.(post._id);
                                        setShowDropdown(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: 'none',
                                        background: 'none',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontSize: 14,
                                        color: post.commentsDisabled ? '#22c55e' : '#f59e0b'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    {post.commentsDisabled ? '🔓' : '🔒'}
                                    {post.commentsDisabled ? 'Bật bình luận' : 'Tắt bình luận'}
                                </button>
                                <button
                                    onClick={() => {
                                        if (window.confirm('Bạn có chắc muốn xóa bài viết này?')) {
                                            onDelete?.(post);
                                        }
                                        setShowDropdown(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: 'none',
                                        background: 'none',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontSize: 14,
                                        color: '#dc2626'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#fef2f2';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <Trash2 size={16} />
                                    Xóa bài viết
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Post Content - Căn trái */}
            <div style={{
                margin: '18px 0',
                fontSize: 18,
                lineHeight: 1.7,
                color: '#222',
                wordBreak: 'break-word',
                textAlign: 'left'
            }}>
                {post.content}
            </div>

            {/* Post Media */}
            <ProfilePostMedia
                images={post.images}
                videos={post.videos}
            />

            {/* Stats hiển thị trước buttons như trang chủ */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 16,
                marginBottom: 8,
                fontSize: 15,
                color: '#65676b'
            }}>
                <div style={{ display: 'flex', gap: 16 }}>
                    {localLikes && localLikes.length > 0 && (
                        <span
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                cursor: 'pointer',
                                transition: 'opacity 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '0.8';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '1';
                            }}
                        >
                            <Heart size={16} fill="#e11d48" color="#e11d48" />
                            {localLikes.length}
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                    {post.comments && post.comments.length > 0 && (
                        <span
                            onClick={() => onComment?.(post)}
                            style={{
                                cursor: 'pointer',
                                color: '#65676b',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#1877f2';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#65676b';
                            }}
                        >
                            {getTotalComments(post.comments)} bình luận
                        </span>
                    )}
                    {/* {post.shares && post.shares >  && (
                        <span>{post.shares} lượt chia sẻ</span>
                    )} */}
                </div>
            </div>

            {/* Action Buttons - Layout giống trang chủ */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 12,
                borderTop: '1px solid #e4e6eb'
            }}>
                <button
                    onClick={handleLikeToggle}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'none',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 15,
                        fontWeight: 600,
                        color: actuallyLiked ? '#e11d48' : '#65676b',
                        transition: 'all 0.2s',
                        flex: 1,
                        justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                >
                    <Heart
                        size={20}
                        fill={actuallyLiked ? '#e11d48' : 'none'}
                        stroke={actuallyLiked ? '#e11d48' : '#65676b'}
                    />
                    {actuallyLiked ? 'Đã thích' : 'Thích'}
                </button>

                <button
                    onClick={() => post.commentsDisabled ? null : onComment?.(post)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'none',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: 8,
                        cursor: post.commentsDisabled ? 'not-allowed' : 'pointer',
                        fontSize: 15,
                        fontWeight: 600,
                        color: post.commentsDisabled ? '#9ca3af' : '#65676b',
                        transition: 'all 0.2s',
                        flex: 1,
                        justifyContent: 'center',
                        opacity: post.commentsDisabled ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                        if (!post.commentsDisabled) {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    disabled={post.commentsDisabled}
                >
                    {post.commentsDisabled ? <Lock strokeWidth={2.25} /> : <MessageCircle size={20} />}
                    {post.commentsDisabled ? 'Bình luận đã tắt' : 'Bình luận'}
                </button>

                <button
                    onClick={() => onShare?.(post)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'none',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 15,
                        fontWeight: 600,
                        color: '#65676b',
                        transition: 'all 0.2s',
                        flex: 1,
                        justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                >
                    <Share2 size={20} />
                    Chia sẻ
                </button>
            </div>

            {/* Comment Section - Căn trái
            <div style={{ marginTop: 14 }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        // justifyContent: "flex-start", // Căn trái thay vì flex-end
                    }}
                >
                    {post.comments && post.comments.length > 0 && (
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                fontWeight: 500,
                                fontSize: 15,
                                color: "#555",
                                cursor: "pointer",
                            }}
                            onClick={() => onComment?.(post)}
                        >
                            <MessageCircle size={18} strokeWidth={1.3} />
                            {post.comments.length} bình luận
                        </span>
                    )}
                </div>
            </div> */}
        </div>
    );
};

export default ProfilePostItem;