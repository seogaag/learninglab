from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class PostType(str, Enum):
    NOTICE = "notice"
    FORUM = "forum"
    REQUEST = "request"

class PostBase(BaseModel):
    post_type: PostType
    title: str
    content: str

class PostCreate(PostBase):
    tags: Optional[List[str]] = []
    mentions: Optional[List[str]] = []  # 이메일 리스트
    image_url: Optional[str] = None  # 이미지 URL

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    mentions: Optional[List[str]] = None
    is_pinned: Optional[bool] = None
    is_resolved: Optional[bool] = None

class TagResponse(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True

class MentionResponse(BaseModel):
    mentioned_email: str
    mentioned_name: Optional[str] = None

class CommentBase(BaseModel):
    content: str
    parent_id: Optional[int] = None

class CommentCreate(CommentBase):
    mentions: Optional[List[str]] = []  # 이메일 리스트

class CommentUpdate(BaseModel):
    content: Optional[str] = None

class CommentResponse(BaseModel):
    id: int
    post_id: int
    content: str
    author_email: str
    author_name: Optional[str] = None
    parent_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    mentions: List[MentionResponse] = []
    
    class Config:
        from_attributes = True

class PostResponse(BaseModel):
    id: int
    post_type: PostType
    title: str
    content: str
    author_email: str
    author_name: Optional[str] = None
    is_pinned: bool
    view_count: int
    image_url: Optional[str] = None
    like_count: int = 0
    is_liked: bool = False  # 현재 사용자가 좋아요를 눌렀는지
    is_resolved: bool = False  # Request 해결 여부
    created_at: datetime
    updated_at: Optional[datetime] = None
    tags: List[TagResponse] = []
    mentions: List[MentionResponse] = []
    comment_count: int = 0
    
    class Config:
        from_attributes = True

class PostListResponse(BaseModel):
    posts: List[PostResponse]
    total: int
    page: int
    page_size: int
