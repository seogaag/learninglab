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
  const { user, token, login } = useAuth()
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [myCourses, setMyCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [coursework, setCoursework] = useState<Coursework[]>([])
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
      
      // refresh token 관련 에러 체크
      if (errorMsg.includes('refresh token') || errorMsg.includes('re-authenticate')) {
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
    if (course.id && token) {
      loadCoursework(course.id)
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
        <div className="main-content-area">
          <h2 className="section-title">Learning</h2>
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
                <h3 className="login-prompt-title">로그인이 필요합니다</h3>
                <p className="login-prompt-text">
                  내가 수강 중인 클래스를 보려면 Google 계정으로 로그인해주세요.
                </p>
                <button 
                  className="login-prompt-button"
                  onClick={login}
                >
                  Sign in with Google
                </button>
              </div>
            </div>
          ) : activeTab === 'my' ? (
            <div className="my-courses-container">
              {loading ? (
                <div className="loading-text">Loading courses...</div>
              ) : error === 'refresh_token_needed' ? (
                <div className="error-message">
                  <p>Google 계정 재인증이 필요합니다.</p>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#685A55' }}>
                    Google Classroom 데이터를 불러오려면 다시 로그인해주세요.
                  </p>
                  <button 
                    className="login-prompt-button"
                    onClick={login}
                  >
                    다시 로그인하기
                  </button>
                </div>
              ) : error ? (
                <div className="error-message">
                  <p>{error}</p>
                  <a 
                    href="https://classroom.google.com/u/0/h"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="classroom-link-button"
                    style={{ marginTop: '1rem', display: 'inline-block' }}
                  >
                    Google Classroom에서 직접 확인하기
                  </a>
                </div>
              ) : myCourses.length === 0 ? (
                <div className="no-courses-container">
                  <div className="no-courses-message">
                    <h3>수강 중인 클래스가 없습니다</h3>
                    <p>Google Classroom에서 클래스를 등록하거나, 아래 버튼을 클릭하여 Google Classroom을 열어주세요.</p>
                    <p style={{ fontSize: '0.9rem', color: '#685A55', marginTop: '0.5rem' }}>
                      참고: Google Classroom은 보안상의 이유로 다른 사이트에 임베딩할 수 없습니다. 
                      아래 버튼을 클릭하여 새 창에서 Google Classroom을 열어주세요.
                    </p>
                    <a 
                      href="https://classroom.google.com/u/0/h"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="classroom-link-button"
                    >
                      Google Classroom 열기
                    </a>
                  </div>
                </div>
              ) : (
                <div className="course-cards">
                  {myCourses.map((course) => (
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
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {selectedCourse ? (
                <div className="course-detail">
                  <button 
                    className="back-button"
                    onClick={() => setSelectedCourse(null)}
                  >
                    ← Back to Courses
                  </button>
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
                        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
                        // 이미 절대 URL인 경우 그대로 반환
                        if (url.startsWith('http://') || url.startsWith('https://')) {
                          console.log(`[Image URL] Using absolute URL: ${url}`)
                          return url
                        }
                        // 상대 경로인 경우 절대 URL로 변환
                        if (url.startsWith('/admin/upload/image/')) {
                          // URL 인코딩 처리 (한글 파일명 등)
                          const encodedPath = url.split('/').map((part, index) => {
                            if (index > 0) {
                              return encodeURIComponent(part)
                            }
                            return part
                          }).join('/').replace('/admin/upload/image/', '/admin/upload/image/')
                          
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
                                  Start Learning
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
            </>
          )}
        </div>

        <div className="sidebar-right">
          <h2 className="sidebar-title">Today's Focus</h2>
          <CalendarSidebar />
        </div>
      </div>
    </div>
  )
}

export default Classroom
