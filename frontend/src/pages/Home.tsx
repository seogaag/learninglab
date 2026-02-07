import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { calendarApi, CalendarEvent } from '../services/api'
import './Home.css'

const Home: React.FC = () => {
  const { token } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (token) {
      loadEvents()
    }
  }, [token])

  const loadEvents = async () => {
    if (!token) return
    
    setLoading(true)
    try {
      const data = await calendarApi.getEvents(token, 5)
      setEvents(data)
    } catch (err) {
      console.error('Error loading events:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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
            {loading ? (
              <div className="loading-text">Loading...</div>
            ) : events.length === 0 ? (
              <div className="no-events">No upcoming events</div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="event-item">
                  <div className="event-date">{formatDate(event.start?.dateTime || event.start?.date)}</div>
                  <div className="event-title-small">{event.summary}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
