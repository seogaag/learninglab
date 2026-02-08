from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.db.database import Base

class PageSection(Base):
    """페이지 섹션 모델 (페이지 빌더용)"""
    __tablename__ = "page_sections"
    
    id = Column(Integer, primary_key=True, index=True)
    section_type = Column(String, nullable=False)  # banner, working_together, feedback, action_buttons, custom
    title = Column(String, nullable=True)  # 섹션 제목
    order = Column(Integer, default=0)  # 섹션 순서
    is_active = Column(Boolean, default=True)
    # 섹션별 데이터를 JSON으로 저장
    data = Column(JSON, nullable=True)  # 섹션 타입에 따라 다른 구조의 데이터
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
