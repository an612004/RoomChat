import express, { Request, Response, NextFunction, Router } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { db } from '../config/firebaseConfig';
import admin from 'firebase-admin';

const router: Router = express.Router();

// Extend Request interface for user property
interface AuthenticatedRequest extends Request {
  user?: any;
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
router.get('/github/callback', async (req: Request, res: Response) => {
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
        // Update existing user
        await userRef.update({
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          updatedAt: new Date(),
          lastLogin: new Date()
        });
        console.log('🔄 User updated in Firebase:', user.name);
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
router.get('/users', async (req: Request, res: Response) => {
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
router.get('/login-history', async (req: Request, res: Response) => {
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
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
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
        await userRef.update({
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          updatedAt: new Date(),
          lastLogin: new Date()
        });
        console.log('🔄 Firebase user updated:', user.name);
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
      user: user,
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

export default router;