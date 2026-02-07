from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.core.security import verify_token
from app.services.google_api import (
    get_access_token_from_refresh,
    get_google_calendar_events
)
from typing import List, Dict, Any

router = APIRouter(prefix="/calendar", tags=["calendar"])

def get_current_user_from_token(token: str, db: Session) -> User:
    """토큰에서 현재 사용자 가져오기"""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@router.get("/events", response_model=List[Dict[str, Any]])
async def get_events(
    token: str,
    max_results: int = 10,
    db: Session = Depends(get_db)
):
    """Google Calendar 이벤트 가져오기"""
    user = get_current_user_from_token(token, db)
    
    if not user.google_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google refresh token not found. Please re-authenticate."
        )
    
    # Access token 가져오기
    access_token = await get_access_token_from_refresh(user.google_refresh_token)
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to get access token. Please re-authenticate."
        )
    
    # 이벤트 목록 가져오기
    events = await get_google_calendar_events(access_token, max_results)
    return events

@router.get("/embed-url")
async def get_calendar_embed_url(
    token: str,
    db: Session = Depends(get_db)
):
    """Google Calendar 임베드 URL 생성"""
    user = get_current_user_from_token(token, db)
    
    # Google Calendar 임베드 URL (iframe용)
    # 실제로는 사용자의 캘린더 ID가 필요하지만, 기본 캘린더는 primary 사용
    embed_url = "https://calendar.google.com/calendar/embed?src=primary&ctz=Asia/Seoul"
    
    return {
        "embed_url": embed_url,
        "iframe_url": embed_url
    }
