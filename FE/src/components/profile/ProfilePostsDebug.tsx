import React, { useState, useEffect } from 'react';

const ProfilePostsDebug: React.FC<{ userEmail?: string }> = ({ userEmail }) => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                console.log('🔍 Debug: Fetching posts...');
                const res = await fetch('http://localhost:3000/post');
                const data = await res.json();

                console.log('🔍 Debug: API Response:', data);
                console.log('🔍 Debug: Posts count:', data.posts?.length || 0);
                console.log('🔍 Debug: User email:', userEmail);

                if (data.success && data.posts) {
                    setPosts(data.posts);

                    // Filter posts by user email
                    const userPosts = data.posts.filter((post: any) => post.authorId === userEmail);
                    console.log('🔍 Debug: User posts count:', userPosts.length);
                    console.log('🔍 Debug: Sample posts:', data.posts.slice(0, 2).map((p: any) => ({
                        id: p._id,
                        authorId: p.authorId,
                        content: p.content?.substring(0, 50) + '...'
                    })));
                }
            } catch (error) {
                console.error('🔍 Debug: Error fetching posts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [userEmail]);

    if (loading) {
        return <div style={{ padding: 20 }}>🔍 Debug: Loading posts...</div>;
    }

    const userPosts = posts.filter(post => post.authorId === userEmail);

    // return (
    //     <div style={{ padding: 20, background: '#f0f0f0', margin: 10, borderRadius: 8 }}>
    //         <h3>🔍 Debug Info</h3>
    //         <p><strong>User Email:</strong> {userEmail || 'Not provided'}</p>
    //         <p><strong>Total Posts:</strong> {posts.length}</p>
    //         <p><strong>User Posts:</strong> {userPosts.length}</p>

    //         {userPosts.length > 0 && (
    //             <div>
    //                 <h4>User's Posts:</h4>
    //                 {userPosts.slice(0, 3).map((post) => (
    //                     <div key={post._id} style={{ background: 'white', padding: 10, margin: 5, borderRadius: 4 }}>
    //                         <p><strong>ID:</strong> {post._id}</p>
    //                         <p><strong>Content:</strong> {post.content?.substring(0, 100)}...</p>
    //                         <p><strong>Author ID:</strong> {post.authorId}</p>
    //                         <p><strong>Created:</strong> {new Date(post.createdAt).toLocaleString()}</p>
    //                     </div>
    //                 ))}
    //             </div>
    //         )}
    //     </div>
    // );
};

export default ProfilePostsDebug;