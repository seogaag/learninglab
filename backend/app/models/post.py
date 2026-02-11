from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum

class PostType(str, enum.Enum):
    NOTICE = "notice"
    FORUM = "forum"
    REQUEST = "request"

class Post(Base):
    """게시글 모델"""
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    post_type = Column(SQLEnum(PostType), nullable=False)  # notice, forum, request
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    author_email = Column(String, nullable=False)  # 작성자 이메일 (사용자 정보 조회용)
    author_name = Column(String, nullable=True)  # 작성자 이름
    is_pinned = Column(Boolean, default=False)  # 공지사항 고정
    view_count = Column(Integer, default=0)  # 조회수
    image_url = Column(String, nullable=True)  # 첨부 이미지 URL
    like_count = Column(Integer, default=0)  # 좋아요 수
    is_resolved = Column(Boolean, default=False)  # Request 해결 여부
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 관계
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    tags = relationship("PostTag", back_populates="post", cascade="all, delete-orphan")
    mentions = relationship("PostMention", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("PostLike", back_populates="post", cascade="all, delete-orphan")

class Comment(Base):
    """댓글 모델"""
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    author_email = Column(String, nullable=False)
    author_name = Column(String, nullable=True)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)  # 대댓글용
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 관계
    post = relationship("Post", back_populates="comments")
    parent = relationship("Comment", remote_side=[id], backref="replies")
    mentions = relationship("CommentMention", back_populates="comment", cascade="all, delete-orphan")

class Tag(Base):
    """태그 모델"""
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계
    posts = relationship("PostTag", back_populates="tag")

class PostTag(Base):
    """게시글-태그 연결 테이블"""
    __tablename__ = "post_tags"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    tag_id = Column(Integer, ForeignKey("tags.id"), nullable=False)
    
    # 관계
    post = relationship("Post", back_populates="tags")
    tag = relationship("Tag", back_populates="posts")

class PostMention(Base):
    """게시글에서 사용자 언급"""
    __tablename__ = "post_mentions"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    mentioned_email = Column(String, nullable=False, index=True)
    mentioned_name = Column(String, nullable=True)
    
    # 관계
    post = relationship("Post", back_populates="mentions")

class CommentMention(Base):
    """댓글에서 사용자 언급"""
    __tablename__ = "comment_mentions"
    
    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey("comments.id"), nullable=False)
    mentioned_email = Column(String, nullable=False, index=True)
    mentioned_name = Column(String, nullable=True)
    
    # 관계
    comment = relationship("Comment", back_populates="mentions")

class PostLike(Base):
    """게시글 좋아요"""
    __tablename__ = "post_likes"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계
    post = relationship("Post", back_populates="likes")
