import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터: 토큰 추가
apiClient.interceptors.request.use((config) => {
  // params에 token이 이미 있으면 덮어쓰지 않음 (관리자 토큰 등)
  if (!config.params?.token) {
    const token = localStorage.getItem('auth_token')
    if (token) {
      if (!config.params) {
        config.params = {}
      }
      config.params.token = token
    }
  }
  return config
})

export interface Course {
  id: string
  name: string
  section?: string
  descriptionHeading?: string
  description?: string
  room?: string
  ownerId?: string
  courseState?: string
  alternateLink?: string
  teacherGroupEmail?: string
  courseGroupEmail?: string
  teacherFolder?: {
    id?: string
    title?: string
    alternateLink?: string
  }
  courseMaterialSets?: any[]
  guardiansEnabled?: boolean
  calendarId?: string
  image_url?: string
  organization?: string
}

export interface Coursework {
  id: string
  title: string
  description?: string
  materials?: any[]
  state?: string
  alternateLink?: string
  creationTime?: string
  updateTime?: string
  dueDate?: {
    year?: number
    month?: number
    day?: number
  }
  dueTime?: {
    hours?: number
    minutes?: number
  }
  maxPoints?: number
  workType?: string
  associatedWithDeveloper?: boolean
  assigneeMode?: string
  individualStudentsOptions?: any
  submissionModificationMode?: string
  creatorUserId?: string
  topicId?: string
  assignment?: any
  multipleChoiceQuestion?: any
}

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start?: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end?: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  location?: string
  htmlLink?: string
  status?: string
}

export const classroomApi = {
  getCourses: async (token: string): Promise<Course[]> => {
    const response = await apiClient.get('/classroom/courses', {
      params: { token }
    })
    return response.data
  },

  getWorkspaceCourses: async (): Promise<Course[]> => {
    const response = await apiClient.get('/public/workspace-courses')
    return response.data
  },

  getCoursework: async (courseId: string, token: string): Promise<Coursework[]> => {
    const response = await apiClient.get(`/classroom/courses/${courseId}/coursework`, {
      params: { token }
    })
    return response.data
  },
}

export const calendarApi = {
  getEvents: async (token: string, maxResults: number = 10): Promise<CalendarEvent[]> => {
    const response = await apiClient.get('/calendar/events', {
      params: { token, max_results: maxResults }
    })
    return response.data
  },

  getEmbedUrl: async (token: string): Promise<{ embed_url: string; iframe_url: string }> => {
    const response = await apiClient.get('/calendar/embed-url', {
      params: { token }
    })
    return response.data
  },
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

export const publicApi = {
  getBanners: async (): Promise<Banner[]> => {
    const response = await apiClient.get('/public/banners')
    return response.data
  },
}

// Community API
export interface Post {
  id: number
  post_type: 'notice' | 'forum' | 'request'
  title: string
  content: string
  author_email: string
  author_name?: string
  is_pinned: boolean
  view_count: number
  image_url?: string
  like_count: number
  is_liked: boolean
  is_resolved: boolean
  created_at: string
  updated_at?: string
  tags: Array<{ id: number; name: string }>
  mentions: Array<{ mentioned_email: string; mentioned_name?: string }>
  comment_count: number
}

export interface Comment {
  id: number
  post_id: number
  content: string
  author_email: string
  author_name?: string
  parent_id?: number
  created_at: string
  updated_at?: string
  mentions: Array<{ mentioned_email: string; mentioned_name?: string }>
}

export interface PostListResponse {
  posts: Post[]
  total: number
  page: number
  page_size: number
}

export interface Tag {
  id: number
  name: string
  post_count: number
}

const getAuthToken = (): string => {
  return localStorage.getItem('auth_token') || ''
}

export const communityApi = {
  getPosts: async (params?: {
    post_type?: 'notice' | 'forum' | 'request'
    tag?: string
    search?: string
    page?: number
    page_size?: number
  }, adminToken?: string): Promise<PostListResponse> => {
    const token = adminToken || getAuthToken()
    const response = await apiClient.get('/community/posts', {
      params: { ...params, token: token || undefined }
    })
    return response.data
  },
  
  getPost: async (postId: number): Promise<Post> => {
    const token = getAuthToken()
    const response = await apiClient.get(`/community/posts/${postId}`, {
      params: { token }
    })
    return response.data
  },
  
  createPost: async (post: {
    post_type: 'notice' | 'forum' | 'request'
    title: string
    content: string
    tags?: string[]
    mentions?: string[]
  }, adminToken?: string): Promise<Post> => {
    // Notice인 경우 관리자 토큰 사용, 그 외에는 일반 사용자 토큰 사용
    const token = adminToken || getAuthToken()
    const response = await apiClient.post('/community/posts', post, {
      params: { token }
    })
    return response.data
  },
  
  updatePost: async (postId: number, post: {
    title?: string
    content?: string
    tags?: string[]
    mentions?: string[]
    is_pinned?: boolean
    is_resolved?: boolean
  }, adminToken?: string): Promise<Post> => {
    const token = adminToken || getAuthToken()
    const response = await apiClient.put(`/community/posts/${postId}`, post, {
      params: { token }
    })
    return response.data
  },
  
  deletePost: async (postId: number, adminToken?: string): Promise<void> => {
    const token = adminToken || getAuthToken()
    await apiClient.delete(`/community/posts/${postId}`, {
      params: { token }
    })
  },
  
  getComments: async (postId: number): Promise<Comment[]> => {
    const response = await apiClient.get(`/community/posts/${postId}/comments`)
    return response.data
  },
  
  createComment: async (postId: number, comment: {
    content: string
    parent_id?: number
    mentions?: string[]
  }): Promise<Comment> => {
    const token = getAuthToken()
    const response = await apiClient.post(`/community/posts/${postId}/comments`, comment, {
      params: { token }
    })
    return response.data
  },
  
  getTags: async (): Promise<Tag[]> => {
    const response = await apiClient.get('/community/tags')
    return response.data
  },
  
  getPopularPosts: async (limit: number = 5): Promise<Post[]> => {
    const token = getAuthToken()
    const response = await apiClient.get('/community/popular-posts', {
      params: { limit, token }
    })
    return response.data
  },
  
  toggleLike: async (postId: number): Promise<{ liked: boolean; like_count: number }> => {
    const token = getAuthToken()
    const response = await apiClient.post(`/community/posts/${postId}/like`, {}, {
      params: { token }
    })
    return response.data
  },
  
  getUsers: async (search?: string, limit: number = 20): Promise<Array<{ email: string; name: string; picture?: string }>> => {
    const token = getAuthToken()
    const response = await apiClient.get('/community/users', {
      params: { search, limit, token: token || undefined }
    })
    return response.data
  },
  
  getMentionedPosts: async (page: number = 1, pageSize: number = 20): Promise<PostListResponse> => {
    const token = getAuthToken()
    if (!token) {
      throw new Error('Authentication required')
    }
    const response = await apiClient.get('/community/mentioned-posts', {
      params: { token, page, page_size: pageSize }
    })
    return response.data
  },
}

export const driveApi = {
  getFolderContents: async (folderId: string, token: string): Promise<{
    folder: any
    contents: any[]
    parent_id: string | null
  }> => {
    const response = await apiClient.get(`/drive/folders/${folderId}/contents`, {
      params: { token }
    })
    return response.data
  },
}
