import React, { useState, useEffect } from 'react';
import { Github, Mail, Facebook, Chrome } from 'lucide-react';
import githubAuthService from '../services/githubAuth';
import facebookAuthService from '../services/facebookAuth';
import googleAuthService from '../services/googleAuth';
import { useNavigate } from 'react-router-dom';
const Login = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();

  // Kiểm tra redirect result từ Facebook khi component mount
  useEffect(() => {
    const handleFacebookRedirect = async () => {
      const result = await facebookAuthService.handleRedirectResult();
      if (result && result.success) {
        console.log('Facebook login success from redirect:', result.user);
        navigate('/home');
      }
    };
    
    handleFacebookRedirect();
  }, [navigate]);

  const handleSendCode = async (e) => {
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

    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      alert(`Mã xác nhận đã được gửi tới ${email}`);
    }, 2000);
  };

  const handleGithubAuth = async () => {
    try {
      setIsGithubLoading(true);
      await githubAuthService.initiateGitHubLogin();
    } catch (error) {
      setIsGithubLoading(false);
      console.error('GitHub login error:', error);
      alert('GitHub login failed. Please try again.');
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setIsFacebookLoading(true);
      
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
      
    } catch (error) {
      console.error('❌ Facebook login error:', error);
      alert('Facebook login failed. Please try again.');
    } finally {
      setIsFacebookLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      
      const result = await googleAuthService.loginWithGoogle();
      
      if (result.success) {
        console.log('✅ Google login successful:', result.user);
        navigate('/home');
      } else {
        alert(result.error || 'Google login failed. Please try again.');
      }
      
    } catch (error) {
      console.error('❌ Google login error:', error);
      alert('Google login failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

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
            disabled={isLoading}
            className={`login-btn ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? (
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
          className={`github-btn animate-zoom-in ${isGithubLoading ? 'loading' : ''}`} 
          onClick={handleGithubAuth}
          disabled={isGithubLoading}
        >
          {isGithubLoading ? (
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
              <Chrome size={20} />
              Login with Google
            </>
          )}
        </button>

        <div>
          {/* Facebook Login */}
        <button
          onClick={handleFacebookLogin}
          disabled={isFacebookLoading}
          className={`facebook-btn ${isFacebookLoading ? 'loading' : ''}`}
        >
          {isFacebookLoading ? (
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
export default Login
