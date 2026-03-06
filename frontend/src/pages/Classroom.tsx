import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { classroomApi, calendarApi, Course, CalendarEvent } from '../services/api'
import { getApiBase } from '../utils/apiBase'
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
  const { user, token, login, loginWithConsent } = useAuth()
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [myCourses, setMyCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'calendar'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ongoing' | 'preparing' | 'finished'>('all')

  useEffect(() => {
    // 워크스페이스 클래스는 항상 로드
    loadWorkspaceCourses()
  }, [])

  useEffect(() => {
    // 내 클래스는 로그인한 경우에만 로드
    if (token && user && activeTab === 'my') {
      console.log('[Classroom] Loading my courses...', { token: token?.substring(0, 20), user: user?.email })
      loadMyCourses()
    }
  }, [token, user, activeTab])

  const loadWorkspaceCourses = async () => {
    setLoading(true)
    try {
      console.log('[Workspace Courses] Loading workspace courses...')
      const data = await classroomApi.getWorkspaceCourses()
      console.log('[Workspace Courses] API response:', data)
      console.log('[Workspace Courses] Number of courses:', data?.length || 0)
      // 이미지 URL 확인 및 로깅
      if (data && data.length > 0) {
        data.forEach((course: Course) => {
          console.log(`[Workspace Courses] Course: ${course.name}, image_url: ${course.image_url}`)
        })
      }
      setAllCourses(data || [])
    } catch (err: any) {
      console.error('[Workspace Courses] Error loading workspace courses:', err)
      console.error('[Workspace Courses] Error response:', err.response)
      setAllCourses([])
    } finally {
      setLoading(false)
    }
  }

  const loadMyCourses = async () => {
    if (!token) {
      console.log('[My Courses] No token, skipping load')
      return
    }
    
    console.log('[My Courses] Starting to load courses...')
    setLoading(true)
    setError(null)
    try {
      const data = await classroomApi.getCourses(token)
      console.log('[My Courses] API response:', data)
      console.log('[My Courses] Number of courses:', data?.length || 0)
      console.log('[My Courses] Course data type:', Array.isArray(data) ? 'array' : typeof data)
      
      if (data && Array.isArray(data)) {
        console.log('[My Courses] Setting courses:', data.map(c => ({ id: c.id, name: c.name })))
        setMyCourses(data)
      } else {
        console.warn('[My Courses] Invalid data format:', data)
        setMyCourses([])
      }
      
      // 데이터가 없으면 에러가 아니라 정상적인 상태
      if (!data || data.length === 0) {
        setError(null)
        console.log('[My Courses] No courses found (this is normal if user has no enrolled courses)')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to load courses'
      console.error('[My Courses] Error loading courses:', err)
      console.error('[My Courses] Error response:', err.response)
      console.error('[My Courses] Error message:', errorMsg)
      
      // refresh token 또는 권한 관련 에러 체크
      if (errorMsg.includes('refresh token') || errorMsg.includes('re-authenticate') || 
          errorMsg.includes('permission') || errorMsg.includes('403') || 
          errorMsg.includes('Forbidden') || err.response?.status === 403) {
        setError('refresh_token_needed')
      } else {
        setError(errorMsg)
        setMyCourses([])
      }
    } finally {
      setLoading(false)
      console.log('[My Courses] Load completed, loading:', false)
    }
  }

  const getStatusFromCourseState = (courseState?: string): 'ongoing' | 'preparing' | 'finished' => {
    if (!courseState) return 'ongoing'
    const state = courseState.toUpperCase()
    if (state === 'ACTIVE') return 'ongoing'
    if (state === 'PROVISIONED') return 'preparing'
    if (state === 'ARCHIVED' || state === 'DECLINED' || state === 'SUSPENDED') return 'finished'
    return 'ongoing'
  }

  const getFilteredCourses = () => {
    const courses = activeTab === 'all' ? allCourses : myCourses
    if (statusFilter === 'all') return courses
    
    return courses.filter(course => {
      const status = getStatusFromCourseState(course.courseState)
      return status === statusFilter
    })
  }

  const currentCourses = getFilteredCourses()

  return (
    <div className="classroom">
      <div className="classroom-grid">
        <div className="sidebar-left">
          <h2 className="sidebar-title">Today's Focus</h2>
          <CalendarSidebar />
        </div>
        <div className="main-content-area">
          <h2 className="section-title">Classroom</h2>
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button 
              className={`tab ${activeTab === 'my' ? 'active' : ''}`}
              onClick={() => setActiveTab('my')}
            >
              My
            </button>
            <button 
              className={`tab ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
            >
              Calendar
            </button>
          </div>
          
          {activeTab === 'all' && (
            <div className="status-filters">
              <button
                className={`status-filter ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All
              </button>
              <button
                className={`status-filter ${statusFilter === 'ongoing' ? 'active' : ''}`}
                onClick={() => setStatusFilter('ongoing')}
              >
                Ongoing
              </button>
              <button
                className={`status-filter ${statusFilter === 'preparing' ? 'active' : ''}`}
                onClick={() => setStatusFilter('preparing')}
              >
                Preparing
              </button>
              <button
                className={`status-filter ${statusFilter === 'finished' ? 'active' : ''}`}
                onClick={() => setStatusFilter('finished')}
              >
                Finished
              </button>
            </div>
          )}
          
          {activeTab === 'calendar' ? (
            <CalendarView />
          ) : activeTab === 'my' && (!token || !user) ? (
            <div className="login-prompt">
              <div className="login-prompt-content">
                <h3 className="login-prompt-title">Login Required</h3>
                <p className="login-prompt-text">
                  Please sign in with your Google account to view your enrolled classes.
                </p>
                <button 
                  className="login-prompt-button"
                  onClick={login}
                >
                  Sign In
                </button>
              </div>
            </div>
          ) : activeTab === 'my' ? (
            <div className="my-courses-container">
              {loading ? (
                <div className="loading-text">Loading courses...</div>
              ) :               error === 'refresh_token_needed' ? (
                <div className="no-courses-container">
                  <div className="no-courses-message">
                    <h3>Unable to load courses</h3>
                    <p>Classroom & Drive 권한이 필요합니다. 아래 버튼을 눌러 다시 로그인하고 권한을 허용해 주세요.</p>
                    <button 
                      className="classroom-link-button classroom-link-button-primary"
                      onClick={loginWithConsent}
                      style={{ marginRight: '0.5rem', marginBottom: '0.5rem' }}
                    >
                      권한 다시 부여 (재로그인)
                    </button>
                    <a 
                      href="https://classroom.google.com/u/0/h"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="classroom-link-button"
                    >
                      Open Google Classroom
                    </a>
                  </div>
                </div>
              ) : error ? (
                <div className="no-courses-container">
                  <div className="no-courses-message">
                    <h3>Unable to load courses</h3>
                    <p>{error}</p>
                    <button 
                      className="classroom-link-button classroom-link-button-primary"
                      onClick={loginWithConsent}
                      style={{ marginRight: '0.5rem', marginBottom: '0.5rem' }}
                    >
                      권한 다시 부여 (재로그인)
                    </button>
                    <a 
                      href="https://classroom.google.com/u/0/h"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="classroom-link-button"
                    >
                      Open Google Classroom
                    </a>
                  </div>
                </div>
              ) : !loading && myCourses.length === 0 ? (
                <div className="no-courses-container">
                  <div className="no-courses-message">
                    <h3>No enrolled classes</h3>
                    <p>Please enroll in a class on Google Classroom, or click the button below to open Google Classroom.</p>
                    <p style={{ fontSize: '0.9rem', color: '#685A55', marginTop: '0.5rem' }}>
                      If you already have classes: try signing out and signing in again to refresh Classroom permissions.
                    </p>
                    <p style={{ fontSize: '0.9rem', color: '#685A55', marginTop: '0.25rem' }}>
                      Note: Google Classroom cannot be embedded in other sites for security reasons. 
                      Please click the button below to open Google Classroom in a new window.
                    </p>
                    <a 
                      href="https://classroom.google.com/u/0/h"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="classroom-link-button classroom-link-button-primary"
                    >
                      Open Google Classroom
                    </a>
                  </div>
                </div>
              ) : (
                <div className="course-cards">
                  {myCourses.map((course) => (
                    <div 
                      key={course.id} 
                      className="course-card"
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
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="course-cards">
                  {loading ? (
                    <div className="loading-text">Loading courses...</div>
                  ) : currentCourses.length === 0 ? (
                    <div className="no-courses">
                      <p>No courses available.</p>
                    </div>
                  ) : (
                    currentCourses.map((course) => {
                      const status = getStatusFromCourseState(course.courseState)
                      const getImageUrl = (url?: string): string => {
                        if (!url) return ''
                        const apiUrl = getApiBase()
                        // 이미 절대 URL인 경우 그대로 반환
                        if (url.startsWith('http://') || url.startsWith('https://')) {
                          console.log(`[Image URL] Using absolute URL: ${url}`)
                          return url
                        }
                        // 상대 경로인 경우 절대 URL로 변환
                        if (url.startsWith('/admin/upload/image/')) {
                          // URL 인코딩 처리 (한글 파일명 등)
                          // 마지막 파일명만 인코딩
                          const pathParts = url.split('/')
                          const filename = pathParts[pathParts.length - 1]
                          const encodedFilename = encodeURIComponent(filename)
                          const encodedUrl = url.replace(filename, encodedFilename)
                          
                          const fullUrl = `${apiUrl}${encodedUrl}`
                          console.log(`[Image URL] Converting: ${url} -> ${fullUrl}`)
                          return fullUrl
                        }
                        console.log(`[Image URL] Returning as-is: ${url}`)
                        return url
                      }
                      
                      const handleCardClick = () => {
                        if (course.alternateLink) {
                          window.open(course.alternateLink, '_blank', 'noopener,noreferrer')
                        }
                      }
                      
                      return (
                        <div 
                          key={course.id} 
                          className="course-card"
                          onClick={handleCardClick}
                        >
                          {course.image_url && (
                            <div 
                              className="course-image-container"
                              style={{
                                backgroundImage: `url(${getImageUrl(course.image_url)})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                width: '100%',
                                height: '200px',
                                borderRadius: '8px',
                                marginBottom: '1rem'
                              }}
                            />
                          )}
                          <div className="course-header">
                            <div className="course-tags">
                              <span className={`status-tag ${status}`}>
                                {status === 'ongoing' ? 'Ongoing' : status === 'preparing' ? 'Preparing' : 'Finished'}
                              </span>
                              {course.organization && (
                                <span className="organization-tag">
                                  {course.organization}
                                </span>
                              )}
                            </div>
                            <h3 className="course-title">{course.name}</h3>
                            {course.description && (
                              <p className="course-subtitle">{course.description}</p>
                            )}
                          </div>
                          <div className="course-content">
                            <div className="course-info">
                              {course.alternateLink && (
                                <a 
                                  href={course.alternateLink} 
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="course-btn"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Enter Classroom
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Classroom
