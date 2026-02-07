import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminBannerApi, adminCourseApi, Banner, WorkspaceCourse } from '../services/adminApi'
import './AdminDashboard.css'

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'banners' | 'courses'>('banners')
  const [banners, setBanners] = useState<Banner[]>([])
  const [courses, setCourses] = useState<WorkspaceCourse[]>([])
  const [loading, setLoading] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [editingCourse, setEditingCourse] = useState<WorkspaceCourse | null>(null)
  const [showBannerForm, setShowBannerForm] = useState(false)
  const [showCourseForm, setShowCourseForm] = useState(false)

  useEffect(() => {
    checkAuth()
    loadData()
  }, [activeTab])

  const checkAuth = () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      navigate('/admin/login')
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'banners') {
        const data = await adminBannerApi.getAll()
        setBanners(data)
      } else {
        const data = await adminCourseApi.getAll()
        setCourses(data)
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('admin_token')
        navigate('/admin/login')
      }
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    navigate('/admin/login')
  }

  const handleBannerSubmit = async (banner: Partial<Banner>) => {
    try {
      if (editingBanner) {
        await adminBannerApi.update(editingBanner.id, banner)
      } else {
        await adminBannerApi.create(banner as Omit<Banner, 'id'>)
      }
      setShowBannerForm(false)
      setEditingBanner(null)
      loadData()
    } catch (err) {
      console.error('Error saving banner:', err)
      alert('배너 저장에 실패했습니다.')
    }
  }

  const handleCourseSubmit = async (course: Partial<WorkspaceCourse>) => {
    try {
      if (editingCourse) {
        await adminCourseApi.update(editingCourse.id, course)
      } else {
        await adminCourseApi.create(course as Omit<WorkspaceCourse, 'id'>)
      }
      setShowCourseForm(false)
      setEditingCourse(null)
      loadData()
    } catch (err) {
      console.error('Error saving course:', err)
      alert('클래스 저장에 실패했습니다.')
    }
  }

  const handleDeleteBanner = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      await adminBannerApi.delete(id)
      loadData()
    } catch (err) {
      console.error('Error deleting banner:', err)
      alert('배너 삭제에 실패했습니다.')
    }
  }

  const handleDeleteCourse = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      await adminCourseApi.delete(id)
      loadData()
    } catch (err) {
      console.error('Error deleting course:', err)
      alert('클래스 삭제에 실패했습니다.')
    }
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>관리자 대시보드</h1>
        <button onClick={handleLogout} className="logout-button">로그아웃</button>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'banners' ? 'active' : ''}`}
          onClick={() => setActiveTab('banners')}
        >
          배너 관리
        </button>
        <button
          className={`tab ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          클래스 관리
        </button>
      </div>

      <div className="admin-content">
        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : activeTab === 'banners' ? (
          <div className="banners-section">
            <div className="section-header">
              <h2>배너 목록</h2>
              <button
                className="add-button"
                onClick={() => {
                  setEditingBanner(null)
                  setShowBannerForm(true)
                }}
              >
                + 배너 추가
              </button>
            </div>
            {showBannerForm && (
              <BannerForm
                banner={editingBanner}
                onSubmit={handleBannerSubmit}
                onCancel={() => {
                  setShowBannerForm(false)
                  setEditingBanner(null)
                }}
              />
            )}
            <div className="items-list">
              {banners.map((banner) => (
                <div key={banner.id} className="item-card">
                  <div className="item-info">
                    <h3>{banner.title}</h3>
                    {banner.subtitle && <p>{banner.subtitle}</p>}
                    <p className="item-meta">순서: {banner.order} | 활성: {banner.is_active ? '예' : '아니오'}</p>
                  </div>
                  <div className="item-actions">
                    <button onClick={() => {
                      setEditingBanner(banner)
                      setShowBannerForm(true)
                    }}>수정</button>
                    <button onClick={() => handleDeleteBanner(banner.id)}>삭제</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="courses-section">
            <div className="section-header">
              <h2>클래스 목록</h2>
              <button
                className="add-button"
                onClick={() => {
                  setEditingCourse(null)
                  setShowCourseForm(true)
                }}
              >
                + 클래스 추가
              </button>
            </div>
            {showCourseForm && (
              <CourseForm
                course={editingCourse}
                onSubmit={handleCourseSubmit}
                onCancel={() => {
                  setShowCourseForm(false)
                  setEditingCourse(null)
                }}
              />
            )}
            <div className="items-list">
              {courses.map((course) => (
                <div key={course.id} className="item-card">
                  <div className="item-info">
                    <h3>{course.name}</h3>
                    {course.description && <p>{course.description}</p>}
                    <p className="item-meta">
                      섹션: {course.section || '-'} | 조직: {course.organization || '-'} | 순서: {course.order} | 활성: {course.is_active ? '예' : '아니오'}
                    </p>
                  </div>
                  <div className="item-actions">
                    <button onClick={() => {
                      setEditingCourse(course)
                      setShowCourseForm(true)
                    }}>수정</button>
                    <button onClick={() => handleDeleteCourse(course.id)}>삭제</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 배너 폼 컴포넌트
const BannerForm: React.FC<{
  banner: Banner | null
  onSubmit: (banner: Partial<Banner>) => void
  onCancel: () => void
}> = ({ banner, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Banner>>({
    title: banner?.title || '',
    subtitle: banner?.subtitle || '',
    image_url: banner?.image_url || '',
    link_url: banner?.link_url || '',
    order: banner?.order || 0,
    is_active: banner?.is_active ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <h3>{banner ? '배너 수정' : '새 배너 추가'}</h3>
      <div className="form-group">
        <label>제목 *</label>
        <input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      <div className="form-group">
        <label>부제목</label>
        <input
          value={formData.subtitle || ''}
          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>이미지 URL *</label>
        <input
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          required
        />
      </div>
      <div className="form-group">
        <label>링크 URL</label>
        <input
          value={formData.link_url || ''}
          onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>순서</label>
        <input
          type="number"
          value={formData.order}
          onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
        />
      </div>
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />
          활성화
        </label>
      </div>
      <div className="form-actions">
        <button type="submit">저장</button>
        <button type="button" onClick={onCancel}>취소</button>
      </div>
    </form>
  )
}

// 클래스 폼 컴포넌트
const CourseForm: React.FC<{
  course: WorkspaceCourse | null
  onSubmit: (course: Partial<WorkspaceCourse>) => void
  onCancel: () => void
}> = ({ course, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<WorkspaceCourse>>({
    name: course?.name || '',
    description: course?.description || '',
    section: course?.section || '',
    image_url: course?.image_url || '',
    alternate_link: course?.alternate_link || '',
    course_state: course?.course_state || 'ACTIVE',
    organization: course?.organization || '',
    order: course?.order || 0,
    is_active: course?.is_active ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <h3>{course ? '클래스 수정' : '새 클래스 추가'}</h3>
      <div className="form-group">
        <label>이름 *</label>
        <input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="form-group">
        <label>설명</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>
      <div className="form-group">
        <label>섹션</label>
        <input
          value={formData.section || ''}
          onChange={(e) => setFormData({ ...formData, section: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>이미지 URL</label>
        <input
          value={formData.image_url || ''}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>링크 URL</label>
        <input
          value={formData.alternate_link || ''}
          onChange={(e) => setFormData({ ...formData, alternate_link: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>상태</label>
        <select
          value={formData.course_state}
          onChange={(e) => setFormData({ ...formData, course_state: e.target.value })}
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="ARCHIVED">ARCHIVED</option>
          <option value="PROVISIONED">PROVISIONED</option>
        </select>
      </div>
      <div className="form-group">
        <label>조직 (GFSU, GN TWN, GN USA 등)</label>
        <input
          value={formData.organization || ''}
          onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>순서</label>
        <input
          type="number"
          value={formData.order}
          onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
        />
      </div>
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />
          활성화
        </label>
      </div>
      <div className="form-actions">
        <button type="submit">저장</button>
        <button type="button" onClick={onCancel}>취소</button>
      </div>
    </form>
  )
}

export default AdminDashboard
