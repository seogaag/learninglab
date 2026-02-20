import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const AuthCallback: React.FC = () => {
  const navigate = useNavigate()
  const { setToken, user, isLoading } = useAuth()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    
    if (token) {
      setToken(token)
    } else {
      navigate('/')
    }
  }, [setToken, navigate])

  // token이 있을 때: fetch 완료(isLoading false) 후 홈으로 이동
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token')
    if (!token) return
    if (isLoading) return
    navigate('/', { replace: true })
  }, [user, isLoading, navigate])

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div>Processing login...</div>
      </div>
    )
  }

  return null
}

export default AuthCallback
