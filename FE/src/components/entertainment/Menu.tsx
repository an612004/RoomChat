import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import './Menu.css';

const Menu = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const genres = [
    "Hành động",
    "Tình cảm",
    "Kinh dị",
    "Hoạt hình",
    "Hài hước",
    "Viễn tưởng",
  ];

  return (
    <div className="menu-gradient menu-container">
      {/* Menu */}
      <ul className="menu-list">
        <li><button onClick={() => navigate('/entertainment/home')} className="menu-btn">Trang Chủ</button></li>
        <li><button className="menu-btn">Phim Bộ</button></li>
        <li><button className="menu-btn">Phim Lẻ</button></li>
        <li><button className="menu-btn">TV Shows</button></li>
        <li className="relative" onMouseEnter={() => setShowDropdown(true)} onMouseLeave={() => setShowDropdown(false)}>
          <button className="menu-btn flex items-center gap-2">Thể Loại
            <svg className="ml-1 w-4 h-4 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
          </button>
          {showDropdown && (
            <ul className="menu-dropdown absolute left-0 top-full mt-2 animate-fade-in">
              {genres.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}
        </li>
      </ul>
      {/* Thanh tìm kiếm */}
      <div className="menu-search">
        <Search size={20} color="#fbbf24" />
        <input type="text" placeholder="Bạn tìm gì..." />
      </div>
    </div>
  );
};

export default Menu;
