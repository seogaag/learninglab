import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { communityApi, Post, Comment, Tag } from '../services/api'
import './Community.css'

type BoardType = 'notice' | 'forum' | 'request' | 'all'

const Community: React.FC = () => {
  const { user, token, login } = useAuth()
  const [activeBoard, setActiveBoard] = useState<BoardType>('all')
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showPostForm, setShowPostForm] = useState(false)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  useEffect(() => {
    loadPosts()
    loadTags()
  }, [activeBoard, searchQuery, selectedTag, page])

  useEffect(() => {
    if (selectedPost) {
      loadComments(selectedPost.id)
    }
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

  const loadComments = async (postId: number) => {
    try {
      const data = await communityApi.getComments(postId)
      setComments(data)
    } catch (err) {
      console.error('Error loading comments:', err)
    }
  }

  const handlePostClick = async (post: Post) => {
    setSelectedPost(post)
    setShowCommentForm(false)
  }

  const handleBackToList = () => {
    setSelectedPost(null)
    setComments([])
    setShowCommentForm(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderContent = (content: string) => {
    // @mention과 #tag 하이라이트
    let rendered = content
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
            <input
              type="text"
              placeholder="검색..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="search-input"
            />
            {activeBoard !== 'notice' && (
              <button
                className="new-post-btn"
                onClick={() => setShowPostForm(true)}
              >
                + 새 글 작성
              </button>
            )}
          </div>
        </div>

        <div className="community-content">
          <div className="community-sidebar">
            <div className="board-tabs">
              <button
                className={`board-tab ${activeBoard === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setActiveBoard('all')
                  setPage(1)
                  setSelectedTag(null)
                }}
              >
                전체
              </button>
              <button
                className={`board-tab ${activeBoard === 'notice' ? 'active' : ''}`}
                onClick={() => {
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
                  setActiveBoard('request')
                  setPage(1)
                  setSelectedTag(null)
                }}
              >
                Requests
              </button>
            </div>

            {tags.length > 0 && (
              <div className="tags-section">
                <h3 className="tags-title">인기 태그</h3>
                <div className="tags-list">
                  {tags.slice(0, 10).map((tag) => (
                    <button
                      key={tag.id}
                      className={`tag-item ${selectedTag === tag.name ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedTag(selectedTag === tag.name ? null : tag.name)
                        setPage(1)
                      }}
                    >
                      #{tag.name} ({tag.post_count})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="community-main">
            {selectedPost ? (
              <div className="post-detail">
                <button className="back-button" onClick={handleBackToList}>
                  ← 목록으로
                </button>
                <div className="post-header">
                  <div className="post-meta">
                    <span className="post-type-badge">{selectedPost.post_type.toUpperCase()}</span>
                    {selectedPost.is_pinned && <span className="pinned-badge">📌 고정</span>}
                  </div>
                  <h2 className="post-title">{selectedPost.title}</h2>
                  <div className="post-info">
                    <span 
                      className="author-name-clickable"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(selectedPost.author_email)
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
                    <span>조회 {selectedPost.view_count}</span>
                  </div>
                  {selectedPost.tags.length > 0 && (
                    <div className="post-tags">
                      {selectedPost.tags.map((tag) => (
                        <span key={tag.id} className="tag-badge">#{tag.name}</span>
                      ))}
                    </div>
                  )}
                </div>
                {selectedPost.image_url && (
                  <div className="post-image-container">
                    <img 
                      src={selectedPost.image_url.startsWith('/admin/upload/image/') 
                        ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${selectedPost.image_url}`
                        : selectedPost.image_url} 
                      alt="Post attachment"
                      className="post-image"
                    />
                  </div>
                )}
                <div
                  className="post-content"
                  dangerouslySetInnerHTML={renderContent(selectedPost.content)}
                />
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
                        alert('좋아요 처리에 실패했습니다.')
                      }
                    }}
                  >
                    {selectedPost.is_liked ? '❤️' : '🤍'} {selectedPost.like_count || 0}
                  </button>
                  {user && user.email === selectedPost.author_email && (
                    <div className="post-edit-actions">
                      <button
                        className="edit-btn"
                        onClick={() => {
                          setEditingPost(selectedPost)
                          setSelectedPost(null)
                          setShowPostForm(true)
                        }}
                      >
                        수정
                      </button>
                      <button
                        className="delete-btn"
                        onClick={async () => {
                          if (!confirm('정말 삭제하시겠습니까?')) return
                          try {
                            await communityApi.deletePost(selectedPost.id)
                            setSelectedPost(null)
                            loadPosts()
                          } catch (err: any) {
                            console.error('Error deleting post:', err)
                            alert('게시글 삭제에 실패했습니다.')
                          }
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
                {selectedPost.mentions.length > 0 && (
                  <div className="post-mentions">
                    <strong>언급된 사용자:</strong>
                    {selectedPost.mentions.map((mention, idx) => (
                      <span key={idx} className="mention-badge">
                        @{mention.mentioned_name || mention.mentioned_email}
                      </span>
                    ))}
                  </div>
                )}

                <div className="comments-section">
                  <h3 className="comments-title">
                    댓글 ({comments.length})
                  </h3>
                  {!showCommentForm && (
                    <button
                      className="add-comment-btn"
                      onClick={() => setShowCommentForm(true)}
                    >
                      댓글 작성
                    </button>
                  )}
                  {showCommentForm && (
                    <CommentForm
                      postId={selectedPost.id}
                      onSuccess={() => {
                        loadComments(selectedPost.id)
                        setShowCommentForm(false)
                      }}
                      onCancel={() => setShowCommentForm(false)}
                    />
                  )}
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
                      }
                      loadPosts()
                    }}
                    onCancel={() => {
                      setShowPostForm(false)
                      setEditingPost(null)
                    }}
                  />
                )}
                {loading ? (
                  <div className="loading">로딩 중...</div>
                ) : posts.length === 0 ? (
                  <div className="no-posts">게시글이 없습니다.</div>
                ) : (
                  <>
                    <div className="posts-list">
                      {posts.map((post) => (
                        <div
                          key={post.id}
                          className="post-card"
                          onClick={() => handlePostClick(post)}
                        >
                          <div className="post-card-header">
                            <span className="post-type-badge">{post.post_type.toUpperCase()}</span>
                            {post.is_pinned && <span className="pinned-badge">📌</span>}
                            <h3 className="post-card-title">{post.title}</h3>
                          </div>
                          <div className="post-card-meta">
                            <span 
                              className="author-name-clickable"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigator.clipboard.writeText(post.author_email)
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
                            <span>조회 {post.view_count}</span>
                            <span>•</span>
                            <span>댓글 {post.comment_count}</span>
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
                        이전
                      </button>
                      <span>
                        {page} / {Math.ceil(total / pageSize)}
                      </span>
                      <button
                        disabled={page >= Math.ceil(total / pageSize)}
                        onClick={() => setPage(page + 1)}
                      >
                        다음
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
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
  const { user } = useAuth()
  const [title, setTitle] = useState(editingPost?.title || '')
  const [content, setContent] = useState(editingPost?.content || '')
  const [submitting, setSubmitting] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [showPasswordInput, setShowPasswordInput] = useState(false)

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title)
      setContent(editingPost.content)
    } else {
      setTitle('')
      setContent('')
    }
  }, [editingPost])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.')
      return
    }

    // Notice인 경우 비밀번호 확인
    if (boardType === 'notice') {
      if (!showPasswordInput) {
        setShowPasswordInput(true)
        return
      }
      if (!adminPassword.trim()) {
        alert('관리자 비밀번호를 입력해주세요.')
        return
      }
    }

    setSubmitting(true)
    try {
      // 태그와 멘션 추출
      const tagMatches = content.match(/#(\w+)/g) || []
      const tags = tagMatches.map(tag => tag.substring(1).toLowerCase())
      
      const mentionMatches = content.match(/@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g) || []
      const mentions = mentionMatches.map(mention => mention.substring(1))

      // Notice인 경우 비밀번호로 관리자 인증
      let adminToken: string | undefined = undefined
      if (boardType === 'notice' && adminPassword) {
        try {
          const { adminAuthApi } = await import('../services/adminApi')
          const loginResult = await adminAuthApi.login({ username: 'seoag68', password: adminPassword })
          adminToken = loginResult.access_token
        } catch (err: any) {
          alert('관리자 비밀번호가 올바르지 않습니다.')
          setSubmitting(false)
          return
        }
      }

      if (editingPost) {
        // 수정 모드
        await communityApi.updatePost(editingPost.id, {
          title: title.trim(),
          content: content.trim(),
          tags: tags.length > 0 ? tags : undefined,
          mentions: mentions.length > 0 ? mentions : undefined
        })
      } else {
        // 생성 모드
        await communityApi.createPost({
          post_type: boardType,
          title: title.trim(),
          content: content.trim(),
          tags: tags.length > 0 ? tags : undefined,
          mentions: mentions.length > 0 ? mentions : undefined
        }, adminToken)
      }
      onSuccess()
    } catch (err: any) {
      console.error('Error creating post:', err)
      alert(err.response?.data?.detail || '게시글 작성에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="post-form" onSubmit={handleSubmit}>
      <h3>{editingPost ? '게시글 수정' : `새 글 작성 (${boardType.toUpperCase()})`}</h3>
      <div className="form-group">
        <label>제목 *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="제목을 입력하세요"
        />
      </div>
      <div className="form-group">
        <label>내용 *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={10}
          placeholder="내용을 입력하세요. @이메일로 멘션, #태그로 태그를 추가할 수 있습니다."
        />
      </div>
      {boardType === 'notice' && showPasswordInput && (
        <div className="form-group">
          <label>관리자 비밀번호 *</label>
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            required
            placeholder="관리자 비밀번호를 입력하세요"
          />
        </div>
      )}
      <div className="form-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? '작성 중...' : '작성'}
        </button>
        <button type="button" onClick={onCancel}>취소</button>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      alert('댓글 내용을 입력해주세요.')
      return
    }

    setSubmitting(true)
    try {
      const mentionMatches = content.match(/@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g) || []
      const mentions = mentionMatches.map(mention => mention.substring(1))

      await communityApi.createComment(postId, {
        content: content.trim(),
        parent_id: parentId,
        mentions: mentions.length > 0 ? mentions : undefined
      })
      setContent('')
      onSuccess()
    } catch (err: any) {
      console.error('Error creating comment:', err)
      alert(err.response?.data?.detail || '댓글 작성에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        rows={3}
        placeholder="댓글을 입력하세요. @이메일로 멘션할 수 있습니다."
      />
      <div className="comment-form-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? '작성 중...' : '작성'}
        </button>
        <button type="button" onClick={onCancel}>취소</button>
      </div>
    </form>
  )
}

// Comment Item Component
const CommentItem: React.FC<{ comment: Comment; postId: number; onReply?: () => void }> = ({ comment, postId, onReply }) => {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderContent = (content: string) => {
    let rendered = content
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
            답글
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
