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
  const token = localStorage.getItem('auth_token')
  if (token && config.params) {
    config.params.token = token
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
