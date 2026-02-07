"""관리자 인증 유틸리티"""
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.admin import Admin
from app.core.security import create_access_token
from datetime import timedelta
from app.core.config import settings
from typing import Optional

def verify_admin_token(token: str) -> dict:
    """관리자 JWT 토큰 검증"""
    from app.core.security import verify_token
    payload = verify_token(token)
    if not payload:
        return None
    
    # 관리자 토큰인지 확인 (role이 'admin'이어야 함)
    if payload.get('role') != 'admin':
        return None
    
    return payload

def get_current_admin(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Admin:
    """현재 관리자 가져오기 (Header에서 토큰 추출)"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
    # "Bearer <token>" 형식에서 토큰 추출
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError("Invalid authorization scheme")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    payload = verify_admin_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin token"
        )
    
    admin_id = payload.get("sub")
    admin = db.query(Admin).filter(Admin.id == int(admin_id)).first()
    
    if not admin or not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin not found or inactive"
        )
    
    return admin

def require_admin_dep(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Admin:
    """관리자 권한이 필요한 엔드포인트용 의존성"""
    return get_current_admin(authorization, db)
