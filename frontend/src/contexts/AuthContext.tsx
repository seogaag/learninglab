import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'
import { getApiBase } from '../utils/apiBase'

interface User {
  id: number
  email: string
  name: string
  picture?: string
  google_id: string
  is_active: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: () => void
  logout: () => void
  setToken: (token: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 로컬 스토리지에서 토큰 불러오기
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      setTokenState(storedToken)
      fetchUser(storedToken)
    } else {
      setIsLoading(false)
    }
  }, [])

  // URL에서 토큰 확인 (OAuth 콜백) - 토큰 제거는 AuthCallback에서 navigate 시 처리
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tokenFromUrl = urlParams.get('token')
    if (tokenFromUrl) {
      setToken(tokenFromUrl)
    }
  }, [])

  const fetchUser = async (authToken: string) => {
    setIsLoading(true)
    const apiBase = getApiBase()
    try {
      const response = await axios.get(`${apiBase}/auth/me`, {
        params: { token: authToken }
      })
      setUser(response.data)
      // 사용자 이메일을 로컬 스토리지에 저장 (로그아웃 후 재로그인 시 refresh_token 확인용)
      if (response.data?.email) {
        localStorage.setItem('user_email', response.data.email)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      setUser(null)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_email')
      setTokenState(null)
    } finally {
      setIsLoading(false)
    }
  }

  const setToken = (newToken: string) => {
    setTokenState(newToken)
    localStorage.setItem('auth_token', newToken)
    fetchUser(newToken)
  }

  const login = () => {
    const apiBase = getApiBase()
    const email = user?.email || localStorage.getItem('user_email')
    const loginUrl = email
      ? `${apiBase}/auth/login?email=${encodeURIComponent(email)}`
      : `${apiBase}/auth/login`
    window.location.href = loginUrl
  }

  const logout = () => {
    setUser(null)
    setTokenState(null)
    localStorage.removeItem('auth_token')
    // user_email은 유지 (재로그인 시 refresh_token 확인용)
    // 로그아웃 후에도 이메일을 유지하여 재로그인 시 권한 요청을 피할 수 있음
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, setToken }}>
      {children}
    </AuthContext.Provider>
  )
}
