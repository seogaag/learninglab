
# Insight Hub - Global Marketing Learning Platform

전세계 마케팅 직원들이 서로의 인사이트를 공유하고 학습할 수 있는 플랫폼입니다.

## 📋 프로젝트 개요

Insight Hub는 글로벌 마케팅 팀을 위한 통합 학습 및 커뮤니티 플랫폼입니다. 직원들이 강의를 수강하고, 학습 진도를 관리하며, 동료들과 인사이트를 공유할 수 있는 환경을 제공합니다.

### 주요 기능

- **메인 페이지**: 플랫폼 소개 및 주요 콘텐츠 소개
- **클래스룸 페이지**: 강의 수강, 학습 진도 추적, 코스 관리
- **커뮤니티 허브**: 인사이트 공유, 파일 요청, 커뮤니티 게시판
- **Google SSO 로그인**: Google 계정으로 간편 로그인

## 🛠 기술 스택

### Backend
- **FastAPI**: Python 기반 고성능 웹 프레임워크
- **PostgreSQL**: 관계형 데이터베이스
- **SQLAlchemy**: ORM
- **Alembic**: 데이터베이스 마이그레이션
- **Authlib**: OAuth 인증

### Frontend
- **React**: 사용자 인터페이스 구축
- **TypeScript**: 타입 안정성
- **React Router**: 라우팅
- **Axios**: HTTP 클라이언트
- **Context API**: 인증 상태 관리

### DevOps
- **Docker**: 컨테이너화
- **Docker Compose**: 멀티 컨테이너 오케스트레이션

## 📁 프로젝트 구조

```
learninglab/
├── backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py         # FastAPI 애플리케이션 진입점
│   │   ├── models/         # 데이터베이스 모델
│   │   ├── schemas/        # Pydantic 스키마
│   │   ├── api/            # API 라우터
│   │   │   └── auth.py     # 인증 API
│   │   ├── core/           # 설정 및 유틸리티
│   │   │   ├── config.py   # 환경 설정
│   │   │   └── security.py # 보안 유틸리티
│   │   └── db/             # 데이터베이스 연결
│   ├── requirements.txt
│   ├── Dockerfile
│   └── alembic/            # 데이터베이스 마이그레이션
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/     # 재사용 가능한 컴포넌트
│   │   ├── contexts/       # Context API
│   │   │   └── AuthContext.tsx # 인증 상태 관리
│   │   ├── pages/          # 페이지 컴포넌트
│   │   │   ├── Home/       # 메인 페이지
│   │   │   ├── Classroom/  # 클래스룸 페이지
│   │   │   ├── Community/  # 커뮤니티 허브 페이지
│   │   │   └── AuthCallback.tsx # OAuth 콜백 처리
│   │   ├── services/       # API 서비스
│   │   ├── hooks/          # 커스텀 훅
│   │   └── App.tsx
│   ├── package.json
│   ├── Dockerfile
│   └── tsconfig.json
├── docker-compose.yml      # Docker Compose 설정
├── .gitignore
└── README.md
```

## 🚀 시작하기

### 사전 요구사항

- Docker 및 Docker Compose 설치
- Git 설치
- Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성

### Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" > "사용자 인증 정보"로 이동
4. "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" 선택
5. 애플리케이션 유형: "웹 애플리케이션"
6. 승인된 리디렉션 URI 추가:
   - `http://localhost:8000/auth/callback`
7. 클라이언트 ID와 클라이언트 시크릿 복사

### 설치 및 실행

1. **저장소 클론**
   ```bash
   git clone https://github.com/seogaag/learninglab.git
   cd learninglab
   ```

2. **환경 변수 설정**
   
   `backend/.env` 파일 생성 (docker-compose.yml에서 자동으로 로드됨):
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

   # Hub 403 해결: 공유 Drive 폴더 접근용 (선택)
   # 1) 서비스 계정 JSON 파일 경로
   GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/service-account.json
   # 2) 또는 JSON 문자열 직접 지정
   # GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   ```
   - **Hub 403 해결**: `GOOGLE_APPLICATION_CREDENTIALS` 또는 `GOOGLE_SERVICE_ACCOUNT_JSON` 설정 후, 해당 Drive 폴더를 서비스 계정 이메일(xxx@project.iam.gserviceaccount.com)과 "뷰어"로 공유하세요.
   - **Hub 업로드**: 드래그앤드롭 업로드가 되려면 폴더를 서비스 계정과 **"편집자"**로 공유하세요.
   
   > **참고**: `backend/.env` 파일은 docker-compose.yml의 `env_file` 설정을 통해 자동으로 로드됩니다. 
   > 모든 환경 변수는 이 파일에서 관리할 수 있습니다.

   `frontend/.env` 파일 생성 (선택사항):
   ```env
   VITE_API_URL=http://localhost:8000
   ```

3. **Docker Compose로 실행**
   ```bash
   docker-compose up --build -d
   ```

4. **데이터베이스 마이그레이션 (최초 1회)**
   ```bash
   docker exec insighthub_backend alembic upgrade head
   ```

5. **관리자 계정 생성 (최초 1회)**
   ```bash
   docker exec insighthub_backend python scripts/create_admin_seoag68.py
   ```

6. **애플리케이션 접속**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API 문서: http://localhost:8000/docs

### DB 처음부터 다시 구성

기존 DB를 버리고 깨끗한 상태로 다시 시작할 때:

**Windows (PowerShell):**
```powershell
.\scripts\reset-db.ps1
```

**Linux / Mac:**
```bash
chmod +x scripts/reset-db.sh
./scripts/reset-db.sh
```

수동 실행:
```bash
docker-compose down -v
docker-compose up -d
# 15초 대기 후
docker exec insighthub_backend alembic upgrade head
docker exec insighthub_backend python scripts/create_admin_seoag68.py
```

**"Can't locate revision 002_sequences" 오류 시:**
```bash
docker exec insighthub_backend python scripts/fix_alembic_and_posts.py
docker exec insighthub_backend alembic upgrade head
```

### 개발 모드 실행

#### Backend 개발
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend 개발
```bash
cd frontend
npm install
npm start
```

## 🔐 인증

### Google SSO 로그인

1. "Sign in with Google" 버튼 클릭
2. Google 계정 선택 및 권한 승인
3. 자동으로 로그인 처리 및 사용자 정보 저장

### 로그인 상태

- **비로그인 상태**: "Sign in with Google" 버튼 표시
- **로그인 상태**: 사용자 프로필 이미지, 이름, 드롭다운 메뉴 표시
  - My Profile
  - Settings
  - Sign Out

## 📝 API 문서

FastAPI의 자동 생성 API 문서:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 주요 API 엔드포인트

- `GET /auth/login` - Google OAuth 로그인 시작
- `GET /auth/callback` - OAuth 콜백 처리
- `GET /auth/me` - 현재 사용자 정보 조회
- `POST /auth/logout` - 로그아웃

## 🗄 데이터베이스 마이그레이션

```bash
cd backend
alembic upgrade head
```

새 마이그레이션 생성:
```bash
alembic revision --autogenerate -m "description"
```

## 🧪 테스트

### Backend 테스트
```bash
cd backend
pytest
```

### Frontend 테스트
```bash
cd frontend
npm test
```

## 📦 다른 환경에서 배포할 때 순서

다른 서버나 PC에서 이 프로젝트를 처음 배포할 때는 아래 순서를 따르세요.

### 1. 저장소 클론 및 이동
```bash
git clone https://github.com/seogaag/learninglab.git
cd learninglab
```

### 2. 환경 변수 설정
- `backend/.env` 파일을 생성하고 다음 항목을 채웁니다.
  - **DATABASE_URL**: 해당 환경의 PostgreSQL 연결 문자열 (Docker 사용 시 `postgresql://user:password@db:5432/insighthub`)
  - **SECRET_KEY**, **ALGORITHM**, **ACCESS_TOKEN_EXPIRE_MINUTES**
  - **FRONTEND_URL**: 프론트엔드 주소 (예: `http://localhost:3000`, 배포 시 `https://your-domain.com`)
  - **GOOGLE_CLIENT_ID**, **GOOGLE_CLIENT_SECRET**, **GOOGLE_REDIRECT_URI** (해당 환경의 도메인/포트에 맞게 설정)
- (선택) `frontend/.env`에 **VITE_API_URL**을 해당 환경의 백엔드 URL로 설정

> **Google SSO "test로 이동" 표시**: Google Cloud Console에서 앱이 '테스트' 상태면 나타날 수 있습니다. '프로덕션'으로 게시하거나, 테스트 사용자에 본인 계정을 추가하면 해결됩니다.

### 3. Docker Compose로 서비스 실행
```bash
docker-compose up --build -d
```
- DB가 먼저 기동되고, 백엔드·프론트엔드가 순서대로 올라갑니다.

### 4. 데이터베이스 테이블 생성 (최초 1회)
- Alembic 마이그레이션 파일이 있는 경우:
  ```bash
  docker exec insighthub_backend alembic upgrade head
  ```
- 마이그레이션이 없거나 `admins` 등 테이블이 없으면, 백엔드에서 모델 기준으로 테이블을 생성하는 스크립트를 실행합니다.

### 5. 관리자 계정 생성 (최초 1회)
```bash
docker exec insighthub_backend python scripts/create_admin_seoag68.py
```
- 다른 아이디/비밀번호가 필요하면 `scripts/create_admin.py` 인자로 지정해 실행합니다.

### 6. 업로드 디렉터리
- 백엔드가 이미지를 저장하는 `uploads` 디렉터리가 호스트에 없으면 생성해 두거나, `docker-compose.yml`의 volume 경로를 해당 환경에 맞게 수정합니다.

### 7. 동작 확인
- Frontend: 설정한 주소 (예: http://localhost:3000)
- Backend API: 설정한 주소 (예: http://localhost:8000)
- API 문서: http://localhost:8000/docs
- 관리자 로그인: `/admin/login`에서 생성한 계정으로 로그인

---

프로덕션 배포 시 별도 설정 파일 사용 예:
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 커밋 메시지 규칙

커밋 메시지는 다음 형식을 따릅니다:

```
<type>: <subject>
<body>
<footer>
```

### Type
- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `build`: 빌드 관련 수정
- `chore`: 기타 수정 (패키지 매니저 등)
- `ci`: CI 설정 수정
- `docs`: 문서 수정
- `style`: 코드 스타일, 포맷팅
- `refactor`: 코드 리팩터링
- `test`: 테스트 코드 추가/수정
- `release`: 버전 릴리즈

### 예시
```
feat: Add login API

Implement user authentication with JWT tokens.
Add login endpoint at /api/auth/login.

Issues #123
```

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 생성해주세요.

## 📜 라이선스

이 프로젝트는 회사 내부 사용을 위한 프로젝트입니다.
