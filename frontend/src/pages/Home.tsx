import React from 'react'
import './Home.css'

const Home: React.FC = () => {
  return (
    <div className="home">
      <div className="hero-section">
        <div className="hero-overlay">
          <h1 className="hero-title">Unlock Global Potential. Share. Learn, Grow.</h1>
          <button className="hero-cta">Featured Class el Noxe!</button>
          <div className="carousel-indicators">
            <span className="indicator active"></span>
            <span className="indicator"></span>
            <span className="indicator"></span>
            <span className="indicator"></span>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="sidebar-left">
          <h2 className="sidebar-title">Main Homepage</h2>
          <ul className="sidebar-menu">
            <li className="menu-item">
              <span>My Courses</span>
            </li>
            <li className="menu-item">
              <span>Ezliert lored</span>
            </li>
            <li className="menu-item">
              <span className="menu-text">AI Marketing</span>
              <span className="menu-dot yellow"></span>
            </li>
            <li className="menu-item">
              <span className="menu-text">Content Strategy</span>
              <span className="menu-check green">✓</span>
            </li>
            <li className="menu-item">
              <span className="menu-text">Clobeld oontteges Q2</span>
              <span className="menu-check green">✓</span>
            </li>
            <li className="menu-item">
              <span>Global Cenayties</span>
            </li>
            <li className="menu-item">
              <span>Data Analytics</span>
            </li>
            <li className="menu-item">
              <span className="menu-text">Filter</span>
              <span className="menu-dot green"></span>
            </li>
          </ul>
          <div className="copyright">©2266 Global toops husparstmà</div>
        </div>

        <div className="main-content-area">
          <h2 className="section-title">Learning</h2>
          <div className="tabs">
            <button className="tab active">Calendar</button>
            <button className="tab">Spien 3lt</button>
          </div>
        </div>

        <div className="sidebar-right">
          <h2 className="sidebar-title">Today's Focus</h2>
          <div className="focus-section">
            <h3 className="focus-subtitle">Ik bits Repind</h3>
            <p className="focus-text">Your crpem loettberntiert thaaike so incase</p>
          </div>
          <div className="calendar-events">
            <h3 className="focus-subtitle">Calendar Events</h3>
            <div className="event-date">26it~ Jan 21, 2023</div>
            <div className="event-time">Morbaat78:60</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
