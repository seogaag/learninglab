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

## 3. 프로젝트 클론

```bash
# 프로젝트 클론 (gflab 또는 해당 저장소)
git clone https://github.com/julie-gpc/gflab.git
cd gflab
```

> 환경 변수는 GitHub Secrets에 설정하면 배포 시 자동으로 `backend/.env`와 루트 `.env`가 생성됩니다. 서버에 직접 파일을 만들 필요 없습니다.

## 4. GitHub Secrets 설정

1. GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** 추가:

### 배포용

| Secret 이름 | 설명 |
|-------------|------|
| `LIGHTSAIL_HOST` | Lightsail 인스턴스 퍼블릭 IP (예: 3.34.123.45) |
| `LIGHTSAIL_USER` | SSH 사용자 (보통 `ubuntu`) |
| `LIGHTSAIL_SSH_KEY` | SSH 비밀키 전체 내용 (.pem 파일 내용) |
| `LIGHTSAIL_APP_PATH` | 앱 경로 (예: `/home/ubuntu/gflab`) |

### 환경 변수 (배포 시 자동으로 .env 생성)

| Secret 이름 | 설명 |
|-------------|------|
| `POSTGRES_USER` | PostgreSQL 사용자 |
| `POSTGRES_PASSWORD` | PostgreSQL 비밀번호 |
| `POSTGRES_DB` | PostgreSQL DB명 (예: insighthub) |
| `VITE_API_URL` | 프론트엔드 API URL (같은 오리진이면 **시크릿을 만들지 않음** – 빈 값 처리됨) |
| `BACKEND_SECRET_KEY` | JWT/세션용 시크릿 키 |
| `BACKEND_FRONTEND_URL` | 프론트엔드 URL. IP/도메인 둘 다 쓰면 쉼표로 구분 (예: `https://your-domain.com,http://3.34.123.45`) |
| `BACKEND_GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `BACKEND_GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `BACKEND_GOOGLE_REDIRECT_URI` | OAuth 콜백 URL (예: https://your-domain.com/auth/callback) |

## 5. Lightsail 네트워크 설정

1. Lightsail 콘솔 → 인스턴스 → **Networking**
2. **Firewall**에서 포트 **80** (HTTP), **443** (HTTPS) 열기

## 6. 배포

- **자동**: `main` 브랜치에 push 시 자동 배포
- **수동**: GitHub → **Actions** → **Deploy to AWS Lightsail** → **Run workflow**

## 7. 접속

- `http://<인스턴스-IP>` 로 접속
- 도메인 연결 시: DNS A 레코드 → 인스턴스 IP

## 8. 관리자 로그인 문제 해결

관리자 로그인이 안 될 때:

1. **비밀번호 재설정** (특수문자 `*` 등이 shell에서 바뀌었을 수 있음):
   ```bash
   docker exec -it <backend_container_id> python scripts/create_admin.py julie-gpc '새비밀번호' --reset
   ```
   비밀번호는 반드시 **작은따옴표**로 감싸세요.

2. **새 관리자 생성** (특수문자 없는 비밀번호로 테스트):
   ```bash
   docker exec -it <backend_container_id> python scripts/create_admin.py admin2 'test123'
   ```
   그 후 `admin2` / `test123`으로 로그인 시도.

3. **백엔드 로그 확인** (요청이 백엔드까지 가는지):
   ```bash
   docker logs -f insighthub_backend
   ```
   로그인 시 `[ADMIN LOGIN] Request received`가 안 보이면 API 요청이 도달하지 않은 것입니다.

4. **브라우저 개발자 도구** → Network 탭에서 로그인 요청이 `POST /api/admin/login`으로 나가는지, 응답 코드는 무엇인지 확인.

## 9. 도메인 + SSL (Let's Encrypt)

### 9.1 사전 준비

1. 도메인 DNS A 레코드가 Lightsail 인스턴스 IP를 가리키는지 확인
2. GitHub Secrets에 프로덕션 URL 설정:
   - `BACKEND_FRONTEND_URL`: https://your-domain.com
   - `BACKEND_GOOGLE_REDIRECT_URI`: https://your-domain.com/auth/callback

### 9.2 인증서 발급 및 SSL 적용

```bash
# 1) HTTP로 먼저 배포 (nginx 실행됨)
docker compose -f docker-compose.prod.yml up -d

# 2) SSL 설정 스크립트 실행 (도메인, 이메일)
chmod +x scripts/setup-ssl.sh
./scripts/setup-ssl.sh your-domain.com admin@your-domain.com

# 3) SSL 적용 후 재시작
docker compose -f docker-compose.prod.yml -f docker-compose.ssl.yml up -d
```

### 9.3 수동 설정 (스크립트 대신)

1. `nginx/nginx-ssl.conf`에서 `YOUR_DOMAIN`을 실제 도메인으로 치환
2. certbot으로 인증서 발급:

```bash
# certbot_www 볼륨명 확인
CERTBOT_VOL=$(docker volume ls -q | grep certbot_www)
docker run --rm \
  -v "${CERTBOT_VOL}:/var/www/certbot" \
  -v /etc/letsencrypt:/etc/letsencrypt \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d your-domain.com --email admin@your-domain.com --agree-tos -n
```

3. SSL Compose로 재시작:

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.ssl.yml up -d
```

### 9.4 인증서 갱신 (자동화)

Let's Encrypt 인증서는 90일 유효. crontab 예시:

```bash
# 매일 새벽 3시 갱신 시도
0 3 * * * cd /home/ubuntu/learninglab && docker run --rm -v $(docker volume ls -q | grep certbot_www):/var/www/certbot -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot renew && docker compose -f docker-compose.prod.yml -f docker-compose.ssl.yml exec nginx nginx -s reload
```
