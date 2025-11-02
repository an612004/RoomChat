import { auth } from '../config/firebase';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth';

class PhoneAuthService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;

  // Initialize reCAPTCHA verifier
  initializeRecaptcha = (containerId: string): void => {
    if (!this.recaptchaVerifier) {
      this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          this.clearRecaptcha();
        }
      });
    }
  };

  // Send OTP to phone number
  sendOTP = async (phoneNumber: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      if (!this.recaptchaVerifier) {
        throw new Error('reCAPTCHA not initialized');
      }

      // Validate phone number format (international format with +84)
      const phoneRegex = /^\+84[0-9]{9,10}$/;
      if (!phoneRegex.test(phoneNumber)) {
        throw new Error('Số điện thoại phải có định dạng +84xxxxxxxxx');
      }

      this.confirmationResult = await signInWithPhoneNumber(
        auth, 
        phoneNumber, 
        this.recaptchaVerifier
      );

      return {
        success: true,
        message: `Mã OTP đã được gửi tới ${phoneNumber}`
      };

    } catch (error: any) {
      console.error('Send OTP error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Handle specific Firebase errors
      let errorMessage = 'Không thể gửi mã OTP';
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Số điện thoại không hợp lệ';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Quá nhiều yêu cầu. Vui lòng thử lại sau.';
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'Xác thực reCAPTCHA thất bại';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Phone authentication chưa được bật trong Firebase Console';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'Đã vượt quá giới hạn SMS. Vui lòng thử lại sau.';
      } else if (error.code === 'auth/billing-not-enabled') {
        errorMessage = 'Cần enable Blaze plan trong Firebase Console để sử dụng Phone Auth';
      } else if (error.message.includes('reCAPTCHA')) {
        errorMessage = 'Lỗi reCAPTCHA. Vui lòng refresh trang và thử lại.';
      }

      this.clearRecaptcha();
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Verify OTP code
  verifyOTP = async (code: string): Promise<{ success: boolean; user?: any; token?: string; error?: string }> => {
    try {
      if (!this.confirmationResult) {
        throw new Error('No confirmation result available');
      }

      const result = await this.confirmationResult.confirm(code);
      const user = result.user;

      if (user) {
        // Get Firebase ID token
        const idToken = await user.getIdToken();

        // Send to backend for processing
        const response = await fetch('http://localhost:3000/auth/firebase-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        });

        const data = await response.json();

        if (data.success) {
          // Store auth data
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));

          this.clearRecaptcha();

          return {
            success: true,
            user: data.user,
            token: data.token
          };
        } else {
          throw new Error(data.message || 'Backend authentication failed');
        }
      }

      throw new Error('No user returned from Firebase');

    } catch (error: any) {
      console.error('Verify OTP error:', error);
      
      let errorMessage = 'Mã OTP không chính xác';
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Mã OTP không chính xác';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'Mã OTP đã hết hạn';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Clear reCAPTCHA verifier
  clearRecaptcha = (): void => {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
    this.confirmationResult = null;
  };

  // Reset for new phone number
  reset = (): void => {
    this.clearRecaptcha();
    this.confirmationResult = null;
  };
}

export default new PhoneAuthService();