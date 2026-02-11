# Insight Hub - Global Marketing Learning Platform

전세계 마케팅 직원들이 서로의 인사이트를 공유하고 학습할 수 있는 플랫폼입니다.

## 🚀 빠른 시작 (Quick Start)

### 1. 저장소 클론
```bash
git clone https://github.com/seogaag/learninglab.git
cd learninglab
```

### 2. 환경 변수 설정

`backend/.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@db:5432/insighthub

# Security Configuration
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/callback
```

> **Google OAuth 설정 방법**: [Google Cloud Console](https://console.cloud.google.com/)에서 OAuth 2.0 클라이언트 ID를 생성하고, 승인된 리디렉션 URI에 `http://localhost:8000/auth/callback`을 추가하세요.

### 3. 실행
```bash
docker-compose up --build
```

### 4. 접속
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs

> **참고**: 데이터베이스 마이그레이션은 자동으로 실행됩니다. 별도 설정이 필요 없습니다.

---

## 📋 주요 기능

- **Google SSO 로그인**: Google 계정으로 간편 로그인 (첫 로그인 시에만 권한 요청)
- **커뮤니티**: 게시글 작성, 댓글, 좋아요, 태그, 멘션 기능
- **클래스룸**: Google Workspace 코스 수강 및 학습 진도 추적
- **Calendar**: Google Calendar 이벤트 조회
- **Hub**: Google Drive 폴더 통합
- **관리자**: 배너, 코스, 페이지 섹션 관리

자세한 기능 명세는 [FRS.md](./FRS.md)를 참고하세요.

---

## 💻 사용 방법

### 로그인
1. 우측 상단의 "Sign in with Google" 버튼 클릭
2. Google 계정 선택 및 권한 승인
3. 첫 로그인 시에만 권한을 요청하며, 이후에는 자동으로 로그인됩니다

### 커뮤니티 사용하기

#### 게시글 작성
1. Community 페이지에서 "New Post" 버튼 클릭
2. 게시글 타입 선택 (Notice, Forum, Request)
3. 제목과 내용 입력
4. 태그 추가: `#태그명` 형식으로 입력
5. 멘션 추가: `@사용자이름` 형식으로 입력 (자동완성 지원)
6. 이미지 업로드 (선택사항)
7. "Post" 버튼 클릭

#### 멘션 기능
- 게시글 또는 댓글 작성 시 `@`를 입력하면 사용자 목록이 자동완성으로 표시됩니다
- 탭 키로 사용자를 선택할 수 있습니다
- 멘션된 게시글은 우측 상단의 "🔔 Mentions" 버튼으로 확인할 수 있습니다

#### Request 해결 상태
- Request 타입 게시글의 작성자는 "Mark as Resolved" 버튼으로 해결 상태를 설정할 수 있습니다
- 해결된 게시글은 회색 박스로 표시되며, 우측에 "✓ Resolved" 배지가 표시됩니다

#### SNS 임베드
- Instagram, Twitter, Threads 게시글 URL을 게시글 내용에 포함하면 자동으로 임베드됩니다

### 관리자 기능
1. `/admin/login` 페이지에서 관리자 계정으로 로그인
2. 배너, 코스, 페이지 섹션을 관리할 수 있습니다

---

## 🛠 개발 모드

### Backend 개발
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend 개발
```bash
cd frontend
npm install
npm start
```

---

## 📦 배포

### 다른 환경에서 배포하기

1. **저장소 클론**
   ```bash
   git clone https://github.com/seogaag/learninglab.git
   cd learninglab
   ```

2. **환경 변수 설정**
   - `backend/.env` 파일 생성 및 환경에 맞게 설정
   - `GOOGLE_REDIRECT_URI`는 배포 환경의 도메인에 맞게 변경

3. **Docker Compose 실행**
   ```bash
   docker-compose up --build -d
   ```

4. **관리자 계정 생성** (최초 1회)
   ```bash
   docker exec insighthub_backend python scripts/create_admin.py <username> <password> [email] [name]
   ```
   
   예시:
   ```bash
   # 기본 사용법 (username과 password 필수)
   docker exec insighthub_backend python scripts/create_admin.py admin mypassword123
   
   # 이메일과 이름 포함
   docker exec insighthub_backend python scripts/create_admin.py admin mypassword123 admin@example.com "Admin Name"
   ```
   
   > **참고**: 
   > - `username`: 관리자 사용자명 (필수)
   > - `password`: 관리자 비밀번호 (필수)
   > - `email`: 관리자 이메일 (선택)
   > - `name`: 관리자 이름 (선택)

5. **동작 확인**
   - Frontend, Backend API, API 문서 접속 확인
   - 관리자 로그인 테스트

---

## 🗄 데이터베이스

### 마이그레이션
- Docker Compose 실행 시 자동으로 최신 버전으로 마이그레이션이 실행됩니다
- 수동 실행이 필요한 경우:
  ```bash
  docker exec insighthub_backend alembic upgrade head
  ```

### 새 마이그레이션 생성
```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

---

## 📝 API 문서

FastAPI의 자동 생성 API 문서:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

모든 API 엔드포인트와 상세 명세는 Swagger UI에서 확인할 수 있습니다.

---

## 🐛 문제 해결

### 데이터베이스 연결 오류
- Docker 컨테이너가 정상적으로 실행 중인지 확인
- `backend/.env` 파일의 `DATABASE_URL`이 올바른지 확인

### OAuth 로그인 오류
- Google Cloud Console에서 OAuth 클라이언트 ID가 올바르게 설정되었는지 확인
- `GOOGLE_REDIRECT_URI`가 Google Cloud Console에 등록된 URI와 일치하는지 확인

### 마이그레이션 오류
- 데이터베이스가 정상적으로 실행 중인지 확인
- 수동으로 마이그레이션 실행:
  ```bash
  docker exec insighthub_backend alembic upgrade head
  ```

### 포트 충돌
- 다른 애플리케이션이 3000, 8000, 5432 포트를 사용 중인지 확인
- `docker-compose.yml`에서 포트를 변경할 수 있습니다

---

## 🛠 기술 스택

### Backend
- FastAPI (Python)
- PostgreSQL
- SQLAlchemy (ORM)
- Alembic (마이그레이션)
- Authlib (OAuth)

### Frontend
- React + TypeScript
- React Router
- Axios
- Context API

### DevOps
- Docker
- Docker Compose

---

## 📁 프로젝트 구조

```
learninglab/
├── backend/          # FastAPI 백엔드
│   ├── app/
│   │   ├── api/      # API 라우터
│   │   ├── models/   # 데이터베이스 모델
│   │   ├── schemas/  # Pydantic 스키마
│   │   └── core/     # 설정 및 유틸리티
│   └── alembic/      # 데이터베이스 마이그레이션
├── frontend/         # React 프론트엔드
│   └── src/
│       ├── pages/    # 페이지 컴포넌트
│       ├── components/ # 재사용 컴포넌트
│       └── services/  # API 서비스
└── docker-compose.yml
```

---

## 📚 추가 문서

- **[FRS.md](./FRS.md)**: 기능 요구사항 명세서
  - 모든 기능의 상세 요구사항
  - API 엔드포인트 상세 명세
  - 데이터베이스 스키마 정보
  - 비기능 요구사항

---

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 커밋 메시지 규칙

```
<type>: <subject>

<body>
```

**Type**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 생성해주세요.

## 📜 라이선스

이 프로젝트는 회사 내부 사용을 위한 프로젝트입니다.
