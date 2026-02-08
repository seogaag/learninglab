from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.page_section import PageSection
from app.schemas.page_section import (
    PageSectionCreate,
    PageSectionUpdate,
    PageSectionResponse
)
from app.core.admin_auth import require_admin_dep
from app.models.admin import Admin
from typing import List

router = APIRouter(prefix="/admin/page-sections", tags=["admin"])

@router.get("", response_model=List[PageSectionResponse])
async def get_page_sections(
    admin: Admin = Depends(require_admin_dep),
    db: Session = Depends(get_db)
):
    """페이지 섹션 목록 조회 (관리자)"""
    sections = db.query(PageSection).order_by(PageSection.order.asc()).all()
    return sections

@router.post("", response_model=PageSectionResponse)
async def create_page_section(
    section: PageSectionCreate,
    admin: Admin = Depends(require_admin_dep),
    db: Session = Depends(get_db)
):
    """페이지 섹션 생성 (관리자)"""
    db_section = PageSection(**section.model_dump())
    db.add(db_section)
    db.commit()
    db.refresh(db_section)
    return db_section

@router.put("/{section_id}", response_model=PageSectionResponse)
async def update_page_section(
    section_id: int,
    section: PageSectionUpdate,
    admin: Admin = Depends(require_admin_dep),
    db: Session = Depends(get_db)
):
    """페이지 섹션 수정 (관리자)"""
    db_section = db.query(PageSection).filter(PageSection.id == section_id).first()
    if not db_section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page section not found"
        )
    
    update_data = section.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_section, key, value)
    
    db.commit()
    db.refresh(db_section)
    return db_section

@router.delete("/{section_id}")
async def delete_page_section(
    section_id: int,
    admin: Admin = Depends(require_admin_dep),
    db: Session = Depends(get_db)
):
    """페이지 섹션 삭제 (관리자)"""
    db_section = db.query(PageSection).filter(PageSection.id == section_id).first()
    if not db_section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page section not found"
        )
    
    db.delete(db_section)
    db.commit()
    return {"message": "Page section deleted successfully"}

@router.post("/reorder")
async def reorder_sections(
    section_orders: List[dict],  # [{"id": 1, "order": 0}, {"id": 2, "order": 1}, ...]
    admin: Admin = Depends(require_admin_dep),
    db: Session = Depends(get_db)
):
    """페이지 섹션 순서 변경 (관리자)"""
    for item in section_orders:
        db_section = db.query(PageSection).filter(PageSection.id == item["id"]).first()
        if db_section:
            db_section.order = item["order"]
    
    db.commit()
    return {"message": "Sections reordered successfully"}
