import React from 'react'
import './Hub.css'

const DEFAULT_FOLDER_ID = '0AFTJRkjnxrwNUk9PVA'

const Hub: React.FC = () => {

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
