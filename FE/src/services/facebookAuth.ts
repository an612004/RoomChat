import { signInWithPopup, signInWithRedirect, getRedirectResult, User, UserCredential } from 'firebase/auth';
import { auth, facebookProvider } from '../config/firebase';
import { ApiResponse } from '../types';

interface FacebookAuthResponse {
  success: boolean;
  user?: any;
  token?: string;
  error?: string;
}

class FacebookAuthService {
  // Facebook Login với Popup
  async loginWithPopup(): Promise<FacebookAuthResponse> {
    try {
      console.log('🔵 Starting Facebook login with popup...');
      
      const result: UserCredential = await signInWithPopup(auth, facebookProvider);
      const user: User = result.user;
      
      console.log('✅ Facebook login successful:', user);
      
      // Lấy Firebase ID token
      const idToken: string = await user.getIdToken();
      
      // Gửi token tới backend để verify và lưu user
      const response = await fetch('http://localhost:3000/auth/firebase-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken })
      });
      
      const backendResult: ApiResponse = await response.json();
      
      if (backendResult.success) {
        // Lưu thông tin user vào localStorage
        localStorage.setItem('authToken', backendResult.data.token);
        localStorage.setItem('user', JSON.stringify(backendResult.data.user));
        
        return {
          success: true,
          user: backendResult.data.user,
          token: backendResult.data.token
        };
      } else {
        throw new Error(backendResult.message || 'Backend authentication failed');
      }
      
    } catch (error: any) {
      console.error('❌ Facebook login error:', error);
      
      let errorMessage = 'Facebook login failed';
      
      if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups and try again.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login cancelled by user';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Login cancelled';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Facebook Login với Redirect (backup method)
  async loginWithRedirect(): Promise<FacebookAuthResponse | void> {
    try {
      console.log('🔵 Starting Facebook login with redirect...');
      await signInWithRedirect(auth, facebookProvider);
    } catch (error: any) {
      console.error('❌ Facebook redirect login error:', error);
      return {
        success: false,
        error: 'Facebook redirect login failed'
      };
    }
  }

  // Xử lý kết quả redirect (gọi khi trang load lại)
  async handleRedirectResult(): Promise<FacebookAuthResponse | null> {
    try {
      const result: UserCredential | null = await getRedirectResult(auth);
      
      if (result) {
        const user: User = result.user;
        console.log('✅ Facebook redirect login successful:', user);
        
        // Lấy Firebase ID token
        const idToken: string = await user.getIdToken();
        
        // Gửi token tới backend để verify và lưu user
        const response = await fetch('http://localhost:3000/auth/firebase-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken })
        });
        
        const backendResult: ApiResponse = await response.json();
        
        if (backendResult.success) {
          localStorage.setItem('authToken', backendResult.data.token);
          localStorage.setItem('user', JSON.stringify(backendResult.data.user));
          
          return {
            success: true,
            user: backendResult.data.user,
            token: backendResult.data.token
          };
        } else {
          throw new Error(backendResult.message || 'Backend authentication failed');
        }
      }
      
      return null;
    } catch (error: any) {
      console.error('❌ Facebook redirect result error:', error);
      return {
        success: false,
        error: 'Failed to handle Facebook redirect result'
      };
    }
  }

  // Logout
  async logout(): Promise<FacebookAuthResponse> {
    try {
      await auth.signOut();
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      console.log('✅ Facebook logout successful');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Facebook logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  }
}

export default new FacebookAuthService();