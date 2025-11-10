import express, { Request, Response, NextFunction, Router } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { db } from '../config/firebaseConfig';
import admin from 'firebase-admin';
import emailService from '../services/emailService';
import Post from '../models/Post';

const router: Router = express.Router();

// Extend Request interface for user property
interface AuthenticatedRequest extends Request {
  user?: any;
}

interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: string;
  createdAt: Date;
  bio?: string;
  followers?: string[];
  following?: string[];
}

// GitHub User interface
interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

// GitHub Email interface
interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility?: string;
}

// Step 1: Redirect to GitHub OAuth
router.get('/github', (req: Request, res: Response) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent('http://localhost:3000/auth/github/callback')}&scope=user:email`;
  
  res.json({ 
    success: true, 
    authUrl: githubAuthUrl,
    message: 'Redirect to GitHub OAuth' 
  });
});

// Step 2: Handle GitHub callback
router.get('/github/callback', async (req: Request, res: Response): Promise<void> => {
  const { code } = req.query;
  
  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
  }

  try {
    // Step 3: Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code,
    }, {
      headers: {
        'Accept': 'application/json'
      }
    });

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_token`);
    }

    // Step 4: Get user data from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const userData = userResponse.data;

    // Step 5: Get user email (if not public)
    const emailResponse = await axios.get('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const primaryEmail = emailResponse.data.find((email: GitHubEmail) => email.primary)?.email || userData.email;

    // Step 6: Create user object
    const user = {
      id: userData.id,
      username: userData.login,
      name: userData.name || userData.login,
      email: primaryEmail,
      avatar: userData.avatar_url,
      provider: 'github',
      createdAt: new Date()
    };

    // Step 7: Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }
    
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        provider: 'github' 
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Step 8: Store user in Firestore
    try {
      const userRef = db.collection('users').doc(user.id.toString());
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        // Create new user
        await userRef.set({
          ...user,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('💾 New user saved to Firebase:', user.name);
      } else {
        // Update existing user - CHỈ CẬP NHẬT THÔNG TIN CẦN THIẾT
        // KHÔNG ghi đè name và avatar đã được user chỉnh sửa
        await userRef.update({
          email: user.email,           // Email có thể thay đổi từ provider
          updatedAt: new Date(),
          lastLogin: new Date(),
          provider: 'github'           // Đảm bảo provider được lưu
        });
        console.log('🔄 User login updated in Firebase (keeping custom profile data)');
      }
      
      // Save login history
      await db.collection('loginHistory').add({
        userId: user.id,
        provider: 'github',
        loginTime: new Date(),
        userAgent: req.headers['user-agent'] || 'Unknown',
        ip: req.ip || 'Unknown'
      });
      console.log('📝 Login history saved to Firebase');
      
    } catch (firebaseError) {
      console.error('❌ Firebase save error:', firebaseError);
      // Continue with login even if Firebase fails
    }

    console.log('🎉 GitHub login successful:', user.name);

    // Step 9: Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/login/success?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);

  } catch (error) {
    console.error('❌ GitHub OAuth error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
});

// Get user info from token
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({ 
    success: true, 
    user: req.user 
  });
});

// Get all users from Firebase (for testing)
router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users from Firebase'
    });
  }
});

// Get login history from Firebase (for testing)
router.get('/login-history', async (req: Request, res: Response): Promise<void> => {
  try {
    const historySnapshot = await db.collection('loginHistory')
      .orderBy('loginTime', 'desc')
      .limit(20)
      .get();
      
    const loginHistory = historySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      count: loginHistory.length,
      loginHistory: loginHistory
    });
  } catch (error) {
    console.error('Error fetching login history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch login history from Firebase'
    });
  }
});

// Middleware to verify JWT token
function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  console.log('🔑 Auth middleware called for:', req.method, req.url);
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔑 Token check:', { 
    hasAuthHeader: !!authHeader, 
    tokenLength: token?.length,
    tokenStart: token?.substring(0, 20) + '...'
  });

  if (!token) {
    console.log('❌ No token provided');
    res.status(401).json({ success: false, message: 'Access token required' });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    res.status(500).json({ success: false, message: 'Server configuration error' });
    return;
  }

  jwt.verify(token, jwtSecret, (err: jwt.VerifyErrors | null, user: any) => {
    if (err) {
      res.status(403).json({ success: false, message: 'Invalid token' });
      return;
    }
    console.log('🔑 JWT decoded user:', user);
    req.user = user;
    next();
  });
}

// Facebook/Firebase Auth - Verify Firebase token and save user
router.post('/firebase-auth', async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      res.status(400).json({ 
        success: false, 
        message: 'Firebase ID token is required' 
      });
      return;
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Get user info from Firebase Auth
    const userRecord = await admin.auth().getUser(uid);
    
    // Create user object
    const user = {
      id: userRecord.uid,
      name: userRecord.displayName || 'Unknown User',
      email: userRecord.email || '',
      avatar: userRecord.photoURL || '',
      provider: userRecord.providerData[0]?.providerId || 'firebase',
      createdAt: new Date()
    };

    // Save user to Firestore
    let userData = user;
    try {
      const userRef = db.collection('users').doc(user.id);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        await userRef.set({
          ...user,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('💾 New Firebase user saved:', user.name);
      } else {
        // CHỈ cập nhật thông tin cần thiết, KHÔNG ghi đè profile đã chỉnh sửa
        await userRef.update({
          email: user.email,           // Email có thể thay đổi từ provider
          updatedAt: new Date(),
          lastLogin: new Date(),
          provider: user.provider      // Cập nhật provider
        });
        console.log('🔄 Firebase user login updated (keeping custom profile data)');
      }
      // Lấy lại user mới nhất từ Firestore (bao gồm bio)
      const updatedDoc = await userRef.get();
      if (updatedDoc.exists) {
        const docData = updatedDoc.data() || {};
        userData = {
          id: updatedDoc.id,
          name: docData.name || user.name,
          email: docData.email || user.email,
          avatar: docData.avatar || user.avatar,
          provider: docData.provider || user.provider,
          createdAt: docData.createdAt || user.createdAt,
          bio: docData.bio || '',
          followers: docData.followers || [],
          following: docData.following || []
        } as AppUser;
      }
      // Save login history
      await db.collection('loginHistory').add({
        userId: user.id,
        provider: user.provider,
        loginTime: new Date(),
        userAgent: req.headers['user-agent'] || 'Unknown',
        ip: req.ip || 'Unknown'
      });
      console.log('📝 Firebase login history saved');
      
    } catch (firebaseError) {
      console.error('❌ Firebase save error:', firebaseError);
    }

    // Generate JWT token for our app
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }
    
    const appToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        provider: user.provider 
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    console.log('🎉 Firebase login successful:', user.name);

    res.json({
      success: true,
      user: userData,
      token: appToken,
      message: 'Firebase authentication successful'
    });

  } catch (error) {
    console.error('❌ Firebase auth error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('ID token')) {
        res.status(401).json({ 
          success: false, 
          message: 'Invalid Firebase ID token' 
        });
        return;
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Firebase authentication failed' 
    });
  }
});

// OTP Storage (In production, use Redis or database)
interface OTPSession {
  email: string;
  otpCode: string;
  expiresAt: Date;
  attempts: number;
}

const otpSessions = new Map<string, OTPSession>();

// Generate random OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate session token
const generateSessionToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Send OTP endpoint
router.post('/send-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required'
      });
      return;
    }

    // Validate Gmail
    const gmailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailPattern.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid Gmail address'
      });
      return;
    }

    // Generate OTP and session token
    const otpCode = generateOTP();
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP session
    otpSessions.set(sessionToken, {
      email,
      otpCode,
      expiresAt,
      attempts: 0
    });

    // Send OTP via email
    let emailSent = false;
    if (process.env.NODE_ENV === 'production' || process.env.GMAIL_USER) {
      emailSent = await emailService.sendOTPEmail(email, otpCode);
      
      if (!emailSent) {
        console.log('⚠️ Email sending failed, falling back to console log');
      }
    }
    
    // For development or fallback, also log the OTP
    if (!emailSent || process.env.NODE_ENV === 'development') {
      console.log(`🔐 OTP for ${email}: ${otpCode}`);
      console.log(`📧 Session Token: ${sessionToken}`);
    }

    res.json({
      success: true,
      message: emailSent ? 
        `Mã OTP đã được gửi đến ${email}. Vui lòng kiểm tra hộp thư của bạn.` : 
        `Mã OTP đã được tạo cho ${email}`,
      sessionToken,
      // Remove this in production
      otpCode: process.env.NODE_ENV === 'development' ? otpCode : undefined
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
});

// Verify OTP endpoint
router.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otpCode, sessionToken } = req.body;

    if (!email || !otpCode || !sessionToken) {
      res.status(400).json({
        success: false,
        message: 'Email, OTP code, and session token are required'
      });
      return;
    }

    // Get OTP session
    const session = otpSessions.get(sessionToken);
    if (!session) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired session'
      });
      return;
    }

    // Check expiration
    if (new Date() > session.expiresAt) {
      otpSessions.delete(sessionToken);
      res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
      return;
    }

    // Check email match
    if (session.email !== email) {
      res.status(400).json({
        success: false,
        message: 'Email mismatch'
      });
      return;
    }

    // Check attempts limit
    if (session.attempts >= 3) {
      otpSessions.delete(sessionToken);
      res.status(400).json({
        success: false,
        message: 'Too many failed attempts'
      });
      return;
    }

    // Verify OTP
    if (session.otpCode !== otpCode) {
      session.attempts++;
      res.status(400).json({
        success: false,
        message: 'Invalid OTP code'
      });
      return;
    }

    // OTP verified successfully, clean up session
    otpSessions.delete(sessionToken);

    // Check if user exists in Firestore
    let userData;
    const usersRef = db.collection('users');
    const existingUser = await usersRef.where('email', '==', email).get();

    if (existingUser.empty) {
      // Create new user
      const newUserData = {
        email: email,
        name: email.split('@')[0], // Use email prefix as name
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=random`,
        provider: 'email',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const newUserRef = await usersRef.add(newUserData);
      userData = { id: newUserRef.id, ...newUserData };

      console.log('✅ New user created:', userData);
    } else {
      // Update existing user
      const userDoc = existingUser.docs[0];
      const userRef = userDoc.ref;
      
      await userRef.update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });

      userData = { id: userDoc.id, ...userDoc.data() };
      console.log('✅ Existing user logged in:', userData);
    }

    // Save login history
    await db.collection('loginHistory').add({
      userId: userData.id,
      provider: 'email',
      loginTime: admin.firestore.FieldValue.serverTimestamp(),
      ip: req.ip || req.connection.remoteAddress || 'unknown'
    });

    // Generate app token
    const appToken = jwt.sign(
      { 
        userId: userData.id,
        email: email,
        provider: 'email'
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'OTP verified successfully',
      user: userData,
      token: appToken
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
});


// Notification model
import Notification from '../models/Notification';

// Tạo thông báo (admin)
router.post('/notifications', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, link, userId, sendType, recipients } = req.body;
    if (!title || !content) {
      res.status(400).json({ success: false, message: 'Thiếu tiêu đề hoặc nội dung' });
      return;
    }

    // If sendType is 'selected', validate recipients
    if (sendType === 'selected' && (!recipients || recipients.length === 0)) {
      res.status(400).json({ 
        success: false, 
        message: 'Vui lòng chọn ít nhất một người dùng để gửi thông báo' 
      });
      return;
    }

    const notify = new Notification({
      title,
      content,
      link: link || '',
      userId: userId || null,
      sendType: sendType || 'all',
      recipients: sendType === 'selected' ? recipients : [],
      createdAt: new Date()
    });
    
    await notify.save();
    
    console.log(`📢 Notification created:`, {
      id: notify._id,
      title,
      sendType,
      recipients: sendType === 'selected' ? recipients.length : 'all users'
    });
    
    res.json({ success: true, id: notify._id });
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lưu thông báo' });
  }
});

// Update user verified status
router.put('/users/:userId/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { isVerified } = req.body;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
      return;
    }

    // Update user in Firestore
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    await userRef.update({
      isVerified: isVerified,
      updatedAt: new Date()
    });

    console.log(`✅ User ${userId} verified status updated to: ${isVerified}`);

    res.json({
      success: true,
      message: 'User verified status updated successfully',
      data: { userId, isVerified }
    });

  } catch (error) {
    console.error('Error updating verified status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user verified status'
    });
  }
});

// Lấy tất cả thông báo (admin)
router.get('/notifications', async (req: Request, res: Response): Promise<void> => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thông báo' });
  }
});

// Lấy thông báo cho user cụ thể
router.get('/notifications/user/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
      return;
    }

    // Tìm thông báo mà user có thể nhận:
    // 1. Thông báo gửi cho tất cả (sendType: 'all')
    // 2. Thông báo có chỉ định user cụ thể (sendType: 'selected' và userId trong recipients)
    const notifications = await Notification.find({
      $or: [
        { sendType: 'all' },
        { 
          sendType: 'selected', 
          recipients: { $in: [userId] } 
        }
      ]
    }).sort({ createdAt: -1 });

    console.log(`📨 User ${userId} có ${notifications.length} thông báo:`, {
      total: notifications.length,
      byType: {
        all: notifications.filter(n => n.sendType === 'all').length,
        selected: notifications.filter(n => n.sendType === 'selected').length
      }
    });

    res.json({ 
      success: true, 
      notifications,
      count: notifications.length,
      userId: userId
    });
  } catch (err) {
    console.error('Error fetching user notifications:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy thông báo người dùng' 
    });
  }
});

// API test: Lấy thông báo của user cụ thể (for debugging)
router.get('/test/notifications/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    // Lấy tất cả thông báo để debug
    const allNotifications = await Notification.find().sort({ createdAt: -1 });
    const userNotifications = await Notification.find({
      $or: [
        { sendType: 'all' },
        { 
          sendType: 'selected', 
          recipients: { $in: [userId] } 
        }
      ]
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      userId: userId,
      debug: {
        totalNotifications: allNotifications.length,
        userNotifications: userNotifications.length,
        allNotificationsBreakdown: allNotifications.map(n => ({
          id: n._id,
          title: n.title,
          sendType: n.sendType,
          recipients: n.recipients || [],
          recipientsCount: n.recipients ? n.recipients.length : 0
        }))
      }
    });
  } catch (err) {
    console.error('Error in test endpoint:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Test endpoint error' 
    });
  }
});

// Xóa thông báo (admin)
router.delete('/notifications/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'Thiếu id thông báo' });
      return;
    }
    await Notification.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa thông báo' });
  }
});

// Đánh dấu thông báo đã đọc cho 1 user (thêm userId vào readBy)
router.patch('/notifications/mark-read', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids, markAll, userId } = req.body;
    if (!userId) {
      res.status(400).json({ success: false, message: 'Thiếu userId' });
      return;
    }
    if (markAll) {
      // add userId to readBy for all notifications (no duplicates)
      await Notification.updateMany({}, { $addToSet: { readBy: userId } });
      res.json({ success: true });
      return;
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, message: 'Thiếu ids hoặc markAll' });
      return;
    }
    await Notification.updateMany({ _id: { $in: ids } }, { $addToSet: { readBy: userId } });
    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error', err);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái đọc' });
  }
});

// Lấy thông tin public của user (để hiển thị profile)
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Thiếu userId' });
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
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }

    const userData = userDoc.data();
    
    // Lấy số lượng followers, following và posts
    const followersCount = userData?.followers?.length || 0;
    const followingCount = userData?.following?.length || 0;
    
    // Đếm số posts của user này
    const postsCount = await Post.countDocuments({
      $or: [
        { authorId: userId },
        { authorEmail: userId },
        { authorId: userDoc.id },
        { authorEmail: userData?.email }
      ]
    });

    const publicUserData = {
      id: userDoc.id,
      name: userData?.name || 'Unknown',
      email: userData?.email || '',
      avatar: userData?.avatar || '',
      bio: userData?.bio || '',
      location: userData?.location || '',
      isVerified: userData?.isVerified || false,
      provider: userData?.provider || 'local',
      createdAt: userData?.createdAt,
      followersCount,
      followingCount,
      postsCount
    };

    console.log(`✅ Returning public user data for ${userId}:`, publicUserData);
    return res.json({ success: true, user: publicUserData });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin user' });
  }
});

// Kiểm tra trạng thái follow
router.get('/follow-status/:targetUserId', async (req: Request, res: Response) => {
  try {
    const { targetUserId } = req.params;
    const currentUserId = req.headers['user-id'] as string;
    
    if (!currentUserId || !targetUserId) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin user' });
    }

    const currentUserRef = db.collection('users').doc(currentUserId);
    const currentUserDoc = await currentUserRef.get();
    
    if (!currentUserDoc.exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user hiện tại' });
    }

    const currentData = currentUserDoc.data() || {};
    const following = currentData.following || [];
    const isFollowing = following.includes(targetUserId);

    return res.json({ success: true, isFollowing });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Lấy danh sách followers của user
router.get('/user/:userId/followers', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Thiếu userId' });
    }

    let userDoc;
    let userRef;

    // 🔍 Thử tìm theo document ID trước
    userRef = db.collection('users').doc(userId);
    userDoc = await userRef.get();

    // 🔍 Nếu không tìm thấy, thử tìm theo email
    if (!userDoc.exists) {
      const emailQuery = await db.collection('users').where('email', '==', userId).get();
      if (!emailQuery.empty) {
        userDoc = emailQuery.docs[0];
      }
    }

    if (!userDoc || !userDoc.exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }

    const userData = userDoc.data();
    const followerIds = userData?.followers || [];

    // Lấy thông tin chi tiết của từng follower
    const followers = [];
    for (const followerId of followerIds) {
      try {
        const followerRef = db.collection('users').doc(followerId);
        const followerDoc = await followerRef.get();
        
        if (followerDoc.exists) {
          const followerData = followerDoc.data();
          followers.push({
            id: followerDoc.id,
            name: followerData?.name || 'Unknown',
            email: followerData?.email || '',
            avatar: followerData?.avatar || '',
            isVerified: followerData?.isVerified || false,
            provider: followerData?.provider || 'local'
          });
        }
      } catch (error) {
        console.error(`Error fetching follower ${followerId}:`, error);
      }
    }

    console.log(`✅ Returning ${followers.length} followers for user ${userId}`);
    return res.json({ success: true, followers, count: followers.length });
  } catch (error) {
    console.error('Error fetching followers:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Lấy danh sách following của user
router.get('/user/:userId/following', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Thiếu userId' });
    }

    let userDoc;
    let userRef;

    // 🔍 Thử tìm theo document ID trước
    userRef = db.collection('users').doc(userId);
    userDoc = await userRef.get();

    // 🔍 Nếu không tìm thấy, thử tìm theo email
    if (!userDoc.exists) {
      const emailQuery = await db.collection('users').where('email', '==', userId).get();
      if (!emailQuery.empty) {
        userDoc = emailQuery.docs[0];
      }
    }

    if (!userDoc || !userDoc.exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }

    const userData = userDoc.data();
    const followingIds = userData?.following || [];

    // Lấy thông tin chi tiết của từng user đang được follow
    const following = [];
    for (const followingId of followingIds) {
      try {
        const followingRef = db.collection('users').doc(followingId);
        const followingDoc = await followingRef.get();
        
        if (followingDoc.exists) {
          const followingData = followingDoc.data();
          following.push({
            id: followingDoc.id,
            name: followingData?.name || 'Unknown',
            email: followingData?.email || '',
            avatar: followingData?.avatar || '',
            isVerified: followingData?.isVerified || false,
            provider: followingData?.provider || 'local'
          });
        }
      } catch (error) {
        console.error(`Error fetching following ${followingId}:`, error);
      }
    }

    console.log(`✅ Returning ${following.length} following for user ${userId}`);
    return res.json({ success: true, following, count: following.length });
  } catch (error) {
    console.error('Error fetching following:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Follow user
router.post('/follow', async (req: Request, res: Response) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.headers['user-id'] as string;
    
    if (!currentUserId || !targetUserId) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin user' });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({ success: false, message: 'Không thể theo dõi chính mình' });
    }

    const currentUserRef = db.collection('users').doc(currentUserId);
    const targetUserRef = db.collection('users').doc(targetUserId);

    const [currentUserDoc, targetUserDoc] = await Promise.all([
      currentUserRef.get(),
      targetUserRef.get()
    ]);

    if (!currentUserDoc.exists || !targetUserDoc.exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }

    const currentData = currentUserDoc.data() || {};
    const targetData = targetUserDoc.data() || {};
    
    const following = currentData.following || [];
    const followers = targetData.followers || [];

    if (following.includes(targetUserId)) {
      return res.status(400).json({ success: false, message: 'Đã theo dõi user này rồi' });
    }

    await Promise.all([
      currentUserRef.update({
        following: [...following, targetUserId]
      }),
      targetUserRef.update({
        followers: [...followers, currentUserId]
      })
    ]);

    return res.json({ success: true, action: 'followed' });
  } catch (error) {
    console.error('Error following user:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Unfollow user  
router.post('/unfollow', async (req: Request, res: Response) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.headers['user-id'] as string;
    
    if (!currentUserId || !targetUserId) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin user' });
    }

    const currentUserRef = db.collection('users').doc(currentUserId);
    const targetUserRef = db.collection('users').doc(targetUserId);

    const [currentUserDoc, targetUserDoc] = await Promise.all([
      currentUserRef.get(),
      targetUserRef.get()
    ]);

    if (!currentUserDoc.exists || !targetUserDoc.exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }

    const currentData = currentUserDoc.data() || {};
    const targetData = targetUserDoc.data() || {};
    
    const following = currentData.following || [];
    const followers = targetData.followers || [];

    if (!following.includes(targetUserId)) {
      return res.status(400).json({ success: false, message: 'Chưa theo dõi user này' });
    }

    await Promise.all([
      currentUserRef.update({
        following: following.filter((id: string) => id !== targetUserId)
      }),
      targetUserRef.update({
        followers: followers.filter((id: string) => id !== currentUserId)
      })
    ]);

    return res.json({ success: true, action: 'unfollowed' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

export { authenticateToken as auth };
export default router;