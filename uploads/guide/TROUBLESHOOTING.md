# Google 로그인 문제 해결 가이드

## 문제 진단 체크리스트

### 1. 환경 변수 확인
`backend/.env` 파일에 다음 변수들이 올바르게 설정되어 있는지 확인:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/callback
```

### 2. Google Cloud Console 설정 확인

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택
3. "API 및 서비스" > "사용자 인증 정보"로 이동
4. OAuth 2.0 클라이언트 ID 확인
5. **승인된 리디렉션 URI**에 다음이 추가되어 있는지 확인:
   - `http://localhost:8000/auth/callback`

### 3. 데이터베이스 마이그레이션 확인

```bash
docker-compose exec backend alembic upgrade head
```

### 4. 백엔드 로그 확인

```bash
docker-compose logs backend
```

에러 메시지 확인:
- "Google OAuth is not configured" → 환경 변수 미설정
- "ModuleNotFoundError: No module named 'authlib'" → 패키지 미설치 (재빌드 필요)

### 5. 일반적인 문제 해결

#### 문제: "Google OAuth is not configured" 에러
**해결**: `backend/.env` 파일에 `GOOGLE_CLIENT_ID`와 `GOOGLE_CLIENT_SECRET` 설정

#### 문제: 리디렉션 URI 불일치
**해결**: Google Cloud Console의 승인된 리디렉션 URI와 `GOOGLE_REDIRECT_URI`가 정확히 일치해야 함

#### 문제: CORS 에러
**해결**: `backend/app/main.py`의 CORS 설정 확인

#### 문제: 데이터베이스 연결 실패
**해결**: 
```bash
docker-compose exec backend alembic upgrade head
```

### 6. 테스트 방법

1. 브라우저에서 http://localhost:3000 접속
2. "Sign in with Google" 버튼 클릭
3. Google 로그인 페이지로 리디렉션되는지 확인
4. 로그인 후 콜백이 정상적으로 처리되는지 확인

### 7. 디버깅

백엔드 API 직접 테스트:
```bash
# 로그인 시작
curl http://localhost:8000/auth/login

# 사용자 정보 확인 (토큰 필요)
curl "http://localhost:8000/auth/me?token=YOUR_TOKEN"
```

### 8. 재시작

문제가 계속되면:
```bash
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```
