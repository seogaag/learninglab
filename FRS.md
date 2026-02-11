# 기능 요구사항 명세서 (Functional Requirements Specification)

## 문서 정보
- **프로젝트명**: Insight Hub - Global Marketing Learning Platform
- **버전**: 1.0.0
- **작성일**: 2024-01-03
- **최종 수정일**: 2024-01-03

---

## 1. 개요

### 1.1 프로젝트 목적
전세계 마케팅 직원들이 서로의 인사이트를 공유하고 학습할 수 있는 통합 플랫폼을 제공합니다.

### 1.2 주요 목표
- 직원 간 지식 공유 및 협업 촉진
- 학습 콘텐츠 관리 및 추적
- 커뮤니티 기반 인사이트 공유
- Google Workspace 통합

---

## 2. 인증 및 사용자 관리

### 2.1 Google OAuth SSO 로그인
**요구사항 ID**: AUTH-001

**설명**: Google 계정을 사용한 단일 로그인(SSO) 기능

**기능 상세**:
- "Sign in with Google" 버튼을 통한 로그인 시작
- Google 계정 선택 및 권한 승인
- 첫 로그인 시에만 권한 요청 (이후 자동 로그인)
- Refresh token을 통한 자동 로그인 유지
- 사용자 정보 자동 저장 (이름, 이메일, 프로필 이미지)

**비기능 요구사항**:
- OAuth 2.0 표준 준수
- JWT 토큰 기반 인증
- 토큰 만료 시간: 30분

**우선순위**: 높음

---

### 2.2 사용자 프로필 관리
**요구사항 ID**: AUTH-002

**설명**: 로그인한 사용자의 프로필 정보 표시 및 관리

**기능 상세**:
- 우측 상단에 프로필 이미지 및 이름 표시
- 프로필 클릭 시 드롭다운 메뉴 표시
  - 사용자 정보 (이름, 이메일)
  - Settings (Google 계정 설정 페이지로 이동)
  - Sign Out
- 외부 클릭 시 드롭다운 자동 닫힘

**우선순위**: 높음

---

### 2.3 관리자 인증
**요구사항 ID**: AUTH-003

**설명**: 관리자 전용 로그인 시스템

**기능 상세**:
- 관리자 전용 로그인 페이지 (`/admin/login`)
- 사용자명/비밀번호 기반 인증
- 관리자 토큰 발급
- 관리자 정보 조회 API

**우선순위**: 중간

---

## 3. 메인 페이지 (Home)

### 3.1 배너 슬라이더
**요구사항 ID**: HOME-001

**설명**: 메인 페이지 상단 배너 슬라이더

**기능 상세**:
- 관리자가 등록한 배너 이미지 자동 슬라이드
- 활성화된 배너만 표시
- 순서(order)에 따른 정렬
- 배너가 없는 경우 흰색 배경 표시
- 자동 전환 및 수동 네비게이션 지원

**우선순위**: 높음

---

### 3.2 Working Together 섹션
**요구사항 ID**: HOME-002

**설명**: 협업 프로젝트 소개 섹션

**기능 상세**:
- 여러 프로젝트의 이미지 갤러리 표시
- 프로젝트별 이미지 자동 슬라이드
- 프로젝트명 표시

**우선순위**: 중간

---

### 3.3 Testimonials 섹션
**요구사항 ID**: HOME-003

**설명**: 사용자 후기 섹션

**기능 상세**:
- 사용자 후기 카드 표시
- 이름, 역할, 평가 점수, 후기 내용 표시

**우선순위**: 낮음

---

## 4. 클래스룸 (Classroom)

### 4.1 코스 목록 조회
**요구사항 ID**: CLASS-001

**설명**: Google Workspace 코스 목록 표시

**기능 상세**:
- 사용자가 등록한 Google Workspace 코스 목록 조회
- 코스 정보 표시 (제목, 설명, 상태 등)
- Google Calendar API 연동

**우선순위**: 높음

---

### 4.2 코스워크 조회
**요구사항 ID**: CLASS-002

**설명**: 특정 코스의 과제 및 코스워크 조회

**기능 상세**:
- 코스 ID를 통한 코스워크 목록 조회
- 과제 정보 표시 (제목, 설명, 마감일, 상태 등)
- Google Classroom API 연동

**우선순위**: 높음

---

### 4.3 학습 진도 추적
**요구사항 ID**: CLASS-003

**설명**: 사용자의 학습 진도 관리

**기능 상세**:
- 코스별 완료 상태 표시
- 코스워크 제출 상태 표시
- 진행률 표시

**우선순위**: 중간

---

## 5. 커뮤니티 (Community)

### 5.1 게시글 작성
**요구사항 ID**: COMM-001

**설명**: 커뮤니티 게시글 작성 기능

**기능 상세**:
- 게시글 타입 선택 (Notice, Forum, Request)
- 제목 및 내용 입력
- 이미지 업로드 (선택)
- 태그 추가 (#tag 형식)
- 멘션 추가 (@username 형식)
- 작성자 정보 자동 저장

**우선순위**: 높음

---

### 5.2 게시글 조회
**요구사항 ID**: COMM-002

**설명**: 게시글 목록 및 상세 조회

**기능 상세**:
- 게시글 목록 표시 (페이지네이션 지원)
- 카테고리별 필터링 (All, Notice, Forum, Request)
- 태그별 필터링
- 검색 기능 (제목, 내용)
- 고정 게시글 우선 표시
- 최신순 정렬
- 게시글 상세 보기
- 작성자 정보 표시
- 작성일시 표시
- 좋아요 수 표시
- 댓글 수 표시

**우선순위**: 높음

---

### 5.3 게시글 수정 및 삭제
**요구사항 ID**: COMM-003

**설명**: 게시글 수정 및 삭제 기능

**기능 상세**:
- 작성자만 수정/삭제 가능
- 게시글 수정 (제목, 내용, 이미지, 태그, 멘션)
- 게시글 삭제 (관련 댓글, 태그, 멘션도 함께 삭제)

**우선순위**: 높음

---

### 5.4 댓글 기능
**요구사항 ID**: COMM-004

**설명**: 게시글에 댓글 작성 및 조회

**기능 상세**:
- 댓글 작성
- 댓글 목록 표시 (최신순)
- 댓글에 멘션 추가 (@username)
- 작성자 정보 표시
- 작성일시 표시

**우선순위**: 높음

---

### 5.5 좋아요 기능
**요구사항 ID**: COMM-005

**설명**: 게시글 좋아요 기능

**기능 상세**:
- 게시글 좋아요/좋아요 취소
- 좋아요 수 표시
- 사용자별 중복 좋아요 방지

**우선순위**: 중간

---

### 5.6 태그 시스템
**요구사항 ID**: COMM-006

**설명**: 게시글 태그 기능

**기능 상세**:
- 게시글 작성 시 #tag 형식으로 태그 추가
- 태그 자동 추출 및 저장
- 태그별 게시글 필터링
- 인기 태그 표시 (Popular Tags)
- 태그 클릭 시 해당 태그 게시글만 표시

**우선순위**: 중간

---

### 5.7 멘션 기능
**요구사항 ID**: COMM-007

**설명**: 사용자 멘션 기능

**기능 상세**:
- 게시글/댓글 작성 시 @username 형식으로 멘션
- @ 입력 시 사용자 목록 자동완성 표시
- 탭 키로 사용자 선택
- 커서 위치에 맞춰 자동완성 목록 표시
- 멘션된 사용자에게 알림 (Mentions 버튼)
- 멘션된 게시글 목록 조회
- 멘션된 게시글에서 사용자 이름 표시

**비기능 요구사항**:
- 자동완성 목록은 커서 위치 기준으로 표시
- 사용자 이름은 공백을 언더스코어(_)로 변환하여 저장

**우선순위**: 높음

---

### 5.8 Mentions 알림
**요구사항 ID**: COMM-008

**설명**: 멘션된 게시글 알림 및 조회

**기능 상세**:
- 멘션된 게시글 목록 표시
- 해결되지 않은 Request 게시글 수에 따라 버튼 색상 변경
  - 해결되지 않은 요청이 있으면 빨간색
  - 없으면 회색
- Mentions 버튼 클릭 시 멘션된 게시글만 표시
- 해결된 게시글도 포함하여 표시
- "Back to list" 버튼으로 목록으로 돌아가기

**우선순위**: 높음

---

### 5.9 Request 해결 상태 관리
**요구사항 ID**: COMM-009

**설명**: Request 타입 게시글의 해결 상태 관리

**기능 상세**:
- Request 게시글 작성자만 해결 상태 설정 가능
- "Mark as Resolved" 버튼으로 해결 상태 변경
- 해결된 게시글은 회색 박스로 표시
- 해결된 게시글 우측에 "✓ Resolved" 배지 표시
- 게시글 상세 페이지에서는 박스 색상 유지 (흰색)
- 해결된 게시글도 Mentions 목록에 표시

**우선순위**: 높음

---

### 5.10 SNS 임베드
**요구사항 ID**: COMM-010

**설명**: Instagram, Twitter, Threads 게시글 임베드

**기능 상세**:
- Instagram 게시글 URL 자동 임베드
- Twitter 게시글 URL 자동 임베드
- Threads 게시글 URL 자동 임베드
- 임베드 크기 조정 (가로/세로)
- Instagram 임베드 스타일링 (min-width: 326px, max-width: 658px)

**우선순위**: 중간

---

### 5.11 인기 게시글
**요구사항 ID**: COMM-011

**설명**: 인기 게시글 표시

**기능 상세**:
- 좋아요 수 기준 인기 게시글 목록
- Popular Posts 섹션에 표시

**우선순위**: 낮음

---

## 6. Hub

### 6.1 Google Drive 통합
**요구사항 ID**: HUB-001

**설명**: Google Drive 폴더 임베드

**기능 상세**:
- 지정된 Google Drive 폴더 임베드 표시
- Google Drive로 직접 이동 링크 제공
- 첫 방문 시 캐시 허용 안내

**우선순위**: 중간

---

## 7. Calendar

### 7.1 Google Calendar 이벤트 조회
**요구사항 ID**: CAL-001

**설명**: Google Calendar 이벤트 조회 및 표시

**기능 상세**:
- 사용자의 Google Calendar 이벤트 조회
- 최대 10개 이벤트 표시 (기본값)
- 최근 30일 내 일정 표시
- 이벤트 정보 표시 (제목, 시작 시간, 종료 시간, 설명)
- 일정이 없는 경우 영어 안내 메시지 표시
- Google Calendar 직접 열기 링크 제공

**우선순위**: 중간

---

### 7.2 Calendar Embed URL
**요구사항 ID**: CAL-002

**설명**: Google Calendar 임베드 URL 생성

**기능 상세**:
- 사용자의 Google Calendar 임베드 URL 생성
- Calendar API 권한 확인
- 권한이 없는 경우 안내 메시지 표시

**우선순위**: 낮음

---

## 8. 관리자 기능

### 8.1 배너 관리
**요구사항 ID**: ADMIN-001

**설명**: 메인 페이지 배너 관리

**기능 상세**:
- 배너 목록 조회
- 배너 추가 (제목, 이미지, 순서, 활성화 여부)
- 배너 수정
- 배너 삭제
- 배너 순서 변경
- 배너 활성화/비활성화

**우선순위**: 높음

---

### 8.2 코스 관리
**요구사항 ID**: ADMIN-002

**설명**: Google Workspace 코스 관리

**기능 상세**:
- 코스 목록 조회
- 코스 추가 (코스 ID, 제목, 설명 등)
- 코스 수정
- 코스 삭제

**우선순위**: 중간

---

### 8.3 페이지 섹션 관리
**요구사항 ID**: ADMIN-003

**설명**: 메인 페이지 섹션 관리

**기능 상세**:
- 페이지 섹션 목록 조회
- 섹션 추가 (타입, 제목, 내용, 순서)
- 섹션 수정
- 섹션 삭제
- 섹션 순서 변경 (드래그 앤 드롭)

**우선순위**: 중간

---

### 8.4 이미지 업로드
**요구사항 ID**: ADMIN-004

**설명**: 관리자용 이미지 업로드 기능

**기능 상세**:
- 이미지 파일 업로드
- 업로드된 이미지 URL 반환
- 한글 파일명 지원
- 이미지 파일 조회

**우선순위**: 중간

---

## 9. 데이터베이스 스키마

### 9.1 주요 테이블
- **users**: 사용자 정보
- **posts**: 게시글
- **comments**: 댓글
- **tags**: 태그
- **post_tags**: 게시글-태그 관계
- **post_mentions**: 게시글 멘션
- **comment_mentions**: 댓글 멘션
- **post_likes**: 게시글 좋아요
- **banners**: 배너
- **workspace_courses**: Google Workspace 코스
- **page_sections**: 페이지 섹션
- **admins**: 관리자 계정
- **oauth_states**: OAuth 상태 관리

### 9.2 주요 필드
- **posts.is_resolved**: Request 게시글 해결 상태 (Boolean, 기본값: false)
- **users.google_refresh_token**: Google OAuth refresh token

---

## 10. API 엔드포인트

### 10.1 인증 API
- `GET /auth/login` - Google OAuth 로그인 시작
- `GET /auth/callback` - OAuth 콜백 처리
- `GET /auth/me` - 현재 사용자 정보 조회
- `POST /auth/logout` - 로그아웃

### 10.2 커뮤니티 API
- `GET /community/posts` - 게시글 목록 조회
- `GET /community/posts/{post_id}` - 게시글 상세 조회
- `POST /community/posts` - 게시글 작성
- `PUT /community/posts/{post_id}` - 게시글 수정
- `DELETE /community/posts/{post_id}` - 게시글 삭제
- `GET /community/posts/{post_id}/comments` - 댓글 목록 조회
- `POST /community/posts/{post_id}/comments` - 댓글 작성
- `POST /community/posts/{post_id}/like` - 게시글 좋아요
- `GET /community/tags` - 태그 목록 조회
- `GET /community/popular-posts` - 인기 게시글 조회
- `GET /community/users` - 사용자 목록 조회 (멘션용)
- `GET /community/mentioned-posts` - 멘션된 게시글 조회

### 10.3 클래스룸 API
- `GET /classroom/courses` - 코스 목록 조회
- `GET /classroom/workspace-courses` - Workspace 코스 목록 조회
- `GET /classroom/courses/{course_id}/coursework` - 코스워크 조회

### 10.4 캘린더 API
- `GET /calendar/events` - Google Calendar 이벤트 조회
- `GET /calendar/embed-url` - Calendar 임베드 URL 생성

### 10.5 관리자 API
- `POST /admin/auth/login` - 관리자 로그인
- `GET /admin/auth/me` - 관리자 정보 조회
- `GET /admin/banners` - 배너 목록 조회
- `POST /admin/banners` - 배너 추가
- `PUT /admin/banners/{banner_id}` - 배너 수정
- `DELETE /admin/banners/{banner_id}` - 배너 삭제
- `GET /admin/courses` - 코스 목록 조회
- `POST /admin/courses` - 코스 추가
- `PUT /admin/courses/{course_id}` - 코스 수정
- `DELETE /admin/courses/{course_id}` - 코스 삭제
- `GET /admin/page` - 페이지 섹션 목록 조회
- `POST /admin/page` - 페이지 섹션 추가
- `PUT /admin/page/{section_id}` - 페이지 섹션 수정
- `DELETE /admin/page/{section_id}` - 페이지 섹션 삭제
- `POST /admin/page/reorder` - 페이지 섹션 순서 변경
- `POST /admin/upload/image` - 이미지 업로드
- `GET /admin/upload/image/{filename}` - 이미지 조회

### 10.6 공개 API
- `GET /public/banners` - 공개 배너 목록 조회
- `GET /public/workspace-courses` - 공개 코스 목록 조회
- `GET /public/page` - 공개 페이지 섹션 조회

### 10.7 Drive API
- `GET /drive/folders/{folder_id}/contents` - Google Drive 폴더 내용 조회

---

## 11. 비기능 요구사항

### 11.1 성능
- 페이지 로딩 시간: 3초 이내
- API 응답 시간: 1초 이내
- 동시 사용자: 100명 이상 지원

### 11.2 보안
- HTTPS 통신
- JWT 토큰 기반 인증
- SQL Injection 방지
- XSS 방지
- CORS 설정

### 11.3 호환성
- 최신 브라우저 지원 (Chrome, Firefox, Safari, Edge)
- 반응형 디자인 (모바일, 태블릿, 데스크톱)

### 11.4 유지보수성
- 코드 주석 및 문서화
- 표준 코딩 컨벤션 준수
- 버전 관리 (Git)

---

## 12. 제약사항

### 12.1 기술적 제약
- Google OAuth 2.0 의존성
- Google Workspace API 의존성
- Google Calendar API 의존성
- Google Drive API 의존성

### 12.2 비즈니스 제약
- Google 계정 필수
- 관리자 권한 필요 기능 존재

---

## 13. 향후 개선 사항

### 13.1 예정된 기능
- 이메일 알림 (멘션 시)
- 게시글 신고 기능
- 관리자 게시글 고정 기능
- 게시글 수정 이력

### 13.2 개선 가능 영역
- 검색 기능 고도화
- 알림 시스템 강화
- 모바일 앱 개발
- 다국어 지원

---

## 14. 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0.0 | 2024-01-03 | 초기 버전 작성 | - |

---

## 부록

### A. 용어 정의
- **SSO**: Single Sign-On, 단일 로그인
- **OAuth**: Open Authorization, 인증 프로토콜
- **JWT**: JSON Web Token, 토큰 기반 인증
- **API**: Application Programming Interface
- **CRUD**: Create, Read, Update, Delete

### B. 참고 문서
- Google OAuth 2.0 문서
- Google Workspace API 문서
- FastAPI 문서
- React 문서
