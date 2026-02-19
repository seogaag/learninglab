from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.admin import Admin
from app.schemas.admin import AdminLogin, AdminToken, AdminResponse
from app.core.security import create_access_token
from app.core.admin_auth import get_current_admin
from app.core.config import settings
from datetime import timedelta

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/login", response_model=AdminToken)
async def admin_login(
    credentials: AdminLogin,
    db: Session = Depends(get_db)
):
    """관리자 로그인 (username/password)"""
    print(f"[ADMIN LOGIN] Request received username={credentials.username}")
    
    admin = db.query(Admin).filter(Admin.username == credentials.username).first()
    
    if not admin:
        print(f"[ADMIN LOGIN] Admin not found: {credentials.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    if not admin.is_active:
        print(f"[ADMIN LOGIN] Inactive account: {credentials.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin account is inactive"
        )
    
    pw_ok = admin.verify_password(credentials.password)
    print(f"[ADMIN LOGIN] Password verification result: {pw_ok}")
    if not pw_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    print(f"[ADMIN LOGIN] Success: {credentials.username}")
    # 관리자 JWT 토큰 생성 (role: admin)
    access_token = create_access_token(
        data={"sub": str(admin.id), "role": "admin"},
        expires_delta=timedelta(hours=24)  # 관리자는 24시간
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=AdminResponse)
async def get_current_admin_info(
    admin: Admin = Depends(get_current_admin)
):
    """현재 관리자 정보 조회"""
    from app.core.admin_auth import get_current_admin
    
    return admin
