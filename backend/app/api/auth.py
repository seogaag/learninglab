from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from app.db.database import get_db
from app.models.user import User
from app.models.oauth_state import OAuthState
from app.schemas.user import Token, UserResponse
from app.core.security import create_access_token
from app.core.config import settings
from datetime import timedelta
import httpx
import secrets
import urllib.parse

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
        },
        # 리디렉션 URI 명시적으로 설정
        redirect_uri=settings.GOOGLE_REDIRECT_URI
    )

@router.get("/login")
async def login(request: Request, db: Session = Depends(get_db)):
    """Google OAuth 로그인 시작"""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured"
        )
    
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    
    # State를 수동으로 생성하고 데이터베이스에 저장
    state = secrets.token_urlsafe(32)
    oauth_state = OAuthState(state=state)
    db.add(oauth_state)
    db.commit()
    
    # authorize_redirect에 state를 명시적으로 전달
    return await oauth.google.authorize_redirect(request, redirect_uri, state=state)

@router.get("/callback")
async def callback(request: Request, code: str = None, state: str = None, error: str = None, db: Session = Depends(get_db)):
    """Google OAuth 콜백 처리"""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured"
        )
    
    # 에러 처리
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth error: {error}"
        )
    
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code not provided"
        )
    
    # State 검증 (데이터베이스에서 확인)
    oauth_state = db.query(OAuthState).filter(OAuthState.state == state).first()
    if not oauth_state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid state parameter. Please try logging in again."
        )
    
    # State 만료 확인 (10분)
    if oauth_state.is_expired(max_age=600):
        db.delete(oauth_state)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="State has expired. Please try logging in again."
        )
    
    # State 검증 후 데이터베이스에서 제거
    db.delete(oauth_state)
    db.commit()
    
    try:
        # authlib의 state 검증을 우회하기 위해 직접 토큰 교환
        # authorize_access_token 대신 직접 OAuth 토큰 엔드포인트 호출
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                'https://oauth2.googleapis.com/token',
                data={
                    'code': code,
                    'client_id': settings.GOOGLE_CLIENT_ID,
                    'client_secret': settings.GOOGLE_CLIENT_SECRET,
                    'redirect_uri': settings.GOOGLE_REDIRECT_URI,
                    'grant_type': 'authorization_code'
                }
            )
            
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to exchange token: {token_response.text}"
                )
            
            token_data = token_response.json()
            access_token = token_data.get('access_token')
            refresh_token = token_data.get('refresh_token')
            
            if not access_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get access token from Google"
                )
        
        # 사용자 정보 가져오기
        # Google OAuth2 v2 userinfo 엔드포인트 사용
        async with httpx.AsyncClient() as client:
            user_response = await client.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers={
                    'Authorization': f"Bearer {access_token}",
                    'Accept': 'application/json'
                },
                timeout=10.0
            )
            
            print(f"User info API response: Status {user_response.status_code}")
            
            if user_response.status_code != 200:
                error_text = user_response.text
                print(f"User info retrieval failed: Status {user_response.status_code}, Response: {error_text}")
                # 401 Unauthorized인 경우 토큰 문제
                if user_response.status_code == 401:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid access token. Please try logging in again."
                    )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to retrieve user information from Google (Status: {user_response.status_code})"
                )
            
            try:
                user_info = user_response.json()
                print(f"User info received: {list(user_info.keys())}")
            except Exception as json_error:
                print(f"Failed to parse user info JSON: {json_error}")
                print(f"Response text: {user_response.text[:200]}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid response format from Google userinfo API"
                )
        
        google_id = user_info.get('sub') or user_info.get('id')
        email = user_info.get('email')
        name = user_info.get('name', '')
        picture = user_info.get('picture')
        
        print(f"Extracted user data: google_id={google_id}, email={email}, name={name}")
        
        if not google_id or not email:
            print(f"Missing required fields: google_id={google_id}, email={email}")
            print(f"Full user_info: {user_info}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get required user information from Google (missing id or email)"
            )
        
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
        jwt_token = create_access_token(
            data={"sub": str(user.id), "email": user.email},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        # 프론트엔드로 리다이렉트 (토큰 포함)
        frontend_url = f"http://localhost:3000/auth/callback?token={jwt_token}"
        return RedirectResponse(url=frontend_url)
        
    except HTTPException:
        # HTTPException은 그대로 전달
        raise
    except Exception as e:
        # 상세한 에러 정보 로깅 (보안을 위해 민감한 정보는 제외)
        import traceback
        error_type = type(e).__name__
        error_message = str(e) if str(e) else "Unknown error"
        
        # 로그에만 상세 정보 기록 (프로덕션에서는 로깅 시스템 사용)
        print(f"OAuth callback error: {error_type}: {error_message}")
        print(f"Traceback: {traceback.format_exc()}")
        
        # 클라이언트에는 일반적인 메시지만 전달 (보안)
        if "code" in error_message.lower() or "token" in error_message.lower():
            detail_message = "Authentication failed: Invalid authorization code or token exchange failed"
        elif "user" in error_message.lower() or "info" in error_message.lower():
            detail_message = "Authentication failed: Unable to retrieve user information"
        else:
            detail_message = f"Authentication failed: {error_type}"
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail_message
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
