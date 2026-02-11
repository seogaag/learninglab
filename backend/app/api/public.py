from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.banner import Banner
from app.models.workspace_course import WorkspaceCourse
from app.schemas.workspace_course import WorkspaceCourseResponse
from typing import List

router = APIRouter(prefix="/public", tags=["public"])

@router.get("/banners")
async def get_public_banners(db: Session = Depends(get_db)):
    """공개 배너 목록 조회 (활성화된 것만). 이미지 URL은 절대 경로 + 한글 인코딩으로 반환."""
    from urllib.parse import quote
    import os

    banners = db.query(Banner).filter(
        Banner.is_active == True
    ).order_by(Banner.order.asc()).all()

    api_url = os.getenv("API_URL", "http://localhost:8000").rstrip("/")
    result = []
    for b in banners:
        image_url = b.image_url or ""
        if image_url.startswith("/admin/upload/image/"):
            path_parts = image_url.split("/")
            filename = path_parts[-1]
            encoded_filename = quote(filename, safe="")
            encoded_path = "/".join(path_parts[:-1]) + "/" + encoded_filename
            image_url = f"{api_url}{encoded_path}"
        result.append({
            "id": b.id,
            "title": b.title,
            "subtitle": b.subtitle,
            "image_url": image_url,
            "link_url": b.link_url,
            "order": b.order,
            "is_active": b.is_active,
        })
    return result

@router.get("/workspace-courses")
async def get_public_workspace_courses(db: Session = Depends(get_db)):
    """공개 워크스페이스 클래스 목록 조회 (활성화된 것만)"""
    courses = db.query(WorkspaceCourse).filter(
        WorkspaceCourse.is_active == True
    ).order_by(WorkspaceCourse.order.asc()).all()
    
    # Course 인터페이스에 맞게 변환
    from app.core.config import settings
    import os
    
    # API URL 설정 (환경 변수 또는 설정에서 가져오기)
    api_url = os.getenv('API_URL', 'http://localhost:8000')
    # 프론트엔드에서 접근할 수 있는 URL 사용
    if hasattr(settings, 'FRONTEND_URL'):
        api_url = settings.FRONTEND_URL.replace(':3000', ':8000') if ':3000' in getattr(settings, 'FRONTEND_URL', '') else api_url
    
    from urllib.parse import quote
    
    result = []
    for course in courses:
        image_url = course.image_url
        # 상대 경로인 경우 절대 URL로 변환
        if image_url and image_url.startswith('/admin/upload/image/'):
            # 파일명만 URL 인코딩 (한글 파일명 처리)
            path_parts = image_url.split('/')
            filename = path_parts[-1]
            encoded_filename = quote(filename, safe='')
            encoded_path = '/'.join(path_parts[:-1]) + '/' + encoded_filename
            image_url = f"{api_url}{encoded_path}"
            print(f"[PUBLIC API] Converting image URL: {course.image_url} -> {image_url}")
        
        result.append({
            "id": str(course.id),
            "name": course.name,
            "section": course.section,
            "description": course.description,
            "courseState": course.course_state,
            "alternateLink": course.alternate_link,
            "image_url": image_url,
            "organization": course.organization
        })
    
    print(f"[PUBLIC API] Returning {len(result)} workspace courses")
    for course in result:
        print(f"[PUBLIC API] Course: {course['name']}, image_url: {course['image_url']}")
    return result
