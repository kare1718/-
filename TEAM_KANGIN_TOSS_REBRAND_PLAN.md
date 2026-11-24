# 팀 강인 (`TEAM KANG:IN`) 전면 리브랜딩 & 토스(Toss) 스타일 UI/UX 개편 계획

> 2026-11-23 작성. 대상 코드베이스: **`academy-manager` (강인한 국어 전용 앱)** — Express `server/` + React `client/`, PostgreSQL.
> *(멀티테넌트 SaaS `my-teaching-assistant`에 반영할 경우 하드코딩 대신 `academies.settings.branding` + 동적 PWA `manifest`로 강인한 국어 테넌트에만 opt-in 적용한다.)*
>
> **✅ 확정 방향 (2026-11-23):**
> 1. **앱·브랜드 통합명:** **`팀 강인`** (로고 표기: **`TEAM KANG:IN`**, 서브 카피: *by 강인한 국어*).
> 2. **확정 로고 스타일:** 상단 깔끔한 산세리프 `TEAM` + 하단 딥 네이비 브러시 필기체 `KANG` + 로열 블루 `:IN` 및 블루 더블 스우시 (`assets/team-kangin/`에 투명 PNG 라이트/다크 + 1:1 PWA 아이콘 192/512 6종 준비 완료).
> 3. **모듈 네이밍 체계 (`IN:` 통일):** 앱 내부 페이지 헤더는 `IN:Plan · IN:Focus · IN:Match · IN:Ask · IN:Track · IN:Archive · IN:Clinic` *(관리자 전용 `IN:Desk`)*, 하단 탭은 토스식 **5탭 한글 2글자(`홈 · 집중 · 채점 · 질문 · 전체`)**로 단순화.
> 4. **UI/UX 방향:** **토스(Toss) 스타일** — `#F2F4F6` 쿨그레이 캔버스 + `#FFFFFF` 22px 무테두리 라운드 카드 + `#3182F6` 브랜드 블루 단일 포인트 + 행동 중심 토스체 카피 + 1화면 1핵심 정보 계층.

---

## 1. 브랜드 아이덴티티 & 에셋 구성

### 1.1 브랜드 계층 구조

| 계층 | 확정 표기 | 노출 위치 |
|---|---|---|
| **PWA 앱 짧은 이름** | **`팀강인`** | 스마트폰 홈화면 아이콘 하단 (`manifest.json` `short_name`, `apple-mobile-web-app-title`) |
| **PWA 앱 정식 이름** | **`팀 강인 — 강인한 국어`** | 설치 배너, `<title>`, Open Graph(`og:title`, `og:site_name`) |
| **로고 워드마크** | **`TEAM KANG:IN`** | 앱 상단 헤더, 로그인·스플래시 화면, 교재·배너 |
| **학부모 신뢰 서브카피** | **`by 강인한 국어 · 강인한국어연구소`** | 로그인 화면 하단, 최초 설치 안내, 학부모 앱 상단 |
| **수강생 호칭** | **`TEAM 강인`** | 공지, 랭킹, 주간 리포트, 굿즈·교재 |

### 1.2 준비 완료 브랜드 에셋 (`assets/team-kangin/`)

| 파일명 | 해상도 / 용도 | 적용 경로 (`academy-manager/client/public/`) |
|---|---|---|
| `team-kangin-light.png` | 603×332 투명 PNG (라이트 모드 헤더·로그인) | `client/public/brand/team-kangin-light.png` |
| `team-kangin-dark.png` | 603×332 투명 PNG (다크 딥네이비 반전) | `client/public/brand/team-kangin-dark.png` |
| `icon-light-192.png` / `icon-light-512.png` | 1:1 PWA 아이콘 (화이트 배경) | `client/public/icons/icon-192.png`, `icon-512.png` *(화이트 선택 시)* |
| `icon-dark-192.png` / `icon-dark-512.png` | 1:1 PWA 아이콘 (딥 네이비 `#0B1933`) | `client/public/icons/icon-192.png`, `icon-512.png` *(딥네이비 선택 시)* |

### 1.3 `manifest.json` & `index.html` 교체 명세

```json
{
  "name": "팀 강인 — 강인한 국어",
  "short_name": "팀강인",
  "description": "혼자 하지 않는 국어, 끝까지 함께 — TEAM KANG:IN by 강인한 국어",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F2F4F6",
  "theme_color": "#0B1933",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- `client/index.html`: `<title>팀 강인 — TEAM KANG:IN</title>`, `apple-mobile-web-app-title="팀강인"`, `theme-color="#0B1933"`, `og:title` / `og:site_name` 일괄 교체.
- `sw.js`: 캐시 버전 범프(`v-team-kangin-1`)해 기존 설치 학생 기기에 새 아이콘·타이틀 즉시 반영.

---

## 2. 토스(Toss) 스타일 디자인 시스템 & 네비게이션 개편

### 2.1 핵심 디자인 토큰 (`client/src/styles/toss-tokens.css` 또는 `index.css`)

```css
:root {
  /* Toss Light Surface System */
  --t-bg: #F2F4F6;          /* 쿨그레이 페이지 캔버스 */
  --t-surface: #FFFFFF;     /* 순백 카드 (border 없이 여백으로 분리) */
  --t-surface-2: #F9FAFB;   /* 카드 내부 소프트 영역 */
  --t-line: #E5E8EB;        /* 리스트 구분선·비활성 테두리 */

  /* Typography Hierarchy */
  --t-ink: #191F28;         /* 헤드라인·핵심 숫자 */
  --t-ink-2: #4E5968;       /* 본문·서브 액션 */
  --t-ink-3: #8B95A1;       /* 캡션·보조 메타 */

  /* Brand Accent (TEAM KANG:IN :IN Blue == Toss Blue) */
  --t-blue: #3182F6;
  --t-blue-dark: #1B64DA;
  --t-blue-soft: #E8F3FF;

  /* Semantic (절제 사용) */
  --t-green: #00A870;
  --t-green-soft: #E6F7F1;
  --t-red: #F04452;
  --t-red-soft: #FFEBEE;
  --t-amber: #F59E0B;
  --t-amber-soft: #FEF3C7;

  /* Radii & Spacing */
  --t-radius-card: 22px;
  --t-radius-btn: 14px;
  --t-radius-chip: 12px;
  --t-gap-card: 14px;
}

[data-theme="dark"] {
  --t-bg: #0B1424;
  --t-surface: #132036;
  --t-surface-2: #192944;
  --t-line: #223452;
  --t-ink: #F8FAFC;
  --t-ink-2: #CBD5E1;
  --t-ink-3: #8FA3BF;
  --t-blue: #3B82F6;
  --t-blue-dark: #60A5FA;
  --t-blue-soft: rgba(59, 130, 246, 0.16);
}
```

### 2.2 토스 UX 5원칙 (전 학생 페이지 공통 적용)

1. **여백으로 구분하는 카드:** 카드에 무거운 그림자·두꺼운 테두리·보라 그라데이션을 제거하고 `#F2F4F6` 배경 위 순백 `22px` 카드로 정리. 카드 안에 3중 이상 중첩 금지.
2. **숫자·결론 최상단 배치:** 성적(`88점 · 1등급`), 남은 루틴(`2개 남았어요`), 카운트다운(`80:00`)을 가장 크고 굵게(`24~44px`, `tabular-nums`, `-0.03em`).
3. **행동 중심 토스체 카피:**
   - 기존 `"미완료 과제 목록"` → **`"민준님, 오늘 국어 루틴 2개 남았어요"`**
   - 기존 `"공부 타이머"` → **`"집중할 준비 됐나요?"`**
   - 기존 `"제출"` → **`"제출하고 바로 채점하기"`**
4. **7탭 → 5탭 하단 네비게이션 다이어트 (`BottomTabBar.jsx`):**
   - 기존 7개(`홈·성적·질문·O/X·안내·자료·게임`)로 좁고 복잡하던 하단 바를 **5개 핵심 탭**으로 통합:

| 하단 탭 (2글자) | 라우트 | 브랜드 모듈 헤더 | 포함 기능 |
|---|---|---|---|
| **홈** | `/student` | `TEAM KANG:IN` + `IN:Plan` | 오늘의 주간 루틴 체크리스트 · 오픈된 `IN:Match` 배너 · 빠른 실행 리스트 · 최근 성적 요약 |
| **집중** | `/student/timer` | **`IN:Focus`** | `실전 타이머`(내신 50분·수능 80분 방송) · `백색소음 Room`(Carrel) · `공부 랭킹` |
| **채점** | `/student/scores` | **`IN:Match`** | 셀프 OMR 입력·즉시 채점(`STUDENT_OMR_PLAN.md`) · 등급컷/분포 · **강인쌤의 한마디** · 오답→`IN:Ask` |
| **질문** | `/student/qna` | **`IN:Ask`** | AI 조교 3인방(조이·히로·레오) · QnA v2 탈도식화 블록 & 8종 미니 퀴즈 · ⭐ MY 노트 저장 |
| **전체** | `/student/hub` | **`IN:Track` · `IN:Archive` · `IN:Clinic`** | 2028 `화법과 언어` 개념 트랙(기존 4종 퀴즈 통합) · 수업 자료/MY 오답노트 · 1:1 클리닉/강인 매거진 · 아바타/상점/공지 |

*(관리자 영역의 AI 어시스턴트는 `IN:Desk` 브랜드 배지로 통일 — [AI_SECRETARY_SMS_PLAN.md](./AI_SECRETARY_SMS_PLAN.md)의 3단 워크스페이스와 100% 정합)*

---

## 3. 신규 기능 통합 설계 (기존 5개 기획서와 유기적 연결)

### 3.1 `IN:Focus` — 실전 방송 타이머 & 도서관 백색소음 Room (`StudyTimer.jsx` 확장)
- **실전 시험 방송 모드 (내신 50분 / 수능 국어 80분):**
  - 토스식 스위치 토글(`감독관 타종 · 종료 안내음성`): 시작 예비령(Web Audio 차임 또는 경량 MP3) → 종료 10분 전·5분 전 알림 → 종료 타종.
- **백색소음 Room (Carrel):**
  - 4종 프리셋(`서울대 도서관` · `스터디카페` · `창밖 빗소리` · `시험장 필기음`) — 초기엔 Web Audio 필터링 노이즈 + 로열티프리 루프 오디오(`client/public/audio/`) 지원.
  - 모바일 화면 꺼짐 대응: `Media Session API` 메타데이터 등록 + `Screen Wake Lock API`(지원 브라우저)로 끊김 최소화.
  - 기존 `/study-timer/sessions/active`를 활용해 상단에 `"지금 팀 강인 N명이 함께 집중 중이에요"` 배지 표시.

### 3.2 `IN:Plan` — 반/학교별 주간 학습 체크리스트 (영상 수강생·AI 비서 연동)
- **신규 테이블 (`033_weekly_study_plans.sql`):**
  - `weekly_study_plans (id, tenant_id, class_id, school, grade, week_start, items JSONB, created_by, created_at)`
  - `student_plan_checks (id, tenant_id, plan_id, student_id, item_key, checked_at, UNIQUE(plan_id, student_id, item_key))`
- **시너지:**
  - 학생이 홈 화면 첫 카드에서 탭 1번으로 체크 → 즉시 프로그레스바 갱신 + 완료 보너스 XP 지급.
  - 출결·현장 과제가 제외되는 **영상 수강생**([VIDEO_STUDENT_CLASSIFICATION_PLAN.md](./VIDEO_STUDENT_CLASSIFICATION_PLAN.md))의 주간 학습 이행률을 정량 추적.
  - `AI_SECRETARY_SMS_PLAN.md`의 **Layer 3 델타 데이터**에 주간 플랜 달성률 자동 포함 → 학부모 문자 설득력 강화.

### 3.3 `IN:Match` — 셀프 OMR + `강인쌤의 한마디` + `IN:Ask` 직결
- `STUDENT_OMR_PLAN.md`의 셀프 OMR(제한시간·쿨타임·오답 잠금 재도전·1차/재제출 이중 기록) 위에 2가지만 추가:
  1. `exam_answer_keys`에 `question_notes JSONB DEFAULT '{}'::jsonb` 컬럼 추가 → 관리자가 문항별 1~2줄 **'강인쌤의 한마디'(출제 의도·함정 포인트)** 등록.
  2. 채점 완료(최종 공개) 화면의 오답 문항 카드에 **`[IN:Ask에게 이 문항 질문하기]`** 버튼 배치 → `/student/qna?examId=...&qNum=...`로 시험명·문항·오답 포인트를 자동 프리필.

### 3.4 `IN:Ask` & `IN:Archive` — `MY 오답·개념 노트` 북마크 루프
- `questions` 테이블(또는 `student_bookmarks`)에 `is_bookmarked BOOLEAN DEFAULT FALSE` + `bookmark_tag VARCHAR(50)` 추가.
- `IN:Ask` 답변 카드 우측 상단 **`⭐ 저장`** 버튼 1탭 → `IN:Archive > MY 오답·개념 노트`에 작품·영역별로 자동 모아 보기(시험 직전 5분 복습용).

### 3.5 `IN:Track` & `IN:Clinic` — 개념 스킬트리 + 강인 매거진
- **`IN:Track`:** 기존 `VocabQuiz · KnowledgeQuiz · ReadingQuiz · OXQuiz`를 단원별 세로형 트랙(예: *2028 화법과 언어 — 트랙 1 품사 → 트랙 2 문장*)으로 묶고, 노드별 `완료 ✓` / `다음 학습` / `핵심 🔥` / `잠금 🔒` 상태 + 탭하면 뒤집히는 **3초 암기 플래시카드** 제공.
- **`IN:Clinic`:** 기존 `ClinicApply.jsx` + `taSchedule.js` 연동(강사/조교 안내 프로필) + `academy_columns` 경량 테이블로 월 2~4편의 **TEAM 강인 매거진(시험장 멘탈·선배 합격 수기)** 탭 추가.

---

## 4. 단계별 구현 로드맵 (총 8~9일)

| 단계 | 기간 | 핵심 범위 | 완료 기준 |
|---|---:|---|---|
| **Phase 1 — 브랜드 & 토스 스킨** | 2일 | `manifest.json` · `index.html` · `sw.js` · 로고/PWA 아이콘 교체 · `toss-tokens.css` · 로그인/홈/5탭 하단바(`BottomTabBar.jsx`) 토스 스타일 전면 개편 | 홈화면 아이콘 `팀강인`, 로그인·헤더 `TEAM KANG:IN`, 5탭 전환 및 라이트/다크 로고 정상 렌더링 |
| **Phase 2 — `IN:Focus` & `IN:Plan`** | 3일 | `StudyTimer.jsx` 실전 방송(50분/80분) + 백색소음 Room(Media Session/Wake Lock) · 주간 플랜 DB/관리자 등록/학생 홈 체크리스트 | 타이머 타종·백색소음 백그라운드 재생, 학생 체크→XP 적립 & 영상 수강생 달성률 집계 |
| **Phase 3 — `IN:Match` · `IN:Ask` · `IN:Track`** | 3~4일 | OMR 토스 UI + `강인쌤의 한마디` + 오답→`IN:Ask` 프리필 · `⭐ MY 노트` 북마크 · `IN:Track` 스킬트리/플래시카드 · `IN:Clinic` 매거진 탭 | 채점→오답 질문→북마크 복습 루프 완성, 프로덕션 빌드 및 모바일(390px) 검수 통과 |

---

## 5. 적용 전 확인 체크리스트

- [ ] `academy-manager` 저장소 권한 연결 및 브랜치 분기 (`feat/team-kangin-toss-rebrand`)
- [ ] PWA 홈화면 기본 아이콘 선택 확정 (`icon-light-*.png` vs `icon-dark-*.png`)
- [ ] 기존 학생/관리자 기능 회귀 없음 확인 (출결·성적·QnA·클리닉·수납·영상 수강생 제외 로직 유지)
- [ ] `QNA_V2_UPGRADE_PLAN.md` · `AI_QNA_PERSONA_PLAN.md` · `STUDENT_OMR_PLAN.md` · `VIDEO_STUDENT_CLASSIFICATION_PLAN.md` · `AI_SECRETARY_SMS_PLAN.md` 스키마 번호 충돌 없음 검증
