import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const LoginSuccess = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        // Get token and user data from URL params
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');
        
        if (token && userParam) {
          // Parse user data from URL
          const userData = JSON.parse(decodeURIComponent(userParam));
          
          // Store token and user data
          localStorage.setItem('authToken', token);
          localStorage.setItem('user', JSON.stringify(userData));
          
          setUser(userData);
          setLoading(false);
          console.log('✅ Login successful:', userData);
          
          // Redirect to home after 2 seconds
          setTimeout(() => {
            navigate('/home');
          }, 2000);
        } else {
          // No token found, redirect to login
          console.error('❌ No token or user data found in URL');
          navigate('/?error=missing_data');
        }
      } catch (error) {
        console.error('Login success handling error:', error);
        navigate('/?error=processing_failed');
      }
    };

    handleSuccess();
  }, [navigate, searchParams]);

  if (loading || !user) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="text-center">
            <div className="loading-spinner"></div>
            <p>Processing login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="text-center">
          <div className="success-icon">✅</div>
          <h1 className="login-title">Login Successful!</h1>
          <div className="user-info">
            <div className='avatar'>
                <img 
              src={user.avatar} 
              alt={user.name}
              className="user-avatar"
            />
            </div>
            <h3>Welcome, {user.name}!</h3>
            <p className="user-email">{user.email}</p>
            <p className="provider-badge">
              🐙 Signed in with GitHub
            </p>
          </div>
          <p className="redirect-message">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginSuccess;