import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { calendarApi, CalendarEvent } from '../services/api'
import './CalendarView.css'

const CalendarView: React.FC = () => {
  const { token } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      loadEvents()
    }
  }, [token])

  const loadEvents = async () => {
    if (!token) {
      console.log('[CalendarView] No token, skipping load')
      return
    }
    
    console.log('[CalendarView] Starting to load events...')
    setLoading(true)
    setError(null)
    try {
      const data = await calendarApi.getEvents(token, 10)
      console.log('[CalendarView] Events loaded:', data?.length || 0)
      setEvents(data || [])
      
      // 데이터가 없으면 에러가 아니라 정상적인 상태
      if (!data || data.length === 0) {
        setError(null)
        console.log('[CalendarView] No events found (this is normal if user has no events)')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to load calendar events'
      console.error('[CalendarView] Error loading events:', err)
      console.error('[CalendarView] Error response:', err.response)
      
      // 403 에러는 권한 문제
      if (err.response?.status === 403 || errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
        setError('Calendar API permission is required. Please check your Google account calendar permissions.')
      } else if (errorMsg.includes('refresh token') || errorMsg.includes('re-authenticate')) {
        setError('refresh_token_needed')
      } else {
        setError(errorMsg)
      }
    } finally {
      setLoading(false)
      console.log('[CalendarView] Load completed')
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
      <div className="calendar-header">
        <h3 className="calendar-title">Upcoming Events</h3>
        <a 
          href="https://calendar.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="calendar-link-button"
        >
          Open Google Calendar →
        </a>
      </div>

      <div className="events-list">
        {loading && events.length === 0 ? (
          <div className="loading-text">Loading events...</div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            {error.includes('permission') && (
              <a 
                href="https://calendar.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="calendar-link-button"
                style={{ marginTop: '1rem', display: 'inline-block' }}
              >
                Open Google Calendar directly
              </a>
            )}
          </div>
        ) : events.length === 0 ? (
          <div className="no-events-container">
            <div className="no-events-message">
              <h3>No upcoming events</h3>
              <p>There are no events in your Google Calendar, or no events within the next 30 days.</p>
              <a 
                href="https://calendar.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="calendar-link-button"
              >
                Open Google Calendar
              </a>
            </div>
          </div>
        ) : (
          <div className="course-cards">
            {events.map((event) => (
              <div key={event.id} className="course-card">
                <div className="course-header">
                  <h3 className="course-title">{event.summary}</h3>
                </div>
                <div className="course-content">
                  <div className="course-info">
                    {event.description && (
                      <p className="course-description">{event.description}</p>
                    )}
                    {event.start && (
                      <p className="course-section">
                        Start: {formatDate(event.start.dateTime || event.start.date)}
                      </p>
                    )}
                    {event.end && (
                      <p className="course-section">
                        End: {formatDate(event.end.dateTime || event.end.date)}
                      </p>
                    )}
                    {event.location && (
                      <p className="course-section">
                        Location: {event.location}
                      </p>
                    )}
                    {event.htmlLink && (
                      <a 
                        href={event.htmlLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="course-btn"
                      >
                        VIEW EVENT
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CalendarView
