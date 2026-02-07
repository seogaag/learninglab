from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.db.database import Base

class WorkspaceCourse(Base):
    """워크스페이스 클래스 모델 (All 탭에서 표시)"""
    __tablename__ = "workspace_courses"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    section = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    alternate_link = Column(String, nullable=True)
    course_state = Column(String, default='ACTIVE')  # ACTIVE, ARCHIVED, PROVISIONED, DECLINED, SUSPENDED
    organization = Column(String, nullable=True)  # GFSU, GN TWN, GN USA 등
    order = Column(Integer, default=0)  # 표시 순서
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
