import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { classroomApi, Course } from '../services/api'
import CalendarView from './CalendarView'
import './Classroom.css'

const CalendarSidebar: React.FC = () => {
  const { token } = useAuth()
  const [events, setEvents] = useState<any[]>([])
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
      const { calendarApi } = await import('../services/api')
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

interface ClassCardProps {
  course: Course
  onClick: () => void
}

const ClassCard: React.FC<ClassCardProps> = ({ course, onClick }) => {
  const getStatusTag = () => {
    if (course.courseState === 'ACTIVE') {
      return <span className="class-tag ongoing">Ongoing</span>
    } else if (course.courseState === 'ARCHIVED') {
      return <span className="class-tag finished">Finished</span>
    } else {
      return <span className="class-tag preparing">Preparing</span>
    }
  }

  const getOrganizationTag = () => {
    // 조직 태그는 course 정보에서 추출하거나 기본값 사용
    return <span className="class-tag org">GFSU</span>
  }

  return (
    <div className="class-card" onClick={onClick}>
      <div className="class-card-image">
        <img 
          src={course.teacherFolder?.alternateLink ? `${course.teacherFolder.alternateLink}/thumbnail` : 'https://via.placeholder.com/300x200?text=Class'} 
          alt={course.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Class'
          }}
        />
        <div className="class-card-tags">
          {getStatusTag()}
          {getOrganizationTag()}
        </div>
      </div>
      <div className="class-card-content">
        <h3 className="class-card-title">{course.name}</h3>
        {course.section && (
          <p className="class-card-subtitle">({course.section})</p>
        )}
        <button className="class-card-button" onClick={(e) => { e.stopPropagation(); onClick(); }}>
          Start Learning
        </button>
      </div>
    </div>
  )
}

const Classroom: React.FC = () => {
  const { user, token } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'all' | 'my-courses' | 'calendar'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ongoing' | 'preparing' | 'finished'>('all')

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

  const myCourses = useMemo(() => {
    return courses.filter(course => course.courseState === 'ACTIVE')
  }, [courses])

  const filteredCourses = useMemo(() => {
    let filtered = activeView === 'my-courses' ? myCourses : courses
    
    if (statusFilter === 'all') return filtered
    
    return filtered.filter(course => {
      if (statusFilter === 'ongoing') return course.courseState === 'ACTIVE'
      if (statusFilter === 'preparing') return course.courseState === 'PROVISIONED' || course.courseState === 'DECLINED'
      if (statusFilter === 'finished') return course.courseState === 'ARCHIVED'
      return true
    })
  }, [courses, myCourses, activeView, statusFilter])

  const handleClassClick = (course: Course) => {
    if (course.alternateLink) {
      window.open(course.alternateLink, '_blank')
    }
  }

  return (
    <div className="classroom-page">
      {/* How to Join a Class Banner */}
      <div className="join-class-banner">
        <div className="banner-content">
          <h2 className="banner-title">How to Join a Class?</h2>
          <p className="banner-subtitle">*Before You Start - Please Check below</p>
          <span className="banner-arrow">↓</span>
        </div>
      </div>

      <div className="classroom-container">
        {/* Main Tabs */}
        <div className="main-tabs">
          <button 
            className={`main-tab ${activeView === 'all' ? 'active' : ''}`}
            onClick={() => setActiveView('all')}
          >
            전체 클래스
          </button>
          <button 
            className={`main-tab ${activeView === 'my-courses' ? 'active' : ''}`}
            onClick={() => setActiveView('my-courses')}
          >
            내가 배우고 있는 클래스
          </button>
          <button 
            className={`main-tab ${activeView === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveView('calendar')}
          >
            Calendar
          </button>
        </div>

        {activeView === 'calendar' ? (
          <CalendarView />
        ) : (
          <>
            {/* Status Filter Tabs */}
            {activeView === 'all' && (
              <div className="status-tabs">
                <button 
                  className={`status-tab ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  전체
                </button>
                <button 
                  className={`status-tab ${statusFilter === 'ongoing' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('ongoing')}
                >
                  진행중
                </button>
                <button 
                  className={`status-tab ${statusFilter === 'preparing' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('preparing')}
                >
                  오픈 예정
                </button>
                <button 
                  className={`status-tab ${statusFilter === 'finished' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('finished')}
                >
                  종료된
                </button>
              </div>
            )}

            {/* Thematic Classes Section */}
            <div className="thematic-classes-section">
              <div className="section-header">
                <h2 className="section-title">Thematic Classes</h2>
                <p className="section-description">
                  Let's take case studies based on experiences from GN partnership countries.
                </p>
              </div>

              {loading ? (
                <div className="loading-container">
                  <div className="loading-text">Loading classes...</div>
                </div>
              ) : error ? (
                <div className="error-container">
                  <div className="error-text">{error}</div>
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="empty-container">
                  <p>No classes found. Please enroll in Google Classroom courses.</p>
                </div>
              ) : (
                <div className="class-cards-grid">
                  {filteredCourses.map((course) => (
                    <ClassCard
                      key={course.id}
                      course={course}
                      onClick={() => handleClassClick(course)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Global Learning by Region Section */}
            <div className="region-classes-section">
              <div className="section-header">
                <h2 className="section-title">Global Learning by Region</h2>
                <p className="section-description">
                  Region-specific fundraising strategy courses will also be offered.
                </p>
              </div>
              <div className="region-cards-grid">
                {/* Region cards can be added here if needed */}
                <div className="region-card">
                  <div className="region-card-image">
                    <span className="region-placeholder">Region Course</span>
                  </div>
                  <span className="class-tag preparing">Preparing</span>
                  <h3 className="region-card-title">EAST ASIA</h3>
                  <button className="class-card-button">Start Learning</button>
                </div>
              </div>
            </div>

            {/* Skill up Banner */}
            <div className="skill-up-banner">
              <div className="banner-content">
                <p className="banner-text">Skill up with GFSU's special courses, and share your feedback</p>
                <button className="banner-button">Get in Touch</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Classroom
