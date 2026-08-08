# AI 질의응답 조교 캐릭터화 — 구현 계획

> 2026-08-08 작성. 대상 코드베이스: `academy-manager` (Express `server/` + React `client/`).
> 실존 조교의 실명·연락처 등 개인정보는 이 문서에 싣지 않는다(공개 저장소). 캐릭터 시트는 내부 관리자 화면에서만 관리.
>
> **✅ 확정 (2026-08-08): 캐릭터는 "실제 조교를 모티브로 한 가상의 캐릭터"로 한다.** 실존 조교 본인을 재현하지 않으며, 이름·설정 모두 창작한다.

## 1. 배경과 현재 구조

현재 학생용 QnA는 **"강인쌤 AI" 단일 페르소나**로 동작한다.

| 레이어 | 현재 구현 | 파일 |
|---|---|---|
| 봇 이름·아바타 | `brand.qna_display_name` + 로고 아바타 (`QnaBotAvatar`) | `client/src/pages/student/QnA.jsx` |
| 인사말 | `site_settings.qna_greeting` (테넌트별) | `server/routes/questions.js` |
| 답변 페르소나 | 카테고리별 시스템 프롬프트(딥/공부법/상담/잡담…) + 과목별 `SUBJECT_INSTRUCTIONS.persona` 절 | `server/utils/aiEngine.js` |
| 말투 규칙 | 학생 말투(반말/존댓말) 따라가기 + 종결어미 일관성 + AI 정형구 금지 | `aiEngine.js` (CONVERSATION_FLOW 등) |
| 내용 정확성 | 강사 지침(`answer_guidelines`) → KB·원문 청크 → verify → revise 파이프라인 | `buildQnaPromptParts.js`, `aiEngine.js` |
| 잡담 분기 | 정체성·관계형 발화 별도 처리 (`lightBanter.js`) | `server/utils/qna/lightBanter.js` |
| 게이미피케이션 | 캐릭터 수집(`characters`)·칭호·XP·상점 | `client/src/pages/admin/GamificationManage.jsx` 외 |

핵심 관찰: **"아이덴티티(스킨)"와 "내용 정확성(코어)"이 이미 코드 레벨에서 분리**되어 있다. 과목별 페르소나 절(`buildSubjectClause`)이라는 선례도 있어, 조교 페르소나는 같은 패턴으로 얹을 수 있다.

## 2. 설계 원칙

1. **스킨과 코어 분리** — 페르소나는 이름·아바타·인사말·리액션·자기지칭·가벼운 말버릇만 바꾼다. 강사 지침, KB, verify/revise, 종결어미 규칙(학생 말투 따라가기)은 페르소나와 무관하게 동일.
2. **가상 캐릭터 (확정)** — 실존 조교 본인이 아니라 **실제 조교를 모티브로 한 가상의 캐릭터**다. 이름·성격·설정을 모두 창작하고(실명·실제 호칭 미사용) 학생에게도 가상 캐릭터임을 고지한다. 모티브 당사자에게는 컨셉 시안을 공유해 확인받는다 — 유사성 때문에 주변에서 알아볼 수 있으므로, 캐릭터의 말·행동이 특정 개인에게 귀속되지 않도록 설계한다.
3. **스레드 잠금** — 한 스레드는 시작한 페르소나로 끝까지. 중간 변경 금지.
4. **Additive & 킬스위치** — 기본값은 기존 "강인쌤 AI". 플래그를 끄면 즉시 원상복귀되도록 페르소나 로직은 전부 추가형으로만.
5. **말버릇은 미니멀** — 문장마다 말버릇을 넣으면 유치해지고 반복 대화에서 피로하다. 도입·마무리·리액션 지점에만 액센트.

## 3. 단계별 계획

### Phase 0 — 캐릭터 시트 준비 (개발 외, 0.5일)
- 조교별 짧은 인터뷰로 **모티브만 추출**: 전문분야(예: 클리닉·자료제작), 설명 스타일, 응원 방식, 인상적인 습관. 이를 재료로 **가상 이름·성격·컨셉을 창작**한다(실명·실제 별명 미사용).
- 캐릭터 시트 항목: 가상 이름 / 이모지 / 한 줄 컨셉 / 전문분야 / 말투 액센트 1~2개 / 응원 스타일 / 금지 항목.

  예시(형식 참고용 창작 예):

  | 항목 | 예 |
  |---|---|
  | 가상 이름 | 새벽 조교 🌙 |
  | 한 줄 컨셉 | 오답 노트에 진심인 클리닉 담당. 차분하고 꼼꼼함 |
  | 말투 액센트 | 마무리에 "오늘 헷갈린 건 오늘 잡자" 같은 정리 멘트 (답변당 최대 1회) |

- 모티브 당사자 확인: 컨셉 시안을 보여주고 동의받는다(유사성으로 식별될 가능성 대비). 본인이 원하면 모티브 제외·수정.

### Phase 1 — DB & 관리자 CRUD (1일)
`server/db/migrations.js`에 추가 (기존 `CREATE TABLE IF NOT EXISTS` 가드 패턴):

```sql
CREATE TABLE IF NOT EXISTS qna_personas (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER NOT NULL,
  display_name  TEXT NOT NULL,        -- 가상 이름 (예: '새벽 조교')
  emoji         TEXT,                  -- 1차 아바타 (이미지 이전 단계)
  avatar_url    TEXT,                  -- 선택: 캐릭터 일러스트
  tagline       TEXT,                  -- 선택 카드 한 줄 소개
  greeting      TEXT,                  -- 페르소나별 첫 인사
  speech_style  TEXT,                  -- 프롬프트 주입용 말투 서술(2~4문장)
  signature_lines TEXT,               -- 말버릇·응원 멘트 few-shot(줄바꿈 구분)
  specialties   TEXT,                  -- 표시용: '클리닉·오답 관리' 등
  ta_member_id  INTEGER,              -- 모티브 조교 연결(내부 관리용·학생 비노출, 선택)
  is_active     INTEGER DEFAULT 1,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE students  ADD COLUMN IF NOT EXISTS qna_persona_id INTEGER; -- 학생의 담당 조교 선택
ALTER TABLE questions ADD COLUMN IF NOT EXISTS persona_id     INTEGER; -- 답변 시점 기록(스레드 잠금·분석)
```

- API: 관리자 CRUD + 학생용 목록/선택(`students.qna_persona_id` 갱신). 신규 `server/routes/qnaPersonas.js` 권장.
- 관리자 UI: `QnAManage.jsx`에 "조교 캐릭터" 탭 — 등록/수정/활성화/정렬/미리보기(인사말+샘플 답변 톤).

### Phase 2 — 서버 프롬프트 통합 (1~1.5일)
- 신규 `server/utils/qna/personaClause.js` — 순수 함수(기존 `buildQnaPromptParts.js` 스타일, LLM·DB 없음 → 단위 테스트 가능):
  - `buildPersonaClause(persona)` → `# 너의 캐릭터` 섹션 문자열.
  - 포함할 가드레일:
    - "너는 **가상의 AI 조교 캐릭터**다. 특정 실존 인물이 아니며, 실제 조교·직원의 사생활·연락처·근무 정보는 모른다고 답한다."
    - "정확성·내용·강사 지침 규칙이 항상 캐릭터보다 우선한다."
    - "종결어미(반말/존댓말)는 기존 규칙대로 **학생 말투를 따라간다**. 캐릭터는 어휘 선택·리액션·자기지칭에만 반영."
    - "말버릇은 답변당 최대 1회. 매 문장 반복 금지."
- `aiEngine.js`: `subjectClause` 합성과 같은 방식으로 딥/simple/공부법/상담/일반 경로에 `personaClause` 주입. **verify(팩트체커)·revise 경로에는 주입하지 않는다**(검증자는 캐릭터를 몰라야 함).
- 스레드 잠금: follow-up이면 스레드 첫 턴의 `questions.persona_id`를 그대로 사용.
- `/questions/qna-greeting`: 학생에게 선택된 페르소나가 있으면 `persona.greeting` 우선 반환.
- `lightBanter.js`: `ai_identity` 폴백을 페르소나 이름으로 응답하게 확장 + "○○ 조교 진짜 있어?" 류 질문 폴백 추가("나는 우리 학원 조교 선생님들에게서 영감을 받아 만든 가상 캐릭터야" 톤 — 특정 실존 조교와 동일시하지 않는다).
- 기록: `questions.persona_id` 저장, `answer_meta`에 페르소나 표기(관리자 검수 화면에서 식별).

### Phase 3 — 학생 UI (1일)
- `QnA.jsx`: 헤더 아바타·이름을 선택 페르소나로 교체, 로딩 문구 페르소나화("○○ 조교가 답을 쓰는 중…"), 인사말 교체.
- 담당 조교 선택 카드 UI: 최초 진입 시 1회 + `MyPage.jsx`에서 변경 가능. 미선택 시 기존 "강인쌤 AI" 유지.
- 고지 캡션: "우리 조교 선생님들을 모티브로 만든 **가상의 AI 캐릭터**예요" 상시 노출(작게).

### Phase 4 — 품질·회귀 (0.5~1일)
- `personaClause` 단위 테스트 + `studentFacingTone.test.js` 패턴의 톤 누출 테스트.
- `qna_test_cases`에 페르소나 케이스 추가 후 selfplay 1회: 종결어미 일관성·정확성 회귀 확인(특히 페르소나 말버릇이 문어체 이탈을 유발하지 않는지).
- 검증 경로 무주입 확인 테스트.

### Phase 5 — 롤아웃 & 측정 (실작업 0.5일 + 1~2주 관찰)
- 테넌트별 feature flag: `site_settings['qna_persona_enabled']` (기존 site_settings 패턴).
- 파일럿: 특정 반/학년부터 (answer_guidelines의 scoped 지침처럼 범위 한정).
- 지표(도입 전 2주 대비): 학생당 질문 수, 스레드 길이, `qna_events.feedback_rating`, 페르소나 선택 분포.
- 롤백: 플래그 off → 즉시 강인쌤 AI 복귀(스키마·데이터는 유지).

### Phase 6+ — 이후 옵션
- 게이미피케이션 결합: 조교 캐릭터 해금(레벨/XP), 조교 카드 수집, "이달의 조교".
- 전문분야 라우팅: 공부법·오답 관리 질문에 클리닉 조교 자동 추천.
- 아바타 일러스트: 이모지 → 일관 스타일 캐릭터 이미지 세트.
- SaaS화: 테넌트별 커스텀 조교 페르소나를 "나만의 조교" 상품 기능으로(브랜딩 필드처럼).

## 4. 리스크와 대응

| 리스크 | 대응 |
|---|---|
| 실존 인물 귀속 (AI 발화가 특정 조교의 말처럼 보임) | **가상 이름·가상 설정으로 창작(확정)** + "가상 캐릭터" 상시 고지 + 사적 정보 차단 프롬프트. 유사성으로 식별될 수 있으므로 모티브 당사자에게 컨셉 확인·수정/제외 요청권 |
| 퇴사·교체 | 가상 캐릭터라 조교 퇴사와 무관하게 유지 가능. 모티브 당사자가 제외를 원하면 `is_active=0` 은퇴, 담당 학생은 기본 페르소나로 폴백(다음 스레드부터) |
| 답변 권위 하락(강인쌤 → 조교) | "강인쌤이 트레이닝한 조교팀" 프레임, 내용·검증 파이프라인 완전 동일, 기본값은 강인쌤 AI 유지 |
| 톤 회귀(말버릇이 종결어미 규칙과 충돌) | 페르소나 절에 우선순위 명시, selfplay·톤 테스트로 회귀 검증 |
| 토큰 비용 | 페르소나 절 200~400자, 추가 모델 호출 없음 → 호출당 비용 증가 미미 |
| 스레드 중 캐릭터 변경으로 혼란 | `questions.persona_id` 스레드 잠금 |

## 5. 총 예상 공수

실작업 **4~5일** + 파일럿 관찰 1~2주. Phase 1~3까지만으로 체감되는 MVP(선택 + 스킨 + 인사말)가 나오고, Phase 2의 말투 통합이 완성도를 좌우한다.
