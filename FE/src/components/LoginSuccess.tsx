import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface UserData {
  name: string;
  email: string;
  avatar: string;
  provider?: string;
}

const LoginSuccess: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleSuccess = async (): Promise<void> => {
      try {
        // Get token and user data from URL params
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');
        
        if (token && userParam) {
          // Parse user data from URL
          const userData: UserData = JSON.parse(decodeURIComponent(userParam));
          
          // Store token first
          localStorage.setItem('authToken', token);
          
          // 🔄 Fetch latest user data from server instead of using URL params
          try {
            const userResponse = await fetch(`http://localhost:3000/user/me/${userData.email}`);
            const latestUserData = await userResponse.json();
            
            if (latestUserData.success && latestUserData.user) {
              // Use latest data from server
              console.log('✅ Fetched latest user data:', latestUserData.user);
              localStorage.setItem('user', JSON.stringify(latestUserData.user));
              setUser(latestUserData.user);
            } else {
              // Fallback to URL data if server fetch fails
              console.log('⚠️ Using URL data as fallback:', userData);
              localStorage.setItem('user', JSON.stringify(userData));
              setUser(userData);
            }
          } catch (fetchError) {
            // Fallback to URL data if server is down
            console.log('⚠️ Server fetch failed, using URL data:', userData);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
          }
          
          setLoading(false);
          
          // Redirect to home after 2 seconds
          setTimeout(() => {
            navigate('/home');
          }, 2000);
        } else {
          // No token found, redirect to login
          console.error('❌ No token or user data found in URL');
          navigate('/?error=missing_data');
        }
      } catch (error: any) {
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
              🐙 Signed in with {user.provider || 'GitHub'}
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