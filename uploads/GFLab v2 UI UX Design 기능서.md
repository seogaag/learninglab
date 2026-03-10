# GFLab v2 UI/UX Design 기능서

[메인 페이지 기준

- 메인 랜딩페이지 기준
    
    ![GFLab v2-final.jpg](GFLab_v2-final.jpg)
    

---

---

### 🎨 GFLab v2 UI/UX Design Specification (Final)

---

### 1. 공통 디자인 시스템 (System Tokens)

| **구분** | **사양 (Specification)** | **비고** |
| --- | --- | --- |
| **Primary Color** | `#89A230` (Olive Green) | 브랜드 메인 컬러 |
| **Accent Color** | `#F16521` (Orange) | 포인트 컬러 (오늘 날짜 강조 등) |
| **Section BG** | `#E9F5D1`, `#F2EFED` | 섹션 구분 배경색 |
| **Main Font** | **Title**: Poppins (Bold, Line 34/0%)
**Body**: Open Sans (Regular) | 가독성 중심 폰트 조합 |
| **Container** | `max-width: 1440px`, `Column width: 98px`, 중앙 정렬 | 대화면 대응 레이아웃 |
| **Border Radius** | `Small: 8px`, `Medium: 16px`, `Large: 24px` | 컴포넌트 곡률 단계 |
| **Spacing** | **상하단 여백**: 평균 `80px`
**타이틀~콘텐츠**: `50px` | 일관된 수직 리듬 유지 |

---

### 2. 화면 높이 기준 (Height Standards)

- **메인 배너 (Hero)**: 최소 `630px`
- **작은 설명 섹션**: `450px`
- **긴 설명/콘텐츠 섹션**: `630px` ~ `660px`

---

### 3. 섹션별 상세 가이드 (Section Details)

### 3.1 메인 배너 (Hero Slide)

- **Height**: 최소 `630px` 적용.
- **Typography**: 타이틀에 `Poppins / Bold` 적용하여 임팩트 강조.
- **Layout**: 좌측 텍스트 영역과 우측 이미지 영역의 조화, 하단은 브랜드 특유의 웨이브 그래픽으로 다음 섹션과 연결.

### 3.2 서비스 카드 (What Can You Do?)

- **Card Design**: `Large Radius (24px)` 적용 권장.
- **Layout**: `3-Column` 그리드 활용 (각 칼럼 너비 `371px` 기준 정렬).
- **Spacing**: 섹션 상하 여백 `80px` 준수.

### 3.3 대시보드 (Notice & My Progress)

- **Notice (좌)**: 화이트 카드 배경에 `Medium: 16px` 적용.
- **Calendar (우)**:
    - 오늘 날짜: `#F16521` (Orange) 포인트 컬러 사용.
    - 기타 상태값: 브랜드 그린 컬러 및 핑크 컬러로 활동 표시.

### 3.4 Working Together (Gallery)

- **Grid**: 4열 배치.
- **Image Style**: `Medium Radius (16px)` 적용하여 부드러운 인상 부여.
- **Spacing**: 타이틀과 이미지 갤러리 사이 간격 `50px`.

### 3.5 YouTube 영상

- GFLab사용법 영상 플레이 - 유투브에서 연결
- 영상 가로 사이즈 `1196px`  중앙 정렬

### 3.5 FAQ (Accordion)

- **Layout**: 컨테이너 폭 `1440px` 내에서 중앙 정렬.
- **Interaction**: 질문 행 클릭 시 하단 답변 노출, 좌측 `+` 아이콘 활용.
- 질문 리스트
    
    

---

### 4. 개발자 참고 사항 (Dev Note)

> • **폰트 적용**: 영문/숫자는 `Poppins`를 우선 적용하고 국문은 `Open Sans` 또는 시스템 폰트와 매칭하여 가독성을 확보하세요.
• **여백 준수**: 섹션 간 여백 `80px`와 요소 간 여백 `50px`를 상수로 관리하여 화면 전체의 통일감을 유지해 주세요.
• **컬러 변수**: `#89A230`과 `#F16521`을 테마 변수로 지정하여 사용하세요.
> 

---