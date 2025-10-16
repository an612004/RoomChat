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
    <div className="modern-login-wrapper">
      <div className="modern-login-container">
        {/* Header Section */}
        <div className="modern-header">
          <div className="logo-section">
            <div className="logo-circle">
              <div>
                <img className='logo-img2 animate-jelly' src="/public/logo.png" alt="Anbi Logo" width={30} />
              </div>
            </div>
          </div>
          <h1 className="welcome-title">Welcome back</h1>
          <p className="welcome-subtitle">Choose your preferred login method</p>
        </div>

        {/* Login Methods Grid */}
        <div className="login-methods">
          {/* Email OTP Card */}
          <div className="method-card primary-method">
            <div className="method-header">
              <Mail className="method-icon" size={24} />
              <span className="method-title">Email OTP</span>
            </div>
            <form onSubmit={handleSendCode} className="method-form">
              <div className="modern-input">
                <input
                  type="email"
                  placeholder="your.email@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="modern-input-field"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loadingStates.email}
                className={`modern-btn primary ${loadingStates.email ? 'loading' : ''}`}
              >
                {loadingStates.email ? (
                  <div className="spinner"></div>
                ) : (
                  'Send Code'
                )}
              </button>
            </form>
          </div>

          {/* Social Login Cards */}
          <div className="social-methods">
            {/* GitHub */}
            <button 
              className={`social-card github ${loadingStates.github ? 'loading' : ''}`}
              onClick={handleGithubAuth}
              disabled={loadingStates.github}
            >
              {loadingStates.github ? (
                <div className="spinner white"></div>
              ) : (
                <>
                  <Github size={20} />
                  <span>GitHub</span>
                  <div className="dev-badge">Dev</div>
                </>
              )}
            </button>

            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className={`social-card google ${isGoogleLoading ? 'loading' : ''}`}
            >
              {isGoogleLoading ? (
                <div className="spinner"></div>
              ) : (
                <>
                  <img src="https://img.icons8.com/?size=100&id=17949&format=png&color=000000" alt="Google" width={20} />
                  <span>Google</span>
                </>
              )}
            </button>

            {/* Facebook */}
            <button
              onClick={handleFacebookLogin}
              disabled={loadingStates.facebook}
              className={`social-card facebook ${loadingStates.facebook ? 'loading' : ''}`}
            >
              {loadingStates.facebook ? (
                <div className="spinner white"></div>
              ) : (
                <>
                  <Facebook size={20} />
                  <span>Facebook</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>Secure login powered by modern authentication</p>
        </div>
      </div>
    </div>
  )
}

export default Login;