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
          First-time visitor? You may see a 403 error after allowing cache. Please refresh your browser.
        </p>

        <div className="hub-image-container">
          <img src="/hub.png" alt="Hub" className="hub-image" />
        </div>

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
