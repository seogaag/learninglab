# API 연결 검증 가이드 (Classroom & Drive)

로그인 후 **Classroom(My 탭)**과 **Drive 폴더**가 안 보일 때 점검 항목입니다.

---

## 1. 검증 스크립트 실행

서버(Lightsail 인스턴스) 또는 로컬에서:

```bash
cd backend
python -m scripts.verify_api_connection julie-gpc@globalgn.org
```

전체 사용자 검증:

```bash
python -m scripts.verify_api_connection
```

결과 예시:
- `refresh_token: 없음` → 로그아웃 후 재로그인 필요
- `Classroom API: 실패 - 403 Forbidden` → Google Cloud Console 설정 확인
- `Drive API: 실패 - 404` → 해당 Drive 폴더를 사용자 계정과 공유해야 함

---

## 2. Google Cloud Console 점검

### 2.1 API 활성화
- [API 및 서비스 > 라이브러리](https://console.cloud.google.com/apis/library)
- **Google Classroom API** → 사용
- **Google Drive API** → 사용

### 2.2 OAuth 동의 화면
- [API 및 서비스 > OAuth 동의 화면](https://console.cloud.google.com/apis/credentials/consent)
- **범위**에 다음이 포함되는지 확인:
  - `classroom.courses.readonly`
  - `classroom.coursework.me.readonly`
  - `drive.readonly`
  - `drive.file`
  - `calendar.readonly`

### 2.3 테스트 사용자 (앱이 "테스트" 모드일 때)
- **테스트 사용자**에 `julie-gpc@globalgn.org` 등 실제 사용 이메일 추가
- 없으면 권한 요청 화면이 뜨지 않아 새 scope를 받을 수 없음

### 2.4 OAuth 클라이언트
- **승인된 리디렉션 URI**에 프로덕션 URL 포함:
  - `https://d3sdbbcgd4ztxv.cloudfront.net/api/auth/callback` 또는
  - Lightsail 백엔드 직접 URL: `https://<your-domain>/auth/callback`

---

## 3. 환경 변수 (프로덕션)

`.env` 또는 Lightsail 인스턴스 환경 변수:

| 변수 | 설명 |
|------|------|
| GOOGLE_CLIENT_ID | OAuth 클라이언트 ID |
| GOOGLE_CLIENT_SECRET | OAuth 클라이언트 시크릿 |
| GOOGLE_REDIRECT_URI | 콜백 URL (프로덕션 도메인) |
| FRONTEND_URL | 프론트엔드 URL |

`GOOGLE_REDIRECT_URI`는 **실제 OAuth 콜백이 도달하는 URL**이어야 합니다.
- CloudFront가 `/api/*`를 백엔드로 보내면: `https://d3sdbbcgd4ztxv.cloudfront.net/api/auth/callback`
- 또는 nginx/Lightsail 백엔드 직접 URL

---

## 4. Drive 폴더 공유

Hub에서 사용하는 폴더 ID: `0AFTJRkjnxrwNUk9PVA`

- 이 폴더를 **로그인한 사용자 계정**과 **편집자** 또는 **뷰어**로 공유해야 합니다.
- 현재는 서비스 계정이 아닌 **개인 Google 계정**으로 접근합니다.

---

## 5. refresh_token과 권한

- Google은 **처음 동의 시** 또는 **prompt=consent**로 다시 로그인할 때만 `refresh_token`을 줍니다.
- 이전 로그인에 Classroom/Drive scope가 빠져 있으면, `refresh_token`에 해당 권한이 없습니다.
- **해결**: 로그아웃 후 재로그인하고, 권한 요청 화면에서 Classroom·Drive 권한을 모두 허용합니다.

---

## 6. 확인이 필요한 사항 (질문)

1. **GOOGLE_REDIRECT_URI**  
   프로덕션에서 실제로 사용 중인 값이 무엇인가요?  
   (예: CloudFront `https://.../api/auth/callback` vs Lightsail `https://.../auth/callback`)

2. **OAuth 동의 화면 게시 상태**  
   앱이 "테스트"인가요, "프로덕션"인가요?  
   테스트라면 `julie-gpc@globalgn.org`가 테스트 사용자로 등록되어 있나요?

3. **Drive 폴더 소유/공유**  
   `0AFTJRkjnxrwNUk9PVA`는 누구 계정의 Drive 폴더인가요?  
   `julie-gpc@globalgn.org`와 해당 폴더가 실제로 공유되어 있나요?

4. **검증 스크립트 실행 결과**  
   위 스크립트를 `julie-gpc@globalgn.org`로 실행했을 때 출력 결과를 알려주실 수 있나요?
