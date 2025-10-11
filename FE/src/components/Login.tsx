import React, { useState, useEffect } from 'react';
import { Github, Mail, Facebook, Chrome } from 'lucide-react';
import githubAuthService from '../services/githubAuth';
import facebookAuthService from '../services/facebookAuth';
import googleAuthService from '../services/googleAuth';
import emailOTPService from '../services/emailOTPAuth';
import OTPVerification from './OTPVerification';
import { useNavigate } from 'react-router-dom';
import { LoadingStates } from '../types';

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    github: false,
    facebook: false,
    email: false
  });
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [showOTPVerification, setShowOTPVerification] = useState<boolean>(false);
  const [sessionToken, setSessionToken] = useState<string>('');
  const navigate = useNavigate();

  // Kiểm tra redirect result từ Facebook khi component mount
  useEffect(() => {
    const handleFacebookRedirect = async (): Promise<void> => {
      const result = await facebookAuthService.handleRedirectResult();
      if (result && result.success) {
        console.log('Facebook login success from redirect:', result.user);
        navigate('/home');
      }
    };
    
    handleFacebookRedirect();
  }, [navigate]);

  const handleSendCode = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!email) {
      alert('Vui lòng nhập địa chỉ Gmail!');
      return;
    }
    const gmailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailPattern.test(email)) {
      alert('Vui lòng nhập địa chỉ Gmail hợp lệ!');
      return;
    }

    setLoadingStates(prev => ({ ...prev, email: true }));
    
    try {
      const result = await emailOTPService.sendOTP(email);
      
      if (result.success && result.sessionToken) {
        setSessionToken(result.sessionToken);
        setShowOTPVerification(true);
      } else {
        alert(result.error || 'Không thể gửi mã OTP. Vui lòng thử lại.');
      }
    } catch (error: any) {
      alert('Có lỗi xảy ra khi gửi mã OTP');
    } finally {
      setLoadingStates(prev => ({ ...prev, email: false }));
    }
  };

  const handleGithubAuth = async (): Promise<void> => {
    try {
      setLoadingStates(prev => ({ ...prev, github: true }));
      await githubAuthService.initiateGitHubLogin();
    } catch (error: any) {
      setLoadingStates(prev => ({ ...prev, github: false }));
      console.error('GitHub login error:', error);
      alert('GitHub login failed. Please try again.');
    }
  };

  const handleFacebookLogin = async (): Promise<void> => {
    try {
      setLoadingStates(prev => ({ ...prev, facebook: true }));
      
      // Thử popup trước, nếu không được thì dùng redirect
      const result = await facebookAuthService.loginWithPopup();
      
      if (result.success) {
        console.log('✅ Facebook login successful:', result.user);
        navigate('/home');
      } else {
        // Nếu popup fail, thử redirect
        console.log('Popup failed, trying redirect...');
        await facebookAuthService.loginWithRedirect();
      }
      
    } catch (error: any) {
      console.error('❌ Facebook login error:', error);
      alert('Facebook login failed. Please try again.');
    } finally {
      setLoadingStates(prev => ({ ...prev, facebook: false }));
    }
  };

  const handleGoogleLogin = async (): Promise<void> => {
    try {
      setIsGoogleLoading(true);
      
      const result = await googleAuthService.loginWithGoogle();
      
      if (result.success) {
        console.log('✅ Google login successful:', result.user);
        navigate('/home');
      } else {
        alert(result.error || 'Google login failed. Please try again.');
      }
      
    } catch (error: any) {
      console.error('❌ Google login error:', error);
      alert('Google login failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleOTPSuccess = (user: any, token: string): void => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    navigate('/home');
  };

  const handleBackToLogin = (): void => {
    setShowOTPVerification(false);
    setSessionToken('');
  };

  // Show OTP Verification if email OTP was sent
  if (showOTPVerification) {
    return (
      <div className='container'>
        <h1>Welcome to Anbi</h1>
        <div className="login-container">
          <div className="login-card">
            <OTPVerification
              email={email}
              sessionToken={sessionToken}
              onBack={handleBackToLogin}
              onSuccess={handleOTPSuccess}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container'>
      <h1>
        Welcome to Anbi
      </h1>
      <div className="login-container">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <h1 className="login-title">Login</h1>
            <p className="login-subtitle">Select login method</p>
          </div>

          {/* Gmail Form */}
          <form onSubmit={handleSendCode} className="login-form">
            <div className="input-group">
              <div className="input-wrapper">
                <Mail className="input-icon" />
                <input
                  type="email"
                  placeholder="Enter your Gmail address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingStates.email}
              className={`login-btn ${loadingStates.email ? 'loading' : ''}`}
            >
              {loadingStates.email ? (
                <div className="loading-spinner"></div>
              ) : (
                <>
                  <Mail size={18} />
                  Send confirmation code
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">
            <span className="divider-text">Or continue with</span>
          </div>

          {/* GitHub Login */}
          <button 
            className={`github-btn animate-zoom-in ${loadingStates.github ? 'loading' : ''}`} 
            onClick={handleGithubAuth}
            disabled={loadingStates.github}
          >
            {loadingStates.github ? (
              <div className="loading-spinner-white"></div>
            ) : (
              <div>
                <Github size={20} />
                Login with GitHub
              </div>
            )}
          </button>
         
          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className={`google-btn ${isGoogleLoading ? 'loading' : ''}`}
          >
            {isGoogleLoading ? (
              <div className="loading-spinner-white"></div>
            ) : (
              <>
                <img src="https://img.icons8.com/?size=100&id=17949&format=png&color=000000" alt="Google Icon" width={20} />
                Login with Google
              </>
            )}
          </button>

          <div>
            {/* Facebook Login */}
            <button
              onClick={handleFacebookLogin}
              disabled={loadingStates.facebook}
              className={`facebook-btn ${loadingStates.facebook ? 'loading' : ''}`}
            >
              {loadingStates.facebook ? (
                <div className="loading-spinner-white"></div>
              ) : (
                <>
                  <Facebook size={20} />
                  Login with Facebook
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login;