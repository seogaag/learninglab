import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './Hub.css'

const Hub: React.FC = () => {
  const { user, token, login } = useAuth()
  const [folderId, setFolderId] = useState<string>('')
  const [embedUrl, setEmbedUrl] = useState<string>('')

  const handleEmbed = () => {
    if (folderId.trim()) {
      // Google Drive 폴더 임베드 URL 생성
      const url = `https://drive.google.com/embeddedfolderview?id=${folderId.trim()}#list`
      setEmbedUrl(url)
    }
  }

  return (
    <div className="hub">
      <div className="hub-container">
        <div className="hub-header">
          <h2 className="section-title">Hub</h2>
          <a 
            href="https://drive.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="drive-link-button"
          >
            Open Google Drive →
          </a>
        </div>

        <div className="hub-content">
          {!token || !user ? (
            <div className="login-prompt">
              <div className="login-prompt-content">
                <h3 className="login-prompt-title">로그인이 필요합니다</h3>
                <p className="login-prompt-text">
                  Google Drive를 보려면 Google 계정으로 로그인해주세요.
                </p>
                <button 
                  className="login-prompt-button"
                  onClick={login}
                >
                  Sign in with Google
                </button>
              </div>
            </div>
          ) : (
            <div className="drive-embed-container">
              <div className="drive-setup">
                <h3 className="drive-setup-title">Google Drive 폴더 임베드</h3>
                <p className="drive-setup-text">
                  Google Drive 폴더를 임베드하려면 폴더 ID가 필요합니다.
                  <br />
                  <strong>폴더 ID 찾는 방법:</strong>
                  <br />
                  1. Google Drive에서 폴더를 열고 공유 설정을 "링크가 있는 모든 사용자"로 변경
                  <br />
                  2. 폴더 URL에서 <code>folders/</code> 뒤의 ID를 복사
                  <br />
                  예: <code>https://drive.google.com/drive/folders/1ABC123xyz...</code>
                </p>
                <div className="drive-input-group">
                  <input
                    type="text"
                    placeholder="폴더 ID를 입력하세요"
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value)}
                    className="drive-input"
                  />
                  <button 
                    onClick={handleEmbed}
                    className="drive-embed-btn"
                    disabled={!folderId.trim()}
                  >
                    임베드
                  </button>
                </div>
              </div>

              {embedUrl ? (
                <div className="drive-iframe-container">
                  <iframe
                    src={embedUrl}
                    style={{
                      width: '100%',
                      height: '600px',
                      border: 'none',
                      borderRadius: '8px'
                    }}
                    title="Google Drive"
                  />
                </div>
              ) : (
                <div className="drive-placeholder">
                  <p>위에서 폴더 ID를 입력하고 임베드 버튼을 클릭하세요.</p>
                  <p style={{ fontSize: '0.9rem', color: '#685A55', marginTop: '1rem' }}>
                    또는 아래 버튼을 클릭하여 새 창에서 Google Drive를 열 수 있습니다.
                  </p>
                  <a 
                    href="https://drive.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="drive-link-button"
                    style={{ marginTop: '1rem', display: 'inline-block' }}
                  >
                    Google Drive 열기
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Hub
