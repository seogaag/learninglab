import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { publicApi, Banner } from '../services/api'
import './Home.css'

interface WorkingTogetherItem {
  id: number
  image: string
  caption: string
}

interface WorkingTogetherProject {
  id: number
  name: string
  images: string[]
}

interface Testimonial {
  id: number
  name: string
  role: string
  text: string
  rating: number
}

const Home: React.FC = () => {
  const navigate = useNavigate()
  const [banners, setBanners] = useState<Banner[]>([])
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

  // Testimonials 데이터 (나중에 DB에서 가져올 수 있음)
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Rouvinn',
      role: 'GPC Global Fundraising Support Unit',
      text: 'This hub has been such a practical resource for me. I find it clear, easy to follow, and well-designed. It makes continuous learning significantly more manageable and effective!',
      rating: 5
    },
    {
      id: 2,
      name: 'Birdy Kim',
      role: 'GPC Management Support Team',
      text: 'It is very beneficial as it provides training on how to begin fundraising in the field, from the basics to practical methods. I feel I will continue to gain much support from this, and I also expect that it will lead to tangible fundraising outcomes:)',
      rating: 5
    },
    {
      id: 3,
      name: 'Tim Park',
      role: 'Good Neighbors USA',
      text: 'This fundraising lab is incredibly valuable, offering a dynamic hub for hands-on learning and real-world application. It\'s a powerful platform that expands our potential—empowering us to learn, and grow alongside the best in the industry.',
      rating: 5
    },
    {
      id: 4,
      name: 'Ellen Kim',
      role: 'GPC Global Budget Strategy and Plan Team',
      text: 'It was valuable to hear different approaches from colleagues in other countries. It gave me fresh perspectives and reminded me of the importance of collaboration and knowledge sharing.',
      rating: 5
    },
    {
      id: 5,
      name: 'Jay Kim',
      role: 'GPC Global Fundraising Support Unit',
      text: 'As a fundraising officer, the Brand Awareness part had always felt quite rogue to me. I requested support from GFSU on this, and the content provided was very helpful. Thank you for creating such a convenient practical lecture.',
      rating: 5
    },
    {
      id: 6,
      name: 'Joy Jung',
      role: 'GPC Global Fundraising Support Unit',
      text: 'I truly enjoyed the meaningful time we had to communicate and share experiences together, and I felt very grateful and happy throughout.',
      rating: 5
    },
    {
      id: 7,
      name: 'Julie Seo',
      role: 'GPC Global Fundraising Support Unit',
      text: 'GFLab provided exactly the lectures we needed. we were able to apply them in our context. The guidance was practical and easy to put into action. We will continue working with GFLab to steadily expand our fundraising efforts.',
      rating: 5
    },
    {
      id: 8,
      name: 'Stephanie',
      role: 'GPC Global Fundraising Support Unit',
      text: 'This platform is helpful for gaining insights from other countries, especially with their lessons learned.',
      rating: 5
    }
  ]

  const [currentTestimonialPage, setCurrentTestimonialPage] = useState(0)
  const testimonialsPerPage = 4
  const totalPages = Math.ceil(testimonials.length / testimonialsPerPage)
  const currentTestimonials = testimonials.slice(
    currentTestimonialPage * testimonialsPerPage,
    (currentTestimonialPage + 1) * testimonialsPerPage
  )

  useEffect(() => {
    loadBanners()
  }, [])

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
      console.log('Loaded banners:', data)
      setBanners(data)
      if (data.length > 0) {
        console.log('First banner image URL:', data[0].image_url)
      }
    } catch (err) {
      console.error('Error loading banners:', err)
    }
  }


  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  const getImageUrl = (url: string): string => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    if (url.startsWith('/admin/upload/image/')) {
      const parts = url.split('/')
      const filename = parts[parts.length - 1]
      const encoded = parts.slice(0, -1).join('/') + '/' + encodeURIComponent(filename)
      return `${API_URL}${encoded}`
    }
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
      

      {/* Working Together Section */}
      <div className="working-together-section">
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

      {/* Feedback & Encouragement Section */}
      <div className="feedback-section">
        <h2 className="section-main-title">Feedback & Encouragement</h2>
        <div className="testimonials-carousel">
          {totalPages > 1 && (
            <button
              type="button"
              className="testimonial-arrow testimonial-arrow-prev"
              onClick={() => setCurrentTestimonialPage((prev) => (prev <= 0 ? totalPages - 1 : prev - 1))}
              aria-label="Previous testimonial"
            >
              ‹
            </button>
          )}
          <div className="testimonials-grid">
            {currentTestimonials.map((testimonial) => (
              <div key={testimonial.id} className="testimonial-card">
                <div className="testimonial-header">
                  <h3 className="testimonial-name">{testimonial.name}</h3>
                  <p className="testimonial-role">{testimonial.role}</p>
                </div>
                <p className="testimonial-text">{testimonial.text}</p>
                <div className="testimonial-rating">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <span key={i} className="star">★</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <button
              type="button"
              className="testimonial-arrow testimonial-arrow-next"
              onClick={() => setCurrentTestimonialPage((prev) => (prev >= totalPages - 1 ? 0 : prev + 1))}
              aria-label="Next testimonial"
            >
              ›
            </button>
          )}
          {totalPages > 1 && (
            <div className="testimonial-pagination">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`testimonial-dot ${index === currentTestimonialPage ? 'active' : ''}`}
                  onClick={() => setCurrentTestimonialPage(index)}
                  aria-label={`Page ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className="action-buttons-section">
        <button 
          className="action-button"
          onClick={() => navigate('/community')}
        >
          Community
        </button>
        <button 
          className="action-button"
          onClick={() => navigate('/learning')}
        >
          Class Room
        </button>
      </div>
    </div>
  )
}

export default Home
