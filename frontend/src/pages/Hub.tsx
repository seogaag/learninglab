import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { driveApi } from '../services/api'
import './Hub.css'

const DEFAULT_FOLDER_ID = '0AFTJRkjnxrwNUk9PVA'
const FOLDER_MIME = 'application/vnd.google-apps.folder'

interface DriveItem {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime?: string
  webViewLink?: string
  thumbnailLink?: string
}

interface FolderData {
  folder: { id: string; name: string; parents?: string[] }
  contents: DriveItem[]
  parent_id: string | null
}

const Hub: React.FC = () => {
  const { user, token, isLoading: authLoading, login } = useAuth()
  const [folderId, setFolderId] = useState(DEFAULT_FOLDER_ID)
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([])
  const [data, setData] = useState<FolderData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const loadFolder = async (fid: string) => {
    setLoading(true)
    setError(null)
    try {
      let res
      if (token) {
        try {
          res = await driveApi.getFolderContents(fid, token)
        } catch (authErr: any) {
          const isInvalidToken = authErr.response?.status === 401 ||
            (typeof (authErr.response?.data?.detail) === 'string' && authErr.response.data.detail.toLowerCase().includes('invalid token'))
          if (isInvalidToken) {
            res = await driveApi.getSharedFolderContents(fid)
          } else {
            // 권한 없음, 서비스 미설정 등: 공유 폴더로 폴백
            try {
              res = await driveApi.getSharedFolderContents(fid)
            } catch {
              throw authErr
            }
          }
        }
      } else {
        res = await driveApi.getSharedFolderContents(fid)
      }
      setData(res)
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to load folder'
      const errStr = (typeof msg === 'string' ? msg : JSON.stringify(msg)).trim()
      setError(errStr || 'Unable to load folder. Try signing in or refreshing.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (folderId) {
      loadFolder(folderId)
    } else {
      setData(null)
      setError(null)
    }
  }, [token, folderId, user])

  const handleFolderClick = (item: DriveItem) => {
    setFolderStack((prev) => [...prev, { id: folderId, name: data?.folder?.name || 'Hub' }])
    setFolderId(item.id)
  }

  const handleBack = () => {
    if (folderStack.length === 0) return
    const prev = folderStack[folderStack.length - 1]
    setFolderStack((s) => s.slice(0, -1))
    setFolderId(prev.id)
  }

  const openInDrive = (item: DriveItem) => {
    const url = item.webViewLink || `https://drive.google.com/drive/folders/${item.id}`
    if (item.mimeType === FOLDER_MIME) {
      window.open(`https://drive.google.com/drive/folders/${item.id}`, '_blank')
    } else {
      window.open(url, '_blank')
    }
  }

  const uploadFiles = async (files: FileList | File[]) => {
    if (!token || files.length === 0) return
    setUploading(true)
    setUploadError(null)
    try {
      const fileArray = Array.from(files)
      for (const file of fileArray) {
        await driveApi.uploadFile(folderId, file, token)
      }
      await loadFolder(folderId)
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Upload failed'
      setUploadError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (token && e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (token) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  if (authLoading) {
    return (
      <div className="hub">
        <div className="hub-container">
          <div className="drive-loading">Loading...</div>
        </div>
      </div>
    )
  }

  const showLoginPrompt = !user && !token
  const folderLink = `https://drive.google.com/drive/folders/${folderId}`

  return (
    <div className="hub">
      <div className="hub-container">
        <div className="hub-header">
          <h2 className="section-title">Hub</h2>
          <a
            href={folderLink}
            target="_blank"
            rel="noopener noreferrer"
            className="drive-link-button"
          >
            Open in Google Drive →
          </a>
        </div>
        <div className="hub-image-container">
          <img src="/hub.png" alt="Collaboration Hub" className="hub-image" />
        </div>
        <div
          className={`hub-content hub-drop-zone ${isDragging ? 'hub-drop-zone-active' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {token && data && (
            <div className="hub-upload-zone">
              <input
                type="file"
                id="hub-file-input"
                multiple
                className="hub-file-input"
                onChange={(e) => e.target.files && uploadFiles(e.target.files)}
                disabled={uploading}
              />
              <label htmlFor="hub-file-input" className="hub-upload-label">
                {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
              </label>
              {uploadError && <p className="hub-upload-error">{uploadError}</p>}
            </div>
          )}
          {showLoginPrompt && !loading && !data && (
            <div className="login-prompt">
              <div className="login-prompt-content">
                <h3 className="login-prompt-title">Sign in required</h3>
                <p className="login-prompt-text">
                  Please sign in with Google to view the shared Drive folder.
                </p>
                <button className="login-prompt-button" onClick={login}>
                  Sign in with Google
                </button>
              </div>
            </div>
          )}
          {folderStack.length > 0 && (
            <div className="drive-breadcrumb">
              <button type="button" className="drive-back-btn" onClick={handleBack}>
                ← Back
              </button>
              <span className="drive-folder-name">{data?.folder?.name || 'Hub'}</span>
            </div>
          )}

          {loading && <div className="drive-loading">Loading folder contents...</div>}
          {error && (
            <div className="drive-empty" style={{ color: '#c0392b' }}>
              {error}
              {error?.includes('refresh token') && (
                <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                  Please sign out and sign in again with Google to reconnect your account.
                </p>
              )}
              <a
                href={folderLink}
                target="_blank"
                rel="noopener noreferrer"
                className="drive-link-button"
                style={{ marginTop: '1rem', display: 'inline-block' }}
              >
                Open in Google Drive →
              </a>
            </div>
          )}
          {!loading && !error && data && (
            <>
              {!data.contents?.length ? (
                <div className="drive-empty">This folder is empty.</div>
              ) : (
                <div className="drive-items-grid">
                  {data.contents.map((item) => {
                    const isFolder = item.mimeType === FOLDER_MIME
                    return (
                      <div
                        key={item.id}
                        className={`drive-item ${isFolder ? 'drive-folder' : ''}`}
                        onClick={() => (isFolder ? handleFolderClick(item) : openInDrive(item))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ')
                            isFolder ? handleFolderClick(item) : openInDrive(item)
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="drive-item-icon">
                          {isFolder ? (
                            <span style={{ fontSize: '2.5rem' }}>📁</span>
                          ) : item.thumbnailLink ? (
                            <img src={item.thumbnailLink} alt="" className="drive-item-thumb" />
                          ) : (
                            <span style={{ fontSize: '2.5rem' }}>📄</span>
                          )}
                        </div>
                        <div className="drive-item-name">{item.name}</div>
                        {item.modifiedTime && (
                          <div className="drive-item-meta">
                            {new Date(item.modifiedTime).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Hub
