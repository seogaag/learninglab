from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.page_section import PageSection
from app.schemas.page_section import PageSectionResponse
from typing import List

router = APIRouter(prefix="/public/page-sections", tags=["public"])

@router.get("", response_model=List[PageSectionResponse])
async def get_public_page_sections(db: Session = Depends(get_db)):
    """공개 페이지 섹션 조회 (활성화된 섹션만)"""
    sections = db.query(PageSection).filter(
        PageSection.is_active == True
    ).order_by(PageSection.order.asc()).all()
    return sections
