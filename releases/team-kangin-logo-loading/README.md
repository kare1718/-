# 팀 강인 (`TEAM KANG:IN`) 로고 · PWA 아이콘 · 토스 스타일 로딩화면 교체 패키지

> 대상 저장소: `kare1718/my-teaching-assistant` (`main` 기준 `121b3ee` 검증 완료)
> 검증 완료: `esbuild --jsx=automatic` 12개 JSX/JS 파일 파싱 에러 0건 · 상대 import 100% 검증 · `manifest.json` JSON 유효성 검증 · `git apply --check` 통과

---

## 적용 방법 (택 1)

### 방법 1 — Git 패치 한 줄 적용 (권장)
```bash
# my-teaching-assistant 폴더 안에서 실행
git am /path/to/-/releases/team-kangin-logo-loading/0001-team-kangin-logo-loading.patch
```

### 방법 2 — 스크립트 한 줄 적용 (충돌 시 자동 파일 덮어쓰기 폴백)
```bash
bash releases/team-kangin-logo-loading/apply.sh /path/to/my-teaching-assistant
```

### 방법 3 — 파일 직접 복사
`releases/team-kangin-logo-loading/files/client/` 폴더를 그대로 `my-teaching-assistant/client/`에 덮어씌우면 됩니다.

---

## 교체된 파일 전체 목록 (23개)

### 1. 브랜드 로고 · PWA 아이콘 · 오프라인/캐시 (10개)
| 파일 | 변경 내용 |
|---|---|
| `client/public/brand/team-kangin-light.png` | 라이트 배경용 투명 PNG (`TEAM KANG:IN` 딥 네이비 + 블루 `:IN`) |
| `client/public/brand/team-kangin-dark.png` | 다크 배경용 투명 PNG (`TEAM KANG:IN` 화이트 + 블루 `:IN`) |
| `client/public/logo.png` | 기존 나만의 조교 로고 → `TEAM KANG:IN` 로고 교체 |
| `client/public/icons/icon-192.png` / `icon-512.png` | 1:1 딥 네이비 `TEAM KANG:IN` PWA 앱 아이콘 교체 |
| `client/public/icons/icon-light-192.png` / `icon-light-512.png` | 화이트 배경 대안 PWA 아이콘 동봉 *(필요 시 교체 가능)* |
| `client/public/manifest.json` | 앱 이름 `팀 강인 — 강인한 국어`, 홈화면 `팀강인`, `theme_color: #0B1933` |
| `client/public/sw.js` | 캐시 버전 `team-kangin-v3` 범프 + 로고·아이콘 프리캐시 |
| `client/public/offline.html` | 토스 스타일 `TEAM KANG:IN` 오프라인 안내 화면 전면 교체 |

### 2. 토스(Toss) 스타일 로딩화면 & 0ms 초기 스플래시 (3개)
| 파일 | 변경 내용 |
|---|---|
| `client/index.html` | `<title>팀 강인 — TEAM KANG:IN</title>`, 메타·OG 교체 + **React 마운트 전 0ms 토스 스플래시(라이트/다크 자동 대응 + 블루 슬라이딩 바)** 내장 |
| `client/src/components/LoadingScreen.jsx` | 기존 스피너(`로딩 중...`) → **`TEAM KANG:IN` 로고 페이드 + `by 강인한 국어` + 블루 슬라이딩 프로그레스 바**로 전면 교체 |
| `client/src/components/ui/PageLoading.jsx` | 토스 스타일 22px 라운드 카드 스켈레톤으로 정돈 |

### 3. 앱 전역 로고 & 기본 타이틀 교체 (10개)
| 파일 | 변경 내용 |
|---|---|
| `client/src/components/BrandLogo.jsx` *(신규)* | 테마(`useUIStore` + 시스템 다크모드)에 따라 라이트/다크 투명 로고를 자동 전환하는 공용 컴포넌트 |
| `client/src/App.jsx` | 딥 네이비 상단 Navbar에 `<BrandLogo variant="dark" height={30} />` 적용 |
| `client/src/pages/LoginPage.jsx` | 로그인 화면 브랜드 영역 `<BrandLogo variant="auto" showSub />` 적용 + 기본값 `팀 강인` |
| `client/src/pages/RegisterPage.jsx` | 회원가입 헤더 `<BrandLogo variant="auto" showSub align="center" />` 적용 |
| `client/src/pages/LandingPage.jsx` | 랜딩 페이지 상단 네비게이션 `<BrandLogo variant="light" height={34} />` 적용 |
| `client/src/pages/student/MyPage.jsx` | 학생 홈 히어로 배너 `<BrandLogo variant="dark" height={34} />` 적용 |
| `client/src/pages/student/QnA.jsx` | AI 선생님 아바타 타일을 `TEAM KANG:IN` 1:1 아이콘(`objectFit: cover`)으로 정돈 + 기본명 `팀 강인` |
| `client/src/components/InstallBanner.jsx` | PWA 설치 배너에 `팀강인` 아이콘 + 딥 네이비 라운드 카드 적용 |
| `client/src/config.js` | 기본 `SITE_TITLE = '팀 강인'`, `MAIN_TITLE` 갱신 |
| `client/src/contexts/TenantContext.jsx` | 테넌트 로드 전 기본 `academyName`/`siteTitle`을 `팀 강인`으로 통일 |
