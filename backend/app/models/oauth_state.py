from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from datetime import datetime, timedelta, timezone
from app.db.database import Base

class OAuthState(Base):
    __tablename__ = "oauth_states"
    
    state = Column(String, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    def is_expired(self, max_age: int = 600) -> bool:
        """State가 만료되었는지 확인 (기본 10분)"""
        if not self.created_at:
            return True
        # timezone-aware datetime 비교
        now = datetime.now(timezone.utc)
        if self.created_at.tzinfo is None:
            # timezone-naive인 경우 UTC로 가정
            created_at_utc = self.created_at.replace(tzinfo=timezone.utc)
        else:
            created_at_utc = self.created_at.astimezone(timezone.utc)
        expiry_time = created_at_utc + timedelta(seconds=max_age)
        return now > expiry_time
