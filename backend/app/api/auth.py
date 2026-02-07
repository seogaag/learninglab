from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import Token, UserResponse
from app.core.security import create_access_token
from app.core.config import settings
from datetime import timedelta
import httpx

router = APIRouter(prefix="/auth", tags=["auth"])

# OAuth 설정
oauth = OAuth()

# Google OAuth 등록 (설정이 있을 때만)
if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
    oauth.register(
        name='google',
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={
            'scope': 'openid email profile https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly https://www.googleapis.com/auth/calendar.readonly',
            'access_type': 'offline',
            'prompt': 'consent'
        }
    )

@router.get("/login")
async def login(request: Request):
    """Google OAuth 로그인 시작"""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured"
        )
    
    redirect_uri = f"http://localhost:8000/auth/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/callback")
async def callback(request: Request, code: str, db: Session = Depends(get_db)):
    """Google OAuth 콜백 처리"""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured"
        )
    
    try:
        # 토큰 교환
        token = await oauth.google.authorize_access_token(request)
        
        # 사용자 정보 가져오기
        user_info = token.get('userinfo')
        if not user_info:
            # userinfo가 없으면 직접 가져오기
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    'https://www.googleapis.com/oauth2/v2/userinfo',
                    headers={'Authorization': f"Bearer {token['access_token']}"}
                )
                user_info = response.json()
        
        google_id = user_info.get('sub')
        email = user_info.get('email')
        name = user_info.get('name', '')
        picture = user_info.get('picture')
        
        if not google_id or not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user information from Google"
            )
        
        # Refresh token 저장
        refresh_token = token.get('refresh_token')
        
        # 사용자 조회 또는 생성
        user = db.query(User).filter(User.google_id == google_id).first()
        if not user:
            user = User(
                google_id=google_id,
                email=email,
                name=name,
                picture=picture,
                google_refresh_token=refresh_token
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # 정보 업데이트
            user.email = email
            user.name = name
            user.picture = picture
            if refresh_token:
                user.google_refresh_token = refresh_token
            db.commit()
            db.refresh(user)
        
        # JWT 토큰 생성
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        # 프론트엔드로 리다이렉트 (토큰 포함)
        frontend_url = f"http://localhost:3000/auth/callback?token={access_token}"
        return RedirectResponse(url=frontend_url)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Authentication failed: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user(
    token: str,
    db: Session = Depends(get_db)
):
    """현재 사용자 정보 조회"""
    from app.core.security import verify_token
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@router.post("/logout")
async def logout():
    """로그아웃 (클라이언트에서 토큰 제거)"""
    return {"message": "Logged out successfully"}
