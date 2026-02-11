import React from 'react'
import './Hub.css'

const DEFAULT_FOLDER_ID = '0AFTJRkjnxrwNUk9PVA'
const FOLDER_LINK = `https://drive.google.com/drive/folders/${DEFAULT_FOLDER_ID}`

const Hub: React.FC = () => {
  return (
    <div className="hub">
      <div className="hub-container">
        <div className="hub-header">
          <h2 className="section-title">Hub</h2>
          <a 
            href={FOLDER_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="drive-link-button"
          >
            Open Google Drive →
          </a>
        </div>

        <p className="hub-embed-hint">
          아래가 403으로 보이면 폴더가 비공개입니다. Google Drive에서 폴더 공유를 &quot;링크가 있는 모든 사용자&quot;로 설정하거나, 위 버튼으로 Drive에서 열어보세요.
        </p>

        <div className="hub-content">
          <div className="drive-embed-container">
            <div className="drive-iframe-container">
              <iframe
                src={`https://drive.google.com/embeddedfolderview?id=${DEFAULT_FOLDER_ID}#list`}
                style={{
                  width: '100%',
                  height: '600px',
                  border: 'none',
                  borderRadius: '8px'
                }}
                title="Google Drive"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hub
