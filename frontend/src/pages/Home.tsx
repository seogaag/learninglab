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

  // Working Together 데이터 (나중에 DB에서 가져올 수 있음)
  const workingTogetherItems: WorkingTogetherItem[] = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400',
      caption: '2024 Annual Conference IW.GN'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400',
      caption: '2025 Collaborate Project w. GNI...'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400',
      caption: '2025 Together we shine project (K...'
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
      caption: '2024 Global Campaign "Earth&us..."'
    }
  ]

  // Testimonials 데이터 (나중에 DB에서 가져올 수 있음)
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Jay Kim',
      role: 'GPC Global Fundraising Support Unit',
      text: 'As a fundraising officer, the Brand Awareness part had always felt quite rogue to me. I requested support from GFSU on this, and the content provided was very helpful. Thank you for creating such a convenient practical lecture.',
      rating: 5
    },
    {
      id: 2,
      name: 'Joy Jung',
      role: 'GPC Global Fundraising Support Unit',
      text: 'I truly enjoyed the meaningful time we had to communicate and share experiences together, and I felt very grateful and happy throughout.',
      rating: 5
    },
    {
      id: 3,
      name: 'Julie Seo',
      role: 'GPC Global Fundraising Support Unit',
      text: 'GFLab provided exactly the lectures we needed. we were able to apply them in our context. The guidance was practical and easy to put into action. We will continue working with GFLab to steadily expand our fundraising efforts.',
      rating: 5
    },
    {
      id: 4,
      name: 'Stephanie',
      role: 'GPC Global Fundraising Support Unit',
      text: 'This platform is helpful for gaining insights from other countries, especially with their lessons learned.',
      rating: 5
    }
  ]

  useEffect(() => {
    loadBanners()
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


  const getImageUrl = (url: string): string => {
    if (!url) return ''
    // 업로드된 이미지인 경우 전체 URL로 변환
    if (url.startsWith('/admin/upload/image/')) {
      return `http://localhost:8000${url}`
    }
    return url
  }

  const currentBanner = banners.length > 0 ? banners[currentBannerIndex] : null

  return (
    <div className="home">
      {currentBanner ? (
        <div 
          className="hero-section hero-banner"
          style={{ backgroundImage: `url(${getImageUrl(currentBanner.image_url)})` }}
          onClick={() => currentBanner.link_url && window.open(currentBanner.link_url, '_blank')}
        >
          {banners.length > 1 && (
            <div className="carousel-indicators">
              {banners.map((_, index) => (
                <span
                  key={index}
                  className={`indicator ${index === currentBannerIndex ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentBannerIndex(index)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
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
      )}

      {/* Working Together Section */}
      <div className="working-together-section">
        <h2 className="section-main-title">Working Together</h2>
        <div className="working-together-grid">
          {workingTogetherItems.map((item) => (
            <div key={item.id} className="working-together-item">
              <img src={item.image} alt={item.caption} className="working-together-image" />
              <p className="working-together-caption">{item.caption}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback & Encouragement Section */}
      <div className="feedback-section">
        <h2 className="section-main-title">Feedback & Encouragement</h2>
        <div className="testimonials-grid">
          {testimonials.map((testimonial) => (
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
