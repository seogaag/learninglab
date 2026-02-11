from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
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
from app.core.validation import (
    validate_oauth_code,
    validate_state,
    validate_email,
    validate_google_id,
    sanitize_string
)
from datetime import timedelta
from typing import Optional
import httpx
import traceback

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
            'scope': 'openid email profile https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/drive.readonly',
            'access_type': 'offline'
            # prompt 제거: 이미 동의한 사용자는 자동 로그인, 처음이거나 refresh_token이 없을 때만 동의 화면 표시
        }
    )

@router.get("/login")
async def login(
    request: Request, 
    email: Optional[str] = Query(None, description="User email to check for existing refresh token"),
    db: Session = Depends(get_db)
):
    """Google OAuth 로그인 시작"""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured"
        )
    
    redirect_uri = f"http://localhost:8000/auth/callback"
    
    # refresh_token을 확실히 받기 위해 직접 URL 생성
    from urllib.parse import urlencode
    scope = (
        "openid email profile "
        "https://www.googleapis.com/auth/classroom.courses.readonly "
        "https://www.googleapis.com/auth/classroom.coursework.me.readonly "
        "https://www.googleapis.com/auth/calendar.readonly"
    )
    
    # state 파라미터 생성 (CSRF 방지) - 데이터베이스에 저장
    import secrets
    
    state = secrets.token_urlsafe(32)
    
    # 데이터베이스에 state 저장 (세션 대신)
    try:
        oauth_state = OAuthState(state=state)
        db.add(oauth_state)
        db.commit()
        print(f"[AUTH] State saved to database: {state}")
    except Exception as e:
        db.rollback()
        print(f"[AUTH] Failed to save state to database: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initialize login"
        )
    
    # 사용자가 이미 refresh_token을 가지고 있는지 확인
    # refresh_token이 있으면 prompt를 제거하여 자동 로그인
    # 없으면 select_account와 consent를 사용하여 권한을 확실히 받음
    has_refresh_token = False
    if email:
        try:
            user = db.query(User).filter(User.email == email).first()
            if user and user.google_refresh_token:
                has_refresh_token = True
                print(f"[AUTH] User {email} already has refresh_token, skipping consent prompt")
        except Exception as e:
            print(f"[AUTH] Error checking user refresh_token: {e}")
    
    # prompt 파라미터 설정
    # - refresh_token이 있으면: prompt 제거 (자동 로그인)
    # - refresh_token이 없으면: select_account만 사용 (Google이 자동으로 처리: 처음이거나 refresh_token이 만료된 경우에만 동의 화면 표시)
    #   참고: prompt=consent를 사용하면 매번 동의 화면이 표시되므로 사용하지 않음
    if has_refresh_token:
        prompt_param = ""
    else:
        # select_account만 사용: Google이 자동으로 처리 (처음이거나 refresh_token이 만료된 경우에만 동의 화면 표시)
        prompt_param = "prompt=select_account&"
    
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.GOOGLE_CLIENT_ID}&"
        f"redirect_uri={redirect_uri}&"
        f"response_type=code&"
        f"scope={scope}&"
        f"access_type=offline&"  # refresh_token을 받기 위해 필수
        f"{prompt_param}"
        f"state={state}"
    )
    
    print(f"[AUTH] Generated OAuth URL with {'no prompt (auto login)' if has_refresh_token else 'prompt=select_account'} and access_type=offline")
    return RedirectResponse(url=auth_url)

@router.get("/callback")
async def callback(request: Request, code: str, state: str = None, db: Session = Depends(get_db)):
    """Google OAuth 콜백 처리 (보안 강화)"""
    print(f"[AUTH] Callback received - code: {code[:20]}..., state: {state}")
    
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured"
        )
    
    # 입력값 검증 (XSS 및 Injection 방지)
    try:
        print(f"[AUTH] Validating input parameters...")
        code = validate_oauth_code(code)
        if state:
            state = validate_state(state)
        print(f"[AUTH] Input validation passed")
    except ValueError as e:
        print(f"[AUTH] Input validation failed: {e}")
        print(f"[AUTH] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request parameters"
        )
    
    # CSRF 검증 - 데이터베이스에서 확인
    print(f"[AUTH] Checking CSRF state in database...")
    oauth_state = db.query(OAuthState).filter(OAuthState.state == state).first()
    
    if not oauth_state:
        print(f"[AUTH] CSRF validation failed. State not found in database: {state}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid state parameter. Please try logging in again."
        )
    
    # 오래된 state 삭제 (5분 이상 된 것)
    from datetime import datetime, timedelta, timezone
    expired_time = datetime.now(timezone.utc) - timedelta(minutes=5)
    db.query(OAuthState).filter(OAuthState.created_at < expired_time).delete()
    
    # state 사용 후 제거 (재사용 방지)
    db.delete(oauth_state)
    db.commit()
    print(f"[AUTH] CSRF validation passed and state removed")
    
    try:
        # 직접 토큰 교환 (refresh_token을 확실히 받기 위해)
        redirect_uri = f"http://localhost:8000/auth/callback"
        token_url = 'https://oauth2.googleapis.com/token'
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                token_url,
                data={
                    'code': code,
                    'client_id': settings.GOOGLE_CLIENT_ID,
                    'client_secret': settings.GOOGLE_CLIENT_SECRET,
                    'redirect_uri': redirect_uri,
                    'grant_type': 'authorization_code'
                }
            )
            
            if token_response.status_code != 200:
                print(f"[AUTH] Token exchange failed: {token_response.status_code} - {token_response.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Token exchange failed: {token_response.text}"
                )
            
            token_data = token_response.json()
            print(f"[AUTH] Token exchange response keys: {list(token_data.keys())}")
            print(f"[AUTH] Refresh token present: {'refresh_token' in token_data}")
        
        access_token = token_data.get('access_token')
        refresh_token = token_data.get('refresh_token')
        
        print(f"[AUTH] Access token: {'present' if access_token else 'NOT PRESENT'}")
        print(f"[AUTH] Refresh token: {'present' if refresh_token else 'NOT PRESENT'}")
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get access token"
            )
        
        # 사용자 정보 가져오기 (id_token에서 먼저 시도, 없으면 userinfo API 사용)
        print(f"[AUTH] Fetching user info from Google...")
        
        # id_token에서 사용자 정보 추출 시도
        google_id = None
        email = None
        name = ''
        picture = None
        
        if 'id_token' in token_data:
            try:
                import base64
                import json
                # JWT는 base64url로 인코딩되어 있음
                id_token = token_data['id_token']
                # JWT는 .으로 구분된 3부분: header.payload.signature
                parts = id_token.split('.')
                if len(parts) >= 2:
                    # payload 디코딩
                    payload_part = parts[1]
                    # base64url 패딩 추가
                    padding = 4 - len(payload_part) % 4
                    if padding != 4:
                        payload_part += '=' * padding
                    # base64 디코딩
                    decoded = base64.urlsafe_b64decode(payload_part)
                    id_token_payload = json.loads(decoded)
                    print(f"[AUTH] Decoded id_token payload keys: {list(id_token_payload.keys())}")
                    
                    google_id = id_token_payload.get('sub')
                    email = id_token_payload.get('email')
                    name = id_token_payload.get('name', '')
                    picture = id_token_payload.get('picture')
                    print(f"[AUTH] User info from id_token: google_id={google_id}, email={email}")
            except Exception as e:
                print(f"[AUTH] Failed to decode id_token: {e}")
        
        # id_token에서 정보를 못 가져왔으면 userinfo API 사용
        if not google_id or not email:
            print(f"[AUTH] Fetching from userinfo API...")
            async with httpx.AsyncClient() as client:
                user_info_response = await client.get(
                    'https://www.googleapis.com/oauth2/v3/userinfo',
                    headers={'Authorization': f"Bearer {access_token}"}
                )
                if user_info_response.status_code != 200:
                    print(f"[AUTH] Failed to get user info: {user_info_response.status_code} - {user_info_response.text}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Failed to get user information from Google"
                    )
                user_info = user_info_response.json()
                print(f"[AUTH] User info API response keys: {list(user_info.keys())}")
                print(f"[AUTH] User info API response: {user_info}")
                
                # userinfo API에서 가져오기
                google_id = user_info.get('sub') or user_info.get('id')
                email = user_info.get('email')
                name = user_info.get('name', '')
                picture = user_info.get('picture')
                print(f"[AUTH] User info from API: google_id={google_id}, email={email}")
        
        if not google_id or not email:
            print(f"[AUTH] Missing user info: google_id={google_id}, email={email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user information from Google"
            )
        
        # 입력값 검증 및 정리 (XSS 방지)
        print(f"[AUTH] Validating user data...")
        try:
            google_id = validate_google_id(google_id)
            email = validate_email(email)
            name = sanitize_string(name, max_length=255) if name else ''
            picture = sanitize_string(picture, max_length=500) if picture else None
            print(f"[AUTH] User data validation passed")
        except ValueError as e:
            print(f"[AUTH] User data validation failed: {e}")
            print(f"[AUTH] Traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user data received from Google"
            )
        
        # Refresh token은 이미 위에서 가져옴
        
        # 사용자 조회 또는 생성 (SQL Injection 방지: SQLAlchemy ORM 사용)
        print(f"[AUTH] Saving user to database...")
        try:
            user = db.query(User).filter(User.google_id == google_id).first()
            if not user:
                print(f"[AUTH] Creating new user: {email}")
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
                print(f"[AUTH] New user created with refresh_token: {'YES' if user.google_refresh_token else 'NO'}")
            else:
                print(f"[AUTH] Updating existing user: {email}")
                print(f"[AUTH] Existing refresh_token: {'YES' if user.google_refresh_token else 'NO'}")
                # 정보 업데이트
                user.email = email
                user.name = name
                user.picture = picture
                # refresh_token이 있으면 업데이트 (없으면 기존 것 유지)
                if refresh_token:
                    print(f"[AUTH] Updating refresh_token")
                    user.google_refresh_token = refresh_token
                else:
                    print(f"[AUTH] No refresh_token in response, keeping existing one if available")
                db.commit()
                db.refresh(user)
                print(f"[AUTH] User updated, refresh_token: {'YES' if user.google_refresh_token else 'NO'}")
        except Exception as db_error:
            db.rollback()
            print(f"[AUTH] Database error: {db_error}")
            print(f"[AUTH] Error type: {type(db_error).__name__}")
            print(f"[AUTH] Traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save user information"
            )
        
        # JWT 토큰 생성
        print(f"[AUTH] Creating JWT token...")
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        print(f"[AUTH] JWT token created successfully")
        
        # 프론트엔드로 리다이렉트 (토큰 포함)
        frontend_url = f"http://localhost:3000/auth/callback?token={access_token}"
        print(f"[AUTH] Redirecting to frontend...")
        return RedirectResponse(url=frontend_url)
        
    except HTTPException:
        # HTTPException은 그대로 전달
        raise
    except Exception as e:
        # 상세한 에러 로깅 (서버 로그에만 기록)
        error_type = type(e).__name__
        error_message = str(e) if str(e) else "Unknown error"
        print(f"[AUTH] Authentication error: {error_type}: {error_message}")
        print(f"[AUTH] Traceback: {traceback.format_exc()}")
        
        # 클라이언트에는 일반적인 메시지만 전달 (보안: 민감한 정보 노출 방지)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authentication failed. Please try again."
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user(
    token: str,
    db: Session = Depends(get_db)
):
    """현재 사용자 정보 조회 (보안 강화)"""
    from app.core.security import verify_token
    
    # 토큰 검증
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    # 사용자 ID 검증 (SQL Injection 방지)
    try:
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        # 숫자로 변환 가능한지 확인
        user_id_int = int(user_id)
        if user_id_int <= 0:
            raise ValueError("Invalid user ID")
        
        # SQLAlchemy ORM 사용 (SQL Injection 방지)
        user = db.query(User).filter(User.id == user_id_int).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    except Exception as e:
        print(f"[AUTH] Error getting user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user information"
        )

@router.post("/logout")
async def logout():
    """로그아웃 (클라이언트에서 토큰 제거)"""
    return {"message": "Logged out successfully"}
