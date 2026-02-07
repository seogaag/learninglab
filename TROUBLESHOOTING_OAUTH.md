# OAuth 인증 문제 해결 가이드

## "Failed to get user information from Google" 오류

이 오류가 발생하는 경우 다음을 확인하세요:

### 1. Google Cloud Console 설정 확인

**필수 확인 사항:**
- ✅ OAuth 2.0 클라이언트 ID가 생성되어 있는가?
- ✅ 승인된 리디렉션 URI에 `http://localhost:8000/auth/callback`이 정확히 등록되어 있는가?
- ✅ OAuth 동의 화면이 설정되어 있는가?
- ✅ 테스트 사용자가 추가되어 있는가? (내부 앱인 경우)

**리디렉션 URI 확인:**
- `http://localhost:8000/auth/callback` (정확히 일치해야 함)
- `http://127.0.0.1:8000/auth/callback`은 다른 것으로 인식됨

### 2. 환경 변수 확인

`backend/.env` 파일에 다음이 설정되어 있는지 확인:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/callback
```

### 3. 로그 확인

백엔드 로그에서 다음 정보를 확인:

```bash
docker-compose logs backend --tail 100
```

다음 메시지들을 찾아보세요:
- `Token exchange failed:` - 토큰 교환 실패
- `User info API response:` - 사용자 정보 API 응답 상태
- `User info received:` - 받은 사용자 정보 필드
- `Extracted user data:` - 추출된 사용자 데이터

### 4. 일반적인 문제와 해결책

**문제: "Invalid access token"**
- 원인: 토큰 교환 실패 또는 만료된 토큰
- 해결: 다시 로그인 시도

**문제: "Missing id or email"**
- 원인: Google API 응답에 필수 필드가 없음
- 해결: OAuth 스코프에 `email`과 `profile`이 포함되어 있는지 확인

**문제: "Invalid response format"**
- 원인: Google API 응답이 JSON이 아님
- 해결: 네트워크 문제 또는 API 엔드포인트 변경 확인

### 5. OAuth 스코프 확인

현재 요청하는 스코프:
- `openid`
- `email`
- `profile`
- `https://www.googleapis.com/auth/classroom.courses.readonly`
- `https://www.googleapis.com/auth/classroom.coursework.me.readonly`
- `https://www.googleapis.com/auth/calendar.readonly`

### 6. 디버깅 단계

1. **로그인 시도**
   ```bash
   # 브라우저에서 http://localhost:3000 접속
   # "Sign in with Google" 클릭
   ```

2. **로그 확인**
   ```bash
   docker-compose logs backend -f
   ```

3. **에러 메시지 확인**
   - 브라우저 개발자 도구 → Network 탭
   - `/auth/callback` 요청 확인
   - 응답 본문에서 상세 에러 메시지 확인

### 7. 보안 주의사항

⚠️ **절대 하지 말아야 할 것:**
- 클라이언트에 민감한 정보(토큰, 시크릿) 노출
- 보안 검증 우회
- 에러 메시지에 민감한 정보 포함

✅ **권장 사항:**
- 모든 에러는 서버 로그에만 상세 기록
- 클라이언트에는 일반적인 에러 메시지만 전달
- 프로덕션에서는 적절한 로깅 시스템 사용
