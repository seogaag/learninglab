from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.core.security import verify_token
from app.services.google_api import (
    get_access_token_from_refresh,
    get_google_classroom_courses,
    get_google_classroom_coursework
)
from typing import List, Dict, Any

router = APIRouter(prefix="/classroom", tags=["classroom"])

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

@router.get("/courses", response_model=List[Dict[str, Any]])
async def get_courses(
    token: str,
    db: Session = Depends(get_db)
):
    """Google Classroom 코스 목록 가져오기"""
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
    
    # 코스 목록 가져오기
    courses = await get_google_classroom_courses(access_token)
    return courses

@router.get("/courses/{course_id}/coursework", response_model=List[Dict[str, Any]])
async def get_coursework(
    course_id: str,
    token: str,
    db: Session = Depends(get_db)
):
    """특정 코스의 과제 목록 가져오기"""
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
    
    # 과제 목록 가져오기
    coursework = await get_google_classroom_coursework(course_id, access_token)
    return coursework
