import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Header.css'

const Header: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false)
  const location = useLocation()
  const { user, isLoading, login, logout } = useAuth()

  const handleLogout = () => {
    logout()
    setShowDropdown(false)
  }

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo">
            <img src="/goodneighbors-logo.jpg" alt="Good Neighbors" className="logo-img" />
          </Link>
        </div>
        
        <nav className="header-nav">
          <Link 
            to="/" 
            className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
          >
            Home
          </Link>
          <Link 
            to="/learning" 
            className={location.pathname === '/learning' ? 'nav-link active' : 'nav-link'}
          >
            Learning
          </Link>
          <Link 
            to="/community" 
            className={location.pathname === '/community' ? 'nav-link active' : 'nav-link'}
          >
            Community
          </Link>
          <Link 
            to="/hub" 
            className={location.pathname === '/hub' ? 'nav-link active' : 'nav-link'}
          >
            Hub
          </Link>
        </nav>

        <div className="header-right">
          {isLoading ? (
            <div className="loading-text">Loading...</div>
          ) : user ? (
            <div className="user-profile" onClick={() => setShowDropdown(!showDropdown)}>
              <img 
                src={user.picture || 'https://via.placeholder.com/40'} 
                alt={user.name} 
                className="profile-img"
              />
              <span className="profile-name">{user.name}</span>
              <span className="dropdown-arrow">▼</span>
              {showDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-item">
                    <div className="dropdown-user-info">
                      <div className="dropdown-user-name">{user.name}</div>
                      <div className="dropdown-user-email">{user.email}</div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <a 
                    href="https://myaccount.google.com/" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dropdown-item" 
                    onClick={(e) => { setShowDropdown(false); }}
                  >
                    Settings
                  </a>
                  <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                    Sign Out
                  </a>
                </div>
              )}
            </div>
          ) : (
            <button className="sign-in-btn" onClick={login}>
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
