from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.core.security import verify_token
from app.core.validation import sanitize_string
from app.services.google_api import (
    get_access_token_from_refresh,
    get_google_classroom_courses,
    get_google_classroom_coursework
)
from typing import List, Dict, Any
import re

router = APIRouter(prefix="/classroom", tags=["classroom"])

def get_current_user_from_token(token: str, db: Session) -> User:
    """토큰에서 현재 사용자 가져오기 (보안 강화)"""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    try:
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        # 숫자로 변환 가능한지 확인 (SQL Injection 방지)
        user_id_int = int(user_id)
        if user_id_int <= 0:
            raise ValueError("Invalid user ID")
        
        # SQLAlchemy ORM 사용 (SQL Injection 방지)
        user = db.query(User).filter(User.id == user_id_int).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

@router.get("/courses", response_model=List[Dict[str, Any]])
async def get_courses(
    token: str,
    db: Session = Depends(get_db)
):
    """Google Classroom 코스 목록 가져오기 (내가 수강 중인 클래스)"""
    user = get_current_user_from_token(token, db)
    
    print(f"[CLASSROOM] Getting courses for user: {user.email} (ID: {user.id})")
    
    if not user.google_refresh_token:
        print(f"[CLASSROOM] No refresh token found for user {user.email}")
        # refresh_token이 없으면 빈 배열 반환 (에러 대신)
        return []
    
    # Access token 가져오기
    print(f"[CLASSROOM] Getting access token from refresh token...")
    access_token = await get_access_token_from_refresh(user.google_refresh_token)
    if not access_token:
        print(f"[CLASSROOM] Failed to get access token from refresh token")
        # access token을 가져올 수 없으면 빈 배열 반환
        return []
    
    print(f"[CLASSROOM] Successfully obtained access token")
    
    # 코스 목록 가져오기
    try:
        print(f"[CLASSROOM] Calling Google Classroom API...")
        courses = await get_google_classroom_courses(access_token)
        print(f"[CLASSROOM] Google Classroom API returned {len(courses)} courses")
        if courses:
            print(f"[CLASSROOM] Course names: {[c.get('name', 'N/A') for c in courses[:3]]}")
        return courses
    except Exception as e:
        print(f"[CLASSROOM] Error fetching Google Classroom courses: {e}")
        import traceback
        traceback.print_exc()
        return []

@router.get("/workspace-courses", response_model=List[Dict[str, Any]])
async def get_workspace_courses(db: Session = Depends(get_db)):
    """워크스페이스 클래스 목록 가져오기 (공개 API)"""
    from app.models.workspace_course import WorkspaceCourse
    
    courses = db.query(WorkspaceCourse).filter(
        WorkspaceCourse.is_active == True
    ).order_by(WorkspaceCourse.order.asc()).all()
    
    # Course 인터페이스에 맞게 변환
    return [
        {
            "id": str(course.id),
            "name": course.name,
            "section": course.section,
            "description": course.description,
            "courseState": course.course_state,
            "alternateLink": course.alternate_link,
            "image_url": course.image_url,
            "organization": course.organization
        }
        for course in courses
    ]

@router.get("/courses/{course_id}/coursework", response_model=List[Dict[str, Any]])
async def get_coursework(
    course_id: str,
    token: str,
    db: Session = Depends(get_db)
):
    """특정 코스의 과제 목록 가져오기 (보안 강화)"""
    # course_id 검증 (SQL Injection 및 XSS 방지)
    if not course_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course ID is required"
        )
    
    # Google Classroom course ID 형식 검증 (숫자 또는 알파벳+숫자)
    if not re.match(r'^[A-Za-z0-9_-]+$', course_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid course ID format"
        )
    
    if len(course_id) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course ID is too long"
        )
    
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
