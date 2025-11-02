
import express, { Request, Response } from 'express';
import { db } from '../config/firebaseConfig';
const router = express.Router();

// Lấy thông tin user theo userId (dùng sau khi đăng nhập để đồng bộ bio)
router.get('/me/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ success: false, message: 'Thiếu userId' });
      return;
    }
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      res.status(404).json({ success: false, message: 'Không tìm thấy user' });
      return;
    }
    res.json({ success: true, user: { id: userDoc.id, ...userDoc.data() } });
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
    const following = currentData.following || [];

    const alreadyFollowing = following.includes(targetUserId);
    const targetData = targetUserDoc.data() || {};
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


export default router;
