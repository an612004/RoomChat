import { signInWithPopup, GoogleAuthProvider, User, UserCredential } from 'firebase/auth';
import { auth } from '../config/firebase';

interface GoogleAuthResponse {
  success: boolean;
  user?: any;
  token?: string;
  error?: string;
}

class GoogleAuthService {
  private provider: GoogleAuthProvider;

  constructor() {
    this.provider = new GoogleAuthProvider();
    this.provider.addScope('email');
    this.provider.addScope('profile');
  }

  async loginWithGoogle(): Promise<GoogleAuthResponse> {
    try {
      console.log('🔵 Starting Google login...');
      
      const result: UserCredential = await signInWithPopup(auth, this.provider);
      const user: User = result.user;
      
      console.log('✅ Google login successful:', user);
      
      // Lấy Firebase ID token
      const idToken: string = await user.getIdToken();
      
      // Gửi token tới backend
      const response = await fetch('http://localhost:3000/auth/firebase-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken })
      });
      
      const backendResult: any = await response.json();
      
      if (backendResult.success) {
        localStorage.setItem('authToken', backendResult.token);
        localStorage.setItem('user', JSON.stringify(backendResult.user));
        
        return {
          success: true,
          user: backendResult.user,
          token: backendResult.token
        };
      } else {
        throw new Error(backendResult.message || 'Backend authentication failed');
      }
      
    } catch (error: any) {
      console.error('❌ Google login error:', error);
      
      let errorMessage = 'Google login failed';
      
      if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups and try again.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login cancelled by user';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async logout(): Promise<GoogleAuthResponse> {
    try {
      await auth.signOut();
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      console.log('✅ Google logout successful');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Google logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  }
}

export default new GoogleAuthService();