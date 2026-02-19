# AWS Lightsail + GitHub Actions 배포 가이드

## 1. Lightsail 인스턴스 생성

1. [AWS Lightsail 콘솔](https://lightsail.aws.amazon.com/) 접속
2. **Create instance** → Linux/Unix, Ubuntu 22.04 LTS
3. 인스턴스 플랜 선택 (최소 $10/월 권장)
4. **Create instance** 클릭

## 2. 초기 서버 설정 (최초 1회)

SSH로 접속 후 아래 명령 실행:

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose v2 (docker compose)
sudo apt install docker-compose-plugin -y

# Git 설치
sudo apt install git -y

# 재로그인 (docker 그룹 적용)
exit
# 다시 SSH 접속
```

## 3. 프로젝트 클론 및 환경 변수

```bash
# 프로젝트 클론
git clone https://github.com/seogaag/learninglab.git
cd learninglab

# 백엔드 환경 변수
nano backend/.env
```

`backend/.env` 예시:

```env
DATABASE_URL=postgresql://user:password@db:5432/insighthub
SECRET_KEY=your-production-secret-key-change-this
FRONTEND_URL=https://your-domain.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/auth/callback
# 선택: Hub Drive 접근용
# GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/service-account.json
```

프로젝트 루트 `.env` (docker-compose.prod용):

```bash
cp .env.example .env   # 또는 직접 생성
nano .env
```

```env
POSTGRES_USER=user
POSTGRES_PASSWORD=strong-password-here
POSTGRES_DB=insighthub
VITE_API_URL=
```

## 4. GitHub Secrets 설정

1. GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** 추가:

| Secret 이름 | 설명 |
|-------------|------|
| `LIGHTSAIL_HOST` | Lightsail 인스턴스 퍼블릭 IP (예: 3.34.123.45) |
| `LIGHTSAIL_USER` | SSH 사용자 (보통 `ubuntu`) |
| `LIGHTSAIL_SSH_KEY` | SSH 비밀키 전체 내용 (.pem 파일 내용) |
| `LIGHTSAIL_APP_PATH` | 앱 경로 (예: `/home/ubuntu/learninglab`) |

## 5. Lightsail 네트워크 설정

1. Lightsail 콘솔 → 인스턴스 → **Networking**
2. **Firewall**에서 포트 **80** (HTTP) 열기

## 6. 배포

- **자동**: `main` 브랜치에 push 시 자동 배포
- **수동**: GitHub → **Actions** → **Deploy to AWS Lightsail** → **Run workflow**

## 7. 접속

- `http://<인스턴스-IP>` 로 접속
- 도메인 연결 시: DNS A 레코드 → 인스턴스 IP, SSL(HTTPS) 추가 권장

## 8. 도메인 + SSL (선택)

도메인 연결 후 Let's Encrypt로 HTTPS 적용하려면 nginx 설정에 SSL을 추가하면 됩니다.
