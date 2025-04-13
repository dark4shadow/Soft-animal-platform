import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaSignOutAlt, FaHome, FaList, FaPaw } from 'react-icons/fa';
import '../styles/layout/_header.css';

const Header = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowDropdown(false);
  };

  const getUserInitial = () => {
    if (currentUser && currentUser.name) {
      return currentUser.name.charAt(0).toUpperCase();
    }
    return 'A';
  };

  return (
    <header className="main-header">
      <div className="logo">
        <h1>
          <Link to="/">Pet Shelter</Link>
        </h1>
      </div>
      
      <nav className="main-nav">
        <ul>
          <li><Link to="/shelters">Притулки</Link></li>
          <li><Link to="/animals">Тварини</Link></li>
          <li><Link to="/blog">Блог</Link></li>
          <li><Link to="/donate">Пожертвувати</Link></li>
        </ul>
      </nav>
      
      <div className="auth-section">
        {isAuthenticated ? (
          <div className="user-profile-dropdown" ref={dropdownRef}>
            <button 
              className="profile-button" 
              onClick={() => setShowDropdown(!showDropdown)}
              aria-label="User menu"
            >
              <div className="profile-avatar">
                {getUserInitial()}
              </div>
            </button>
            
            {showDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <p className="user-name">{currentUser?.name || 'Користувач'}</p>
                  <p className="user-email">{currentUser?.email}</p>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                  <span className="icon"><FaUser /></span> Мій профіль
                </Link>
                
                {currentUser?.userType === 'volunteer' && (
                  <>
                    <Link to="/volunteer-dashboard" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      <span className="icon"><FaHome /></span> Особистий кабінет
                    </Link>
                    <Link to="/volunteer/intake-requests" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      <span className="icon"><FaList /></span> Мої запити на прийом тварин
                    </Link>
                    <Link to="/create-intake-request" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      <span className="icon"><FaPaw /></span> Знайшли тварину
                    </Link>
                  </>
                )}
                
                {currentUser?.userType === 'shelter' && (
                  <>
                    <Link to="/shelter-dashboard" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      <span className="icon"><FaHome /></span> Адмін-панель притулку
                    </Link>
                    <Link to="/shelter/intake-requests" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      <span className="icon"><FaList /></span> Запити на прийом тварин
                    </Link>
                  </>
                )}
                
                <div className="dropdown-divider"></div>
                
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <span className="icon"><FaSignOutAlt /></span> Вийти
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="btn btn-outline">Увійти</Link>
            <Link to="/register" className="btn btn-primary">Реєстрація</Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;