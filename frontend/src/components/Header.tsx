import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Header.css'

const Header: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false)
  const location = useLocation()
  const { user, isLoading, login, logout } = useAuth()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    logout()
    setShowDropdown(false)
  }

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo">
            <img src="/goodneighbors-logo.jpg" alt="Good Neighbors" className="logo-img" />
            <span className="logo-text">Fundraising Lab</span>
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
            <div className="user-profile" ref={dropdownRef}>
              <div onClick={() => setShowDropdown(!showDropdown)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <img 
                  src={user.picture || 'https://via.placeholder.com/40'} 
                  alt={user.name} 
                  className="profile-img"
                />
                <span className="profile-name">{user.name}</span>
                <span className="dropdown-arrow">▼</span>
              </div>
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
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <a 
                href="https://sites.google.com/globalgn.org/gflab/sign-up?authuser=0"
                target="_blank"
                rel="noopener noreferrer"
                className="sign-up-btn"
              >
                Sign Up
              </a>
              <button className="sign-in-btn" onClick={login}>
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
