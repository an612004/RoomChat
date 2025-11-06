
import express, { Request, Response } from 'express';
import { db } from '../config/firebaseConfig';
import Post from '../models/Post';
import Comment from '../models/Comment';
import socketService from '../services/socketService';
const router = express.Router();

// Lấy thông tin user theo userId hoặc email (dùng sau khi đăng nhập để đồng bộ bio)
router.get('/me/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ success: false, message: 'Thiếu userId' });
      return;
    }

    let userDoc;
    let userRef;

    // 🔍 Thử tìm theo document ID trước
    userRef = db.collection('users').doc(userId);
    userDoc = await userRef.get();

    // 🔍 Nếu không tìm thấy, thử tìm theo email
    if (!userDoc.exists) {
      console.log(`🔍 Document ID ${userId} not found, trying email search...`);
      const emailQuery = await db.collection('users').where('email', '==', userId).get();
      
      if (!emailQuery.empty) {
        userDoc = emailQuery.docs[0];
        console.log(`✅ Found user by email: ${userId}`);
      }
    }

    if (!userDoc || !userDoc.exists) {
      console.log(`❌ User not found: ${userId}`);
      res.status(404).json({ success: false, message: 'Không tìm thấy user' });
      return;
    }

    const userData = { id: userDoc.id, ...userDoc.data() };
    console.log(`✅ Returning user data for ${userId}:`, userData);
    res.json({ success: true, user: userData });
    return;
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin user' });
    return;
  }
});
router.post('/follow', async (req, res) => {
  try {
    const { currentUserId, targetUserId } = req.body;
    if (!currentUserId || !targetUserId) {
      return res.status(400).json({ success: false, message: 'Thiếu userId' });
    }

    // ❌ Kiểm tra không được follow chính mình
    if (currentUserId === targetUserId) {
      return res.status(400).json({ success: false, message: 'Bạn không thể theo dõi chính mình' });
    }

    // � Không tìm theo email nữa — chỉ cho phép ID
    const targetUserRef = db.collection('users').doc(targetUserId);
    const targetUserDoc = await targetUserRef.get();

    if (!targetUserDoc.exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng mục tiêu' });
    }

    const currentUserRef = db.collection('users').doc(currentUserId);
    const currentUserDoc = await currentUserRef.get();
    if (!currentUserDoc.exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng hiện tại' });
    }

    const currentData = currentUserDoc.data() || {};
    const targetData = targetUserDoc.data() || {};
    
    // ❌ Kiểm tra không được follow người cùng email
    if (currentData.email && targetData.email && currentData.email === targetData.email) {
      return res.status(400).json({ success: false, message: 'Bạn không thể theo dõi tài khoản cùng email với mình' });
    }

    const following = currentData.following || [];

    const alreadyFollowing = following.includes(targetUserId);
    const targetFollowers = targetData.followers || [];

    if (alreadyFollowing) {
      // ❌ Bỏ theo dõi
      await currentUserRef.update({
        following: following.filter((id: string) => id !== targetUserId),
      });
      await targetUserRef.update({
        followers: targetFollowers.filter((id: string) => id !== currentUserId),
      });
      return res.json({ success: true, action: 'unfollowed' });
    } else {
      // ✅ Theo dõi
      await currentUserRef.update({
        following: [...following, targetUserId],
      });
      await targetUserRef.update({
        followers: targetFollowers.includes(currentUserId)
          ? targetFollowers
          : [...targetFollowers, currentUserId],
      });
      return res.json({ success: true, action: 'followed' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Lỗi khi theo dõi người dùng' });
  }
});


// Lấy tất cả user từ Firestore (debug)
router.get('/all', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách user' });
  }
});

// Cập nhật thông tin giới thiệu (bio)
// Cập nhật thông tin giới thiệu (bio) trong Firestore
router.put('/bio', async (req: Request, res: Response) => {
  try {
    const { userId, bio } = req.body;
    if (!userId || typeof bio !== 'string') {
      return res.status(400).json({ success: false, message: 'Thiếu userId hoặc bio' });
    }
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }
    await userRef.update({ bio });
    const updatedUser = await userRef.get();
    return res.json({ success: true, user: updatedUser.data() });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi khi cập nhật bio' });
  }
});
// 🧩 Lấy thông tin user + chi tiết followers/following
router.get('/me/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Thiếu userId' });
    }

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }

    const userData = userDoc.data();

    // 🧠 Lấy chi tiết danh sách "đang theo dõi"
    let followingDetails: any[] = [];
    if (Array.isArray(userData?.following)) {
      const followingPromises = userData.following.map(async (uid: string) => {
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
          const data = doc.data();
          return {
            id: uid,
            name: data?.name || 'Người dùng',
            email: data?.email || '',
            avatar: data?.avatar || '/default-avatar.png',
          };
        }
        return null;
      });
      followingDetails = (await Promise.all(followingPromises)).filter(Boolean);
    }

    // 🧠 Lấy chi tiết danh sách "người theo dõi" (nếu có)
    let followerDetails: any[] = [];
    if (Array.isArray(userData?.followers)) {
      const followerPromises = userData.followers.map(async (uid: string) => {
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
          const data = doc.data();
          return {
            id: uid,
            name: data?.name || 'Người dùng',
            email: data?.email || '',
            avatar: data?.avatar || '/default-avatar.png',
          };
        }
        return null;
      });
      followerDetails = (await Promise.all(followerPromises)).filter(Boolean);
    }

    // ✅ Trả về user cùng danh sách chi tiết
    return res.json({
      success: true,
      user: {
        id: userDoc.id,
        ...userData,
        following: followingDetails,
        followers: followerDetails,
      },
    });
  } catch (err) {
    console.error('🔥 Lỗi khi lấy thông tin user:', err);
    return res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin user' });
  }
});

// Route cập nhật profile
router.post('/update-profile', async (req: Request, res: Response) => {
  try {
    const { email, name, avatar, coverPhoto, bio } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Thiếu email' });
    }

    // Tìm user theo email
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    
    if (snapshot.empty) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }

    const userDoc = snapshot.docs[0];
    const updateData: any = {};
    
    // Chỉ cập nhật các field được gửi lên
    if (name !== undefined) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (coverPhoto !== undefined) updateData.coverPhoto = coverPhoto;
    if (bio !== undefined) updateData.bio = bio;

    // Cập nhật vào Firestore
    await userDoc.ref.update(updateData);
    
    // Lấy data mới sau khi cập nhật
    const updatedDoc = await userDoc.ref.get();
    const updatedData = updatedDoc.data();

    // 🔄 Broadcast profile update via Socket.IO
    if (name !== undefined || avatar !== undefined) {
      const broadcastData: { name?: string; avatar?: string } = {};
      if (name !== undefined) broadcastData.name = name;
      if (avatar !== undefined) broadcastData.avatar = avatar;
      
      socketService.broadcastProfileUpdate(email, broadcastData);
    }

    // 🔄 Đồng bộ hóa thông tin trong Posts và Comments (MongoDB)
    if (name !== undefined || avatar !== undefined) {
      try {
        const syncData: any = {};
        if (name !== undefined) syncData.authorName = name;
        if (avatar !== undefined) syncData.authorAvatar = avatar;

        // Cập nhật thông tin trong tất cả posts của user
        await Post.updateMany(
          { authorId: email },
          { $set: syncData }
        );

        // Cập nhật thông tin trong tất cả comments của user  
        await Comment.updateMany(
          { authorId: email },
          { $set: syncData }
        );

        // Cập nhật thông tin trong tất cả replies của user
        const comments = await Comment.find({ 'replies.authorId': email });
        for (const comment of comments) {
          let updated = false;
          if (comment.replies && Array.isArray(comment.replies)) {
            comment.replies = comment.replies.map((reply: any) => {
              if (reply.authorId === email) {
                if (name !== undefined) reply.authorName = name;
                if (avatar !== undefined) reply.authorAvatar = avatar;
                updated = true;
              }
              return reply;
            });
          }
          if (updated) {
            await comment.save();
          }
        }

        console.log(`✅ Synced profile data for ${email} across all posts and comments`);

        // 🔄 Cập nhật thông tin trong Firestore followers/following lists
        try {
          // Tìm tất cả users có followers/following chứa email này
          const allUsersSnapshot = await db.collection('users').get();
          
          for (const userDoc of allUsersSnapshot.docs) {
            const userData = userDoc.data();
            let needUpdate = false;
            const updateData: any = {};

            // Kiểm tra và cập nhật trong followers list
            if (userData.followers && Array.isArray(userData.followers)) {
              const followerIndex = userData.followers.findIndex((follower: any) => {
                return (typeof follower === 'string' && follower === email) ||
                       (typeof follower === 'object' && follower.email === email);
              });
              
              if (followerIndex !== -1) {
                // Cập nhật thông tin follower
                if (typeof userData.followers[followerIndex] === 'object') {
                  const updatedFollower = { ...userData.followers[followerIndex] };
                  if (name !== undefined) updatedFollower.name = name;
                  if (avatar !== undefined) updatedFollower.avatar = avatar;
                  userData.followers[followerIndex] = updatedFollower;
                  updateData.followers = userData.followers;
                  needUpdate = true;
                }
              }
            }

            // Kiểm tra và cập nhật trong following list
            if (userData.following && Array.isArray(userData.following)) {
              const followingIndex = userData.following.findIndex((following: any) => {
                return (typeof following === 'string' && following === email) ||
                       (typeof following === 'object' && following.email === email);
              });
              
              if (followingIndex !== -1) {
                // Cập nhật thông tin following
                if (typeof userData.following[followingIndex] === 'object') {
                  const updatedFollowing = { ...userData.following[followingIndex] };
                  if (name !== undefined) updatedFollowing.name = name;
                  if (avatar !== undefined) updatedFollowing.avatar = avatar;
                  userData.following[followingIndex] = updatedFollowing;
                  updateData.following = userData.following;
                  needUpdate = true;
                }
              }
            }

            // Cập nhật vào Firestore nếu cần
            if (needUpdate) {
              await userDoc.ref.update(updateData);
              console.log(`✅ Updated profile info in ${userDoc.id}'s followers/following lists`);
            }
          }

          console.log(`✅ Synced profile data across all Firestore followers/following lists`);
        } catch (firestoreError) {
          console.error('⚠️ Error syncing data to Firestore followers/following:', firestoreError);
          // Không fail request chính, chỉ log lỗi
        }

      } catch (syncError) {
        console.error('⚠️ Error syncing data to posts/comments:', syncError);
        // Không fail request chính, chỉ log lỗi
      }
    }

    return res.json({ 
      success: true, 
      message: 'Cập nhật thành công và đồng bộ dữ liệu',
      user: { id: updatedDoc.id, ...updatedData }
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật profile:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

export default router;
