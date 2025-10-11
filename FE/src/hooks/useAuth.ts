import { useState, useEffect } from 'react';

interface User {
  name: string;
  email: string;
  avatar: string;
  provider?: string;
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
    const checkAuth = (): void => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const user: User = JSON.parse(storedUser);
          setAuthState({
            user,
            isLoggedIn: true,
            token: storedToken
          });
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

  return {
    user: authState.user,
    isLoggedIn: authState.isLoggedIn,
    token: authState.token,
    login,
    logout
  };
}