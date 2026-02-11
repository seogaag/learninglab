import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const AuthCallback: React.FC = () => {
  const navigate = useNavigate()
  const { setToken, isLoading } = useAuth()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    
    if (token) {
      setToken(token)
      navigate('/')
    } else {
      navigate('/')
    }
  }, [setToken, navigate])

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
