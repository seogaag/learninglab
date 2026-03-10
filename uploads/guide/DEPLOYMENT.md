# 배포 가이드 (Deployment Guide)

## 프로젝트 구조 분석

현재 프로젝트는 다음과 같은 구성입니다:
- **백엔드**: FastAPI (Python) - 포트 8000
- **프론트엔드**: React + Vite (TypeScript) - 포트 3000
- **데이터베이스**: PostgreSQL
- **컨테이너**: Docker Compose 사용
- **파일 저장**: 로컬 파일 시스템 (uploads 디렉토리)
- **인증**: Google OAuth 2.0

## 배포 옵션 비교

### 1. AWS Lightsail ⭐ 추천

**장점:**
- ✅ Docker Compose 직접 지원
- ✅ PostgreSQL 컨테이너 실행 가능
- ✅ 고정 가격 ($5~40/월)
- ✅ 간단한 서버 관리
- ✅ 파일 업로드 저장소 제공
- ✅ SSL 인증서 자동 관리 (Let's Encrypt)
- ✅ 스냅샷 백업 기능

**단점:**
- ❌ 수동 스케일링
- ❌ 서버 관리 필요 (보안 패치 등)

**적합한 경우:**
- 중소규모 프로젝트
- 예측 가능한 트래픽
- Docker Compose 그대로 사용하고 싶은 경우

**예상 비용:**
- $10/월 (1GB RAM, 1 vCPU) - 소규모
- $20/월 (2GB RAM, 1 vCPU) - 중규모
- $40/월 (4GB RAM, 2 vCPU) - 대규모

---

### 2. Railway ⭐ 추천 (간단함)

**장점:**
- ✅ Docker Compose 지원
- ✅ PostgreSQL 플러그인 제공
- ✅ 자동 배포 (Git 연동)
- ✅ 간단한 설정
- ✅ 무료 티어 제공 ($5 크레딧/월)
- ✅ 환경 변수 관리 쉬움

**단점:**
- ❌ 파일 저장소 제한 (S3 등 외부 저장소 권장)
- ❌ 비용이 사용량 기반

**적합한 경우:**
- 빠른 배포가 필요한 경우
- 소규모 프로젝트
- 파일 업로드를 S3로 변경 가능한 경우

**예상 비용:**
- 무료 티어: $5 크레딧/월 (제한적)
- 유료: 사용량 기반 ($0.000463/GB RAM/시간)

---

### 3. Render

**장점:**
- ✅ Docker 지원
- ✅ PostgreSQL 제공
- ✅ 무료 티어 (제한적)
- ✅ 자동 배포
- ✅ SSL 자동 설정

**단점:**
- ❌ 무료 티어는 15분 비활성 시 슬리프 모드
- ❌ 파일 저장소 제한

**예상 비용:**
- 무료: 제한적 (슬리프 모드)
- 유료: $7/월 (서비스) + $7/월 (PostgreSQL)

---

### 4. Vercel (프론트엔드만)

**장점:**
- ✅ 프론트엔드 배포 최적화
- ✅ 무료 티어
- ✅ 자동 배포
- ✅ CDN 제공

**단점:**
- ❌ 백엔드 제한적 (Serverless Functions만)
- ❌ PostgreSQL 직접 지원 안 함
- ❌ 파일 업로드 제한
- ❌ Docker Compose 사용 불가

**적합한 경우:**
- 프론트엔드만 배포하고 백엔드는 별도로 운영하는 경우

---

### 5. AWS ECS/Fargate

**장점:**
- ✅ 완전 관리형 컨테이너 서비스
- ✅ 자동 스케일링
- ✅ 높은 확장성
- ✅ RDS PostgreSQL 지원

**단점:**
- ❌ 복잡한 설정
- ❌ 비용이 높음
- ❌ 학습 곡선

**적합한 경우:**
- 대규모 프로젝트
- 높은 트래픽 예상
- AWS 생태계 활용

---

## 추천 배포 전략

### 옵션 1: AWS Lightsail (가장 추천) ⭐

**이유:**
1. Docker Compose 그대로 사용 가능
2. PostgreSQL 컨테이너 실행 가능
3. 파일 업로드 저장소 제공
4. 고정 가격으로 예측 가능
5. 설정이 비교적 간단

**배포 단계:**
1. Lightsail 인스턴스 생성 (Ubuntu 22.04)
2. Docker 및 Docker Compose 설치
3. Git 저장소 클론
4. 환경 변수 설정
5. `docker-compose up -d` 실행

**필요한 작업:**
- 환경 변수 설정 (`.env` 파일)
- Google OAuth 리디렉션 URI 업데이트
- 도메인 연결 (선택사항)
- SSL 인증서 설정 (Let's Encrypt)

---

### 옵션 2: Railway (간단한 배포) ⭐

**이유:**
1. 가장 빠른 배포
2. Git 연동으로 자동 배포
3. PostgreSQL 플러그인 제공
4. 무료 티어로 시작 가능

**필요한 작업:**
- 파일 업로드를 S3 또는 외부 저장소로 변경
- Railway에 프로젝트 연결
- PostgreSQL 플러그인 추가
- 환경 변수 설정

---

### 옵션 3: 하이브리드 (프론트엔드 + 백엔드 분리)

**구성:**
- **프론트엔드**: Vercel 또는 Netlify
- **백엔드**: AWS Lightsail 또는 Railway
- **데이터베이스**: AWS RDS 또는 Railway PostgreSQL

**장점:**
- 프론트엔드 CDN 활용
- 백엔드 독립적 스케일링
- 비용 최적화 가능

**단점:**
- CORS 설정 필요
- 두 플랫폼 관리

---

## 배포 전 준비사항

### 1. 환경 변수 설정

**백엔드 `.env`:**
```env
DATABASE_URL=postgresql://user:password@db:5432/insighthub
SECRET_KEY=your-production-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/callback
```

**프론트엔드 `.env`:**
```env
VITE_API_URL=https://api.yourdomain.com
```

### 2. Google OAuth 설정

1. Google Cloud Console에서 리디렉션 URI 추가:
   - 프로덕션: `https://yourdomain.com/auth/callback`
   - 개발: `http://localhost:8000/auth/callback`

### 3. 프로덕션 Docker Compose 설정

`docker-compose.prod.yml` 생성 (선택사항):
- `--reload` 제거
- 볼륨 마운트 제거
- 환경 변수 파일 분리

---

## AWS Lightsail 배포 가이드

### 1. 인스턴스 생성

1. AWS Lightsail 콘솔 접속
2. "Create instance" 클릭
3. 플랫폼: Linux/Unix
4. 블루프린트: Ubuntu 22.04 LTS
5. 인스턴스 플랜 선택 (최소 $10/월 권장)
6. 인스턴스 이름 설정
7. "Create instance" 클릭

### 2. 서버 설정

```bash
# SSH 접속
ssh -i your-key.pem ubuntu@your-instance-ip

# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Git 설치
sudo apt install git -y
```

### 3. 프로젝트 배포

```bash
# 프로젝트 클론
git clone https://github.com/seogaag/learninglab.git
cd learninglab

# 환경 변수 설정
nano backend/.env
# .env 파일 내용 입력

# Docker Compose 실행
docker-compose -f docker-compose.yml up -d --build
```

### 4. 도메인 연결 (선택사항)

1. Lightsail에서 Static IP 생성
2. 도메인 DNS 설정 (A 레코드)
3. SSL 인증서 설정 (Let's Encrypt)

---

## Railway 배포 가이드

### 1. 프로젝트 준비

1. Railway 계정 생성 (https://railway.app)
2. "New Project" > "Deploy from GitHub repo"
3. 저장소 선택

### 2. 서비스 설정

1. **PostgreSQL 추가:**
   - "New" > "Database" > "Add PostgreSQL"
   - 연결 정보 복사

2. **백엔드 서비스:**
   - "New" > "GitHub Repo" 선택
   - Root Directory: `backend`
   - Build Command: (자동 감지)
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - 환경 변수 설정

3. **프론트엔드 서비스:**
   - "New" > "GitHub Repo" 선택
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Start Command: `npm run preview`
   - 환경 변수: `VITE_API_URL` 설정

### 3. 파일 저장소 변경 (필수)

Railway는 파일 시스템이 임시이므로 S3 또는 외부 저장소 사용 필요:

```python
# backend/app/api/admin_upload.py 수정 필요
# S3 또는 Cloudinary 등으로 변경
```

---

## 비용 비교 (월간 예상)

| 플랫폼 | 소규모 | 중규모 | 대규모 |
|--------|--------|--------|--------|
| **AWS Lightsail** | $10 | $20 | $40 |
| **Railway** | $5-15 | $20-40 | $50-100 |
| **Render** | $14 | $25 | $50+ |
| **Vercel (FE) + Lightsail (BE)** | $10 | $20 | $40 |

---

## 최종 추천

### 소규모 프로젝트 (사용자 < 100명)
**Railway** - 빠른 배포, 무료 티어로 시작

### 중규모 프로젝트 (사용자 100-1000명)
**AWS Lightsail** - 안정적, 고정 가격, Docker Compose 그대로 사용

### 대규모 프로젝트 (사용자 1000명+)
**AWS ECS/Fargate + RDS** - 확장성, 자동 스케일링

---

## 다음 단계

1. 배포 플랫폼 선택
2. 프로덕션 환경 변수 준비
3. Google OAuth 리디렉션 URI 업데이트
4. 배포 스크립트 작성 (필요시)
5. 모니터링 설정 (선택사항)

---

## 참고 자료

- [AWS Lightsail 문서](https://docs.aws.amazon.com/lightsail/)
- [Railway 문서](https://docs.railway.app/)
- [Render 문서](https://render.com/docs)
- [Vercel 문서](https://vercel.com/docs)
