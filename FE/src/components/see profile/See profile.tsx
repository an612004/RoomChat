import React, { useState, useEffect } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, UserPlus, UserMinus, MessageCircle, Settings, Heart, MoreHorizontal, Share2 } from "lucide-react";
import VerifiedBadge from "../VerifiedBadge";
import useAuth from "../../hooks/useAuth";
import CommentModal from "../trangchu/CommentModal";
import "./SeeProfile.css";

interface UserProfile {
    id: string;
    name: string;
    email: string;
    avatar: string;
    bio?: string;
    location?: string;
    joinedDate?: string;
    followersCount?: number;
    followingCount?: number;
    postsCount?: number;
    isVerified?: boolean;
    provider: string;
}

interface Comment {
    _id?: string;
    authorId: string;
    authorName?: string;
    authorAvatar?: string;
    content: string;
    createdAt?: string;
    reactions?: {
        heart?: string[];
    };
    replies?: Comment[];
}

interface Post {
    _id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    authorEmail?: string;
    authorVerified?: boolean;
    content: string;
    images?: string[];
    videos?: string[];
    likes?: string[] | number; // Can be either array of user IDs or count number
    shares?: number;
    comments?: Comment[];
    createdAt: string;
    date?: { seconds: number };
}

interface SeeProfileProps {
    userId: string;
    onClose: () => void;
}


const SeeProfile: React.FC<SeeProfileProps> = ({ userId, onClose }) => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    // We no longer use a full-page loading flag — render layout immediately.
    const [postsLoading, setPostsLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');
    const [followers, setFollowers] = useState<UserProfile[]>([]);
    const [following, setFollowing] = useState<UserProfile[]>([]);

    // States for post interactions
    const [showLikesModal, setShowLikesModal] = useState<string | null>(null);
    const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());
    const [userLikedPosts, setUserLikedPosts] = useState<Set<string>>(new Set());
    const [animatingHearts, setAnimatingHearts] = useState<Set<string>>(new Set());
    const [localLikedPosts, setLocalLikedPosts] = useState<Set<string>>(new Set());

    // States for CommentModal - using shared component
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [activePost, setActivePost] = useState<Post | null>(null);

    // Fetch user profile
    const fetchProfile = async () => {
        try {
            // start fetchProfile (no full-page loader)
            const response = await fetch(`http://localhost:3000/auth/user/${userId}`);
            const data = await response.json();

            if (data.success && data.user) {
                const userProfile: UserProfile = {
                    id: data.user.id || data.user._id,
                    name: data.user.name,
                    email: data.user.email,
                    avatar: data.user.avatar,
                    bio: data.user.bio || "Chưa có thông tin giới thiệu",
                    location: data.user.location,
                    joinedDate: data.user.joinedDate || data.user.createdAt,
                    followersCount: data.user.followersCount || 0,
                    followingCount: data.user.followingCount || 0,
                    postsCount: data.user.postsCount || 0,
                    isVerified: data.user.isVerified || false,
                    provider: data.user.provider || 'unknown'
                };
                setProfile(userProfile);

                // Also check follow status
                if (currentUser) {
                    checkFollowStatus();
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            // fetchProfile finished
        }
    };

    // Fetch user posts
    const fetchPosts = async () => {
        try {
            setPostsLoading(true);

            const searchId = profile?.email || userId;
            console.log(`🔍 Fetching posts for user: ${searchId} (original userId: ${userId})`);

            const response = await fetch(`http://localhost:3000/post/user/${encodeURIComponent(searchId)}?includeComments=true&includeReplies=true`);
            const data = await response.json();

            console.log('📝 Posts API response:', data);

            if (data.success) {
                console.log(`✅ Found ${data.posts.length} posts for user ${searchId}`);
                const fetchedPosts = data.posts || [];
                setPosts(fetchedPosts);

                // Initialize userLikedPosts state based on fetched posts
                if (currentUser) {
                    const userIdentifier = currentUser.email || currentUser.id;
                    if (userIdentifier) {
                        const likedPostIds = new Set<string>();

                        fetchedPosts.forEach((post: Post) => {
                            // For array-based likes, check if user is in the array
                            if (Array.isArray(post.likes) && post.likes.includes(userIdentifier)) {
                                likedPostIds.add(post._id);
                                console.log(`✅ User ${userIdentifier} liked post ${post._id} (array check)`);
                            }
                            // For number-based likes, we'll rely on local state 
                            // (this should be enhanced with a proper API call to get user's liked posts)
                        });

                        setUserLikedPosts(likedPostIds);
                        setLocalLikedPosts(new Set(likedPostIds)); // Initialize local state with same data
                        console.log(`🔍 Initialized userLikedPosts:`, Array.from(likedPostIds));
                    }
                }
            } else {
                setPosts([]);
            }
        } catch (error) {
            console.error('❌ Error fetching posts:', error);
            setPosts([]);
        } finally {
            setPostsLoading(false);
        }
    };

    // Check follow status
    const checkFollowStatus = async () => {
        if (!currentUser) return;

        try {
            const response = await fetch(`http://localhost:3000/auth/follow-status/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'user-id': currentUser.id || currentUser.email,
                }
            });
            const data = await response.json();
            setIsFollowing(data.isFollowing || false);
        } catch (error) {
            console.error('Error checking follow status:', error);
        }
    };

    // Handle follow/unfollow
    const handleFollowToggle = async () => {
        if (!currentUser || followLoading) return;

        try {
            setFollowLoading(true);
            const endpoint = isFollowing ? 'unfollow' : 'follow';
            const response = await fetch(`http://localhost:3000/auth/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'user-id': currentUser.id || currentUser.email,
                },
                body: JSON.stringify({ targetUserId: userId })
            });

            const data = await response.json();
            if (data.success) {
                setIsFollowing(!isFollowing);
                // Update follower count
                setProfile(prev => prev ? {
                    ...prev,
                    followersCount: isFollowing
                        ? (prev.followersCount || 1) - 1
                        : (prev.followersCount || 0) + 1
                } : null);
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
        } finally {
            setFollowLoading(false);
        }
    };

    // Fetch followers list
    const fetchFollowers = async () => {
        try {
            const response = await fetch(`http://localhost:3000/auth/user/${userId}/followers`);
            const data = await response.json();

            if (data.success) {
                setFollowers(data.followers || []);
            }
        } catch (error) {
            console.error('Error fetching followers:', error);
        }
    };

    // Fetch following list
    const fetchFollowing = async () => {
        try {
            const response = await fetch(`http://localhost:3000/auth/user/${userId}/following`);
            const data = await response.json();

            if (data.success) {
                setFollowing(data.following || []);
            }
        } catch (error) {
            console.error('Error fetching following:', error);
        }
    };

    // Handle tab change with data fetching
    const handleTabChange = (tab: 'posts' | 'followers' | 'following') => {
        setActiveTab(tab);

        if (tab === 'posts' && posts.length === 0 && profile) {
            fetchPosts();
        } else if (tab === 'followers' && followers.length === 0) {
            fetchFollowers();
        } else if (tab === 'following' && following.length === 0) {
            fetchFollowing();
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return 'Không xác định';
        }
    };

    // Handle post like/unlike - each user can only like once
    const handlePostLike = async (postId: string) => {
        try {
            console.log('🚀 handlePostLike started for postId:', postId);

            if (!currentUser) {
                console.log('❌ No current user, cannot like post');
                return;
            }

            const userIdentifier = currentUser.email || currentUser.id;
            if (!userIdentifier) {
                console.log('❌ No user identifier, cannot like post');
                return;
            }

            // Prevent double clicks
            if (likingPosts.has(postId)) {
                console.log('⏳ Already processing like for post:', postId);
                return;
            }

            console.log('✅ Setting loading state for post:', postId);
            setLikingPosts(prev => new Set(prev).add(postId));

            // Get current post and check if user already liked it
            const currentPost = posts.find(p => p._id === postId);
            if (!currentPost) {
                console.log('❌ Post not found');
                setLikingPosts(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(postId);
                    return newSet;
                });
                return;
            }

            const isCurrentlyLiked = isPostLiked(currentPost);
            console.log('🔍 Current like status:', isCurrentlyLiked);

            // Immediate UI update using local state
            setLocalLikedPosts(prev => {
                const newSet = new Set(prev);
                if (isCurrentlyLiked) {
                    newSet.delete(postId);
                } else {
                    newSet.add(postId);
                    // Trigger heart animation when liking (not when unliking)
                    setAnimatingHearts(prevAnim => new Set(prevAnim).add(postId));
                    // Remove animation after animation completes
                    setTimeout(() => {
                        setAnimatingHearts(prevAnim => {
                            const newAnimSet = new Set(prevAnim);
                            newAnimSet.delete(postId);
                            return newAnimSet;
                        });
                    }, 400);
                }
                return newSet;
            });

            // Optimistic UI update - toggle like status
            setPosts(prevPosts =>
                prevPosts.map(post => {
                    if (post._id === postId) {
                        if (Array.isArray(post.likes)) {
                            // Handle array-based likes (with user IDs)
                            const currentLikes = [...post.likes];
                            if (isCurrentlyLiked) {
                                // Remove user from likes array
                                const newLikes = currentLikes.filter(id => id !== userIdentifier);
                                console.log('💔 Removing like. Old:', currentLikes, 'New:', newLikes);
                                return { ...post, likes: newLikes };
                            } else {
                                // Add user to likes array (ensure uniqueness)
                                if (!currentLikes.includes(userIdentifier)) {
                                    const newLikes = [...currentLikes, userIdentifier];
                                    console.log('❤️ Adding like. Old:', currentLikes, 'New:', newLikes);
                                    return { ...post, likes: newLikes };
                                }
                            }
                        } else if (typeof post.likes === 'number') {
                            // Handle number-based likes (count only)
                            const newCount = isCurrentlyLiked
                                ? Math.max(0, post.likes - 1)
                                : post.likes + 1;
                            console.log('🔢 Updating like count from', post.likes, 'to', newCount);

                            // Update userLikedPosts state for tracking
                            setUserLikedPosts(prev => {
                                const newSet = new Set(prev);
                                if (isCurrentlyLiked) {
                                    newSet.delete(postId);
                                } else {
                                    newSet.add(postId);
                                }
                                return newSet;
                            });

                            return { ...post, likes: newCount };
                        }
                    }
                    return post;
                })
            );

            // Make API call to toggle like
            try {
                const response = await fetch(`http://localhost:3000/post/${postId}/like`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: userIdentifier
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('✅ Like API response:', data);

                if (data.success) {
                    // Update with actual server response to ensure consistency
                    setPosts(prevPosts =>
                        prevPosts.map(post => {
                            if (post._id === postId) {
                                console.log('🔄 Updating post with server data:', data.likes, 'liked status:', data.liked);
                                return {
                                    ...post,
                                    likes: data.likes !== undefined ? data.likes : post.likes
                                };
                            }
                            return post;
                        })
                    );

                    // Sync local state with server response based on actual server status
                    if (data.liked !== undefined) {
                        if (data.liked) {
                            // Server confirms user liked the post
                            setUserLikedPosts(prev => {
                                if (!prev.has(postId)) {
                                    console.log('📌 Adding to userLikedPosts (server confirmed):', postId);
                                    const newSet = new Set(prev);
                                    newSet.add(postId);
                                    return newSet;
                                }
                                return prev;
                            });
                            // Remove from local optimistic state since server confirmed
                            setLocalLikedPosts(prev => {
                                if (prev.has(postId)) {
                                    console.log('🧹 Removing from localLikedPosts (server confirmed):', postId);
                                    const newSet = new Set(prev);
                                    newSet.delete(postId);
                                    return newSet;
                                }
                                return prev;
                            });
                        } else {
                            // Server confirms user has NOT liked the post
                            setUserLikedPosts(prev => {
                                if (prev.has(postId)) {
                                    console.log('📌 Removing from userLikedPosts (server confirmed):', postId);
                                    const newSet = new Set(prev);
                                    newSet.delete(postId);
                                    return newSet;
                                }
                                return prev;
                            });
                            // Remove from local optimistic state since server confirmed
                            setLocalLikedPosts(prev => {
                                if (prev.has(postId)) {
                                    console.log('🧹 Removing from localLikedPosts (server confirmed):', postId);
                                    const newSet = new Set(prev);
                                    newSet.delete(postId);
                                    return newSet;
                                }
                                return prev;
                            });
                        }
                    }
                    if (Array.isArray(data.likes)) {
                        const serverLikedState = data.likes.includes(userIdentifier);
                        setUserLikedPosts(prev => {
                            const newSet = new Set(prev);
                            if (serverLikedState) {
                                newSet.add(postId);
                            } else {
                                newSet.delete(postId);
                            }
                            return newSet;
                        });

                        // Sync local liked posts with server state
                        setLocalLikedPosts(prev => {
                            const newSet = new Set(prev);
                            if (serverLikedState) {
                                newSet.add(postId);
                            } else {
                                newSet.delete(postId);
                            }
                            console.log(`🔄 Synced localLikedPosts for ${postId}:`, serverLikedState);
                            return newSet;
                        });
                    }
                } else {
                    throw new Error(data.message || 'Failed to toggle like');
                }
            } catch (error) {
                console.error('❌ Error toggling like:', error);

                // Revert local liked posts on error
                setLocalLikedPosts(prev => {
                    const newSet = new Set(prev);
                    if (isCurrentlyLiked) {
                        newSet.add(postId); // Restore if was liked
                    } else {
                        newSet.delete(postId); // Remove if wasn't liked
                    }
                    console.log(`🔄 Reverted localLikedPosts for ${postId} due to error`);
                    return newSet;
                });

                // Revert optimistic update on error
                setPosts(prevPosts =>
                    prevPosts.map(post => {
                        if (post._id === postId) {
                            if (Array.isArray(post.likes)) {
                                // Revert array-based likes
                                const currentLikes = [...post.likes];
                                if (isCurrentlyLiked) {
                                    // Re-add the user
                                    if (!currentLikes.includes(userIdentifier)) {
                                        return { ...post, likes: [...currentLikes, userIdentifier] };
                                    }
                                } else {
                                    // Remove the user
                                    return { ...post, likes: currentLikes.filter(id => id !== userIdentifier) };
                                }
                            } else if (typeof post.likes === 'number') {
                                // Revert number-based likes
                                const revertedCount = isCurrentlyLiked
                                    ? post.likes + 1
                                    : Math.max(0, post.likes - 1);

                                // Revert userLikedPosts state
                                setUserLikedPosts(prev => {
                                    const newSet = new Set(prev);
                                    if (isCurrentlyLiked) {
                                        newSet.add(postId);
                                    } else {
                                        newSet.delete(postId);
                                    }
                                    return newSet;
                                });

                                return { ...post, likes: revertedCount };
                            }
                        }
                        return post;
                    })
                );
            } finally {
                setLikingPosts(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(postId);
                    return newSet;
                });
            }
        } catch (outerError) {
            console.error('❌ CRITICAL ERROR in handlePostLike:', outerError);
            setLikingPosts(prev => {
                const newSet = new Set(prev);
                newSet.delete(postId);
                return newSet;
            });
        }
    };

    // Utility function to safely get likes array
    const getPostLikes = (post: Post): string[] => {
        try {
            if (!post.likes) return [];
            if (Array.isArray(post.likes)) return post.likes;
            if (typeof post.likes === 'number') {
                return [];
            }
            return [];
        } catch (error) {
            console.error('❌ Error getting post likes:', error);
            return [];
        }
    };

    // Utility function to get likes count
    const getPostLikesCount = (post: Post): number => {
        try {
            if (!post.likes) return 0;
            if (typeof post.likes === 'number') return post.likes;
            if (Array.isArray(post.likes)) return post.likes.length;
            return 0;
        } catch (error) {
            console.error('❌ Error getting post likes count:', error);
            return 0;
        }
    };

    // Check if current user liked the post - simplified logic with local state priority
    const isPostLiked = (post: Post) => {
        try {
            if (!currentUser) {
                return false;
            }

            const userIdentifier = currentUser.email || currentUser.id;
            if (!userIdentifier) {
                return false;
            }

            // Priority 1: Check local state first (for immediate UI updates)
            if (localLikedPosts.has(post._id)) {
                console.log(`✅ isPostLiked (${post._id}): TRUE from localLikedPosts`);
                return true;
            }

            // Priority 2: Check array-based likes from server
            if (Array.isArray(post.likes)) {
                const isLiked = post.likes.includes(userIdentifier);
                console.log(`🔍 isPostLiked (${post._id}): ${isLiked} from array-based likes`, post.likes);
                return isLiked;
            }

            // Priority 3: For number-based likes, check userLikedPosts state
            if (typeof post.likes === 'number') {
                const isLiked = userLikedPosts.has(post._id);
                console.log(`🔍 isPostLiked (${post._id}): ${isLiked} from userLikedPosts state`);
                return isLiked;
            }

            console.log(`❌ isPostLiked (${post._id}): FALSE - unknown format`);
            return false;
        } catch (error) {
            console.error('❌ Error in isPostLiked:', error);
            return false;
        }
    };

    // Handle showing likes modal
    const handleShowLikes = (postId: string) => {
        setShowLikesModal(postId);
    };

    // Handle showing comments modal - using shared CommentModal
    const handleShowComments = (postId: string) => {
        console.log('🔍 handleShowComments called with postId:', postId);
        console.log('🔍 Current posts array length:', posts.length);
        console.log('🔍 Current user:', currentUser?.email);
        console.log('🔍 Available post IDs:', posts.map(p => p._id));

        const post = posts.find(p => p._id === postId);
        console.log('🔍 Found post:', !!post);

        if (post) {
            console.log('🔍 Post details:', {
                id: post._id,
                content: post.content?.substring(0, 50),
                commentsCount: post?.comments?.length || 0
            });

            console.log('🔍 Setting activePost and showCommentModal...');

            // Use flushSync to ensure immediate state update
            flushSync(() => {
                setActivePost(post);
                setShowCommentModal(true);
            });

            console.log('🔍 State set with flushSync - activePost:', !!post, 'showCommentModal: true');

            console.log('✅ CommentModal should now be visible');
        } else {
            console.log('❌ Post not found in posts array');
            console.log('🔍 Searched for postId:', postId);
            console.log('🔍 Available posts:', posts.map(p => ({ id: p._id, content: p.content?.substring(0, 30) })));
        }
    };

    // Handle post updates from CommentModal
    const handlePostUpdate = (postId: string, updates: Partial<Post>) => {
        setPosts(prevPosts =>
            prevPosts.map(post =>
                post._id === postId
                    ? { ...post, ...updates }
                    : post
            )
        );
    };

    // Format time ago - matching ProfilePostItem style
    const formatTimeAgo = (dateString: string) => {
        try {
            const now = new Date();
            const postTime = new Date(dateString);
            const diffMs = now.getTime() - postTime.getTime();
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

            if (diffMinutes < 1) {
                return 'Vừa xong';
            }

            if (diffMinutes < 60) {
                return `${diffMinutes} phút`;
            }

            if (diffHours < 24) {
                return `${diffHours} giờ`;
            }

            return postTime.toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Vừa xong';
        }
    };

    // Count total comments including replies
    const getTotalComments = (comments?: Comment[]): number => {
        if (!comments) return 0;
        return comments.reduce((total, comment) => {
            return total + 1 + (comment.replies ? comment.replies.length : 0);
        }, 0);
    };

    // Monitor state changes for debugging
    useEffect(() => {
        console.log('🔍 State changed - showCommentModal:', showCommentModal, 'activePost:', !!activePost);
    }, [showCommentModal, activePost]);

    useEffect(() => {
        if (userId) {
            console.log('🚀 SeeProfile mounted with userId:', userId);
            console.log('👤 Current user:', currentUser);
            fetchProfile();
        }
    }, [userId, currentUser]);

    useEffect(() => {
        if (profile && activeTab === 'posts') {
            fetchPosts();
        }
    }, [profile, activeTab]);

    useEffect(() => {
        if (activeTab === 'followers' && followers.length === 0 && userId) {
            fetchFollowers();
        } else if (activeTab === 'following' && following.length === 0 && userId) {
            fetchFollowing();
        }
    }, [activeTab, userId]);

    // Render the component immediately (no blocking full-page loader).
    // When `profile` is not yet available, show placeholders/defaults in the UI
    // and populate them when the async fetch completes.

    const isOwnProfile = currentUser && (currentUser.id === userId || currentUser.email === userId);

    return (
        <div className="see-profile-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="see-profile-content">
                {/* Header */}
                <div className="profile-header">
                    <button onClick={onClose} className="back-btn">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="header-name-section">
                        <h2>{profile?.name || 'Đang tải...'}</h2>
                        {profile?.isVerified && (
                            <VerifiedBadge isVerified={true} size="medium" />
                        )}
                    </div>
                    {isOwnProfile && (
                        <button onClick={() => navigate('/profile')} className="settings-btn">
                            <Settings size={20} />
                        </button>
                    )}
                </div>

                {/* Profile Info */}
                <div className="profile-info">
                    <div className="profile-avatar-section">
                        <img
                            src={profile?.avatar || "/default-avatar.png"}
                            alt={profile?.name || ''}
                            className="profile-avatar-large"
                        />
                    </div>

                    <div className="profile-details">
                        <div className="profile-name-section">
                            <div className="profile-name-row">
                                <h1 className="profile-name">{profile?.name || 'Đang tải...'}</h1>
                                {profile?.isVerified && (
                                    <VerifiedBadge isVerified={true} size="medium" />
                                )}
                            </div>
                            <span className="profile-email">@{profile?.email ? profile.email.split('@')[0] : ''}</span>
                        </div>

                        <p className="profile-bio">{profile?.bio || ''}</p>

                        <div className="profile-meta">
                            {profile?.location && (
                                <div className="meta-item">
                                    <MapPin size={16} />
                                    <span>{profile.location}</span>
                                </div>
                            )}
                            <div className="meta-item">
                                <Calendar size={16} />
                                <span>Tham gia {formatDate(profile?.joinedDate || '')}</span>
                            </div>
                        </div>

                        <div className="profile-stats">
                            <div className="stat-item" onClick={() => handleTabChange('posts')}>
                                <span className="stat-number">{profile?.postsCount || posts.length}</span>
                                <span className="stat-label">Bài viết</span>
                            </div>
                            <div className="stat-item" onClick={() => handleTabChange('following')}>
                                <span className="stat-number">{profile?.followingCount || 0}</span>
                                <span className="stat-label">Đang theo dõi</span>
                            </div>
                            <div className="stat-item" onClick={() => handleTabChange('followers')}>
                                <span className="stat-number">{profile?.followersCount || 0}</span>
                                <span className="stat-label">Người theo dõi</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {!isOwnProfile && currentUser && (
                            <div className="profile-actions">
                                <button
                                    onClick={handleFollowToggle}
                                    disabled={followLoading}
                                    className={`follow-btn ${isFollowing ? 'following' : 'follow'}`}
                                >
                                    {followLoading ? (
                                        <div className="btn-spinner"></div>
                                    ) : isFollowing ? (
                                        <>
                                            <UserMinus size={16} />
                                            Bỏ theo dõi
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={16} />
                                            Theo dõi
                                        </>
                                    )}
                                </button>
                                <button className="message-btn">
                                    <MessageCircle size={16} />
                                    Nhắn tin
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="profile-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
                        onClick={() => handleTabChange('posts')}
                    >
                        Bài viết ({profile?.postsCount || posts.length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'followers' ? 'active' : ''}`}
                        onClick={() => handleTabChange('followers')}
                    >
                        Người theo dõi ({profile?.followersCount || 0})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'following' ? 'active' : ''}`}
                        onClick={() => handleTabChange('following')}
                    >
                        Đang theo dõi ({profile?.followingCount || 0})
                    </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                    {activeTab === 'posts' && (
                        <div className="posts-section">
                            <div className="posts-header">
                                <h3>Bài viết của {profile?.name}</h3>
                                {/* Debug button for testing */}

                            </div>

                            {postsLoading ? (
                                <div className="loading-spinner">
                                    <div className="spinner"></div>
                                    <p>Đang tải bài viết...</p>
                                </div>
                            ) : posts.length === 0 ? (
                                <div className="no-posts-message">
                                    <div className="no-posts-icon">📝</div>
                                    <div>Không có bài viết nào để hiển thị</div>
                                </div>
                            ) : (
                                <div className="profile-posts-container">
                                    {posts.map(post => (
                                        <div key={post._id} className="profile-post-item">
                                            {/* Post Header */}
                                            <div className="profile-post-header">
                                                <div className="post-author-section">
                                                    <img
                                                        src={profile?.avatar || "/default-avatar.png"}
                                                        alt={profile?.name}
                                                        className="post-author-avatar"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                        }}
                                                    />
                                                    <div className="post-author-info">
                                                        <div className="post-author-name-section">
                                                            <span className="post-author-name">{profile?.name}</span>
                                                            {profile?.isVerified && (
                                                                <VerifiedBadge isVerified={true} size="medium" />
                                                            )}
                                                        </div>
                                                        <div className="post-timestamp">
                                                            <span>{formatTimeAgo(post.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Post Menu - Only show for current user */}
                                                {currentUser && (currentUser.id === userId || currentUser.email === userId) && (
                                                    <div className="post-menu">
                                                        <button
                                                            className="post-menu-button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                            }}
                                                        >
                                                            <MoreHorizontal size={20} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Post Content */}
                                            <div className="profile-post-content">
                                                <div className="post-text-content">
                                                    {post.content}
                                                </div>

                                                {/* Post Media */}
                                                {((post.images && post.images.length > 0) || (post.videos && post.videos.length > 0)) && (
                                                    <div className="profile-post-media">
                                                        {/* Images */}
                                                        {post.images && post.images.length > 0 && (
                                                            <div className={`media-grid ${post.images.length === 1 ? 'single' : post.images.length === 2 ? 'double' : 'multiple'}`}>
                                                                {post.images.slice(0, 4).map((image, index) => (
                                                                    <div
                                                                        key={index}
                                                                        className={`media-item ${index === 3 && post.images!.length > 4 ? 'has-overlay' : ''}`}
                                                                        onClick={() => {
                                                                            console.log('Open image modal:', image);
                                                                        }}
                                                                    >
                                                                        <img
                                                                            src={image.startsWith('/uploads/') ? `http://localhost:3000${image}` : image}
                                                                            alt={`Post image ${index + 1}`}
                                                                            className="media-image"
                                                                        />
                                                                        {index === 3 && post.images!.length > 4 && (
                                                                            <div className="media-overlay">
                                                                                <span>+{post.images!.length - 4}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Videos */}
                                                        {post.videos && post.videos.length > 0 && (
                                                            <div className="video-container">
                                                                {post.videos.map((video, index) => (
                                                                    <video
                                                                        key={index}
                                                                        src={video.startsWith('/uploads/') ? `http://localhost:3000${video}` : video}
                                                                        controls
                                                                        className="media-video"
                                                                        preload="metadata"
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Post Stats */}
                                            {(getPostLikesCount(post) > 0 || (post.comments && getTotalComments(post.comments) > 0)) && (
                                                <div className="profile-post-stats">
                                                    <div className="stats-row">
                                                        {getPostLikesCount(post) > 0 && (
                                                            <button
                                                                className="stats-item likes-stats"
                                                                onClick={() => handleShowLikes(post._id)}
                                                            >
                                                                <div className="likes-icon">
                                                                    <Heart size={14} fill="#dc2626" color="#dc2626" />
                                                                </div>
                                                                <span className="stats-text">
                                                                    {getPostLikesCount(post)} lượt thích
                                                                </span>
                                                            </button>
                                                        )}

                                                        {post.comments && getTotalComments(post.comments) > 0 && (
                                                            <button
                                                                className="stats-item comments-stats"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleShowComments(post._id);
                                                                }}
                                                            >
                                                                <span className="stats-text">
                                                                    {getTotalComments(post.comments)} bình luận
                                                                </span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action Buttons - Layout giống Profile */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                paddingTop: 12,
                                                borderTop: '1px solid #e4e6eb'
                                            }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        console.log(`🎯 Clicking like for post ${post._id}, current state:`, isPostLiked(post));
                                                        handlePostLike(post._id);
                                                    }}
                                                    disabled={likingPosts.has(post._id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        background: 'none',
                                                        border: 'none',
                                                        padding: '8px 16px',
                                                        borderRadius: 8,
                                                        cursor: likingPosts.has(post._id) ? 'not-allowed' : 'pointer',
                                                        fontSize: 15,
                                                        fontWeight: 600,
                                                        color: isPostLiked(post) ? '#e11d48' : '#65676b',
                                                        transition: 'all 0.2s',
                                                        flex: 1,
                                                        justifyContent: 'center',
                                                        opacity: likingPosts.has(post._id) ? 0.6 : 1
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!likingPosts.has(post._id)) {
                                                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                    }}
                                                >
                                                    <Heart
                                                        size={20}
                                                        fill={isPostLiked(post) ? '#e11d48' : 'none'}
                                                        stroke={isPostLiked(post) ? '#e11d48' : '#65676b'}
                                                        className={`like-button-heart ${animatingHearts.has(post._id) ? 'like-button-animate' : ''}`}
                                                        style={{
                                                            transition: animatingHearts.has(post._id) ? "none" : "all 0.2s ease",
                                                        }}
                                                    />
                                                    {likingPosts.has(post._id) ? 'Đang xử lý...' : (isPostLiked(post) ? 'Đã thích' : 'Thích')}
                                                </button>

                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleShowComments(post._id);
                                                    }}
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
                                                    <MessageCircle size={20} />
                                                    Bình luận
                                                </button>

                                                <button
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
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'followers' && (
                        <div className="users-list">
                            {followers.length === 0 ? (
                                <div className="empty-state">
                                    <p>Chưa có người theo dõi</p>
                                </div>
                            ) : (
                                <div className="users-grid">
                                    {followers.map(follower => (
                                        <div key={follower.id} className="user-card" onClick={() => {
                                            console.log('View profile:', follower.id);
                                        }}>
                                            <img
                                                src={follower.avatar || "/default-avatar.png"}
                                                alt={follower.name}
                                                className="user-card-avatar"
                                            />
                                            <div className="user-card-info">
                                                <div className="user-card-name">
                                                    {follower.name}
                                                    {follower.isVerified && (
                                                        <VerifiedBadge isVerified={true} size="medium" />
                                                    )}
                                                </div>
                                                <div className="user-card-email">@{follower.email.split('@')[0]}</div>
                                                <div className="user-card-provider">{follower.provider}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'following' && (
                        <div className="users-list">
                            {following.length === 0 ? (
                                <div className="empty-state">
                                    <p>Chưa theo dõi ai</p>
                                </div>
                            ) : (
                                <div className="users-grid">
                                    {following.map(followingUser => (
                                        <div key={followingUser.id} className="user-card" onClick={() => {
                                            console.log('View profile:', followingUser.id);
                                        }}>
                                            <img
                                                src={followingUser.avatar || "/default-avatar.png"}
                                                alt={followingUser.name}
                                                className="user-card-avatar"
                                            />
                                            <div className="user-card-info">
                                                <div className="user-card-name">
                                                    {followingUser.name}
                                                    {followingUser.isVerified && (
                                                        <VerifiedBadge isVerified={true} size="medium" />
                                                    )}
                                                </div>
                                                <div className="user-card-email">@{followingUser.email.split('@')[0]}</div>
                                                <div className="user-card-provider">{followingUser.provider}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Likes Modal */}
                {showLikesModal && (
                    <div className="modal-overlay" onClick={() => setShowLikesModal(null)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Những người đã thích</h3>
                                <button
                                    className="modal-close-btn"
                                    onClick={() => setShowLikesModal(null)}
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="modal-body">
                                {(() => {
                                    const post = posts.find(p => p._id === showLikesModal);
                                    if (!post) return <p className="no-likes">Không tìm thấy bài viết</p>;

                                    const likesCount = getPostLikesCount(post);
                                    const likes = getPostLikes(post);

                                    if (likesCount === 0) {
                                        return <p className="no-likes">Chưa có ai thích bài viết này</p>;
                                    }

                                    if (likes.length > 0) {
                                        return (
                                            <div className="likes-list">
                                                {likes.map((likeUserId, index) => {
                                                    // For array-based likes, likeUserId could be email or user ID
                                                    const isCurrentUser = currentUser &&
                                                        (likeUserId === currentUser.email || likeUserId === currentUser.id);

                                                    return (
                                                        <div key={index} className="like-item">
                                                            <img
                                                                src="/default-avatar.png"
                                                                alt={likeUserId}
                                                                className="like-user-avatar"
                                                            />
                                                            <div className="like-user-info">
                                                                <span className="like-user-name">
                                                                    {isCurrentUser ? 'Bạn' : (
                                                                        // Extract name from email if it's an email format
                                                                        likeUserId.includes('@')
                                                                            ? likeUserId.split('@')[0]
                                                                            : likeUserId
                                                                    )}
                                                                </span>
                                                                <span className="like-user-email">
                                                                    {likeUserId.includes('@') ? `@${likeUserId.split('@')[0]}` : `ID: ${likeUserId}`}
                                                                </span>
                                                            </div>
                                                            {!isCurrentUser && (
                                                                <button
                                                                    className="like-user-follow-btn"
                                                                    onClick={() => {
                                                                        console.log('Follow user:', likeUserId);
                                                                        // TODO: Implement follow functionality
                                                                    }}
                                                                >
                                                                    Theo dõi
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="likes-summary">
                                            <div className="likes-count-display">
                                                <span className="heart-emoji-big">❤️</span>
                                                <h3>{likesCount} lượt thích</h3>
                                            </div>
                                            <p className="likes-note">
                                                {isPostLiked(post)
                                                    ? (likesCount === 1
                                                        ? 'Bạn đã thích bài viết này'
                                                        : `Bạn và ${likesCount - 1} người khác đã thích bài viết này`)
                                                    : `${likesCount} người đã thích bài viết này`}
                                            </p>
                                            {/* Show a simplified list for number-based likes */}
                                            <div className="likes-placeholder">
                                                <div className="simple-likes-list">
                                                    {isPostLiked(post) && (
                                                        <div className="like-item-simple">
                                                            <img
                                                                src={currentUser?.avatar || "/default-avatar.png"}
                                                                alt="Bạn"
                                                                className="like-user-avatar-small"
                                                            />
                                                            <span className="like-user-name-simple">Bạn</span>
                                                        </div>
                                                    )}
                                                    {likesCount > 1 && (
                                                        <div className="more-likes-indicator">
                                                            <span className="more-likes-text">
                                                                {isPostLiked(post)
                                                                    ? `và ${likesCount - 1} người khác`
                                                                    : `${likesCount} người khác`}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <small className="likes-api-note">
                                                    💡 Danh sách chi tiết sẽ hiển thị khi có API lấy thông tin người dùng
                                                </small>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Comment Modal - Shared Component */}
                {(() => {
                    console.log('🎯 CommentModal render check:', {
                        showCommentModal,
                        hasActivePost: !!activePost,
                        hasCurrentUser: !!currentUser,
                        activePostId: activePost?._id,
                        shouldRender: !!(showCommentModal && activePost && currentUser)
                    });

                    if (showCommentModal && activePost && currentUser) {
                        console.log('✅ RENDERING CommentModal with post:', activePost._id);
                        return (
                            <CommentModal
                                post={activePost}
                                onClose={() => {
                                    console.log('🚪 Closing CommentModal');
                                    setShowCommentModal(false);
                                    setActivePost(null);
                                }}
                                user={currentUser}
                                onPostUpdate={handlePostUpdate}
                            />
                        );
                    } else {
                        console.log('❌ NOT rendering CommentModal - missing requirements');
                        return null;
                    }
                })()}
            </div>
        </div>
    );
};

export default SeeProfile;