import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Header.css'

const Header: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false)
  const location = useLocation()

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo">
            <div className="logo-icon">in</div>
            <span className="logo-text">Insight Hub</span>
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
        </nav>

        <div className="header-right">
          <button className="sign-in-btn">Sign in with Google</button>
          <div className="user-profile" onClick={() => setShowDropdown(!showDropdown)}>
            <img 
              src="https://via.placeholder.com/40" 
              alt="Profile" 
              className="profile-img"
            />
            <span className="profile-name">Jane Doe</span>
            <span className="dropdown-arrow">▼</span>
            {showDropdown && (
              <div className="dropdown-menu">
                <a href="#" className="dropdown-item">My Profile</a>
                <a href="#" className="dropdown-item">Settings</a>
                <a href="#" className="dropdown-item">Sign Out</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
