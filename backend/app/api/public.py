from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.banner import Banner
from app.models.workspace_course import WorkspaceCourse
from app.schemas.banner import BannerResponse
from app.schemas.workspace_course import WorkspaceCourseResponse
from typing import List

router = APIRouter(prefix="/public", tags=["public"])

@router.get("/banners", response_model=List[BannerResponse])
async def get_public_banners(db: Session = Depends(get_db)):
    """공개 배너 목록 조회 (활성화된 것만)"""
    banners = db.query(Banner).filter(
        Banner.is_active == True
    ).order_by(Banner.order.asc()).all()
    return banners

@router.get("/workspace-courses", response_model=List[WorkspaceCourseResponse])
async def get_public_workspace_courses(db: Session = Depends(get_db)):
    """공개 워크스페이스 클래스 목록 조회 (활성화된 것만)"""
    courses = db.query(WorkspaceCourse).filter(
        WorkspaceCourse.is_active == True
    ).order_by(WorkspaceCourse.order.asc()).all()
    return courses
