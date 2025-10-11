// GitHub Authentication Service

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
}

interface AuthResponse {
  success: boolean;
  authUrl?: string;
  message?: string;
}

interface UserData {
  user: GitHubUser;
  token: string;
}

class GitHubAuthService {
  private baseURL: string;

  constructor() {
    this.baseURL = 'http://localhost:3000/auth';
  }

  // Start GitHub OAuth flow
  async initiateGitHubLogin(): Promise<void> {
    try {
      console.log('🔄 Initiating GitHub login...');
      console.log('🌐 Requesting:', `${this.baseURL}/github`);
      
      const response = await fetch(`${this.baseURL}/github`);
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: AuthResponse = await response.json();
      console.log('📦 Response data:', data);
      
      if (data.success && data.authUrl) {
        console.log('✅ Got auth URL, redirecting to GitHub...');
        // Redirect to GitHub OAuth
        window.location.href = data.authUrl;
      } else {
        throw new Error(`Backend error: ${data.message || 'Failed to get GitHub auth URL'}`);
      }
    } catch (error: any) {
      console.error('❌ GitHub login error:', error);
      
      // More specific error messages
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to backend server. Make sure backend is running on port 3000.');
      } else if (error.message.includes('HTTP 404')) {
        throw new Error('GitHub auth endpoint not found. Check if auth routes are properly configured.');
      } else if (error.message.includes('HTTP 500')) {
        throw new Error('Server error. Check backend logs for details.');
      } else {
        throw error;
      }
    }
  }

  // Handle login success callback
  handleLoginSuccess(): UserData | null {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userStr = urlParams.get('user');
    
    if (token && userStr) {
      try {
        const user: GitHubUser = JSON.parse(decodeURIComponent(userStr));
        
        // Store token and user info
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Clean URL
        window.history.replaceState({}, document.title, '/dashboard');
        
        return { token, user };
      } catch (error: any) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    
    return null;
  }

  // Get stored user info
  getCurrentUser(): UserData | null {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');
    
    if (userStr && token) {
      try {
        return {
          user: JSON.parse(userStr),
          token: token
        };
      } catch (error: any) {
        console.error('Error parsing user data:', error);
        this.logout();
        return null;
      }
    }
    
    return null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  // Logout user
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  // Verify token with backend
  async verifyToken(): Promise<boolean> {
    const token = localStorage.getItem('authToken');
    
    if (!token) return false;
    
    try {
      const response = await fetch(`${this.baseURL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data: AuthResponse = await response.json();
      return data.success;
    } catch (error: any) {
      console.error('Token verification error:', error);
      this.logout();
      return false;
    }
  }
}

export default new GitHubAuthService();