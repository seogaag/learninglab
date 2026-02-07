from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.banner import Banner
from app.schemas.banner import BannerCreate, BannerUpdate, BannerResponse
from app.core.admin_auth import require_admin_dep
from app.models.admin import Admin
from typing import List

router = APIRouter(prefix="/admin/banners", tags=["admin"])

@router.get("", response_model=List[BannerResponse])
async def get_banners(
    admin: Admin = Depends(require_admin_dep),
    db: Session = Depends(get_db)
):
    """배너 목록 조회 (관리자)"""
    banners = db.query(Banner).order_by(Banner.order.asc()).all()
    return banners

@router.post("", response_model=BannerResponse)
async def create_banner(
    banner: BannerCreate,
    admin: Admin = Depends(require_admin_dep),
    db: Session = Depends(get_db)
):
    """배너 생성 (관리자)"""
    db_banner = Banner(**banner.model_dump())
    db.add(db_banner)
    db.commit()
    db.refresh(db_banner)
    return db_banner

@router.put("/{banner_id}", response_model=BannerResponse)
async def update_banner(
    banner_id: int,
    banner: BannerUpdate,
    admin: Admin = Depends(require_admin_dep),
    db: Session = Depends(get_db)
):
    """배너 수정 (관리자)"""
    db_banner = db.query(Banner).filter(Banner.id == banner_id).first()
    if not db_banner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Banner not found"
        )
    
    update_data = banner.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_banner, key, value)
    
    db.commit()
    db.refresh(db_banner)
    return db_banner

@router.delete("/{banner_id}")
async def delete_banner(
    banner_id: int,
    admin: Admin = Depends(require_admin_dep),
    db: Session = Depends(get_db)
):
    """배너 삭제 (관리자)"""
    
    db_banner = db.query(Banner).filter(Banner.id == banner_id).first()
    if not db_banner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Banner not found"
        )
    
    db.delete(db_banner)
    db.commit()
    return {"message": "Banner deleted successfully"}
