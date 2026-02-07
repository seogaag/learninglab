"""입력값 검증 및 보안 유틸리티"""
import re
from typing import Optional
from html import escape

def sanitize_string(value: str, max_length: Optional[int] = None) -> str:
    """
    문자열 입력값 검증 및 정리
    - XSS 방지를 위한 HTML 이스케이프
    - 길이 제한
    """
    if not isinstance(value, str):
        raise ValueError("Input must be a string")
    
    # HTML 특수문자 이스케이프 (XSS 방지)
    sanitized = escape(value)
    
    # 길이 제한
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized.strip()

def validate_email(email: str) -> str:
    """이메일 형식 검증"""
    if not email:
        raise ValueError("Email is required")
    
    # 기본 이메일 형식 검증
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        raise ValueError("Invalid email format")
    
    # 길이 제한
    if len(email) > 255:
        raise ValueError("Email is too long")
    
    return email.lower().strip()

def validate_google_id(google_id: str) -> str:
    """Google ID 검증 (숫자만 허용)"""
    if not google_id:
        raise ValueError("Google ID is required")
    
    # Google ID는 숫자 문자열
    if not google_id.isdigit():
        raise ValueError("Invalid Google ID format")
    
    if len(google_id) > 50:
        raise ValueError("Google ID is too long")
    
    return google_id

def validate_oauth_code(code: str) -> str:
    """OAuth authorization code 검증"""
    if not code:
        raise ValueError("Authorization code is required")
    
    # OAuth code는 URL-safe 문자열
    if not re.match(r'^[A-Za-z0-9_\-./]+$', code):
        raise ValueError("Invalid authorization code format")
    
    if len(code) > 500:
        raise ValueError("Authorization code is too long")
    
    return code

def validate_state(state: str) -> str:
    """OAuth state 파라미터 검증"""
    if not state:
        raise ValueError("State parameter is required")
    
    # state는 URL-safe base64 문자열
    if not re.match(r'^[A-Za-z0-9_\-]+$', state):
        raise ValueError("Invalid state parameter format")
    
    if len(state) < 10 or len(state) > 200:
        raise ValueError("Invalid state parameter length")
    
    return state

def sanitize_url(url: str) -> Optional[str]:
    """URL 검증 및 정리"""
    if not url:
        return None
    
    # 허용된 프로토콜만 허용
    allowed_protocols = ['http://', 'https://']
    if not any(url.startswith(protocol) for protocol in allowed_protocols):
        raise ValueError("Invalid URL protocol")
    
    # 길이 제한
    if len(url) > 2048:
        raise ValueError("URL is too long")
    
    return url.strip()
