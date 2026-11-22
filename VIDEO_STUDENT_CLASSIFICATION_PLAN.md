# 영상 수강생 분류(현강 / 영상) — 구현 계획

> 2026-11-22 작성. 대상 코드베이스: `academy-manager` / `my-teaching-assistant` (Express `server/` + React `client/`, PostgreSQL).
> (멀티테넌트 키는 `academy-manager`의 `tenant_id` / `my-teaching-assistant`의 `academy_id`, 마이그레이션은 `server/db/migrations.js` 또는 `server/db/migrations/*.sql` 규약에 맞춰 적용한다.)
>
> **✅ 확정 (2026-11-22):**
> 1. **분류 단위:** 학생 단위 속성 (`students.learning_mode` = `'offline'` 현강 기본 / `'video'` 영상).
> 2. **적용 범위:** 출결 · 과제 · 학생 목록/대시보드 · 학습 리포트(학부모/학생/주간 진단/원장 브리핑) · 자동화/크론(결석·미제출 SMS 및 태스크) 전체.
> 3. **동일 유지 항목:** 성적(시험) · QnA 질문 · 클리닉 · 수강료 · 공지 · 학습자료 · 상담 로그는 현강/영상 구분 없이 기존대로 관리.
> 4. **자동화 기본값 OFF (체크 해제 / Opt-in):** 신규 자동화 규칙 활성화, 자동화·크론·SMS의 영상 수강생 포함, 자동 분류/전환, 영상 무활동 자동 감지 등 **모든 '자동' 옵션은 기본적으로 체크가 해제된 상태(OFF)**로 두고 관리자가 직접 켠 경우에만 동작.

## 1. 배경과 현재 구조

현재 `students` 테이블에는 재원 상태(`status`: `active` / `inactive` / `withdrawn` 등)만 있고 **수강 형태(현강 vs 영상)** 구분이 없다. 이로 인해 출결·과제·대시보드·자동화·리포트가 모든 `status = 'active'` 학생을 현강생으로 가정하고 동작한다.

| 영역 | 현재 동작 | 영상 수강생으로 인해 생기는 문제 | 주요 파일 |
|---|---|---|---|
| 학생 프로필 | `status`만 존재 (`active` 기준 필터) | 현강/영상 구분 및 일괄 필터 불가 | `server/routes/admin.js`, `client/src/pages/admin/StudentList.jsx` |
| 출결 | `status = 'active'` 전체를 출석부·결석자·출석률 모수에 포함 | 매일 미체크/결석 누적, 출석률 왜곡, 연속 결석·보강 미편성 오탐 | `server/routes/attendance.js`, `client/src/pages/admin/AttendanceManage.jsx` |
| 과제 | 반/수업의 모든 `active` 학생을 과제 체크 목록에 표시 | 미제출 목록 오염, 과제 이행률 하락 | `server/routes/homework.js`, `client/src/pages/admin/HomeworkManage.jsx` |
| 대시보드 | 전체 `active` 수로 `not_checked`·`attendance_rate_today` 산출 | 원장/강사 대시보드의 당일 출석률·미체크 수치 왜곡 | `server/routes/dashboard.js`, `client/src/pages/admin/Dashboard.jsx` |
| 자동화 · 크론 | 결석 알림 SMS, 연속 결석 상담/퇴원 위험, 보강 미편성 태스크 자동 생성 (규칙 기본 `is_active = true`) | 영상 수강생에게 결석 문자 오발송 및 불필요한 운영 태스크 누적 | `server/services/automation.js`, `server/services/cronJobs.js`, `client/src/pages/admin/AutomationManage.jsx` |
| 학습 리포트 | 출결·과제 지표를 일괄 집계하고 AI 코멘트·주간 브리핑 입력으로 전달 | 학부모/주간 리포트·원장 브리핑에 "출석 0%·과제 미제출" 오진 노출 | `server/routes/reports.js`, `server/utils/geminiHelper.js`, `weeklyStudentDiagnosis.js` |
| 보호자 · 학생 앱 | 출결 요약·미제출 과제 카드 기본 노출 | 영상 수강생·학부모에게 출결 0% 경고 표시 | `server/routes/parentApp.js`, `server/routes/students.js` |

## 2. 설계 원칙

1. **재원 상태(`status`)와 수강 형태(`learning_mode`) 직교 분리** — `status = 'video'`로 섞지 않는다. 영상 수강생도 `active`·`paused`·`withdrawn` 생명주기를 독립적으로 가져야 한다.
2. **Additive & 기본값 안전** — `learning_mode VARCHAR(20) NOT NULL DEFAULT 'offline'`으로 추가해 기존 학생·쿼리·데이터에 무영향으로 도입한다.
3. **자동은 기본 체크 해제 (Opt-in 원칙)** — 자동화 규칙 활성화(`is_active`), 자동화/SMS의 영상 수강생 포함(`include_video`), 자동 분류(예: 출석 0건 → 영상 자동 전환), 영상 무활동 자동 이탈 감지 등 **모든 자동 실행·자동 포함 옵션은 기본값 `false`(체크 해제)**로 둔다. 관리자가 의도를 갖고 직접 체크(ON)했을 때만 자동 동작한다.
4. **공통 필터 헬퍼 일원화** — 각 라우트·크론마다 `learning_mode != 'video'`를 산발적으로 적다가 누락하지 않도록 공통 상수/헬퍼(`OFFLINE_ONLY_SQL` 또는 `isVideoStudent(student)`)로 통일한다.
5. **기본 제외 + 선택 조회(Soft Exclusion)** — 출석부·과제 화면은 기본값으로 현강생만 노출하되, 관리자가 "영상 수강생 포함" 토글(기본 OFF)을 켜면 예외 입력(온라인 과제 제출 체크, 일회성 현장 방문 등)이 가능하게 둔다.
6. **전환 이력 보존** — 학기 중 현강 ↔ 영상 전환 시 기존 출결·과제 기록을 삭제하지 않고 `learning_mode_changed_at`과 변경 이력을 남긴다.
7. **향후 확장 여지 확보** — 추후 한 학생이 반마다 현강/영상을 섞어 듣는 요구가 생기면 `class_students.learning_mode` (NULL 허용, NULL이면 `students.learning_mode` 상속) 컬럼만 추가해 무중단 확장할 수 있게 값 체계를 동일하게(`'offline'` | `'video'`) 설계한다.

## 3. 단계별 구현 계획

### Phase 1 — DB 스키마 & 학생 CRUD / 일괄 전환 (0.5~1일)

#### DB 마이그레이션
```sql
-- 1. students 테이블에 수강 형태 추가
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS learning_mode VARCHAR(20) NOT NULL DEFAULT 'offline',
  ADD COLUMN IF NOT EXISTS learning_mode_changed_at TIMESTAMPTZ;

-- 허용값 제약 (기존 마이그레이션 스타일에 맞춰 idempotent 가드 적용)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_students_learning_mode'
  ) THEN
    ALTER TABLE students
      ADD CONSTRAINT chk_students_learning_mode
      CHECK (learning_mode IN ('offline', 'video'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_students_learning_mode
  ON students (academy_id, status, learning_mode);
  -- academy-manager에서는 academy_id 대신 tenant_id 사용

-- 2. 사전등록 테이블(있는 경우)도 동일 필드 추가
ALTER TABLE pre_registered_students
  ADD COLUMN IF NOT EXISTS learning_mode VARCHAR(20) NOT NULL DEFAULT 'offline';

-- 3. (권장) 현강 ↔ 영상 전환 이력 테이블 — 기간 리포트 맥락 보존용
CREATE TABLE IF NOT EXISTS student_learning_mode_logs (
  id          SERIAL PRIMARY KEY,
  academy_id  INTEGER NOT NULL, -- academy-manager: tenant_id
  student_id  INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  prev_mode   VARCHAR(20) NOT NULL,
  next_mode   VARCHAR(20) NOT NULL,
  changed_by  INTEGER REFERENCES users(id),
  reason      TEXT,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_mode_logs_student
  ON student_learning_mode_logs (student_id, changed_at DESC);
```

#### API 및 데이터 입력 경로
- `server/routes/admin.js`:
  - `GET /students`: 쿼리 파라미터 `?learning_mode=all|offline|video` 추가, 응답에 `learning_mode`, `learning_mode_changed_at` 포함.
  - `GET /students/:id`, `GET /students/:id/overview`: `learning_mode` 반환.
  - `POST /students`, `PUT /students/:id`: `learning_mode` 검증(`'offline' | 'video'`) 및 저장. 값이 변경되면 `learning_mode_changed_at = NOW()` 갱신 + `student_learning_mode_logs`에 1행 기록.
  - **신규 `PUT /students/bulk-learning-mode`**: `{ studentIds: number[], learningMode: 'offline' | 'video', reason?: string }` — 도입 직후 기존 영상 수강생을 한 번에 분류하기 위한 일괄 전환 엔드포인트.
- `server/routes/dataImport.js` 및 사전등록 전환 로직:
  - 엑셀 임포트 컬럼에 `수강유형` (허용: `현강`/`오프라인`/`offline` → `'offline'`, `영상`/`인강`/`온라인`/`video` → `'video'`, 공란 → `'offline'`) 지원.
  - 사전등록 학생 승인 시 `pre_registered_students.learning_mode`를 `students.learning_mode`로 이월.

### Phase 2 — 출결 · 과제 제외 처리 (1일)

공통 헬퍼(예: `server/utils/studentMode.js`) 정의:
```js
const LEARNING_MODES = Object.freeze({ OFFLINE: 'offline', VIDEO: 'video' });
const isVideoStudent = (student) => student?.learning_mode === LEARNING_MODES.VIDEO;
// SQL WHERE 절 공통 조건 (별칭 s 기준)
const OFFLINE_STUDENT_SQL = "COALESCE(s.learning_mode, 'offline') = 'offline'";
```

#### 출결 (`server/routes/attendance.js`)
- `GET /today`, `GET /absent`, `GET /stats`, `GET /absent-streak`, `GET /makeup-pending`:
  - 기본값으로 `AND COALESCE(s.learning_mode, 'offline') = 'offline'` 적용.
  - `?include_video=1` 전달 시에만 영상 수강생 포함 (출석률 분모 `total`은 기본 현강생 수만 집계, 응답에 `excluded_video_count` 함께 반환해 UI에 안내 가능).
- `POST /check-in`:
  - 영상 수강생이 QR/키오스크로 현장 출석을 찍는 예외 상황(특강/보강 등)은 **에러로 막지 않고 기록 허용**하되, 응답에 `is_video_student: true` 플래그를 실어 안내 배너 표시(또는 학원 설정으로 차단 선택).
- `GET /student/me`, `GET /student/:id`:
  - 학생의 `learning_mode`를 함께 반환해 프론트에서 출결 미집계 안내를 일관되게 렌더링.

#### 과제 (`server/routes/homework.js`)
- `GET /class/:className/date/:date`, `GET /history/:className`:
  - 기본값 `AND COALESCE(s.learning_mode, 'offline') = 'offline'` 적용. `?include_video=1`로 토글 시 영상 수강생도 목록에 표시(뱃지 구분).
  - 응답에 `excluded_video_count` 포함.
- `POST /bulk-save`:
  - 현강 일괄 저장 시 영상 수강생의 `pending`/`미제출` 행이 실수로 생성되지 않도록, `includeVideo`가 명시되지 않았거나 상태가 `미제출/pending`인 영상 수강생 항목은 서버에서 필터링(이미 제출한 예외 기록만 저장 허용).
- `GET /my`, `GET /student/:studentId`:
  - `learning_mode` 함께 반환. 영상 수강생의 과제 목록/미제출 카운트 배지 노출 기준 분리.

### Phase 3 — 자동화 · 크론 · 알림 가드 (0.5~1일)

> **핵심 원칙 2가지:**
> 1. **자동은 기본 체크 해제 (Opt-in):** 신규 자동화 규칙 활성화(`is_active`), 자동화 규칙의 영상 수강생 포함(`conditions.include_video`), 신규 자동 감지(무활동 알림 등), 초기 자동 분류는 모두 **기본 `false`(체크 해제)** 로 두고 관리자가 직접 체크한 경우에만 동작한다.
> 2. **대상 구분:** 출결·과제 기반 트리거만 영상 수강생을 제외하고, **수강료 미납 · 상담 후속조치 · 공지 · 성적 알림은 영상 수강생도 그대로 유지**한다.

| 대상 | 파일 | 변경 내용 |
|---|---|---|
| 자동화 규칙 생성 기본값 | `server/routes/automation.js`, `016_automation.sql` / `migrations.js` | 신규 규칙 `is_active` 기본값 **`false`(체크 해제)**, `conditions.include_video` 기본값 **`false`(체크 해제)**. 기존 운영 중인 규칙의 `is_active`는 건드리지 않음 |
| 자동화 관리 UI | `client/src/pages/admin/AutomationManage.jsx` | 규칙 생성/수정 모달에 `규칙 활성화`, `영상 수강생 포함` 체크박스를 **기본 해제** 상태로 배치. 비활성 규칙을 경고·강제 권장하는 배너("활성화를 권장합니다")는 의도적 OFF를 존중해 중립 문구로 조정 |
| 결석/지각 알림 SMS & 연속 결석 상담 태스크 | `server/services/automation.js` (`onAttendanceEvent`) | 학생 `learning_mode === 'video'`이고 해당 규칙의 `conditions.include_video !== true`이면 즉시 early return (SMS·태스크 모두 미생성) |
| 보강 미편성 자동 태스크 (매일 09:00) | `server/services/cronJobs.js` | `JOIN students s` 조건에 `AND COALESCE(s.learning_mode, 'offline') = 'offline'` 추가 |
| 퇴원 위험 — 연속 3회 결석 태스크 (매주 월 09:00) | `server/services/cronJobs.js` | `WHERE ... AND COALESCE(s.learning_mode, 'offline') = 'offline'` 추가 |
| 퇴원 위험 — 장기 미납 태스크 | `server/services/cronJobs.js` | **변경 없음 (영상 수강생도 포함 유지)** |
| 과제 미제출 알림/자동화 (해당 경로 존재 시) | `automation.js` / `sms.js` / `notifications.js` | 대상 학생 조회 쿼리에 `OFFLINE_STUDENT_SQL` 적용 (별도 체크 ON 전까지 미발송) |
| 일괄 SMS 발송 수신자 필터 | `server/routes/sms.js`, `client/src/pages/admin/SmsManage.jsx` | 수신자 필터에 `수강 유형(전체/현강/영상)` 옵션 추가. 예약/자동 발송 체크박스는 기본 해제 유지 |

### Phase 4 — 대시보드 · 관리자/보호자/학생 UI (1일)

#### 대시보드 API (`server/routes/dashboard.js`)
- `GET /owner`:
  - 재원생 카운트를 `active_total`, `offline_count`, `video_count`로 분리 반환.
  - `attendance_today.not_checked`와 `attendance_rate_today`의 분모를 `offline_count`로 계산 (출결 쿼리도 `JOIN students s ... AND s.learning_mode = 'offline'`로 일치시켜 분자 > 분모 불일치 방지).
- `GET /teacher`:
  - `attendance_pending`, `homework_summary.not_submitted_count` 모두 `OFFLINE_STUDENT_SQL` 적용.

#### 관리자 화면 (`client/src/pages/admin/`)
- `StudentList.jsx` / `StudentManage.jsx`:
  - 상단 필터 세그먼트: `전체 (N) | 현강 (N) | 영상 (N)`.
  - 학생 이름 옆 `영상` 뱃지 (보라/인디고 톤, 현강은 기본값이라 뱃지 생략해 시각 노이즈 최소화).
  - 학생 등록/수정 모달에 `수강 유형: [현강] [영상]` 라디오 토글.
  - 체크박스 다중 선택 → **"수강 유형 일괄 변경"** 액션 버튼 (`PUT /students/bulk-learning-mode`).
- `AttendanceManage.jsx` / `HomeworkManage.jsx`:
  - 기본: 현강생만 노출 + 상단 안내 칩 `"영상 수강 N명 제외됨"`.
  - 우측 상단 체크박스/토글 `"영상 수강생 포함"` (**기본 체크 해제**) — ON 시 영상 수강생을 목록 하단에 `영상` 뱃지와 함께 표시해 예외 기록 가능.
- `Dashboard.jsx`:
  - 재원생 카드에 `현강 N · 영상 M` 보조 표기.
  - 오늘의 출석률 카드에 `현강 N명 기준` 서브라벨 명시.

#### 보호자 · 학생 화면 (`parentApp.js`, `StudentDashboard` 등)
- `GET /parent/children/:studentId/summary`, `GET /students/dashboard`: 응답에 `learning_mode` 포함.
- 영상 수강생 로그인/보호자 조회 시:
  - "출석률 0% / 미제출 과제 N건" 경고 카드 숨김.
  - 대체 안내 배너: `"영상 수강 중 — 성적·학습 질문·수업 자료 중심으로 확인하실 수 있습니다."`

### Phase 5 — 학습 리포트 · 원장 브리핑 & 작성 스킬 동기화 (0.5~1일)

#### 리포트 서버 · AI 코멘트 (`server/routes/reports.js`, `server/utils/geminiHelper.js`, `weeklyStudentDiagnosis.js`)
1. **데이터 조회**: `generate-comment-preview`, `/:id/generate-comment`, `/:id/preview`, 주간 진단 배치 쿼리에서 `s.learning_mode`와 기간 중 전환 이력(`student_learning_mode_logs`)을 함께 조회.
2. **템플릿·미리보기(`/:id/preview`)**:
   - 영상 수강생이면 헤더 학생 정보 옆에 `영상 수강` 배지 표기.
   - 출결/과제 성격의 필드(`attendance`, `homework` 등)가 비어 있거나 `'미제출'`/`'미체크'` 기본값인 경우 출력에서 제외(단, 강사가 직접 수동 입력한 코멘트가 있으면 그대로 노출).
3. **AI 코멘트 프롬프트 가드레일** (`generateReportComment` 및 주간 진단 프롬프트):
   - `learningMode === 'video'`일 때 시스템 프롬프트에 아래 규칙 주입:
     - *"이 학생은 **영상 수강생**이므로 학원 현장 출결 및 현장 과제 제출이 별도로 집계되지 않는다."*
     - *"출석·결석·과제 제출 기록이 없는 것을 약점, 태도 문제, 학습 이탈 징후로 절대 언급하지 말라."*
     - *"'출결 데이터가 부족합니다' 같은 어색한 문장 대신, 성적·질문(대화)·클리닉 기록 등 실제 수집된 데이터에 집중해 서술하라."*
   - 기간 중 현강 ↔ 영상 전환 이력이 있으면 `전환일(YYYY-MM-DD)`을 프롬프트에 함께 넘겨 전환 전후의 출결 공백을 오해하지 않게 방지.
4. **원장용 주간 운영 브리핑 & 주의 학생 자동 추출**:
   - 학원 전체 출결률·과제 제출률 집계 및 "결석·과제 미제출 주의 학생 Top 5" 추출 쿼리에서 `OFFLINE_STUDENT_SQL` 적용(영상 수강생이 매주 주의 학생에 오탐 노출되는 문제 차단).
5. **리포트 작성 UI (`ReportManage.jsx`)**:
   - 영상 수강생 선택 시 출결·과제 항목에 `"영상 수강 — 기본 제외(필요 시 선택 입력)"` 안내 표시 및 미입력 허용.
6. **스킬 동기화 (`kare1718/-` 저장소 `skills/student-report/SKILL.md`)**:
   - 앱 밖에서 수동 리포트 작성 시에도 같은 기준이 적용되도록 *"영상 수강생은 출결·과제 부재를 결함/약점으로 쓰지 않고 성적·질문·클리닉 데이터 중심으로 서술"* 원칙 1항목 추가.

### Phase 6 — 검증 · 초기 데이터 이관 · 롤아웃 (0.5일)

#### 검증 체크리스트
- [ ] **자동 기본 OFF 검증**: 신규 자동화 규칙 생성 시 `is_active = false`, `conditions.include_video = false`인지 확인. 출석부·과제·자동화 UI의 모든 자동/영상포함 체크박스가 기본 해제 상태인지 확인.
- [ ] **출결 회귀**: 현강 2명 + 영상 1명 시드에서 `/attendance/today`, `/absent`, `/stats`, `/absent-streak`, `/makeup-pending` 모두 영상 학생 미포함 및 출석률 분모 = 2 확인.
- [ ] **과제 회귀**: `/homework/class/:className/date/:date` 기본 목록에 영상 학생 미포함, `?include_video=1` 시 포함, `/homework/bulk-save` 시 영상 학생 미제출 행 미생성 확인.
- [ ] **자동화·크론**: 영상 학생 결석 이벤트 발생 시 SMS·상담 태스크 미생성 확인; 동일 학생 수강료 미납 시에는 미납 SMS·태스크 정상 생성 확인.
- [ ] **대시보드 · 브리핑**: 원장/강사 대시보드와 주간 운영 브리핑에서 `not_checked`·출석률·주의 학생이 현강생만 반영하고 `video_count`가 별도 표기되는지 확인.
- [ ] **리포트**: 영상 학생 AI 코멘트에 "결석/미제출/출석 부족" 표현이 나오지 않는지 샘플 5건 검증.
- [ ] **전환 시나리오**: 현강 → 영상 → 현강 왕복 전환 시 기존 출석·과제 이력이 유실되지 않고 `student_learning_mode_logs`에 기록되는지 확인.

#### 초기 데이터 이관 (배포 당일 — 수동 확인 원칙)
1. 마이그레이션 적용 → 전 재원생 기본값 `'offline'`으로 무중단 반영(자동 분류/자동 전환 실행 안 함).
2. 원장/관리자가 `학생 목록`에서 기존 영상 수강생(필요 시 부록의 진단 SQL로 후보 목록만 참고)을 직접 확인·체크 후 **"영상 수강으로 일괄 전환"** 1회 실행.
3. 전환 직후 `task_queue`에 기존 영상 수강생 명의로 쌓여 있던 `absence_counseling` / `makeup_pending` / 결석 기반 `withdrawal_risk` 미완료 태스크를 검토 후 정리.

## 4. 엣지 케이스와 리스크 대응

| 리스크 / 엣지 케이스 | 대응 |
|---|---|
| 자동화 규칙 생성 직후 의도치 않은 문자·태스크 자동 발송 | 신규 자동화 규칙 `is_active` 및 `include_video` 기본값 `false`(체크 해제). 관리자가 직접 ON 해야 실행 |
| 학기 중 현강 ↔ 영상 중도 전환 | 과거 출석·과제 행은 보존하고 `learning_mode_changed_at` + `student_learning_mode_logs` 기록. 전환 시점 이후 출결·자동화에서만 제외 |
| 영상 수강생이 간혹 현장 방문(특강/보강) 또는 온라인 과제 제출 | 출석 체크인·예외 입력은 하드 차단하지 않고 허용하되, 기본 목록/분모에서만 제외("영상 수강생 포함" 토글로 조회) |
| 대시보드 출석률 분자·분모 불일치 | 영상 수강생의 예외 출석 행이 분자에만 들어가 출석률이 100%를 넘지 않도록 `dashboard.js`·`attendance/stats` 분자 쿼리에도 `OFFLINE_STUDENT_SQL` 적용 |
| 자동화에서 수강료·상담까지 실수로 제외 | `learning_mode` 가드는 오직 출결·과제 트리거에만 적용. 수강료(`overdue`), 상담(`follow_up`), 퇴원(`withdrawal`) 로직은 건드리지 않음 |
| AI 리포트가 "출결 데이터가 없어 분석 불가" 식으로 어색하게 서술 | 프롬프트에 영상 수강생 명시 + "부재 언급 금지, 성적·질문·클리닉 중심 분석" 지침 삽입 |
| 향후 "한 학생이 A반은 현강, B반은 영상" 요구 등장 | `class_students.learning_mode` (nullable) 추가 후 `COALESCE(cs.learning_mode, s.learning_mode, 'offline')`로 쿼리만 확장 — 기존 데이터 100% 호환 |

## 5. 추가 보완 검토 항목 (실데이터 확인 후 채택 여부 결정)

아래 항목은 현재 DB 실데이터를 확인한 뒤 실제 운영에 해당되는 것만 선택 반영한다.

| 항목 | 배경 / 확인 포인트 | 반영 방향 (채택 시) |
|---|---|---|
| **영상 수강생 무활동 이탈 감지** | 출결 제외 후 영상 수강생이 조용히 이탈할 위험 | `최근 N주간 접속·QnA·성적·퀴즈 0건` 감지 옵션 추가 — **기본 체크 해제(OFF)**, 원하는 학원만 ON |
| **반 정원(`classes.capacity`) 계산** | 현강반에 영상 수강생이 함께 배정될 때 교실 좌석 정원을 차지해 신규 현강생 등록이 막힐 수 있음 | 정원 체크를 현강생 수(`offline_count`) 기준으로 계산하고 `현강 N / 정원 C (영상 +M)` 표시 |
| **수강료(`tuition`) 자동 청구** | 현강과 영상 수강료가 다른 경우 `POST /tuition/generate-monthly`가 반 기본 금액으로 청구할 수 있음 | 영상 전용 수강료 플랜 또는 자동 할인 규칙 매핑 (수강료가 같으면 작업 불필요) |
| **시험 미응시 · 등수(`scores`)** | 영상 수강생이 현장 테스트에 미응시하거나 자가 채점하는 경우 | `status = 'absent'` 등 미응시 행의 평균/등수 제외 여부, 자가 채점 구분 정책 확정 |
| **게이미피케이션 형평성** | 출석·과제 보너스 XP 비중이 높으면 영상 수강생이 랭킹에서 불리 | 랭킹 필터(현강/영상) 또는 QnA·퀴즈 활동 XP 비중 점검 |

## 6. 총 예상 공수

실작업 **3~4일** (단일 개발 기준, 섹션 5 추가 항목 제외).
- **1차 배포 (Phase 1~3, 2일):** 학생 분류 + 일괄 전환 + 출석부·과제·자동화 제외(자동 기본 OFF) → 운영 현장의 미체크·오알림 문제의 약 80% 즉시 해소.
- **2차 배포 (Phase 4~6, 1.5~2일):** 대시보드 지표 분리 + 보호자/학생 앱 안내 + 학습 리포트/원장 브리핑 보정 + 통합 검증.

## 부록 — 배포 전 실데이터 진단 SQL

구현 착수 전 Supabase SQL Editor에서 실행해(집계 결과만 확인) 섹션 5의 채택 여부와 초기 분류 대상을 파악한다.

```sql
-- 1) 현재 DB에서 '영상' 수강생 표기 패턴 & 반별 편성 확인
SELECT
  COUNT(*) FILTER (WHERE s.memo ~* '영상|인강|온라인|비대면|녹화') AS memo_video_cnt,
  COUNT(*) FILTER (WHERE s.status = 'active') AS total_active_cnt
FROM students s;

SELECT c.name, c.capacity, COUNT(cs.student_id) AS enrolled_cnt
FROM classes c
LEFT JOIN class_students cs ON cs.class_id = c.id AND cs.status = 'active'
WHERE c.status = 'active'
GROUP BY c.id, c.name, c.capacity
ORDER BY c.name;

-- 2) 최근 30일 출석 0건인 재원생 규모 (출석률 왜곡 폭 확인)
SELECT
  COUNT(*) AS active_total,
  COUNT(*) FILTER (WHERE att_cnt = 0) AS zero_attendance_30d,
  COUNT(*) FILTER (WHERE att_cnt > 0) AS has_attendance_30d
FROM (
  SELECT s.id,
         COUNT(a.id) FILTER (WHERE a.date >= CURRENT_DATE - INTERVAL '30 days') AS att_cnt
  FROM students s
  WHERE s.status = 'active'
  GROUP BY s.id
) t;

-- 3) 출석 0건(영상 추정) 학생의 최근 60일 실제 기능 이용 분포
WITH suspected_video AS (
  SELECT s.id
  FROM students s
  LEFT JOIN attendance a
    ON a.student_id = s.id AND a.date >= CURRENT_DATE - INTERVAL '30 days'
  WHERE s.status = 'active'
  GROUP BY s.id
  HAVING COUNT(a.id) = 0
)
SELECT
  (SELECT COUNT(*) FROM suspected_video) AS suspected_cnt,
  (SELECT COUNT(DISTINCT student_id) FROM scores
    WHERE student_id IN (SELECT id FROM suspected_video)
      AND created_at >= NOW() - INTERVAL '60 days') AS used_scores_60d,
  (SELECT COUNT(DISTINCT student_id) FROM questions
    WHERE student_id IN (SELECT id FROM suspected_video)
      AND created_at >= NOW() - INTERVAL '60 days') AS used_qna_60d,
  (SELECT COUNT(DISTINCT student_id) FROM homework_submissions
    WHERE student_id IN (SELECT id FROM suspected_video)
      AND submitted_at >= NOW() - INTERVAL '60 days') AS used_homework_60d;

-- 4) 복수 반 수강 학생 확인 (학생 단위 vs 반 단위 분류 검증)
SELECT cs.student_id, COUNT(DISTINCT cs.class_id) AS class_cnt,
       STRING_AGG(c.name, ', ') AS class_names
FROM class_students cs
JOIN classes c ON c.id = cs.class_id
WHERE cs.status = 'active'
GROUP BY cs.student_id
HAVING COUNT(DISTINCT cs.class_id) > 1
LIMIT 20;

-- 5) 기존 task_queue 오탐 누적 규모 확인
SELECT task_type, status, COUNT(*)
FROM task_queue
WHERE task_type IN ('absence_counseling', 'makeup_pending', 'withdrawal_risk')
GROUP BY task_type, status
ORDER BY task_type, status;
```

