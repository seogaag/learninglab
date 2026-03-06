import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { publicApi, Banner, PinnedNotice } from '../services/api'
import { getApiBase } from '../utils/apiBase'
import './Home.css'

const GPC_CALENDAR_URL = 'https://calendar.google.com/calendar/u/0?cid=Y19lZDU5YWU0MTcwNTIzODM0M2M2ZDMzMDA5MjQ2Y2UwYjM0OTdjZWY5MTM2NzAxYTUwMmNkMTdmZTQyYjAzZTVhQGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20'

const FaqItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button type="button" className="faq-question" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="faq-plus">{open ? '−' : '+'}</span>
        <span>{question}</span>
      </button>
      {open && <div className="faq-answer">{answer}</div>}
    </div>
  )
}

interface MiniCalendarProps {
  eventDates: Set<string>
}
const MiniCalendar: React.FC<MiniCalendarProps> = ({ eventDates }) => {
  const [viewDate, setViewDate] = useState(() => new Date())
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))
  const goToToday = () => setViewDate(new Date())

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="mini-calendar">
      <div className="mini-calendar-header">
        <button type="button" className="mini-calendar-arrow" onClick={prevMonth} aria-label="Previous month">‹</button>
        <span className="mini-calendar-month">{monthNames[month]} {year}</span>
        <button type="button" className="mini-calendar-arrow" onClick={nextMonth} aria-label="Next month">›</button>
      </div>
      <div className="mini-calendar-weekdays">
        {dayLabels.map((l) => (
          <span key={l} className="mini-calendar-weekday">{l}</span>
        ))}
      </div>
      <div className="mini-calendar-grid">
        {cells.map((d, i) => {
          if (d === null) return <div key={`empty-${i}`} className="mini-calendar-cell empty" />
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const isToday = dateStr === todayStr
          const hasEvent = eventDates.has(dateStr)
          return (
            <div key={dateStr} className={`mini-calendar-cell ${isToday ? 'today' : ''}`}>
              <span className="mini-calendar-date">{d}</span>
              {hasEvent && <span className="mini-calendar-event-dot" />}
            </div>
          )
        })}
      </div>
      <div className="mini-calendar-actions">
        <button type="button" className="mini-calendar-today-btn" onClick={goToToday}>
          Today
        </button>
        <a
          href={GPC_CALENDAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mini-calendar-link"
        >
          Open Google Calendar →
        </a>
      </div>
    </div>
  )
}

interface WorkingTogetherProject {
  id: number
  name: string
  images: string[]
}

const Home: React.FC = () => {
  const navigate = useNavigate()
  const [banners, setBanners] = useState<Banner[]>([])
  const [pinnedNotices, setPinnedNotices] = useState<PinnedNotice[]>([])
  const [calendarEventDates, setCalendarEventDates] = useState<Set<string>>(new Set())
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [projectImageIndices, setProjectImageIndices] = useState<number[]>([0, 0, 0, 0])

  // Working Together 프로젝트 데이터
  const workingTogetherProjects: WorkingTogetherProject[] = [
    {
      id: 1,
      name: '2024 Annual Conference (w.Cameroon)',
      images: ['/working_together/2024_GPAC_1.png', '/working_together/2024_GPAC_2.png']
    },
    {
      id: 2,
      name: '2025 Collaborate Project (w. GNI*GNT)',
      images: ['/working_together/2025_ColabT_1.png', '/working_together/2025_ColabT_2.png']
    },
    {
      id: 3,
      name: '2025 Together We Shine Project (KOL: Kim Hyun-joo) (w.GNT)',
      images: ['/working_together/2025_Together_1.png', '/working_together/2025_Together_2.png']
    },
    {
      id: 4,
      name: '2025 Global Campaign "Earth&us" (KOL: Shin Hye-sun)',
      images: ['/working_together/2024_EnU_1.png', '/working_together/2024_EnU_2.png']
    }
  ]

  useEffect(() => {
    loadBanners()
    loadPinnedNotices()
    loadCalendarEventDates()
  }, [])

  const loadCalendarEventDates = async () => {
    try {
      const { dates } = await publicApi.getCalendarEventDates()
      setCalendarEventDates(new Set(dates || []))
    } catch {
      setCalendarEventDates(new Set())
    }
  }

  useEffect(() => {
    if (banners.length <= 1) return
    const interval = setInterval(() => {
      setCurrentBannerIndex((i) => (i >= banners.length - 1 ? 0 : i + 1))
    }, 5000)
    return () => clearInterval(interval)
  }, [banners.length])

  useEffect(() => {
    const interval = setInterval(() => {
      setProjectImageIndices((prev) => 
        prev.map((index, projectIndex) => {
          const project = workingTogetherProjects[projectIndex]
          return project ? (index >= project.images.length - 1 ? 0 : index + 1) : index
        })
      )
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const loadBanners = async () => {
    try {
      const data = await publicApi.getBanners()
      setBanners(data)
    } catch (err) {
      console.error('Error loading banners:', err)
    }
  }

  const loadPinnedNotices = async () => {
    try {
      const data = await publicApi.getPinnedNotices()
      setPinnedNotices(data || [])
    } catch (err) {
      console.error('Error loading pinned notices:', err)
    }
  }


  const apiBase = getApiBase()
  const getImageUrl = (url: string): string => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    if (url.startsWith('/admin/upload/image/')) return `${apiBase}${url}`
    return url
  }

  const goPrev = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentBannerIndex((i) => (i <= 0 ? banners.length - 1 : i - 1))
  }
  const goNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentBannerIndex((i) => (i >= banners.length - 1 ? 0 : i + 1))
  }

  const currentBanner = banners.length > 0 ? banners[currentBannerIndex] : null

  return (
    <div className="home">
      {currentBanner ? (
        <section className="hero-carousel" aria-label="Main banner carousel">
          {currentBanner.link_url ? (
            <a
              href={currentBanner.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-carousel-link"
            >
              <div className="hero-carousel-inner" key={currentBannerIndex}>
                <div
                  className="hero-carousel-image"
                  key={currentBanner.id}
                  style={{ backgroundImage: `url(${getImageUrl(currentBanner.image_url)})` }}
                />
              </div>
            </a>
          ) : (
            <div className="hero-carousel-inner" key={currentBannerIndex}>
              <div
                className="hero-carousel-image"
                key={currentBanner.id}
                style={{ backgroundImage: `url(${getImageUrl(currentBanner.image_url)})` }}
              />
            </div>
          )}

          {banners.length > 1 && (
            <>
              <button
                type="button"
                className="hero-carousel-arrow hero-carousel-arrow-prev"
                onClick={goPrev}
                aria-label="Previous slide"
              >
                ‹
              </button>
              <button
                type="button"
                className="hero-carousel-arrow hero-carousel-arrow-next"
                onClick={goNext}
                aria-label="Next slide"
              >
                ›
              </button>
              <div className="hero-carousel-indicators">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`hero-carousel-dot ${index === currentBannerIndex ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentBannerIndex(index)
                    }}
                    aria-label={`Slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      ) : (
        <section className="hero-carousel" aria-label="Main banner carousel" style={{ backgroundColor: 'white', minHeight: '480px' }}>
          <div className="hero-carousel-inner" style={{ backgroundColor: 'white' }}>
            <div className="hero-carousel-image" style={{ backgroundColor: 'white' }} />
          </div>
        </section>
      )}

      {/* Service Cards: What Can You Do on GFLab? (기능서 3.2) */}
      <section className="service-card-section">
        <div className="service-card-inner">
          <b className="service-card-welcome">WELCOME</b>
          <h2 className="service-card-title">What Can You Do on GFLab?</h2>
          <div className="service-card-grid">
            <div className="service-card service-card-hub" onClick={() => navigate('/hub')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/hub')}>
              <img src="/Icon_1.png" alt="" className="service-card-icon" />
              <h3 className="service-card-card-title">Collaboration Hub</h3>
              <b className="service-card-desc">Share Global Resources</b>
              <p className="service-card-desc">share and download fundraising photos from Good Neighbors worldwide - all in one place.</p>            
            </div>
            <div className="service-card service-card-classroom" onClick={() => navigate('/classroom')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/classroom')}>
              <img src="/Icon_2.png" alt="" className="service-card-icon" />
              <h3 className="service-card-card-title">Classroom</h3>
              <b className="service-card-desc">Learn Anytime, Anywhere</b>
              <p className="service-card-desc">Level up your skills with courses on content creation, filming, and digital marketing, anytime and anywhere.</p>            
            </div>
            <div className="service-card service-card-community" onClick={() => navigate('/community')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/community')}>
              <img src="/Icon_3.png" alt="" className="service-card-icon" />
              <h3 className="service-card-card-title">Community</h3>
              <b className="service-card-desc">Connect, Discuss & Suggest</b>
              <p className="service-card-desc">Connect with GN staff, share ideas, and send inquiries or proposals with ease.</p>            
            </div>
          </div>
        </div>
      </section>

      {/* Remarkable: Notice + Calendar (1:1) */}
      <section className="remarkable-section">
        <div className="remarkable-inner">
        <h2 className="section-main-title remarkable-section-title"></h2>
        <div className="remarkable-grid">
          <div className="remarkable-left">
            <div
              className="remarkable-notice-box"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/community?board=notice')}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/community?board=notice')}
            >
              <div className="remarkable-notice-heading-row">
                <h3 className="remarkable-notice-heading">Notice</h3>
                <span className="remarkable-notice-viewall" onClick={(e) => { e.stopPropagation(); navigate('/community?board=notice'); }}>View All</span>
              </div>
              {pinnedNotices.length > 0 ? (
                <div className="remarkable-notice-list" onClick={(e) => e.stopPropagation()}>
                  {pinnedNotices.map((notice) => (
                    <div
                      key={notice.id}
                      className="remarkable-notice-item"
                      onClick={() => navigate(`/community?post=${notice.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/community?post=${notice.id}`)}
                    >
                      <span className="remarkable-notice-badge">📌</span>
                      <div>
                        <h4 className="remarkable-notice-title">{notice.title}</h4>
                        <p className="remarkable-notice-text">{notice.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="remarkable-notice-empty">No notices at the moment.</p>
              )}
            </div>
          </div>
          <div className="remarkable-right">
            <MiniCalendar eventDates={calendarEventDates} />
          </div>
        </div>
        </div>
      </section>

      {/* Working Together Section */}
      <div className="working-together-section">
        <div className="working-together-inner">
          <h2 className="section-main-title">Working Together</h2>
          <div className="working-together-grid">
          {workingTogetherProjects.map((project, projectIndex) => (
            <div key={project.id} className="working-together-item">
              <div className="working-together-image-wrapper">
                <img
                  src={project.images[projectImageIndices[projectIndex]]}
                  alt={project.name}
                  className="working-together-image"
                />
                <div className="working-together-indicators-small">
                  {project.images.map((_, index) => (
                    <span
                      key={index}
                      className={`working-together-dot-small ${index === projectImageIndices[projectIndex] ? 'active' : ''}`}
                    />
                  ))}
                </div>
              </div>
              <p className="working-together-caption">{project.name}</p>
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* How to use GFLab (기능서 3.5 YouTube) */}
      <section className="youtube-section">
        <div className="youtube-section-inner">
          <h2 className="section-main-title">How to use GFLab</h2>
          <div className="youtube-card">
          <div className="youtube-wrapper">
            <iframe
              title="How to use GFLab"
              src="https://www.youtube.com/embed/Oj7zTJuUlGw"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="youtube-iframe"
            />
          </div>
        </div>
        </div>
      </section>

      {/* ASK YOUR QUESTIONS - Frequently Asked Questions (기능서 3.5) */}
      <section className="faq-section">
        <div className="faq-section-inner">
          <p className="faq-section-label">ASK YOUR QUESTIONS</p>
          <h2 className="faq-section-title">Frequently Asked Questions</h2>
          <div className="faq-list">
          <FaqItem
            question="I can't log in."
            answer="Personal accounts and country-specific accounts are not supported. Please log in with your @globalgn.org account only."
          />
          <FaqItem
            question="I want to change my password."
            answer="You can change your password only after completing two-factor authentication (2FA). If you haven't set up a verified phone number or email address, please contact the GPC IT staff."
          />
          <FaqItem
            question="I'm not sure if my sign up registration was submitted."
            answer="If you have completed the form, please wait. Accounts are created on a weekly basis, and a confirmation email will be sent to the address you provided in the form."
          />
          <FaqItem
            question="How do I request materials?"
            answer="Go to Community → Request and submit your inquiry. For a faster response, please @mention the GPC representative."
          />
          <FaqItem
            question="How do I upload Fundraising assets?"
            answer="Anyone who has joined the Collaboration Hub (Google Drive) can upload freely. Please make sure to read the Collaboration Hub User Guide before uploading."
          />
          <FaqItem
            question="I want to share my experience through a class."
            answer="If you'd like to open a new class or suggest an idea, leave a request under Community → Request. We'll review it and get back to you."
          />
          <FaqItem
            question="What is the Calendar for?"
            answer="The calendar shows globally relevant updates such as new classes, articles, and special dates. If you'd like to add an event, please leave a request in Community → Request."
          />
        </div>
        </div>
      </section>
    </div>
  )
}

export default Home
