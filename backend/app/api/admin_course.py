from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.workspace_course import WorkspaceCourse
from app.schemas.workspace_course import (
    WorkspaceCourseCreate,
    WorkspaceCourseUpdate,
    WorkspaceCourseResponse
)
from app.core.admin_auth import require_admin_dep
from app.models.admin import Admin
from typing import List

router = APIRouter(prefix="/admin/courses", tags=["admin"])

@router.get("", response_model=List[WorkspaceCourseResponse])
async def get_workspace_courses_admin(
    admin: Admin = Depends(require_admin_dep),
    db: Session = Depends(get_db)
):
    """워크스페이스 클래스 목록 조회 (관리자)"""
    courses = db.query(WorkspaceCourse).order_by(WorkspaceCourse.order.asc()).all()
    return courses

@router.post("", response_model=WorkspaceCourseResponse)
async def create_workspace_course(
    course: WorkspaceCourseCreate,
    admin: Admin = Depends(require_admin_dep),
    db: Session = Depends(get_db)
):
    """워크스페이스 클래스 생성 (관리자)"""
    db_course = WorkspaceCourse(**course.model_dump())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

@router.put("/{course_id}", response_model=WorkspaceCourseResponse)
async def update_workspace_course(
    course_id: int,
    course: WorkspaceCourseUpdate,
    admin: Admin = Depends(require_admin_dep),
    db: Session = Depends(get_db)
):
    """워크스페이스 클래스 수정 (관리자)"""
    db_course = db.query(WorkspaceCourse).filter(WorkspaceCourse.id == course_id).first()
    if not db_course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    update_data = course.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_course, key, value)
    
    db.commit()
    db.refresh(db_course)
    return db_course

@router.delete("/{course_id}")
async def delete_workspace_course(
    course_id: int,
    admin: Admin = Depends(require_admin_dep),
    db: Session = Depends(get_db)
):
    """워크스페이스 클래스 삭제 (관리자)"""
    
    db_course = db.query(WorkspaceCourse).filter(WorkspaceCourse.id == course_id).first()
    if not db_course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    db.delete(db_course)
    db.commit()
    return {"message": "Course deleted successfully"}
