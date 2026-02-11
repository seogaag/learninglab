import React, { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const hideTopRightWave = location.pathname === '/learning' || location.pathname === '/hub'

  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        <div className="page-waves" aria-hidden="true">
          <svg className="wave wave-bottom" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="#89A230" d="M0,160L60,170.7C120,181,240,203,360,186.7C480,171,600,117,720,112C840,107,960,149,1080,165.3C1200,181,1320,171,1380,165.3L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" />
          </svg>
          {!hideTopRightWave && (
            <svg className="wave wave-top-right" viewBox="0 0 400 300" preserveAspectRatio="none">
              <path fill="#89A230" d="M400,0V150C350,120,280,80,200,80C120,80,50,120,0,150V0H400Z" />
            </svg>
          )}
        </div>
        <div className="main-content-inner">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Layout
