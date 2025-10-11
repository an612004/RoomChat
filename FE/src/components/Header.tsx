import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

const Header: React.FC = () => {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  const handleLogout = (): void => {
    logout();
    navigate('/login');
    setShowConfirm(false);
  };

  return (
    <header className='header'>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2">
          <div className='logo-img'>
            <img src="/logo.png" alt="Logo" />
          </div>
          <span className="text-white font-semibold text-lg"></span>
        </div>
        
        <div>
          {isLoggedIn && user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className='avatar'>
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  />
                </div>
                <span className="text-white text-sm">Hi, {user.name}</span>
              </div>
              <button
                onClick={() => setShowConfirm(true)}
                className="logout-btn"
              >
                <LogOut size={20} color="white" />
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} className="login-btn">Login</button> 
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showConfirm && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <div className="logout-modal-header">
              <h3>Confirm logout</h3>
            </div>
            <div className="logout-modal-body">
              <p>Are you sure you want to log out of your account?</p>
              {user && (
                <div className="user-info-confirm">
                  <img src={user.avatar} alt={user.name} className="avatar-small" />
                  <span>{user.name}</span>
                </div>
              )}
            </div>
            <div className="logout-modal-footer">
              <button 
                onClick={() => setShowConfirm(false)} 
                className="btn btn-cancel"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout} 
                className="btn btn-confirm"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;