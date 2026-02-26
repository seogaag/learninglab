import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminBannerApi, adminCourseApi, adminUploadApi, Banner, WorkspaceCourse } from '../services/adminApi'
import { communityApi, Post } from '../services/api'
import { getApiBase } from '../utils/apiBase'
import './AdminDashboard.css'

const API_URL = getApiBase()
const MAX_IMAGE_SIZE_MB = 30
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']

// 공용 이미지 업로드 드롭존
const ImageUploadDropzone: React.FC<{
  onFileSelect: (file: File) => void
  uploading: boolean
  required?: boolean
}> = ({ onFileSelect, uploading, required }) => {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateAndEmit = (file: File | null) => {
    if (!file) return
    const maxSize = MAX_IMAGE_SIZE_MB * 1024 * 1024
    if (file.size > maxSize) {
      alert(`파일 크기는 ${MAX_IMAGE_SIZE_MB}MB를 초과할 수 없습니다.`)
      return
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert('PNG, JPEG, JPG, GIF, WebP 형식의 이미지만 업로드 가능합니다.')
      return
    }
    onFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) validateAndEmit(file)
  }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndEmit(e.target.files?.[0] ?? null)
    e.target.value = ''
  }
  const handleClick = () => inputRef.current?.click()

  return (
    <div
      className={`image-dropzone ${isDragging ? 'dropzone-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        onChange={handleChange}
        disabled={uploading}
        required={required}
        style={{ display: 'none' }}
      />
      <span className="dropzone-text">
        {uploading ? '업로드 중...' : '클릭하거나 이미지를 여기에 드래그하여 놓으세요'}
      </span>
      <span className="dropzone-hint">PNG, JPEG, JPG, GIF, WebP (최대 {MAX_IMAGE_SIZE_MB}MB)</span>
    </div>
  )
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'banners' | 'courses' | 'notices'>('banners')
  const [notices, setNotices] = useState<Post[]>([])
  const [showNoticeForm, setShowNoticeForm] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Post | null>(null)
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
        setBanners(data || [])
      } else if (activeTab === 'courses') {
        const data = await adminCourseApi.getAll()
        setCourses(data || [])
      } else if (activeTab === 'notices') {
        const adminToken = localStorage.getItem('admin_token')
        const response = await communityApi.getPosts({ post_type: 'notice' }, adminToken || undefined)
        setNotices(response?.posts || [])
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('admin_token')
        navigate('/admin/login')
      }
      console.error('Error loading data:', err)
      // 에러 발생 시 빈 배열로 설정
      if (activeTab === 'banners') {
        setBanners([])
      } else if (activeTab === 'courses') {
        setCourses([])
      } else if (activeTab === 'notices') {
        setNotices([])
      }
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
        <button
          className={`tab ${activeTab === 'notices' ? 'active' : ''}`}
          onClick={() => setActiveTab('notices')}
        >
          Notice 관리
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
        ) : activeTab === 'courses' ? (
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
                      상태: {course.course_state === 'ACTIVE' ? 'Ongoing' : course.course_state === 'PROVISIONED' ? 'Preparing' : 'Finished'} | 
                      섹션: {course.section || '-'} | 
                      조직: {course.organization || '-'} | 
                      순서: {course.order} | 
                      활성: {course.is_active ? '예' : '아니오'}
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
        ) : (
          <div className="notices-section">
            <div className="section-header">
              <h2>Notice 목록</h2>
              <button
                className="add-button"
                onClick={() => {
                  setEditingNotice(null)
                  setShowNoticeForm(true)
                }}
              >
                + Notice 작성
              </button>
            </div>
            {showNoticeForm && (
              <NoticeForm
                notice={editingNotice}
                onSubmit={async (notice) => {
                  try {
                    const adminToken = localStorage.getItem('admin_token')
                    if (!adminToken) {
                      alert('관리자 토큰이 없습니다. 다시 로그인해주세요.')
                      return
                    }
                    if (editingNotice) {
                      await communityApi.updatePost(editingNotice.id, {
                        title: notice.title,
                        content: notice.content,
                        is_pinned: notice.is_pinned,
                        image_urls: notice.image_urls,
                        image_sizes: notice.image_sizes,
                      }, adminToken)
                    } else {
                      await communityApi.createPost({
                        post_type: 'notice',
                        title: notice.title,
                        content: notice.content,
                        is_pinned: notice.is_pinned,
                        image_urls: notice.image_urls,
                        image_sizes: notice.image_sizes,
                      }, adminToken)
                    }
                    setShowNoticeForm(false)
                    setEditingNotice(null)
                    loadData()
                  } catch (err: any) {
                    console.error('Error saving notice:', err)
                    alert(err.response?.data?.detail || 'Notice 저장에 실패했습니다.')
                  }
                }}
                onCancel={() => {
                  setShowNoticeForm(false)
                  setEditingNotice(null)
                }}
              />
            )}
            <div className="items-list">
              {notices.map((notice) => (
                <div key={notice.id} className="item-card">
                  <div className="item-info">
                    <h3>{notice.title}</h3>
                    <p className="item-meta">
                      작성자: {notice.author_name || notice.author_email} | 
                      조회: {notice.view_count} | 
                      댓글: {notice.comment_count} | 
                      {notice.is_pinned && ' 📌 고정'}
                    </p>
                  </div>
                  <div className="item-actions">
                    <button onClick={() => {
                      setEditingNotice(notice)
                      setShowNoticeForm(true)
                    }}>수정</button>
                    <button onClick={async () => {
                      if (!confirm('정말 삭제하시겠습니까?')) return
                      try {
                        const adminToken = localStorage.getItem('admin_token')
                        if (!adminToken) {
                          alert('관리자 토큰이 없습니다. 다시 로그인해주세요.')
                          return
                        }
                        await communityApi.deletePost(notice.id, adminToken)
                        loadData()
                      } catch (err: any) {
                        console.error('Error deleting notice:', err)
                        alert(err.response?.data?.detail || 'Notice 삭제에 실패했습니다.')
                      }
                    }}>삭제</button>
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

const MAX_NOTICE_IMAGES = 3

// Notice Form Component
type ImageSizeOption = 'full' | 'original' | 'small'

const NoticeForm: React.FC<{
  notice: Post | null
  onSubmit: (notice: { title: string; content: string; is_pinned?: boolean; image_urls?: string[]; image_sizes?: string[] }) => void
  onCancel: () => void
}> = ({ notice, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: notice?.title || '',
    content: notice?.content || '',
    is_pinned: notice?.is_pinned || false,
  })
  const [imageUrls, setImageUrls] = useState<string[]>(
    notice?.image_urls?.length ? notice.image_urls.slice(0, MAX_NOTICE_IMAGES) : notice?.image_url ? [notice.image_url] : []
  )
  const [imageSizes, setImageSizes] = useState<ImageSizeOption[]>(() => {
    const urls = notice?.image_urls?.length ? notice.image_urls.slice(0, MAX_NOTICE_IMAGES) : notice?.image_url ? [notice.image_url] : []
    return urls.map((_, i) => (notice?.image_sizes?.[i] as ImageSizeOption) || 'full')
  })
  const [uploading, setUploading] = useState(false)
  const noticeImageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (notice) {
      setFormData({
        title: notice.title,
        content: notice.content,
        is_pinned: notice.is_pinned || false,
      })
      const urls = notice.image_urls?.length ? notice.image_urls.slice(0, MAX_NOTICE_IMAGES) : notice.image_url ? [notice.image_url] : []
      setImageUrls(urls)
      setImageSizes(urls.map((_, i) => (notice.image_sizes?.[i] as ImageSizeOption) || 'full'))
    } else {
      setFormData({ title: '', content: '', is_pinned: false })
      setImageUrls([])
      setImageSizes([])
    }
  }, [notice])

  const handleNoticeImageUpload = async (file: File) => {
    if (imageUrls.length >= MAX_NOTICE_IMAGES) {
      alert(`이미지는 최대 ${MAX_NOTICE_IMAGES}장까지 첨부할 수 있습니다.`)
      return
    }
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert('이미지 크기는 5MB를 초과할 수 없습니다.')
      return
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert('PNG, JPEG, JPG, GIF, WebP 형식만 가능합니다.')
      return
    }
    const adminToken = localStorage.getItem('admin_token')
    if (!adminToken) {
      alert('관리자 토큰이 없습니다.')
      return
    }
    setUploading(true)
    try {
      const result = await communityApi.uploadImage(file, adminToken)
      setImageUrls((prev) => [...prev, result.url].slice(0, MAX_NOTICE_IMAGES))
      setImageSizes((prev) => [...prev, 'full'].slice(0, MAX_NOTICE_IMAGES))
    } catch (err: any) {
      console.error('Notice image upload error:', err)
      alert(err.response?.data?.detail || '이미지 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const removeNoticeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
    setImageSizes((prev) => prev.filter((_, i) => i !== index))
  }

  const setNoticeImageSize = (index: number, size: ImageSizeOption) => {
    setImageSizes((prev) => prev.map((s, i) => (i === index ? size : s)))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      image_urls: imageUrls.length > 0 ? imageUrls : undefined,
      image_sizes: imageUrls.length > 0 ? imageSizes : undefined,
    })
  }

  const getImageDisplayUrl = (url: string) => {
    if (url.startsWith('http')) return url
    return `${API_URL}${url}`
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <h3>{notice ? 'Notice 수정' : '새 Notice 작성'}</h3>
      <div className="form-group">
        <label>제목 *</label>
        <input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      <div className="form-group">
        <label>내용 *</label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          required
          rows={10}
        />
      </div>
      <div className="form-group">
        <label>이미지 (최대 {MAX_NOTICE_IMAGES}장)</label>
        <input
          ref={noticeImageInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleNoticeImageUpload(file)
            e.target.value = ''
          }}
        />
        {imageUrls.length < MAX_NOTICE_IMAGES && (
          <button
            type="button"
            className="admin-form-image-add"
            onClick={() => noticeImageInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? '업로드 중...' : '+ 이미지 추가'}
          </button>
        )}
        {imageUrls.length > 0 && (
          <div className="admin-form-image-list">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="admin-form-image-item">
                <img src={getImageDisplayUrl(url)} alt="" />
                <button type="button" className="admin-form-image-remove" onClick={() => removeNoticeImage(idx)} aria-label="삭제">×</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="form-group form-group-toggle">
        <span className="form-group-toggle-label">고정 게시글</span>
        <button
          type="button"
          role="switch"
          aria-checked={formData.is_pinned}
          className={`notice-pinned-toggle ${formData.is_pinned ? 'on' : 'off'}`}
          onClick={() => setFormData({ ...formData, is_pinned: !formData.is_pinned })}
        >
          <span className="notice-pinned-toggle-thumb" />
        </button>
      </div>
      <div className="form-actions">
        <button type="submit">저장</button>
        <button type="button" onClick={onCancel}>취소</button>
      </div>
    </form>
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
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (formData.image_url) {
      if (formData.image_url.startsWith('/admin/upload/image/')) {
        setPreviewUrl(`${API_URL}${formData.image_url}`)
      } else {
        setPreviewUrl(formData.image_url)
      }
    } else {
      setPreviewUrl(null)
    }
  }, [formData.image_url])

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    try {
      const result = await adminUploadApi.uploadImage(file)
      setFormData((prev) => ({ ...prev, image_url: result.url }))
    } catch (err: any) {
      console.error('Error uploading image:', err)
      const errorMessage = err.response?.data?.detail || '이미지 업로드에 실패했습니다.'
      alert(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.image_url) {
      alert('이미지를 업로드해주세요.')
      return
    }
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
        <label>이미지 *</label>
        <div className="image-upload-section">
          <ImageUploadDropzone
            onFileSelect={handleFileUpload}
            uploading={uploading}
          />
          {previewUrl && (
            <div className="image-preview">
              <img src={previewUrl} alt="Preview" />
            </div>
          )}
        </div>
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
    start_date: course?.start_date || '',
    order: course?.order || 0,
    is_active: course?.is_active ?? true,
  })
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (formData.image_url) {
      if (formData.image_url.startsWith('/admin/upload/image/')) {
        setPreviewUrl(`${API_URL}${formData.image_url}`)
      } else {
        setPreviewUrl(formData.image_url)
      }
    } else {
      setPreviewUrl(null)
    }
  }, [formData.image_url])

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    try {
      const result = await adminUploadApi.uploadImage(file)
      setFormData((prev) => ({ ...prev, image_url: result.url }))
    } catch (err: any) {
      console.error('Error uploading image:', err)
      const errorMessage = err.response?.data?.detail || '이미지 업로드에 실패했습니다.'
      alert(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...formData }
    if (payload.start_date === '') delete payload.start_date
    onSubmit(payload)
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
        <label>이미지</label>
        <div className="image-upload-section">
          <ImageUploadDropzone
            onFileSelect={handleFileUpload}
            uploading={uploading}
          />
          {previewUrl && (
            <div className="image-preview">
              <img src={previewUrl} alt="Preview" />
            </div>
          )}
        </div>
      </div>
      <div className="form-group">
        <label>링크 URL</label>
        <input
          value={formData.alternate_link || ''}
          onChange={(e) => setFormData({ ...formData, alternate_link: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>상태 *</label>
        <select
          value={formData.course_state}
          onChange={(e) => setFormData({ ...formData, course_state: e.target.value })}
          required
        >
          <option value="ACTIVE">Ongoing</option>
          <option value="PROVISIONED">Preparing</option>
          <option value="ARCHIVED">Finished</option>
        </select>
        <small style={{ color: '#685A55', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
          Ongoing: 진행 중인 클래스 | Preparing: 준비 중인 클래스 | Finished: 완료된 클래스
        </small>
      </div>
      <div className="form-group">
        <label>조직 (GFSU, GN TWN, GN USA 등)</label>
        <input
          value={formData.organization || ''}
          onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>시작 날짜</label>
        <input
          type="date"
          value={formData.start_date || ''}
          onChange={(e) => setFormData({ ...formData, start_date: e.target.value || undefined })}
        />
        <small style={{ color: '#685A55', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
          비어있으면 목록 맨 뒤에 표시됩니다
        </small>
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
