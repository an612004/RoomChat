// Email OTP Authentication Service

interface OTPResponse {
  success: boolean;
  message?: string;
  sessionToken?: string;
  error?: string;
}

interface VerifyOTPResponse {
  success: boolean;
  user?: any;
  token?: string;
  message?: string;
  error?: string;
}

class EmailOTPService {
  private baseURL: string;

  constructor() {
    this.baseURL = 'http://localhost:3000/auth';
  }

  // Gửi mã OTP qua email
  async sendOTP(email: string): Promise<OTPResponse> {
    try {
      console.log('🔵 Sending OTP to:', email);

      const response = await fetch(`${this.baseURL}/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const result: OTPResponse = await response.json();

      if (result.success) {
        console.log('✅ OTP sent successfully');
        return {
          success: true,
          message: result.message,
          sessionToken: result.sessionToken
        };
      } else {
        throw new Error(result.message || 'Failed to send OTP');
      }

    } catch (error: any) {
      console.error('❌ Send OTP error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send OTP'
      };
    }
  }

  // Xác thực mã OTP
  async verifyOTP(email: string, otpCode: string, sessionToken: string): Promise<VerifyOTPResponse> {
    try {
      console.log('🔵 Verifying OTP for:', email);

      const response = await fetch(`${this.baseURL}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          otpCode, 
          sessionToken 
        })
      });

      const result: VerifyOTPResponse = await response.json();

      if (result.success) {
        console.log('✅ OTP verification successful');
        
        // Store authentication data
        if (result.token && result.user) {
          localStorage.setItem('authToken', result.token);
          localStorage.setItem('user', JSON.stringify(result.user));
        }

        return {
          success: true,
          user: result.user,
          token: result.token,
          message: result.message
        };
      } else {
        throw new Error(result.message || 'OTP verification failed');
      }

    } catch (error: any) {
      console.error('❌ OTP verification error:', error);
      return {
        success: false,
        error: error.message || 'OTP verification failed'
      };
    }
  }

  // Gửi lại mã OTP
  async resendOTP(email: string): Promise<OTPResponse> {
    return this.sendOTP(email);
  }
}

export default new EmailOTPService();