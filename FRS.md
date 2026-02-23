# 기능 요구사항 명세서 (Functional Requirements Specification)

## 문서 정보

| 항목 | 내용 |
|------|------|
| 프로젝트명 | Good Neighbors Fundraising Lab - Global Marketing Learning Platform |
| 버전 | 2.1.0 |
| 최종 수정일 | 2025-02-23 |

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

- **요구사항 ID**: AUTH-001
- **설명**: Google 계정을 사용한 단일 로그인(SSO) 기능
- **Sign in 버튼**: "Sign In" 버튼을 통한 로그인 시작
- **OAuth 플로우**: Google 계정 선택 및 권한 승인
- **자동 로그인**: Refresh token을 통한 자동 로그인 유지
- **사용자 정보**: 이름, 이메일, 프로필 이미지 자동 저장
- **Sign Up 링크**: Google Sites 기반 회원가입 페이지 링크 제공
- **비기능**: OAuth 2.0, JWT 토큰 기반, 토큰 만료 30분

### 2.2 사용자 프로필 관리

- **요구사항 ID**: AUTH-002
- **설명**: 로그인한 사용자의 프로필 정보 표시 및 관리
- **프로필 표시**: 우측 상단 프로필 이미지 및 이름 표시
- **드롭다운 메뉴**: 프로필 클릭 시 표시
- **메뉴 항목**: 사용자 정보(이름, 이메일), Settings(Google 계정), Sign Out
- **외부 클릭**: 드롭다운 자동 닫힘

### 2.3 관리자 인증

- **요구사항 ID**: AUTH-003
- **설명**: 관리자 전용 로그인 시스템
- **로그인 페이지**: `/admin/login`
- **인증 방식**: 사용자명/비밀번호 기반
- **토큰**: 관리자 JWT 토큰 발급 및 저장
- **대시보드**: `/admin/dashboard` 접근 시 인증 확인

---

## 3. 메인 페이지 (Home)

### 3.1 배너 슬라이더

- **요구사항 ID**: HOME-001
- **설명**: 메인 페이지 상단 배너 슬라이더
- **데이터 소스**: 관리자가 등록한 배너 (공개 API)
- **표시 조건**: 활성화된 배너만, order 순서대로
- **배너 없음**: 흰색 배경 표시
- **네비게이션**: 자동 전환 및 수동 클릭 지원
- **이미지 표시**: background-size: contain (잘림 방지)

### 3.2 Remarkable 섹션

- **요구사항 ID**: HOME-002
- **설명**: 메인 페이지 Remarkable 섹션 (1:1 레이아웃)
- **왼쪽 - Notice**: 고정 공지 노란 박스
  - 연한 노란 배경(#FFFDE7), 게시글 박스 흰색 배경 + 두꺼운 노란 테두리
  - 데이터 소스: `GET /public/pinned-notices`
  - 클릭 시 Community 게시글 상세로 이동
- **오른쪽 - 미니 캘린더**: GPC Google 캘린더
  - 월별 그리드, 이전/다음 달 네비게이션
  - Today 버튼: 오늘 날짜로 이동
  - 오늘 날짜: 주황 테두리 강조
  - 일정 있는 날: 숫자 아래 빨간 점 표시
  - 데이터 소스: `GET /public/calendar-event-dates`
  - Open Google Calendar 링크로 전체 캘린더 열기

### 3.3 Working Together 섹션

- **요구사항 ID**: HOME-003
- **설명**: 협업 프로젝트 소개 섹션
- **콘텐츠**: 프로젝트별 이미지 갤러리 자동 슬라이드
- **프로젝트**: 2024 GPAC, 2025 ColabT, Together We Shine, Earth&us 등

### 3.4 Feedback & Encouragement 섹션

- **요구사항 ID**: HOME-004
- **설명**: 사용자 후기 섹션
- **표시**: 이름, 역할, 평가 점수, 후기 내용
- **페이징**: 페이지당 4개, 이전/다음 버튼

---

## 4. Learning (Classroom)

### 4.1 탭 구성

- **요구사항 ID**: CLASS-001
- **설명**: Learning 페이지 탭 구성
- **All 탭**: Workspace 코스 목록 (관리자 등록)
- **My 탭**: Google Classroom 등록 코스 (로그인 필요)
- **Calendar 탭**: Google Calendar 이벤트 표시

### 4.2 All 탭 – Workspace 코스

- **요구사항 ID**: CLASS-002
- **설명**: 관리자가 등록한 Workspace 코스 표시
- **데이터 소스**: `GET /public/workspace-courses`
- **상태 필터**: All, Ongoing, Preparing, Finished
- **코스 카드**: 이미지, 제목, 설명, 상태 태그, 조직 태그
- **클릭 동작**: Google Classroom 링크로 새 탭 이동

### 4.3 My 탭 – 내 클래스

- **요구사항 ID**: CLASS-003
- **설명**: 사용자가 등록한 Google Classroom 코스
- **데이터 소스**: Google Classroom API (`GET /classroom/courses`)
- **미로그인 시**: 로그인 안내 및 Sign In 버튼만 표시 (Open Google Classroom 버튼 미표시)
- **권한 부족**: 권한 다시 부여(재로그인) 안내
- **클릭 동작**: 클래스 카드 클릭 시 VIEW COURSE 링크로 이동

### 4.4 Calendar 탭

- **요구사항 ID**: CLASS-004
- **설명**: Google Calendar 이벤트 표시
- **데이터 소스**: `GET /calendar/events`
- **표시**: 최대 10개, 최근 30일 내 일정
- **사이드바**: Today's Focus에 최근 3개 이벤트 표시

---

## 5. Community

### 5.1 게시글 작성

- **요구사항 ID**: COMM-001
- **설명**: 커뮤니티 게시글 작성 기능
- **게시글 타입**: Notice, Forum, Request
- **입력 항목**: 제목, 내용(필수)
- **이미지**: 최대 3장, 드래그 앤 드롭/붙여넣기(Ctrl+V)/파일 선택
- **태그**: #tag 형식으로 자동 추출
- **멘션**: @username 또는 @email 형식
- **Notice 작성**: 관리자 비밀번호 필요
- **Hub 안내**: 파일(이미지 외)은 Hub에 업로드 안내

### 5.2 게시글 조회

- **요구사항 ID**: COMM-002
- **설명**: 게시글 목록 및 상세 조회
- **목록**: 페이지네이션, 카테고리 필터(All/Notice/Forum/Request)
- **필터**: 태그별 필터링, 검색(제목/내용)
- **정렬**: 고정 게시글 우선, 최신순
- **상세**: 제목, 내용, 이미지(본문 아래), 작성자, 작성일시, 조회수, 좋아요, 댓글 수

### 5.3 게시글 수정 및 삭제

- **요구사항 ID**: COMM-003
- **설명**: 게시글 수정 및 삭제
- **권한**: 작성자만 수정/삭제 가능
- **수정**: 제목, 내용, 이미지(추가/삭제), 태그, 멘션
- **삭제**: 관련 댓글·태그·멘션 함께 삭제

### 5.4 댓글 기능

- **요구사항 ID**: COMM-004
- **설명**: 게시글 댓글 작성 및 조회
- **작성**: 댓글 작성, 멘션(@username) 지원
- **표시**: 목록 최신순, 작성자·작성일시 표시
- **답글**: 대댓글(Reply) 지원

### 5.5 좋아요 기능

- **요구사항 ID**: COMM-005
- **설명**: 게시글 좋아요 토글
- **동작**: 좋아요/좋아요 취소, 좋아요 수 실시간 반영
- **제한**: 사용자별 중복 좋아요 방지

### 5.6 태그 시스템

- **요구사항 ID**: COMM-006
- **설명**: 게시글 태그 기능
- **입력**: #tag 형식으로 작성 시 자동 추출
- **필터**: Popular Tags 클릭 시 해당 태그 게시글만 표시

### 5.7 멘션 기능

- **요구사항 ID**: COMM-007
- **설명**: 사용자 멘션 및 알림
- **입력**: @username 또는 @email 형식
- **자동완성**: @ 입력 시 사용자 목록 검색, Tab/Enter로 선택
- **알림**: Mentions 버튼으로 멘션된 게시글 목록 조회

### 5.8 Mentions 알림

- **요구사항 ID**: COMM-008
- **설명**: 멘션된 게시글 알림 및 조회
- **버튼**: Mentions 버튼, 미해결 Request 수에 따라 색상 변경
- **목록**: 멘션된 게시글만 표시, Back to list로 복귀

### 5.9 Request 해결 상태

- **요구사항 ID**: COMM-009
- **설명**: Request 타입 게시글 해결 상태 관리
- **권한**: 작성자만 Mark as Resolved 가능
- **표시**: 해결된 게시글에 ✓ Resolved 배지

### 5.10 SNS 임베드

- **요구사항 ID**: COMM-010
- **설명**: URL 기반 SNS 임베드
- **지원**: YouTube, Instagram, Twitter/X, Threads, 일반 URL 링크

### 5.11 인기 게시글

- **요구사항 ID**: COMM-011
- **설명**: Forum 탭에서 좋아요 기준 인기 게시글 표시
- **표시**: Popular Posts 섹션, 상위 3개

### 5.12 이미지 업로드 (Community)

- **요구사항 ID**: COMM-012
- **설명**: 게시글 작성 시 이미지 업로드
- **방식**: 드래그 앤 드롭, 붙여넣기(Ctrl+V, 이미지 영역 클릭 후), 파일 선택
- **제한**: 최대 3장, 5MB 이하, PNG/JPG/GIF/WebP
- **미리보기**: Blob URL 기반 즉시 미리보기
- **표시**: 게시글 본문 아래에 이미지 배치

---

## 6. Hub

### 6.1 Google Drive 폴더 탐색

- **요구사항 ID**: HUB-001
- **설명**: Google Drive 폴더 내용 조회
- **데이터 소스**: `GET /drive/folders/{folder_id}/contents`
- **조건**: 로그인 필수
- **표시**: 폴더/파일 목록, 썸네일, 이름, 수정일
- **네비게이션**: 폴더 클릭 시 하위 이동, 상위 이동 버튼

### 6.2 파일 업로드

- **요구사항 ID**: HUB-002
- **설명**: 현재 폴더에 파일 업로드
- **방식**: 드래그 앤 드롭, 클릭하여 파일 선택
- **데이터 소스**: `POST /drive/folders/{folder_id}/upload`
- **결과**: 업로드 후 폴더 목록 새로고침

### 6.3 Google Drive 열기

- **요구사항 ID**: HUB-003
- **설명**: Google Drive에서 해당 폴더 열기
- **동작**: "Open in Google Drive" 링크로 새 탭 이동

---

## 7. 관리자 기능

### 7.1 대시보드 탭

- **요구사항 ID**: ADMIN-000
- **설명**: 관리자 대시보드 탭 구성
- **탭**: Banners, Courses, Notices

### 7.2 배너 관리

- **요구사항 ID**: ADMIN-001
- **설명**: 메인 페이지 배너 관리
- **기능**: 목록 조회, 추가, 수정, 삭제
- **항목**: 제목, 이미지, 순서(order), 활성화 여부
- **이미지**: 드래그 앤 드롭/클릭 업로드, 최대 30MB
- **추천 크기**: 1920×480px (가로 채움, contain으로 잘림 방지)

### 7.3 코스 관리

- **요구사항 ID**: ADMIN-002
- **설명**: Workspace 코스 관리
- **기능**: 목록 조회, 추가, 수정, 삭제
- **항목**: 코스 ID, 제목, 이미지, 조직, 상태 등

### 7.4 공지(Notice) 관리

- **요구사항 ID**: ADMIN-003
- **설명**: Community Notice 게시글 관리
- **기능**: 공지 목록 조회, 추가, 수정, 삭제
- **연동**: Community API 사용, 관리자 토큰으로 Notice 작성

### 7.5 이미지 업로드

- **요구사항 ID**: ADMIN-004
- **설명**: 관리자용 이미지 업로드
- **API**: `POST /admin/upload/image`
- **용도**: 배너, 코스 이미지 등

---

## 8. API 엔드포인트 요약

### 8.1 인증

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /auth/login | Google OAuth 로그인 시작 |
| GET | /auth/callback | OAuth 콜백 처리 |
| GET | /auth/me | 현재 사용자 정보 |
| POST | /auth/logout | 로그아웃 |

### 8.2 Community

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /community/posts | 게시글 목록 |
| GET | /community/posts/{id} | 게시글 상세 |
| POST | /community/posts | 게시글 작성 |
| PUT | /community/posts/{id} | 게시글 수정 |
| DELETE | /community/posts/{id} | 게시글 삭제 |
| GET | /community/posts/{id}/comments | 댓글 목록 |
| POST | /community/posts/{id}/comments | 댓글 작성 |
| POST | /community/posts/{id}/like | 좋아요 토글 |
| POST | /community/upload-image | 이미지 업로드 |
| GET | /community/image/{filename} | 이미지 조회 |
| GET | /community/tags | 태그 목록 |
| GET | /community/popular-posts | 인기 게시글 |
| GET | /community/users | 사용자 목록(멘션) |
| GET | /community/mentioned-posts | 멘션된 게시글 |

### 8.3 Classroom

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /classroom/courses | 내 코스(Google) |
| GET | /classroom/workspace-courses | Workspace 코스 |
| GET | /classroom/courses/{id}/coursework | 코스워크 조회 |

### 8.4 Calendar

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /calendar/events | Calendar 이벤트 |
| GET | /calendar/embed-url | Calendar 임베드 URL |

### 8.5 Drive

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /drive/folders/{id}/contents | 폴더 내용 |
| POST | /drive/folders/{id}/upload | 파일 업로드 |

### 8.6 공개 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /public/banners | 배너 목록 |
| GET | /public/workspace-courses | Workspace 코스 목록 |
| GET | /public/pinned-notices | 고정 공지 목록 |
| GET | /public/calendar-event-dates | 캘린더 이벤트 날짜 (Remarkable용) |

### 8.7 관리자 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /admin/auth/login | 관리자 로그인 |
| GET | /admin/auth/me | 관리자 정보 |
| GET/POST/PUT/DELETE | /admin/banners/* | 배너 CRUD |
| GET/POST/PUT/DELETE | /admin/courses/* | 코스 CRUD |
| GET/POST/PUT/DELETE | /admin/page/* | 페이지 섹션 CRUD |
| POST | /admin/upload/image | 이미지 업로드 |

---

## 9. 라우트

| 경로 | 페이지 | 설명 |
|------|--------|------|
| / | Home | 메인 |
| /learning | Classroom | Learning (All/My/Calendar) |
| /community | Community | 커뮤니티 |
| /hub | Hub | Google Drive Hub |
| /auth/callback | AuthCallback | OAuth 콜백 |
| /admin/login | AdminLogin | 관리자 로그인 |
| /admin/dashboard | AdminDashboard | 관리자 대시보드 |

---

## 10. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2024-01-03 | 초기 버전 |
| 2.0.0 | 2025-02-23 | 기능별 표 형식, 우선순위 제거 |
| 2.1.0 | 2025-02-23 | Remarkable 섹션(Notice+캘린더), My 탭 미로그인 시 Sign In만, 배너 contain, 이미지 본문 아래 표시, 테이블→불릿 정리, Notion 호환 포맷 |
