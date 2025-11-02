"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const firebaseConfig_1 = require("../config/firebaseConfig");
const router = express_1.default.Router();
// Lấy thông tin user theo userId (dùng sau khi đăng nhập để đồng bộ bio)
router.get('/me/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            res.status(400).json({ success: false, message: 'Thiếu userId' });
            return;
        }
        const userRef = firebaseConfig_1.db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            res.status(404).json({ success: false, message: 'Không tìm thấy user' });
            return;
        }
        res.json({ success: true, user: { id: userDoc.id, ...userDoc.data() } });
        return;
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin user' });
        return;
    }
});
// Theo dõi / Bỏ theo dõi người dùng
router.post('/follow', async (req, res) => {
    try {
        const { currentUserId, targetUserId } = req.body;
        if (!currentUserId || !targetUserId) {
            return res.status(400).json({ success: false, message: 'Thiếu userId' });
        }
        const currentUserRef = firebaseConfig_1.db.collection('users').doc(currentUserId);
        const targetUserRef = firebaseConfig_1.db.collection('users').doc(targetUserId);
        const [currentUserDoc, targetUserDoc] = await Promise.all([
            currentUserRef.get(),
            targetUserRef.get(),
        ]);
        if (!currentUserDoc.exists || !targetUserDoc.exists) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }
        const currentData = currentUserDoc.data() || {};
        const following = currentData.following || [];
        let newFollowing;
        let action;
        if (following.includes(targetUserId)) {
            newFollowing = following.filter((id) => id !== targetUserId);
            action = 'unfollowed';
        }
        else {
            newFollowing = [...following, targetUserId];
            action = 'followed';
        }
        await currentUserRef.update({ following: newFollowing });
        return res.json({ success: true, action, following: newFollowing });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi khi theo dõi người dùng' });
    }
});
// Lấy tất cả user từ Firestore (debug)
router.get('/all', async (req, res) => {
    try {
        const snapshot = await firebaseConfig_1.db.collection('users').get();
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, users });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách user' });
    }
});
// Cập nhật thông tin giới thiệu (bio)
// Cập nhật thông tin giới thiệu (bio) trong Firestore
router.put('/bio', async (req, res) => {
    try {
        const { userId, bio } = req.body;
        if (!userId || typeof bio !== 'string') {
            return res.status(400).json({ success: false, message: 'Thiếu userId hoặc bio' });
        }
        const userRef = firebaseConfig_1.db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
        }
        await userRef.update({ bio });
        const updatedUser = await userRef.get();
        return res.json({ success: true, user: updatedUser.data() });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi khi cập nhật bio' });
    }
});
exports.default = router;
