import { useState, useEffect } from 'react';

interface User {
  name: string;
  email: string;
  avatar: string;
  provider?: string;
  bio?: string;
  followers?: string[];
  following?: string[];
  _id?: string;
  id?: string;
  isVerified?: boolean;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  token: string | null;
}

export default function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoggedIn: false,
    token: null
  });

  useEffect(() => {
    // Check for stored auth data on component mount
    const checkAuth = async (): Promise<void> => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const user: User = JSON.parse(storedUser);
          
          // Set auth state first (for immediate UI)
          setAuthState({
            user,
            isLoggedIn: true,
            token: storedToken
          });

          // 🔄 Then fetch fresh data from server in background
          try {
            const response = await fetch(`http://localhost:3000/user/me/${user.email}`);
            const freshData = await response.json();
            
            if (freshData.success && freshData.user) {
              console.log('🔄 Refreshed user data from server:', freshData.user);
              const updatedUser = freshData.user;
              
              // Update both state and localStorage with fresh data
              setAuthState({
                user: updatedUser,
                isLoggedIn: true,
                token: storedToken
              });
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }
          } catch (fetchError) {
            console.log('⚠️ Could not refresh user data, using cached data');
          }
          
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          logout();
        }
      }
    };

    checkAuth();
  }, []);

  const login = (user: User, token: string): void => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuthState({
      user,
      isLoggedIn: true,
      token
    });
  };

  const logout = (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setAuthState({
      user: null,
      isLoggedIn: false,
      token: null
    });
  };

  const setUser = (user: User) => {
    console.log("🔄 Updating user in auth state:", user);
    setAuthState((prev) => ({ ...prev, user }));
    localStorage.setItem('user', JSON.stringify(user));
  };

  return {
    user: authState.user,
    isLoggedIn: authState.isLoggedIn,
    token: authState.token,
    login,
    logout,
    setUser
  };
}