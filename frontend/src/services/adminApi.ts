import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface AdminLoginRequest {
  username: string
  password: string
}

export interface AdminToken {
  access_token: string
  token_type: string
}

export interface Admin {
  id: number
  username: string
  email?: string
  name?: string
  is_active: boolean
}

export interface Banner {
  id: number
  title: string
  subtitle?: string
  image_url: string
  link_url?: string
  order: number
  is_active: boolean
}

export interface WorkspaceCourse {
  id: number
  name: string
  description?: string
  section?: string
  image_url?: string
  alternate_link?: string
  course_state: string
  organization?: string
  order: number
  is_active: boolean
}

// Axios 인스턴스 생성
const adminApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터: 관리자 토큰 자동 추가
adminApi.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('admin_token')
  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`
  }
  return config
})

export const adminAuthApi = {
  login: async (credentials: AdminLoginRequest): Promise<AdminToken> => {
    const response = await axios.post(`${API_URL}/admin/login`, credentials)
    return response.data
  },
  
  getMe: async (): Promise<Admin> => {
    const response = await adminApi.get('/admin/me')
    return response.data
  },
}

export const adminBannerApi = {
  getAll: async (): Promise<Banner[]> => {
    const response = await adminApi.get('/admin/banners')
    return response.data
  },
  
  create: async (banner: Omit<Banner, 'id'>): Promise<Banner> => {
    const response = await adminApi.post('/admin/banners', banner)
    return response.data
  },
  
  update: async (id: number, banner: Partial<Banner>): Promise<Banner> => {
    const response = await adminApi.put(`/admin/banners/${id}`, banner)
    return response.data
  },
  
  delete: async (id: number): Promise<void> => {
    await adminApi.delete(`/admin/banners/${id}`)
  },
}

export const adminCourseApi = {
  getAll: async (): Promise<WorkspaceCourse[]> => {
    const response = await adminApi.get('/admin/courses')
    return response.data
  },
  
  create: async (course: Omit<WorkspaceCourse, 'id'>): Promise<WorkspaceCourse> => {
    const response = await adminApi.post('/admin/courses', course)
    return response.data
  },
  
  update: async (id: number, course: Partial<WorkspaceCourse>): Promise<WorkspaceCourse> => {
    const response = await adminApi.put(`/admin/courses/${id}`, course)
    return response.data
  },
  
  delete: async (id: number): Promise<void> => {
    await adminApi.delete(`/admin/courses/${id}`)
  },
}

// 공개 API (배너 및 워크스페이스 클래스)
export const publicApi = {
  getBanners: async (): Promise<Banner[]> => {
    const response = await axios.get(`${API_URL}/public/banners`)
    return response.data
  },
  
  getWorkspaceCourses: async (): Promise<WorkspaceCourse[]> => {
    const response = await axios.get(`${API_URL}/public/workspace-courses`)
    return response.data
  },
}
