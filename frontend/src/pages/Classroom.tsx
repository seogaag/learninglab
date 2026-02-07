import React from 'react'
import './Classroom.css'

const Classroom: React.FC = () => {
  return (
    <div className="classroom">
      <div className="classroom-grid">
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
            <button className="tab">Calendar</button>
            <button className="tab active">Spien 3lt</button>
          </div>

          <div className="progress-section">
            <div className="progress-item">
              <div className="progress-header">
                <span className="progress-title">AI Marketing</span>
                <span className="progress-percent">60% Complete</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div className="progress-item">
              <div className="progress-header">
                <span className="progress-title">Content Strategy</span>
                <span className="progress-percent">65% Complete</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>

          <div className="course-cards">
            <div className="course-card">
              <div className="course-header">
                <h3 className="course-title">Google Classroom</h3>
              </div>
              <div className="course-content">
                <img 
                  src="https://via.placeholder.com/200" 
                  alt="Course" 
                  className="course-image"
                />
                <div className="course-info">
                  <p className="course-description">Arooul Woting nhatч вечоривна</p>
                  <button className="course-btn">VIEW COURSE</button>
                </div>
              </div>
              <div className="course-modules">
                <h4 className="modules-title">Carkvis</h4>
                <ul className="modules-list">
                  <li className="module-item">Passatrs →</li>
                  <li className="module-item">Murreyre →</li>
                  <li className="module-item">MA →</li>
                  <li className="module-item">Datovine vihas →</li>
                  <li className="module-item">Earicance fruage →</li>
                  <li className="module-item">Toedt Ross →</li>
                  <li className="module-item">Noursers/sene 63 Bessiée →</li>
                </ul>
              </div>
            </div>

            <div className="course-card">
              <div className="course-header">
                <h3 className="course-title">AI Prurred Masioring Sihedges</h3>
              </div>
              <div className="course-content">
                <img 
                  src="https://via.placeholder.com/200" 
                  alt="Course" 
                  className="course-image"
                />
                <div className="course-info">
                  <p className="course-description">Course description text here...</p>
                  <button className="course-btn">VIEW COURSE</button>
                </div>
              </div>
            </div>

            <div className="course-card">
              <div className="course-header">
                <h3 className="course-title">Market</h3>
              </div>
              <div className="course-content">
                <p className="course-description">Market course content...</p>
                <button className="course-btn">LOOIFT REUE</button>
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar-right">
          <h2 className="sidebar-title">Today's Focus</h2>
          <div className="focus-section">
            <h3 className="focus-subtitle">Ik bits Repind</h3>
            <p className="focus-text">Your crpentloettberntiert thaaike So incase</p>
          </div>
          <div className="calendar-events">
            <h3 className="focus-subtitle">Calendar Events</h3>
            <div className="event-date">26im Jan 21, 2023</div>
            <div className="event-time">Morbaat 78:60</div>
          </div>
          <div className="social-icons">
            <span className="social-icon">📅</span>
            <span className="social-icon">💬</span>
            <span className="social-icon">👤</span>
            <span className="social-icon">⚙️</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Classroom
