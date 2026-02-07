import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { calendarApi, CalendarEvent } from '../services/api'
import './CalendarView.css'

const CalendarView: React.FC = () => {
  const { token } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'embed'>('list')

  useEffect(() => {
    if (token) {
      loadEvents()
      loadEmbedUrl()
    }
  }, [token])

  const loadEvents = async () => {
    if (!token) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await calendarApi.getEvents(token, 10)
      setEvents(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load calendar events')
      console.error('Error loading events:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadEmbedUrl = async () => {
    if (!token) return
    
    try {
      const data = await calendarApi.getEmbedUrl(token)
      setEmbedUrl(data.embed_url)
    } catch (err: any) {
      console.error('Error loading embed URL:', err)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="calendar-view">
      <div className="calendar-controls">
        <button 
          className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => setViewMode('list')}
        >
          List View
        </button>
        <button 
          className={`view-btn ${viewMode === 'embed' ? 'active' : ''}`}
          onClick={() => setViewMode('embed')}
        >
          Calendar View
        </button>
      </div>

      {viewMode === 'list' ? (
        <div className="events-list">
          {loading && events.length === 0 ? (
            <div className="loading-text">Loading events...</div>
          ) : error ? (
            <div className="error-text">{error}</div>
          ) : events.length === 0 ? (
            <div className="no-events">No upcoming events</div>
          ) : (
            <div className="events-container">
              {events.map((event) => (
                <div key={event.id} className="event-card">
                  <div className="event-header">
                    <h4 className="event-title">{event.summary}</h4>
                    {event.status === 'confirmed' && (
                      <span className="event-status">✓</span>
                    )}
                  </div>
                  {event.description && (
                    <p className="event-description">{event.description}</p>
                  )}
                  <div className="event-details">
                    {event.start && (
                      <div className="event-time">
                        <strong>Start:</strong> {formatDate(event.start.dateTime || event.start.date)}
                      </div>
                    )}
                    {event.end && (
                      <div className="event-time">
                        <strong>End:</strong> {formatDate(event.end.dateTime || event.end.date)}
                      </div>
                    )}
                    {event.location && (
                      <div className="event-location">
                        <strong>Location:</strong> {event.location}
                      </div>
                    )}
                  </div>
                  {event.htmlLink && (
                    <a 
                      href={event.htmlLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="event-link"
                    >
                      Open in Google Calendar →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="calendar-embed">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              style={{
                width: '100%',
                height: '600px',
                border: 'none',
                borderRadius: '8px'
              }}
              title="Google Calendar"
            />
          ) : (
            <div className="loading-text">Loading calendar...</div>
          )}
        </div>
      )}
    </div>
  )
}

export default CalendarView
