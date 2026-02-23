from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.database import get_db
from app.models.banner import Banner
from app.models.workspace_course import WorkspaceCourse
from app.models.post import Post
from app.schemas.workspace_course import WorkspaceCourseResponse
from typing import List

router = APIRouter(prefix="/public", tags=["public"])

@router.get("/banners")
async def get_public_banners(db: Session = Depends(get_db)):
    """공개 배너 목록 조회 (활성화된 것만). 이미지 URL은 상대 경로로 반환 (프론트엔드가 same-origin 처리)."""
    from urllib.parse import quote

    banners = db.query(Banner).filter(
        Banner.is_active == True
    ).order_by(Banner.order.asc()).all()

    result = []
    for b in banners:
        image_url = b.image_url or ""
        if image_url.startswith("/admin/upload/image/"):
            path_parts = image_url.split("/")
            filename = path_parts[-1]
            encoded_filename = quote(filename, safe="")
            image_url = "/".join(path_parts[:-1]) + "/" + encoded_filename
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
    
    from urllib.parse import quote
    
    result = []
    for course in courses:
        image_url = course.image_url
        # 상대 경로 반환 (프론트엔드에서 getApiBase()와 조합)
        if image_url and image_url.startswith('/admin/upload/image/'):
            path_parts = image_url.split('/')
            filename = path_parts[-1]
            encoded_filename = quote(filename, safe='')
            image_url = '/'.join(path_parts[:-1]) + '/' + encoded_filename
        
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
    return result


@router.get("/pinned-notices")
async def get_pinned_notices(db: Session = Depends(get_db)):
    """고정된 Notice 게시글 목록 조회 (메인 페이지 배너 밑 노출용)"""
    posts = db.query(Post).filter(
        Post.post_type == "notice",
        Post.is_pinned == True
    ).order_by(desc(Post.created_at)).limit(10).all()

    result = []
    for p in posts:
        content = p.content or ""
        result.append({
            "id": p.id,
            "title": p.title,
            "content": content[:200] + "..." if len(content) > 200 else content,
            "created_at": p.created_at,
        })
    return result
