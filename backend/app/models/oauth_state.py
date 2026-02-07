from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class OAuthState(Base):
    """OAuth state 파라미터 저장 (CSRF 방지)"""
    __tablename__ = "oauth_states"
    
    state = Column(String, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
