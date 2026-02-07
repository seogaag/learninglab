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
    
    print(f"[CALENDAR] Getting events for user: {user.email} (ID: {user.id})")
    
    if not user.google_refresh_token:
        print(f"[CALENDAR] No refresh token found for user {user.email}")
        # refresh_token이 없으면 빈 배열 반환 (에러 대신)
        return []
    
    # Access token 가져오기
    print(f"[CALENDAR] Getting access token from refresh token...")
    access_token = await get_access_token_from_refresh(user.google_refresh_token)
    if not access_token:
        print(f"[CALENDAR] Failed to get access token from refresh token")
        # access token을 가져올 수 없으면 빈 배열 반환
        return []
    
    print(f"[CALENDAR] Successfully obtained access token")
    
    # 이벤트 목록 가져오기
    try:
        print(f"[CALENDAR] Calling Google Calendar API...")
        events = await get_google_calendar_events(access_token, max_results)
        print(f"[CALENDAR] Google Calendar API returned {len(events)} events")
        return events
    except Exception as e:
        print(f"[CALENDAR] Error fetching Google Calendar events: {e}")
        import traceback
        traceback.print_exc()
        return []

@router.get("/embed-url")
async def get_calendar_embed_url(
    token: str,
    db: Session = Depends(get_db)
):
    """Google Calendar 임베드 URL 생성"""
    user = get_current_user_from_token(token, db)
    
    print(f"[CALENDAR] Getting embed URL for user: {user.email}")
    
    # Google Calendar 임베드 URL (iframe용)
    # 사용자의 이메일 주소를 캘린더 ID로 사용
    from urllib.parse import quote
    calendar_id = quote(user.email)
    embed_url = f"https://calendar.google.com/calendar/embed?src={calendar_id}&ctz=Asia%2FSeoul"
    
    print(f"[CALENDAR] Generated embed URL: {embed_url}")
    
    return {
        "embed_url": embed_url,
        "iframe_url": embed_url
    }
