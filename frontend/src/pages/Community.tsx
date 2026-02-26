import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { communityApi, Post, Comment, Tag } from '../services/api'
import { getApiBase } from '../utils/apiBase'
import './Community.css'

const MAX_IMAGES = 3

type BoardType = 'notice' | 'forum' | 'request' | 'all'

export type ImageSizeOption = 'full' | 'original' | 'small'
type ImageItem = { serverUrl: string; id?: string; size?: ImageSizeOption }

/** Parse URL that may be JSON array string (backend legacy) */
function parseImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return ''
  const s = url.trim()
  if (s.startsWith('[')) {
    try {
      const arr = JSON.parse(s)
      if (Array.isArray(arr) && arr[0]) return String(arr[0])
    } catch {
      /* ignore */
    }
  }
  return s
}

/** Convert post image URL to absolute src for <img> */
function getPostImageSrc(url: string): string {
  const raw = parseImageUrl(url)
  if (!raw) return ''
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  if (raw.startsWith('/admin/upload/image/') || raw.startsWith('/community/image/')) {
    const lastSlash = raw.lastIndexOf('/')
    const filename = raw.slice(lastSlash + 1)
    const encodedFilename = encodeURIComponent(filename)
    const apiBase = getApiBase().replace(/\/$/, '')
    if (raw.startsWith('/community/')) {
      const path = `/community/image/${encodedFilename}`
      const full = `${apiBase}${path}`
      if (typeof window !== 'undefined' && full.startsWith('/')) {
        return window.location.origin + full
      }
      return full
    }
    const pathBefore = raw.slice(0, lastSlash + 1)
    const path = `${pathBefore}${encodedFilename}`
    const fullPath = `${apiBase}${path}`
    if (typeof window !== 'undefined' && fullPath.startsWith('/')) {
      return window.location.origin + fullPath
    }
    return fullPath
  }
  return raw
}

/** Notice(Global Partnership Center) 클릭 시 복사할 이메일 */
const NOTICE_COPY_EMAIL = 'communications@goodneighbors.org'
function getEmailToCopy(post: { post_type?: string; author_name?: string; author_email: string }): string {
  if (post.post_type === 'notice' || post.author_name === 'Global Partnership Center') {
    return NOTICE_COPY_EMAIL
  }
  return post.author_email
}

const Community: React.FC = () => {
  const { user, token, login } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeBoard, setActiveBoard] = useState<BoardType>('all')
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showPostForm, setShowPostForm] = useState(false)
  const [, setShowCommentForm] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [popularPosts, setPopularPosts] = useState<Post[]>([])
  const [mentionedPosts, setMentionedPosts] = useState<Post[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const [imageLightboxUrl, setImageLightboxUrl] = useState<string | null>(null)
  const pageSize = 20

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setImageLightboxUrl(null)
    }
    if (imageLightboxUrl) {
      document.addEventListener('keydown', onKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [imageLightboxUrl])

  // URL 파라미터에서 게시글 ID, board(카테고리) 읽기
  useEffect(() => {
    const postId = searchParams.get('post')
    const board = searchParams.get('board') as BoardType | null
    if (board === 'notice' || board === 'forum' || board === 'request') {
      setActiveBoard(board)
      setSelectedPost(null)
      setShowMentions(false)
      setPage(1)
      setSelectedTag(null)
    }
    if (postId) {
      const id = parseInt(postId, 10)
      if (!isNaN(id) && (!selectedPost || selectedPost.id !== id)) {
        loadPostById(id)
      }
    } else if (selectedPost) {
      // URL에 post 파라미터가 없으면 게시글 선택 해제
      setSelectedPost(null)
      setComments([])
      setShowCommentForm(false)
    }
  }, [searchParams])

  useEffect(() => {
    // selectedPost가 없을 때만 게시글 목록 로드
    if (!selectedPost) {
      if (showMentions) {
        // Mentions 페이지일 때는 기존 데이터 초기화 후 새로 로드
        setMentionedPosts([])
        loadMentionedPosts(true)
      } else {
        loadPosts()
        loadTags()
        loadPopularPosts()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBoard, searchQuery, selectedTag, page, showMentions])

  // 멘션된 글 미리 로드 (알림 표시용, showMentions가 false일 때만)
  useEffect(() => {
    if (!selectedPost && !showMentions && token) {
      loadMentionedPosts(false)
    }
  }, [token])

  useEffect(() => {
    if (selectedPost) {
      loadComments(selectedPost.id)
    }
  }, [selectedPost])

  // SNS 임베드 스크립트 로드
  useEffect(() => {
    // Instagram 스크립트
    if (!document.getElementById('instagram-embed-script')) {
      const instagramScript = document.createElement('script')
      instagramScript.id = 'instagram-embed-script'
      instagramScript.src = 'https://www.instagram.com/embed.js'
      instagramScript.async = true
      document.body.appendChild(instagramScript)
    }

    // Twitter 스크립트
    if (!document.getElementById('twitter-embed-script')) {
      const twitterScript = document.createElement('script')
      twitterScript.id = 'twitter-embed-script'
      twitterScript.src = 'https://platform.twitter.com/widgets.js'
      twitterScript.async = true
      twitterScript.charset = 'utf-8'
      document.body.appendChild(twitterScript)
    }

    // Threads 스크립트
    if (!document.getElementById('threads-embed-script')) {
      const threadsScript = document.createElement('script')
      threadsScript.id = 'threads-embed-script'
      threadsScript.src = 'https://www.threads.net/embed.js'
      threadsScript.async = true
      document.body.appendChild(threadsScript)
    }

    // 위젯 재로드 (약간의 지연 후)
    const timer = setTimeout(() => {
      if ((window as any).instgrm) {
        (window as any).instgrm.Embeds.process()
      }
      if ((window as any).twttr) {
        (window as any).twttr.widgets.load()
      }
      if ((window as any).ThreadsEmbed) {
        (window as any).ThreadsEmbed.load()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [selectedPost])

  const loadPosts = async () => {
    setLoading(true)
    try {
      const params: any = {
        page,
        page_size: pageSize
      }
      
      if (activeBoard !== 'all') {
        params.post_type = activeBoard
      }
      
      if (searchQuery) {
        params.search = searchQuery
      }
      
      if (selectedTag) {
        params.tag = selectedTag
      }
      
      const response = await communityApi.getPosts(params)
      setPosts(response.posts)
      setTotal(response.total)
    } catch (err) {
      console.error('Error loading posts:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadTags = async () => {
    try {
      const data = await communityApi.getTags()
      setTags(data)
    } catch (err) {
      console.error('Error loading tags:', err)
    }
  }

  const loadPopularPosts = async () => {
    try {
      const data = await communityApi.getPopularPosts(3)
      setPopularPosts(data)
    } catch (err) {
      console.error('Error loading popular posts:', err)
    }
  }

  const loadMentionedPosts = async (showLoading: boolean = false) => {
    if (!token) return
    
    // 중복 호출 방지
    if (loading && showLoading) return
    
    try {
      if (showLoading) {
        setLoading(true)
      }
      const response = await communityApi.getMentionedPosts(page, pageSize)
      
      // Map을 사용하여 중복 완전 제거 (id 기준) - 더 확실한 방법
      const postsMap = new Map<number, Post>()
      response.posts.forEach(post => {
        // 같은 ID가 이미 있으면 무시 (첫 번째 것만 유지)
        if (!postsMap.has(post.id)) {
          postsMap.set(post.id, post)
        }
      })
      const uniquePosts = Array.from(postsMap.values())
      
      // Mentions 페이지에서는 항상 새 데이터로 교체 (중복 방지)
      setMentionedPosts(uniquePosts)
      setTotal(response.total || uniquePosts.length)
    } catch (err) {
      console.error('Error loading mentioned posts:', err)
      setMentionedPosts([])
      setTotal(0)
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  const loadComments = async (postId: number) => {
    try {
      const data = await communityApi.getComments(postId)
      setComments(data)
    } catch (err) {
      console.error('Error loading comments:', err)
    }
  }

  const loadPostById = async (postId: number) => {
    try {
      const detailedPost = await communityApi.getPost(postId)
      setSelectedPost(detailedPost)
      setShowCommentForm(true)
      // 목록의 게시글도 업데이트
      setPosts(posts.map(p => p.id === postId ? detailedPost : p))
      // 인기글도 업데이트
      setPopularPosts(popularPosts.map(p => p.id === postId ? detailedPost : p))
      await loadComments(postId)
    } catch (err) {
      console.error('Error loading post details:', err)
      // 에러 발생 시 URL 파라미터 제거
      setSearchParams({})
    }
  }

  const handlePostClick = async (post: Post) => {
    try {
      // URL 파라미터 업데이트
      setSearchParams({ post: post.id.toString() })
      // 게시글 상세를 불러와서 조회수 증가
      const detailedPost = await communityApi.getPost(post.id)
      setSelectedPost(detailedPost)
      setShowCommentForm(true)
      // 목록의 게시글도 업데이트
      setPosts(posts.map(p => p.id === post.id ? detailedPost : p))
      // 인기글도 업데이트
      setPopularPosts(popularPosts.map(p => p.id === post.id ? detailedPost : p))
      await loadComments(post.id)
    } catch (err) {
      console.error('Error loading post details:', err)
      // 에러가 발생해도 기존 게시글 정보로 표시
      setSelectedPost(post)
      setShowCommentForm(true)
    }
  }

  const handleBackToList = () => {
    setSelectedPost(null)
    setComments([])
    setShowCommentForm(false)
    // URL 파라미터 제거
    setSearchParams({})
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderContent = (content: string) => {
    // XSS 방지: HTML 이스케이프 함수
    const escapeHtml = (text: string) => {
      const div = document.createElement('div')
      div.textContent = text
      return div.innerHTML
    }
    
    // URL 패턴을 플레이스홀더로 먼저 교체 (임베드 처리)
    const placeholders: { [key: string]: string } = {}
    let placeholderIndex = 0
    
    // YouTube (youtube.com/watch?v=VIDEO_ID 또는 youtu.be/VIDEO_ID)
    content = content.replace(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)(?:\S*)?/g,
      (_match, videoId) => {
        const placeholder = `__EMBED_PLACEHOLDER_${placeholderIndex}__`
        placeholders[placeholder] = `<div class="embed-container youtube-embed"><iframe width="100%" height="400" src="https://www.youtube.com/embed/${escapeHtml(videoId)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
        placeholderIndex++
        return placeholder
      }
    )
    
    // Instagram (p, reel, tv 모두 지원)
    content = content.replace(
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(p|reel|tv)\/([a-zA-Z0-9_-]+)(?:\S*)?/g,
      (_match, type, postId) => {
        const placeholder = `__EMBED_PLACEHOLDER_${placeholderIndex}__`
        const permalink = `https://www.instagram.com/${escapeHtml(type)}/${escapeHtml(postId)}/`
        placeholders[placeholder] = `<div class="embed-container instagram-embed"><blockquote class="instagram-media" data-instgrm-permalink="${escapeHtml(permalink)}" data-instgrm-version="14"></blockquote></div>`
        placeholderIndex++
        return placeholder
      }
    )
    
    // X (Twitter) - twitter.com과 x.com 모두 지원
    content = content.replace(
      /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)(?:\S*)?/g,
      (_match, username, tweetId) => {
        const placeholder = `__EMBED_PLACEHOLDER_${placeholderIndex}__`
        placeholders[placeholder] = `<div class="embed-container twitter-embed"><blockquote class="twitter-tweet" data-theme="light"><a href="https://twitter.com/${escapeHtml(username)}/status/${escapeHtml(tweetId)}"></a></blockquote></div>`
        placeholderIndex++
        return placeholder
      }
    )
    
    // Threads
    content = content.replace(
      /(?:https?:\/\/)?(?:www\.)?threads\.net\/@(\w+)\/post\/([a-zA-Z0-9_-]+)(?:\S*)?/g,
      (_match, username, postId) => {
        const placeholder = `__EMBED_PLACEHOLDER_${placeholderIndex}__`
        const permalink = `https://www.threads.net/@${escapeHtml(username)}/post/${escapeHtml(postId)}`
        placeholders[placeholder] = `<div class="embed-container threads-embed"><blockquote class="threads-embed" data-threads-permalink="${escapeHtml(permalink)}" data-threads-version="1"></blockquote></div>`
        placeholderIndex++
        return placeholder
      }
    )
    
    // 일반 URL은 링크로 변환 (이미 임베드되지 않은 경우)
    content = content.replace(
      /(https?:\/\/[^\s<>"']+)/g,
      (url) => {
        // 이미 플레이스홀더로 교체된 경우 스킵
        if (url.startsWith('__EMBED_PLACEHOLDER_')) {
          return url
        }
        const placeholder = `__EMBED_PLACEHOLDER_${placeholderIndex}__`
        placeholders[placeholder] = `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`
        placeholderIndex++
        return placeholder
      }
    )
    
    // 나머지 텍스트를 HTML 이스케이프
    let rendered = escapeHtml(content)
    
    // 플레이스홀더를 원래 임베드로 교체
    for (const [placeholder, embed] of Object.entries(placeholders)) {
      rendered = rendered.replace(placeholder, embed)
    }
    
    // @mention과 #tag 하이라이트 (이미 이스케이프된 텍스트에서 처리)
    rendered = rendered.replace(/@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<span class="mention">@$1</span>')
    rendered = rendered.replace(/#(\w+)/g, '<span class="tag-inline">#$1</span>')
    return { __html: rendered }
  }

  if (!token || !user) {
    return (
      <div className="community">
        <div className="login-prompt">
          <div className="login-prompt-content">
            <h3 className="login-prompt-title">Login Required</h3>
            <p className="login-prompt-text">
              Please sign in with your Google account to access the community.
            </p>
            <button className="login-prompt-button" onClick={login}>
              Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="community">
      <div className="community-container">
        <div className="community-header">
          <h2 className="section-title">Community</h2>
          <div className="community-actions">
            {token && (() => {
              // Requests 카테고리 해결되지 않은 글만 카운트
              const unresolvedRequests = mentionedPosts.filter(
                p => p.post_type === 'request' && !p.is_resolved
              )
              const totalUnresolved = unresolvedRequests.length
              const totalMentions = mentionedPosts.length
              return !showMentions && (
                <button
                  className={`mentions-notification-btn ${totalUnresolved > 0 ? 'has-unresolved' : 'no-unresolved'}`}
                  onClick={() => {
                    setShowMentions(true)
                    setSelectedPost(null)
                    setSearchParams({})
                    setPage(1)
                    setSelectedTag(null)
                  }}
                  title={totalUnresolved > 0 
                    ? `You have ${totalUnresolved} unresolved request${totalUnresolved > 1 ? 's' : ''}`
                    : totalMentions > 0 
                    ? `You have ${totalMentions} mention${totalMentions > 1 ? 's' : ''}`
                    : 'No mentions'
                  }
                >
                  🔔 Mentions
                </button>
              )
            })()}
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSelectedPost(null)
                setSearchParams({})
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="search-input"
            />
            {activeBoard !== 'notice' && (
              <button
                className="new-post-btn"
                onClick={() => {
                  setSelectedPost(null)
                  setSearchParams({})
                  setShowPostForm(true)
                }}
              >
                + New Post
              </button>
            )}
          </div>
        </div>

        <div className="community-content">
          <div className="community-sidebar">
            <div className="board-tabs-box">
              <div className="board-tabs">
                <button
                  className={`board-tab ${activeBoard === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedPost(null)
                    setSearchParams({})
                    setShowMentions(false)
                    setActiveBoard('all')
                    setPage(1)
                    setSelectedTag(null)
                  }}
                >
                  All
                </button>
                <button
                  className={`board-tab ${activeBoard === 'notice' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedPost(null)
                    setSearchParams({})
                    setShowMentions(false)
                    setActiveBoard('notice')
                    setPage(1)
                    setSelectedTag(null)
                  }}
                >
                  Notice
                </button>
                <button
                  className={`board-tab ${activeBoard === 'forum' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedPost(null)
                    setSearchParams({})
                    setShowMentions(false)
                    setActiveBoard('forum')
                    setPage(1)
                    setSelectedTag(null)
                  }}
                >
                  Forum
                </button>
                <button
                  className={`board-tab ${activeBoard === 'request' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedPost(null)
                    setSearchParams({})
                    setShowMentions(false)
                    setActiveBoard('request')
                    setPage(1)
                    setSelectedTag(null)
                  }}
                >
                  Requests
                </button>
              </div>
            </div>

            {tags.length > 0 && (
              <div className="tags-section-box">
                <div className="tags-section">
                  <h3 className="tags-title">Popular Tags</h3>
                  <div className="tags-list">
                    {tags.slice(0, 10).map((tag) => (
                      <button
                        key={tag.id}
                        className={`tag-item ${selectedTag === tag.name ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedPost(null)
                          setSearchParams({})
                          setSelectedTag(selectedTag === tag.name ? null : tag.name)
                          setPage(1)
                        }}
                      >
                        #{tag.name} ({tag.post_count})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="community-main">
            {!selectedPost && showMentions && (
              <div className="mentions-section">
                <button
                  className="back-to-list-btn"
                  onClick={() => {
                    setShowMentions(false)
                    setPage(1)
                  }}
                >
                  ← Back to List
                </button>
                <div className="mentions-header">
                  <h2 className="section-title">📢 Mentions</h2>
                </div>
                {loading ? (
                  <div className="loading">Loading...</div>
                ) : mentionedPosts.length === 0 ? (
                  <div className="no-posts">No mentions found.</div>
                ) : (
                  <div className="posts-list">
                    {(() => {
                      // 렌더링 시점에서도 중복 제거 (최종 안전장치)
                      const postsMap = new Map<number, Post>()
                      mentionedPosts.forEach(post => {
                        if (!postsMap.has(post.id)) {
                          postsMap.set(post.id, post)
                        }
                      })
                      return Array.from(postsMap.values())
                    })().map((post) => (
                      <div
                        key={post.id}
                        className={`post-card ${post.post_type === 'notice' ? 'notice-post' : ''} ${post.post_type === 'notice' && post.is_pinned ? 'notice-pinned' : ''} ${post.post_type === 'request' && post.is_resolved ? 'request-resolved' : ''}`}
                        onClick={() => handlePostClick(post)}
                      >
                        <div className="post-card-header">
                          <div className="post-card-header-left">
                            <span className="post-type-badge">{post.post_type.toUpperCase()}</span>
                            {post.is_pinned && <span className="pinned-badge">📌</span>}
                            <h3 className="post-card-title">{post.title}</h3>
                          </div>
                          {post.post_type === 'request' && post.is_resolved && (
                            <span className="resolved-badge">✓ Resolved</span>
                          )}
                        </div>
                        <div className="post-card-meta">
                          <span>{post.author_name || post.author_email}</span>
                          <span>•</span>
                          <span>{formatDate(post.created_at)}</span>
                          <span>•</span>
                          <span>Views {post.view_count}</span>
                        </div>
                        {post.tags.length > 0 && (
                          <div className="post-card-tags">
                            {post.tags.map((tag) => (
                              <span key={tag.id} className="tag-badge">#{tag.name}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {!selectedPost && !showMentions && activeBoard === 'forum' && popularPosts.length > 0 && (
              <div className="popular-posts-section-main">
                <h2 className="section-title">Popular Posts</h2>
                <div className="popular-posts-grid">
                  {popularPosts.map((post) => (
                    <div
                      key={post.id}
                      className="popular-post-card"
                      onClick={() => handlePostClick(post)}
                    >
                      <div className="popular-post-card-header">
                        <span className="popular-post-type">{post.post_type.toUpperCase()}</span>
                        {post.is_pinned && <span className="popular-post-pinned">📌</span>}
                      </div>
                      <h3 className="popular-post-card-title">{post.title}</h3>
                      <div className="popular-post-card-meta">
                        <span>❤️ {post.like_count || 0}</span>
                        <span>•</span>
                        <span>Views {post.view_count || 0}</span>
                        <span>•</span>
                        <span>Comments {post.comment_count || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedPost ? (
              <div className="post-detail">
                <button className="back-button" onClick={handleBackToList}>
                  ← Back to List
                </button>
                <div className="post-header">
                  <div className="post-meta">
                    <div className="post-meta-left">
                      <span className="post-type-badge">{selectedPost.post_type.toUpperCase()}</span>
                      {selectedPost.is_pinned && <span className="pinned-badge">📌 Pinned</span>}
                    </div>
                    {selectedPost.post_type === 'request' && selectedPost.is_resolved && (
                      <span className="resolved-badge">✓ Resolved</span>
                    )}
                  </div>
                  <h2 className="post-title">{selectedPost.title}</h2>
                  <div className="post-info">
                    <span 
                      className="author-name-clickable"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(getEmailToCopy(selectedPost))
                        const toast = document.createElement('div')
                        toast.textContent = 'Mail Address Copied!'
                        toast.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #89A230; color: white; padding: 8px 16px; border-radius: 4px; z-index: 10000; font-weight: 400; font-size: 0.875rem; box-shadow: 0 2px 8px rgba(0,0,0,0.15); animation: fadeInOut 2s;'
                        document.body.appendChild(toast)
                        setTimeout(() => {
                          toast.style.animation = 'fadeOut 0.3s'
                          setTimeout(() => document.body.removeChild(toast), 300)
                        }, 1700)
                      }}
                      title="Click to copy email"
                    >
                      {selectedPost.author_name || selectedPost.author_email}
                    </span>
                    <span>•</span>
                    <span>{formatDate(selectedPost.created_at)}</span>
                    <span>•</span>
                    <span>Views {selectedPost.view_count}</span>
                  </div>
                  {selectedPost.tags.length > 0 && (
                    <div className="post-tags">
                      {selectedPost.tags.map((tag) => (
                        <span key={tag.id} className="tag-badge">#{tag.name}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div
                  className="post-content"
                  dangerouslySetInnerHTML={renderContent(selectedPost.content)}
                />
                {((selectedPost.image_urls && selectedPost.image_urls.length > 0) || selectedPost.image_url) && (
                  <div className="post-images-container">
                    {(selectedPost.image_urls || (selectedPost.image_url ? [selectedPost.image_url] : [])).slice(0, MAX_IMAGES).map((url, idx) => {
                      const src = getPostImageSrc(url)
                      const size = selectedPost.image_sizes?.[idx] || 'full'
                      return (
                        <div key={idx} className={`post-image-container post-image-clickable post-image--${size}`}>
                          <img
                            src={src}
                            alt={`Post attachment ${idx + 1}`}
                            className={`post-image post-image--${size}`}
                            onClick={(e) => { e.stopPropagation(); setImageLightboxUrl(src) }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter') setImageLightboxUrl(src) }}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
                <div className="post-actions">
                  <button
                    className={`like-btn ${selectedPost.is_liked ? 'liked' : ''}`}
                    onClick={async () => {
                      if (!token) {
                        alert('Login required.')
                        return
                      }
                      try {
                        const result = await communityApi.toggleLike(selectedPost.id)
                        setSelectedPost({
                          ...selectedPost,
                          is_liked: result.liked,
                          like_count: result.like_count
                        })
                        // 목록의 게시글도 업데이트
                        setPosts(posts.map(p => 
                          p.id === selectedPost.id 
                            ? { ...p, is_liked: result.liked, like_count: result.like_count }
                            : p
                        ))
                      } catch (err: any) {
                        console.error('Error toggling like:', err)
                        alert('Failed to process like.')
                      }
                    }}
                  >
                    {selectedPost.is_liked ? '❤️' : '🤍'} {selectedPost.like_count || 0}
                  </button>
                  {user && user.email === selectedPost.author_email && (
                    <div className="post-edit-actions">
                      {selectedPost.post_type === 'request' && (
                        <button
                          className={`resolve-btn ${selectedPost.is_resolved ? 'resolved' : ''}`}
                          onClick={async () => {
                            try {
                              const updatedPost = await communityApi.updatePost(selectedPost.id, {
                                is_resolved: !selectedPost.is_resolved
                              })
                              setSelectedPost(updatedPost)
                              // 목록의 게시글도 업데이트
                              setPosts(posts.map(p => 
                                p.id === selectedPost.id 
                                  ? { ...p, is_resolved: updatedPost.is_resolved }
                                  : p
                              ))
                            } catch (err: any) {
                              console.error('Error updating resolved status:', err)
                              alert('Failed to update resolved status.')
                            }
                          }}
                        >
                          {selectedPost.is_resolved ? '✓ Resolved' : 'Mark as Resolved'}
                        </button>
                      )}
                      <button
                        className="edit-btn"
                        onClick={() => {
                          setEditingPost(selectedPost)
                          setSelectedPost(null)
                          setSearchParams({})
                          setShowPostForm(true)
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={async () => {
                          if (!confirm('Are you sure you want to delete?')) return
                          try {
                            await communityApi.deletePost(selectedPost.id)
                            setSelectedPost(null)
                            setSearchParams({})
                            loadPosts()
                          } catch (err: any) {
                            console.error('Error deleting post:', err)
                            alert('Failed to delete post.')
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                {selectedPost.mentions.length > 0 && (
                  <div className="post-mentions">
                    <strong>Mentioned users:</strong>
                    {selectedPost.mentions.map((mention, idx) => (
                      <span key={idx} className="mention-badge">
                        @{mention.mentioned_name || mention.mentioned_email}
                      </span>
                    ))}
                  </div>
                )}

                <div className="comments-section">
                  <h3 className="comments-title">
                    Comments ({comments.length})
                  </h3>
                  <CommentForm
                    postId={selectedPost.id}
                    onSuccess={() => {
                      loadComments(selectedPost.id)
                    }}
                    onCancel={() => {}}
                  />
                  <div className="comments-list">
                    {comments
                      .filter(c => !c.parent_id)
                      .map((comment) => (
                        <div key={comment.id}>
                          <CommentItem 
                            comment={comment} 
                            postId={selectedPost.id}
                            onReply={() => loadComments(selectedPost.id)}
                          />
                          {comments
                            .filter(c => c.parent_id === comment.id)
                            .map((reply) => (
                              <CommentItem 
                                key={reply.id} 
                                comment={reply} 
                                postId={selectedPost.id}
                              />
                            ))}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {showPostForm && (
                  <PostForm
                    boardType={activeBoard === 'all' ? 'forum' : activeBoard}
                    editingPost={editingPost}
                    onSuccess={() => {
                      setShowPostForm(false)
                      setEditingPost(null)
                      if (selectedPost) {
                        setSelectedPost(null)
                        setSearchParams({})
                      }
                      loadPosts()
                    }}
                    onCancel={() => {
                      setShowPostForm(false)
                      setEditingPost(null)
                    }}
                  />
                )}
                {!showMentions && (
                  <>
                    {loading ? (
                      <div className="loading">Loading...</div>
                    ) : posts.length === 0 ? (
                      <div className="no-posts">No posts found.</div>
                    ) : (
                      <>
                        <div className="posts-list">
                          {posts.map((post) => (
                            <div
                              key={post.id}
                              className={`post-card ${post.post_type === 'notice' ? 'notice-post' : ''} ${post.post_type === 'notice' && post.is_pinned ? 'notice-pinned' : ''} ${post.post_type === 'request' && post.is_resolved ? 'request-resolved' : ''}`}
                              onClick={() => handlePostClick(post)}
                            >
                              <div className="post-card-header">
                                <div className="post-card-header-left">
                                  <span className="post-type-badge">{post.post_type.toUpperCase()}</span>
                                  {post.is_pinned && <span className="pinned-badge">📌</span>}
                                  <h3 className="post-card-title">{post.title}</h3>
                                </div>
                                {post.post_type === 'request' && post.is_resolved && (
                                  <span className="resolved-badge">✓ Resolved</span>
                                )}
                              </div>
                              <div className="post-card-meta">
                                <span 
                                  className="author-name-clickable"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigator.clipboard.writeText(getEmailToCopy(post))
                                    const toast = document.createElement('div')
                                    toast.textContent = 'Mail Address Copied!'
                                    toast.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #89A230; color: white; padding: 8px 16px; border-radius: 4px; z-index: 10000; font-weight: 400; font-size: 0.875rem; box-shadow: 0 2px 8px rgba(0,0,0,0.15); animation: fadeInOut 2s;'
                                    document.body.appendChild(toast)
                                    setTimeout(() => {
                                      toast.style.animation = 'fadeOut 0.3s'
                                      setTimeout(() => document.body.removeChild(toast), 300)
                                    }, 1700)
                                  }}
                                  title="Click to copy email"
                                >
                                  {post.author_name || post.author_email}
                                </span>
                                <span>•</span>
                                <span>{formatDate(post.created_at)}</span>
                                <span>•</span>
                                <span>Views {post.view_count}</span>
                                <span>•</span>
                                <span>Comments {post.comment_count}</span>
                              </div>
                              {post.tags.length > 0 && (
                                <div className="post-card-tags">
                                  {post.tags.map((tag) => (
                                    <span key={tag.id} className="tag-badge">#{tag.name}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="pagination">
                          <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                          >
                            Previous
                          </button>
                          <span>
                            {page} / {Math.ceil(total / pageSize)}
                          </span>
                          <button
                            disabled={page >= Math.ceil(total / pageSize)}
                            onClick={() => setPage(page + 1)}
                          >
                            Next
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {imageLightboxUrl && (
        <div
          className="image-lightbox-overlay"
          onClick={() => setImageLightboxUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="이미지 크게 보기"
        >
          <button
            type="button"
            className="image-lightbox-close"
            onClick={() => setImageLightboxUrl(null)}
            aria-label="닫기"
          >
            ×
          </button>
          <img
            src={imageLightboxUrl}
            alt="Enlarged"
            className="image-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

// Post Form Component
const PostForm: React.FC<{
  boardType: 'notice' | 'forum' | 'request'
  editingPost?: Post | null
  onSuccess: () => void
  onCancel: () => void
}> = ({ boardType, editingPost, onSuccess, onCancel }) => {
  useAuth()
  const [title, setTitle] = useState(editingPost?.title || '')
  const [content, setContent] = useState(editingPost?.content || '')
  const [imageItems, setImageItems] = useState<ImageItem[]>(
    (editingPost?.image_urls?.slice(0, MAX_IMAGES) || (editingPost?.image_url ? [editingPost.image_url] : [])).map((url, idx) => ({
      serverUrl: url,
      size: (editingPost?.image_sizes?.[idx] as ImageSizeOption) || 'full',
    }))
  )
  const blobUrlsRef = React.useRef<Map<string, string>>(new Map())
  const [uploadingImage, setUploadingImage] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [showPasswordInput, setShowPasswordInput] = useState(false)
  const [mentionUsers, setMentionUsers] = useState<Array<{ email: string; name: string; picture?: string }>>([])
  const [showMentionList, setShowMentionList] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [mentionIndex, setMentionIndex] = useState(-1)
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title)
      setContent(editingPost.content)
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
      blobUrlsRef.current.clear()
      setImageItems(
        (editingPost.image_urls?.slice(0, MAX_IMAGES) || (editingPost.image_url ? [editingPost.image_url] : [])).map((url, idx) => ({
          serverUrl: url,
          size: (editingPost.image_sizes?.[idx] as ImageSizeOption) || 'full',
        }))
      )
    } else {
      setTitle('')
      setContent('')
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
      blobUrlsRef.current.clear()
      setImageItems([])
    }
  }, [editingPost])

  useEffect(() => () => {
    blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
    blobUrlsRef.current.clear()
  }, [])

  const uploadImageFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files)
    if (!arr.length || imageItems.length >= MAX_IMAGES) return
    const remaining = MAX_IMAGES - imageItems.length
    const imageFiles = arr.filter(f => f.type.startsWith('image/')).slice(0, remaining)
    if (!imageFiles.length) return
    setUploadingImage(true)
    for (const file of imageFiles) {
      const id = `blob-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const blobUrl = URL.createObjectURL(file)
      blobUrlsRef.current.set(id, blobUrl)
      setImageItems(prev => [...prev, { serverUrl: '', id }].slice(0, MAX_IMAGES))
      try {
        const { url } = await communityApi.uploadImage(file)
        setImageItems(prev => prev.map((item) =>
          item.id === id ? { ...item, serverUrl: url } : item
        ))
      } catch (err: unknown) {
        console.error('Image upload failed:', err)
        blobUrlsRef.current.delete(id)
        URL.revokeObjectURL(blobUrl)
        setImageItems(prev => prev.slice(0, -1))
        let msg = 'Image upload failed.'
        if (err && typeof err === 'object' && 'response' in err) {
          const res = (err as { response?: { status?: number; data?: { detail?: string } } }).response
          if (res?.status === 401) msg = 'Login required.'
          else if (res?.status === 413) msg = 'File exceeds 5MB limit.'
          else if (res?.status === 400 && res?.data?.detail) msg = String(res.data.detail)
          else if (res?.data?.detail) msg = String(res.data.detail)
        }
        alert(msg)
      }
    }
    setUploadingImage(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    uploadImageFiles(files)
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = e.dataTransfer?.files
    if (!files?.length) return
    uploadImageFiles(files)
  }

  const setImageSize = (idx: number, size: ImageSizeOption) => {
    setImageItems(prev => prev.map((item, i) => (i === idx ? { ...item, size } : item)))
  }

  const removeImage = (idx: number) => {
    setImageItems(prev => {
      const item = prev[idx]
      if (item?.id) {
        const blobUrl = blobUrlsRef.current.get(item.id)
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl)
          blobUrlsRef.current.delete(item.id)
        }
      }
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handlePasteImage = (e: React.ClipboardEvent) => {
    if (imageItems.length >= MAX_IMAGES) {
      alert('Maximum 3 images allowed.')
      return
    }
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (!file) {
          alert('Image paste is not supported in this browser. Please use the file upload button or drag and drop.')
          return
        }
        uploadImageFiles([file])
        return
      }
    }
  }

  const loadMentionUsers = async (search: string) => {
    setLoadingUsers(true)
    try {
      const users = await communityApi.getUsers(search, 10)
      setMentionUsers(users)
      setMentionIndex(-1)
    } catch (err) {
      console.error('Error loading users:', err)
      setMentionUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  const insertMention = (user: { email: string; name: string }) => {
    if (!textareaRef.current) return
    
    const cursorPos = textareaRef.current.selectionStart
    const textBeforeCursor = content.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      // 사용자 이름으로 멘션 (공백이 있으면 언더스코어로 대체)
      const mentionName = user.name || user.email.split('@')[0]
      const safeName = mentionName.replace(/\s+/g, '_')
      const newContent = 
        content.substring(0, lastAtIndex + 1) + 
        safeName + 
        ' ' + 
        content.substring(cursorPos)
      
      setContent(newContent)
      setShowMentionList(false)
      setMentionSearch('')
      setMentionIndex(-1)
      
      // 커서 위치 조정
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = lastAtIndex + 1 + safeName.length + 1
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
          textareaRef.current.focus()
        }
      }, 0)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      alert('Please enter title and content.')
      return
    }

    // Notice인 경우 비밀번호 확인
    if (boardType === 'notice') {
      if (!showPasswordInput) {
        setShowPasswordInput(true)
        return
      }
      if (!adminPassword.trim()) {
        alert('Please enter admin password.')
        return
      }
    }

    setSubmitting(true)
    try {
      // 태그와 멘션 추출
      const tagMatches = content.match(/#(\w+)/g) || []
      const tags = tagMatches.map(tag => tag.substring(1).toLowerCase())
      
      // 이메일 형식과 사용자 이름 형식 모두 추출
      const emailMatches = content.match(/@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g) || []
      const nameMatches = content.match(/@([a-zA-Z0-9_]+)/g) || []
      // 이메일은 그대로, 이름은 나중에 백엔드에서 이메일로 변환
      const mentions = [
        ...emailMatches.map(mention => mention.substring(1)),
        ...nameMatches.map(mention => mention.substring(1))
      ]

      // Notice인 경우 비밀번호로 관리자 인증
      let adminToken: string | undefined = undefined
      if (boardType === 'notice' && adminPassword) {
        try {
          const { adminAuthApi } = await import('../services/adminApi')
          const loginResult = await adminAuthApi.login({ username: 'seoag68', password: adminPassword })
          adminToken = loginResult.access_token
        } catch (err: any) {
          alert('Admin password is incorrect.')
          setSubmitting(false)
          return
        }
      }

      if (editingPost) {
        // Edit mode: always send image_urls so backend can clear when user removes all
        await communityApi.updatePost(editingPost.id, {
          title: title.trim(),
          content: content.trim(),
          tags: tags.length > 0 ? tags : undefined,
          mentions: mentions.length > 0 ? mentions : undefined,
          image_urls: imageItems.map(i => i.serverUrl).filter(Boolean),
          image_sizes: imageItems.map(i => i.size || 'full').filter((_, i) => imageItems[i]?.serverUrl),
        })
      } else {
        // Create mode
        await communityApi.createPost({
          post_type: boardType,
          title: title.trim(),
          content: content.trim(),
          tags: tags.length > 0 ? tags : undefined,
          mentions: mentions.length > 0 ? mentions : undefined,
          image_urls: imageItems.map(i => i.serverUrl).filter(Boolean),
          image_sizes: imageItems.map(i => i.size || 'full').filter((_, i) => imageItems[i]?.serverUrl),
        }, adminToken)
      }
      onSuccess()
    } catch (err: any) {
      console.error('Error creating post:', err)
      alert(err.response?.data?.detail || 'Failed to create post.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="post-form" onSubmit={handleSubmit}>
      <h3>{editingPost ? 'Edit Post' : `New Post (${boardType.toUpperCase()})`}</h3>
      <div className="form-group form-notice-hub">
        <p className="hub-notice-text">
          Please use <Link to="/hub">Hub</Link> to share your files.
        </p>
      </div>
      <div className="form-group">
        <label>Title *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Enter title"
        />
      </div>
      <div className="form-group form-group-content-with-images" style={{ position: 'relative' }}>
        <label>Content *</label>
        <textarea
          ref={textareaRef}
          value={content}
          onPaste={handlePasteImage}
          onChange={(e) => {
            const newContent = e.target.value
            setContent(newContent)
            
            // @ 입력 감지
            const cursorPos = e.target.selectionStart
            const textBeforeCursor = newContent.substring(0, cursorPos)
            const lastAtIndex = textBeforeCursor.lastIndexOf('@')
            
            if (lastAtIndex !== -1) {
              const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
              // 공백이나 줄바꿈이 없으면 멘션 검색 중
              if (!textAfterAt.match(/[\s\n]/)) {
                setMentionSearch(textAfterAt)
                setShowMentionList(true)
                // 커서 위치 계산
                if (textareaRef.current) {
                  try {
                    const textarea = textareaRef.current
                    const textBeforeCursor = newContent.substring(0, cursorPos)
                    const lines = textBeforeCursor.split('\n')
                    
                    // @ 기호가 있는 줄 번호
                    const atLineIndex = textBeforeCursor.substring(0, lastAtIndex).split('\n').length - 1
                    const atLineText = lines[atLineIndex] || ''
                    
                    // textarea 스타일 정보
                    const style = window.getComputedStyle(textarea)
                    const lineHeight = parseFloat(style.lineHeight) || 20
                    const paddingTop = parseFloat(style.paddingTop) || 0
                    const paddingLeft = parseFloat(style.paddingLeft) || 0
                    const borderTop = parseFloat(style.borderTopWidth) || 0
                    const fontSize = parseFloat(style.fontSize) || 14
                    const fontFamily = style.fontFamily
                    
                    // @ 기호까지의 텍스트 너비 계산
                    const textBeforeAt = atLineText.substring(0, atLineText.lastIndexOf('@'))
                    const tempSpan = document.createElement('span')
                    tempSpan.style.visibility = 'hidden'
                    tempSpan.style.position = 'absolute'
                    tempSpan.style.whiteSpace = 'pre'
                    tempSpan.style.font = `${fontSize}px ${fontFamily}`
                    tempSpan.textContent = textBeforeAt
                    document.body.appendChild(tempSpan)
                    const atLeft = tempSpan.offsetWidth
                    document.body.removeChild(tempSpan)
                    
                    // textarea의 위치
                    const textareaRect = textarea.getBoundingClientRect()
                    const scrollTop = textarea.scrollTop
                    
                    // @ 기호가 있는 줄의 위치 계산
                    const lineTop = atLineIndex * lineHeight + paddingTop + borderTop - scrollTop
                    
                    setMentionPosition({
                      top: textareaRect.top + lineTop + lineHeight,
                      left: textareaRect.left + paddingLeft + atLeft
                    })
                  } catch (err) {
                    console.error('Error calculating mention position:', err)
                    // 오류 발생 시 기본 위치 사용
                    if (textareaRef.current) {
                      const rect = textareaRef.current.getBoundingClientRect()
                      setMentionPosition({
                        top: rect.bottom + 5,
                        left: rect.left
                      })
                    }
                  }
                }
                // 입력한 문자로 사용자 검색 (빈 문자열이어도 전체 목록 표시)
                loadMentionUsers(textAfterAt || '')
              } else {
                setShowMentionList(false)
              }
            } else {
              setShowMentionList(false)
            }
          }}
          onKeyDown={(e) => {
            if (showMentionList && mentionUsers.length > 0) {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setMentionIndex(prev => (prev < mentionUsers.length - 1 ? prev + 1 : prev))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setMentionIndex(prev => (prev > 0 ? prev - 1 : -1))
              } else if (e.key === 'Tab' || e.key === 'Enter') {
                if (mentionIndex >= 0 && mentionIndex < mentionUsers.length) {
                  e.preventDefault()
                  insertMention(mentionUsers[mentionIndex])
                }
              } else if (e.key === 'Escape') {
                setShowMentionList(false)
              }
            }
          }}
          required
          rows={10}
          placeholder="Enter content. You can mention with @name and add tags with #tag."
        />
        {showMentionList && (
          <div 
            className="mention-autocomplete"
            style={{
              position: 'fixed',
              top: `${mentionPosition.top}px`,
              left: `${mentionPosition.left}px`,
              zIndex: 1000,
              background: 'white',
              border: '1px solid #E9EADE',
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              maxHeight: '200px',
              overflowY: 'auto',
              minWidth: '250px'
            }}
          >
            {loadingUsers ? (
              <div style={{ padding: '0.5rem 1rem', color: '#685A55', fontSize: '0.9rem' }}>
                Loading users...
              </div>
            ) : mentionUsers.length > 0 ? (
              mentionUsers.map((user, idx) => (
                <div
                  key={user.email}
                  onClick={() => insertMention(user)}
                  style={{
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    backgroundColor: idx === mentionIndex ? '#E9EADE' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={() => setMentionIndex(idx)}
                >
                  {user.picture && (
                    <img 
                      src={user.picture} 
                      alt={user.name || user.email}
                      style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#57463D' }}>
                      {user.name || user.email.split('@')[0]}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#685A55' }}>{user.email}</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '0.5rem 1rem', color: '#685A55', fontSize: '0.9rem' }}>
                {mentionSearch ? `No users found for "${mentionSearch}"` : 'No users found'}
              </div>
            )}
          </div>
        )}
        <div className="form-group images-in-content">
          <label>Images (max {MAX_IMAGES}) — 크기 조정</label>
          <div
            className={`image-drop-zone ${isDragging ? 'dragging' : ''} ${imageItems.length >= MAX_IMAGES ? 'full' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPaste={handlePasteImage}
            tabIndex={0}
            title="Click here then paste (Ctrl+V) - paste may not work in all browsers"
          >
            {imageItems.length < MAX_IMAGES && (
              <div className="image-upload-row">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="image-upload-input"
                />
                <span className="image-upload-hint">
                  {uploadingImage ? 'Uploading...' : 'Drag & drop, paste (Ctrl+V in this area), or click to add files. Paste may not work in all browsers.'}
                </span>
              </div>
            )}
            {imageItems.length > 0 && (
              <div className="post-form-images">
                {imageItems.map((item, idx) => (
                  <div key={item.id || item.serverUrl || idx} className="post-form-image-item">
                    <img
                      src={(item.id && blobUrlsRef.current.get(item.id)) || getPostImageSrc(item.serverUrl)}
                      alt={`Preview ${idx + 1}`}
                    />
                    <div className="post-form-image-controls">
                      <span className="image-size-label">크기:</span>
                      <select
                        value={item.size || 'full'}
                        onChange={(e) => setImageSize(idx, e.target.value as ImageSizeOption)}
                        className="image-size-select"
                        title="Image size"
                      >
                        <option value="full">전체 너비</option>
                        <option value="original">원본</option>
                        <option value="small">작게</option>
                      </select>
                      <button type="button" className="remove-image-btn" onClick={() => removeImage(idx)} title="Remove">
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {boardType === 'notice' && showPasswordInput && (
        <div className="form-group">
          <label>Admin Password *</label>
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            required
            placeholder="Enter admin password"
          />
        </div>
      )}
      <div className="form-actions">
        <button type="submit" disabled={submitting || uploadingImage}>
          {submitting ? 'Posting...' : uploadingImage ? 'Uploading images...' : 'Post'}
        </button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

// Comment Form Component
const CommentForm: React.FC<{
  postId: number
  parentId?: number
  onSuccess: () => void
  onCancel: () => void
}> = ({ postId, parentId, onSuccess, onCancel }) => {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [mentionUsers, setMentionUsers] = useState<Array<{ email: string; name: string; picture?: string }>>([])
  const [showMentionList, setShowMentionList] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [mentionIndex, setMentionIndex] = useState(-1)
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
  const [loadingUsers, setLoadingUsers] = useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const loadMentionUsers = async (search: string) => {
    setLoadingUsers(true)
    try {
      const users = await communityApi.getUsers(search, 10)
      setMentionUsers(users)
      setMentionIndex(-1)
    } catch (err) {
      console.error('Error loading users:', err)
      setMentionUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  const insertMention = (user: { email: string; name: string }) => {
    if (!textareaRef.current) return
    
    const cursorPos = textareaRef.current.selectionStart
    const textBeforeCursor = content.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      // 사용자 이름으로 멘션 (공백이 있으면 언더스코어로 대체)
      const mentionName = user.name || user.email.split('@')[0]
      const safeName = mentionName.replace(/\s+/g, '_')
      const newContent = 
        content.substring(0, lastAtIndex + 1) + 
        safeName + 
        ' ' + 
        content.substring(cursorPos)
      
      setContent(newContent)
      setShowMentionList(false)
      setMentionSearch('')
      setMentionIndex(-1)
      
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = lastAtIndex + 1 + safeName.length + 1
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
          textareaRef.current.focus()
        }
      }, 0)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      alert('Please enter comment content.')
      return
    }

    setSubmitting(true)
    try {
      // 이메일 형식과 사용자 이름 형식 모두 추출
      const emailMatches = content.match(/@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g) || []
      const nameMatches = content.match(/@([a-zA-Z0-9_]+)/g) || []
      // 이메일은 그대로, 이름은 나중에 백엔드에서 이메일로 변환
      const mentions = [
        ...emailMatches.map(mention => mention.substring(1)),
        ...nameMatches.map(mention => mention.substring(1))
      ]

      await communityApi.createComment(postId, {
        content: content.trim(),
        parent_id: parentId,
        mentions: mentions.length > 0 ? mentions : undefined
      })
      setContent('')
      onSuccess()
    } catch (err: any) {
      console.error('Error creating comment:', err)
      alert(err.response?.data?.detail || 'Failed to create comment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit} style={{ position: 'relative' }}>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          const newContent = e.target.value
          setContent(newContent)
          
          const cursorPos = e.target.selectionStart
          const textBeforeCursor = newContent.substring(0, cursorPos)
          const lastAtIndex = textBeforeCursor.lastIndexOf('@')
          
          if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
            if (!textAfterAt.match(/[\s\n]/)) {
              setMentionSearch(textAfterAt)
              setShowMentionList(true)
              // 커서 위치 계산
              if (textareaRef.current) {
                try {
                  const textarea = textareaRef.current
                  const textBeforeCursor = newContent.substring(0, cursorPos)
                  const lines = textBeforeCursor.split('\n')
                  
                  // @ 기호가 있는 줄 번호
                  const atLineIndex = textBeforeCursor.substring(0, lastAtIndex).split('\n').length - 1
                  const atLineText = lines[atLineIndex] || ''
                  
                  // textarea 스타일 정보
                  const style = window.getComputedStyle(textarea)
                  const lineHeight = parseFloat(style.lineHeight) || 20
                  const paddingTop = parseFloat(style.paddingTop) || 0
                  const paddingLeft = parseFloat(style.paddingLeft) || 0
                  const borderTop = parseFloat(style.borderTopWidth) || 0
                  const fontSize = parseFloat(style.fontSize) || 14
                  const fontFamily = style.fontFamily
                  
                  // @ 기호까지의 텍스트 너비 계산
                  const textBeforeAt = atLineText.substring(0, atLineText.lastIndexOf('@'))
                  const tempSpan = document.createElement('span')
                  tempSpan.style.visibility = 'hidden'
                  tempSpan.style.position = 'absolute'
                  tempSpan.style.whiteSpace = 'pre'
                  tempSpan.style.font = `${fontSize}px ${fontFamily}`
                  tempSpan.textContent = textBeforeAt
                  document.body.appendChild(tempSpan)
                  const atLeft = tempSpan.offsetWidth
                  document.body.removeChild(tempSpan)
                  
                  // textarea의 위치
                  const textareaRect = textarea.getBoundingClientRect()
                  const scrollTop = textarea.scrollTop
                  
                  // @ 기호가 있는 줄의 위치 계산
                  const lineTop = atLineIndex * lineHeight + paddingTop + borderTop - scrollTop
                  
                  setMentionPosition({
                    top: textareaRect.top + lineTop + lineHeight,
                    left: textareaRect.left + paddingLeft + atLeft
                  })
                } catch (err) {
                  console.error('Error calculating mention position:', err)
                  // 오류 발생 시 기본 위치 사용
                  if (textareaRef.current) {
                    const rect = textareaRef.current.getBoundingClientRect()
                    setMentionPosition({
                      top: rect.bottom + 5,
                      left: rect.left
                    })
                  }
                }
              }
              // 입력한 문자로 사용자 검색 (빈 문자열이어도 전체 목록 표시)
              loadMentionUsers(textAfterAt || '')
            } else {
              setShowMentionList(false)
            }
          } else {
            setShowMentionList(false)
          }
        }}
        onKeyDown={(e) => {
          if (showMentionList && mentionUsers.length > 0) {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setMentionIndex(prev => (prev < mentionUsers.length - 1 ? prev + 1 : prev))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setMentionIndex(prev => (prev > 0 ? prev - 1 : -1))
            } else if (e.key === 'Tab' || e.key === 'Enter') {
              if (mentionIndex >= 0 && mentionIndex < mentionUsers.length) {
                e.preventDefault()
                insertMention(mentionUsers[mentionIndex])
              }
            } else if (e.key === 'Escape') {
              setShowMentionList(false)
            }
          }
        }}
        required
        rows={3}
        placeholder="Enter comment. You can mention with @name."
      />
      {showMentionList && (
        <div 
          className="mention-autocomplete"
          style={{
            position: 'fixed',
            top: `${mentionPosition.top}px`,
            left: `${mentionPosition.left}px`,
            zIndex: 1000,
            background: 'white',
            border: '1px solid #E9EADE',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            maxHeight: '200px',
            overflowY: 'auto',
            minWidth: '250px'
          }}
        >
          {loadingUsers ? (
            <div style={{ padding: '0.5rem 1rem', color: '#685A55', fontSize: '0.9rem' }}>
              Loading users...
            </div>
          ) : mentionUsers.length > 0 ? (
            mentionUsers.map((user, idx) => (
              <div
                key={user.email}
                onClick={() => insertMention(user)}
                style={{
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  backgroundColor: idx === mentionIndex ? '#E9EADE' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={() => setMentionIndex(idx)}
              >
                {user.picture && (
                  <img 
                    src={user.picture} 
                    alt={user.name || user.email}
                    style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#57463D' }}>
                    {user.name || user.email.split('@')[0]}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#685A55' }}>{user.email}</div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '0.5rem 1rem', color: '#685A55', fontSize: '0.9rem' }}>
              {mentionSearch ? `No users found for "${mentionSearch}"` : 'No users found'}
            </div>
          )}
        </div>
      )}
      <div className="comment-form-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Posting...' : 'Post'}
        </button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

// Comment Item Component
const CommentItem: React.FC<{ comment: Comment; postId: number; onReply?: () => void }> = ({ comment, postId, onReply }) => {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderContent = (content: string) => {
    // XSS 방지: HTML 이스케이프 함수
    const escapeHtml = (text: string) => {
      const div = document.createElement('div')
      div.textContent = text
      return div.innerHTML
    }
    
    // URL 패턴을 플레이스홀더로 먼저 교체 (임베드 처리)
    const placeholders: { [key: string]: string } = {}
    let placeholderIndex = 0
    
    // YouTube (youtube.com/watch?v=VIDEO_ID 또는 youtu.be/VIDEO_ID)
    content = content.replace(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)(?:\S*)?/g,
      (_match, videoId) => {
        const placeholder = `__EMBED_PLACEHOLDER_${placeholderIndex}__`
        placeholders[placeholder] = `<div class="embed-container youtube-embed"><iframe width="100%" height="400" src="https://www.youtube.com/embed/${escapeHtml(videoId)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
        placeholderIndex++
        return placeholder
      }
    )
    
    // Instagram (p, reel, tv 모두 지원)
    content = content.replace(
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(p|reel|tv)\/([a-zA-Z0-9_-]+)(?:\S*)?/g,
      (_match, type, postId) => {
        const placeholder = `__EMBED_PLACEHOLDER_${placeholderIndex}__`
        const permalink = `https://www.instagram.com/${escapeHtml(type)}/${escapeHtml(postId)}/`
        placeholders[placeholder] = `<div class="embed-container instagram-embed"><blockquote class="instagram-media" data-instgrm-permalink="${escapeHtml(permalink)}" data-instgrm-version="14"></blockquote></div>`
        placeholderIndex++
        return placeholder
      }
    )
    
    // X (Twitter) - twitter.com과 x.com 모두 지원
    content = content.replace(
      /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)(?:\S*)?/g,
      (_match, username, tweetId) => {
        const placeholder = `__EMBED_PLACEHOLDER_${placeholderIndex}__`
        placeholders[placeholder] = `<div class="embed-container twitter-embed"><blockquote class="twitter-tweet" data-theme="light"><a href="https://twitter.com/${escapeHtml(username)}/status/${escapeHtml(tweetId)}"></a></blockquote></div>`
        placeholderIndex++
        return placeholder
      }
    )
    
    // Threads
    content = content.replace(
      /(?:https?:\/\/)?(?:www\.)?threads\.net\/@(\w+)\/post\/([a-zA-Z0-9_-]+)(?:\S*)?/g,
      (_match, username, postId) => {
        const placeholder = `__EMBED_PLACEHOLDER_${placeholderIndex}__`
        const permalink = `https://www.threads.net/@${escapeHtml(username)}/post/${escapeHtml(postId)}`
        placeholders[placeholder] = `<div class="embed-container threads-embed"><blockquote class="threads-embed" data-threads-permalink="${escapeHtml(permalink)}" data-threads-version="1"></blockquote></div>`
        placeholderIndex++
        return placeholder
      }
    )
    
    // 일반 URL은 링크로 변환 (이미 임베드되지 않은 경우)
    content = content.replace(
      /(https?:\/\/[^\s<>"']+)/g,
      (url) => {
        // 이미 플레이스홀더로 교체된 경우 스킵
        if (url.startsWith('__EMBED_PLACEHOLDER_')) {
          return url
        }
        const placeholder = `__EMBED_PLACEHOLDER_${placeholderIndex}__`
        placeholders[placeholder] = `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`
        placeholderIndex++
        return placeholder
      }
    )
    
    // 나머지 텍스트를 HTML 이스케이프
    let rendered = escapeHtml(content)
    
    // 플레이스홀더를 원래 임베드로 교체
    for (const [placeholder, embed] of Object.entries(placeholders)) {
      rendered = rendered.replace(placeholder, embed)
    }
    
    // @mention과 #tag 하이라이트 (이미 이스케이프된 텍스트에서 처리)
    rendered = rendered.replace(/@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<span class="mention">@$1</span>')
    rendered = rendered.replace(/#(\w+)/g, '<span class="tag-inline">#$1</span>')
    return { __html: rendered }
  }

  return (
    <div className={`comment-item ${comment.parent_id ? 'comment-reply' : ''}`}>
      <div className="comment-header">
        <span 
          className="comment-author author-name-clickable"
          onClick={(e) => {
            e.stopPropagation()
            navigator.clipboard.writeText(comment.author_email)
            const toast = document.createElement('div')
            toast.textContent = 'Mail Address Copied!'
            toast.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #89A230; color: white; padding: 8px 16px; border-radius: 4px; z-index: 10000; font-weight: 400; font-size: 0.875rem; box-shadow: 0 2px 8px rgba(0,0,0,0.15); animation: fadeInOut 2s;'
            document.body.appendChild(toast)
            setTimeout(() => {
              toast.style.animation = 'fadeOut 0.3s'
              setTimeout(() => document.body.removeChild(toast), 300)
            }, 1700)
          }}
          title="Click to copy email"
        >
          {comment.author_name || comment.author_email}
        </span>
        <span className="comment-date">{formatDate(comment.created_at)}</span>
        {!comment.parent_id && onReply && (
          <button 
            className="reply-btn"
            onClick={(e) => {
              e.stopPropagation()
              setShowReplyForm(!showReplyForm)
            }}
          >
            Reply
          </button>
        )}
      </div>
      <div
        className="comment-content"
        dangerouslySetInnerHTML={renderContent(comment.content)}
      />
      {showReplyForm && onReply && (
        <div className="reply-form-container">
          <CommentForm
            postId={postId}
            parentId={comment.id}
            onSuccess={() => {
              setShowReplyForm(false)
              onReply()
            }}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}
    </div>
  )
}

export default Community
