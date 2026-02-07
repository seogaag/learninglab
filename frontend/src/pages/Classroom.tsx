import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { classroomApi, calendarApi, Course, Coursework, CalendarEvent } from '../services/api'
import CalendarView from './CalendarView'
import './Classroom.css'

const CalendarSidebar: React.FC = () => {
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
      const data = await calendarApi.getEvents(token, 3)
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
  )
}

const Classroom: React.FC = () => {
  const { user, token } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [coursework, setCoursework] = useState<Coursework[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'courses' | 'calendar'>('courses')

  useEffect(() => {
    if (token && user) {
      loadCourses()
    }
  }, [token, user])

  const loadCourses = async () => {
    if (!token) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await classroomApi.getCourses(token)
      setCourses(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load courses')
      console.error('Error loading courses:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCoursework = async (courseId: string) => {
    if (!token) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await classroomApi.getCoursework(courseId, token)
      setCoursework(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load coursework')
      console.error('Error loading coursework:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course)
    if (course.id) {
      loadCoursework(course.id)
    }
  }

  return (
    <div className="classroom">
      <div className="classroom-grid">
        <div className="sidebar-left">
          <h2 className="sidebar-title">My Courses</h2>
          {loading && courses.length === 0 ? (
            <div className="loading-text">Loading courses...</div>
          ) : error ? (
            <div className="error-text">{error}</div>
          ) : (
            <ul className="sidebar-menu">
              {courses.length === 0 ? (
                <li className="menu-item">
                  <span>No courses found</span>
                </li>
              ) : (
                courses.map((course) => (
                  <li 
                    key={course.id} 
                    className={`menu-item ${selectedCourse?.id === course.id ? 'active' : ''}`}
                    onClick={() => handleCourseClick(course)}
                  >
                    <span className="menu-text">{course.name}</span>
                    {course.courseState === 'ACTIVE' && (
                      <span className="menu-dot green"></span>
                    )}
                  </li>
                ))
              )}
            </ul>
          )}
          <div className="copyright">©2266 Global toops husparstmà</div>
        </div>

        <div className="main-content-area">
          <h2 className="section-title">Learning</h2>
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'courses' ? 'active' : ''}`}
              onClick={() => setActiveTab('courses')}
            >
              Courses
            </button>
            <button 
              className={`tab ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
            >
              Calendar
            </button>
          </div>

          {activeTab === 'courses' ? (
            <>
              {selectedCourse ? (
                <div className="course-detail">
                  <div className="course-header">
                    <h3 className="course-title">{selectedCourse.name}</h3>
                    {selectedCourse.section && (
                      <p className="course-section">Section: {selectedCourse.section}</p>
                    )}
                    {selectedCourse.description && (
                      <p className="course-description">{selectedCourse.description}</p>
                    )}
                    {selectedCourse.alternateLink && (
                      <a 
                        href={selectedCourse.alternateLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="course-btn"
                      >
                        Open in Google Classroom
                      </a>
                    )}
                  </div>

                  {loading && coursework.length === 0 ? (
                    <div className="loading-text">Loading assignments...</div>
                  ) : (
                    <div className="course-modules">
                      <h4 className="modules-title">Assignments</h4>
                      {coursework.length === 0 ? (
                        <p className="no-assignments">No assignments found</p>
                      ) : (
                        <ul className="modules-list">
                          {coursework.map((work) => (
                            <li key={work.id} className="module-item">
                              <div className="module-content">
                                <span className="module-name">{work.title}</span>
                                {work.dueDate && (
                                  <span className="module-due">
                                    Due: {work.dueDate.year}-{work.dueDate.month}-{work.dueDate.day}
                                  </span>
                                )}
                              </div>
                              {work.alternateLink && (
                                <a 
                                  href={work.alternateLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="module-link"
                                >
                                  →
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="course-cards">
                  {courses.length === 0 ? (
                    <div className="no-courses">
                      <p>No courses available. Please enroll in Google Classroom courses.</p>
                    </div>
                  ) : (
                    courses.map((course) => (
                      <div 
                        key={course.id} 
                        className="course-card"
                        onClick={() => handleCourseClick(course)}
                      >
                        <div className="course-header">
                          <h3 className="course-title">{course.name}</h3>
                        </div>
                        <div className="course-content">
                          <div className="course-info">
                            {course.description && (
                              <p className="course-description">{course.description}</p>
                            )}
                            {course.section && (
                              <p className="course-section">Section: {course.section}</p>
                            )}
                            {course.alternateLink && (
                              <a 
                                href={course.alternateLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="course-btn"
                                onClick={(e) => e.stopPropagation()}
                              >
                                VIEW COURSE
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : (
            <CalendarView />
          )}
        </div>

        <div className="sidebar-right">
          <h2 className="sidebar-title">Today's Focus</h2>
          <div className="focus-section">
            <h3 className="focus-subtitle">Ik bits Repind</h3>
            <p className="focus-text">Your crpentloettberntiert thaaike So incase</p>
          </div>
          <CalendarSidebar />
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
