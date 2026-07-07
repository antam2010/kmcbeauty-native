---
id: SPEC-UX-001
version: 0.1.1
status: draft
created_at: 2026-07-06
updated: 2026-07-06
author: antam2010
priority: high
labels: [ux, accessibility, visibility, senior, wcag-aa]
issue_number: null
---

# SPEC-UX-001 — 시니어 친화 시인성 및 즉효 개선

## HISTORY

- 2026-07-06 (v0.1.0): 초안 작성. 두 건의 독립 읽기 전용 감사(UX + 성능)에서 확인된 검증 결과 8건을 기반으로 4단계 로드맵의 1단계(최저 위험·최고 체감 가치)를 정의. 진단 근거는 `research.md` 참조.
- 2026-07-06 (v0.1.1): 계획 감사(`.moai/reports/plan-audit/SPEC-UX-001-review-1.md`) 반영 — frontmatter 필수 필드 교정(`created`→`created_at`, `priority` 소문자, `labels` 추가), EARS 재분류(무조건 금지문 → Ubiquitous 부정형, 조건부 금지문 → Unwanted If-then, L77 → State-Driven), REQ-UX-005 비규범 문장 제거 및 weasel word 구체화, AC-11 이진 판정 재정의, file:line off-by-one 4건 교정.

---

## 1. 개요 (Overview)

KMC Beauty Native 앱의 **주 사용자는 오너의 어머니(60대)**로, 매일 미용실 운영을 위해 앱을 직접 사용한다. 본 SPEC은 시니어 사용자의 **시인성·접근성·즉각적 오류 회복성**을 개선하기 위한 것으로, 스타일 토큰·컴포넌트 props·소규모 방어 코드 수준의 변경만을 대상으로 한다.

본 SPEC은 4단계 로드맵의 **1단계(Stage 1)**이며, 다음 원칙을 따른다.

- **로직·화면 흐름 변경 없음** (예약 흐름, 데이터 페칭 아키텍처, IA 재구성은 후속 SPEC).
- **최저 위험, 최고 체감 가치**: 색상 토큰 상향, 폰트 크기 하한, 터치 타깃 확보, 접근성 라벨, 오류 화면 재시도.
- 검증 근거는 file:line 단위로 감사에서 확인됨(`research.md`).

## 2. 목표 (Goals)

- 모든 텍스트가 WCAG AA(명도 대비 4.5:1) 이상을 만족한다.
- 본문 16pt / 캡션·라벨 14pt 이상의 폰트 하한을 적용한다.
- 모든 상호작용 컨트롤이 44×44pt 이상의 유효 터치 영역을 갖는다.
- 아이콘 전용 버튼에 스크린리더 라벨을 제공한다(현재 앱 전체 0건).
- 데이터 로드 실패 시 사용자가 화면 안에서 재시도할 수 있다(막다른 화면·무음 실패 제거).
- 프로덕션 API 요청 경로에서 미게이팅 진단 로그를 제거한다.

## 3. 범위 (In Scope)

감사에서 file:line으로 검증된 다음 8개 항목에 한정한다.

| # | 항목 | Finding | 대표 위치 |
|---|------|---------|-----------|
| 1 | 저대비 텍스트 상향 | F-2 | `src/ui/theme.ts:50`, `BookingForm.tsx:695`, `profile.tsx:263,275`, `BookingListScreen.tsx:457,509` |
| 2 | 상태 배지 대비 교정 | F-3 | `BookingListScreen.tsx:30-36,516-520` |
| 3 | 최소 폰트 크기 적용 | F-4 | `index.tsx:581`, `BookingForm.styles.ts:191,244,280,525`, `ImprovedCalendar`, `profile`, `shop-selection` |
| 4 | 터치 타깃 44pt 확보 | F-5 | `BookingListScreen.tsx:443-449`, `BookingForm.styles.ts:212-223,357-366,457-464`, `ShopHeader.tsx:84-92` |
| 5 | 접근성 라벨 추가 | F-1/F-6 | `src/ui/atoms/BaseButton.tsx` + 아이콘 버튼 전수 |
| 6 | 홈 오류 화면 재시도 버튼 | F-15 | `app/(tabs)/index.tsx:202-210` |
| 7 | 조용한 실패 인라인 안내 | F-16 | `BookingForm.tsx:245-254`, `index.tsx:45-60` |
| 8 | 프로덕션 로그 게이팅 | Perf F-9 | `src/api/client.ts:33,48,227`, `BookingListScreen.tsx:136,157,172,231,240` |

---

## 4. 요구사항 (EARS Requirements)

### REQ-UX-001 — 저대비 텍스트 상향 (F-2)

- **Ubiquitous**: 시스템은 모든 텍스트 색상 토큰이 해당 배경 대비 **4.5:1 이상**의 명도 대비를 유지하도록 렌더링해야 한다(shall).
- **Ubiquitous**: 시스템은 `text.muted` 및 보조 텍스트 색상을 `#6b7280`(gray[500], theme.ts:31) 수준 이상으로 상향해야 한다.
- **Ubiquitous**: 시스템은 본문·보조 텍스트·플레이스홀더 색상에 배경 대비 4.5:1 미만인 값(예: `#9ca3af`, `#999`)을 사용하지 않아야 한다(shall not).

### REQ-UX-002 — 상태 배지 대비 교정 (F-3)

- **Ubiquitous**: 모든 예약 상태 배지(`RESERVED`/`VISITED`/`COMPLETED`/`CANCELLED`/`NO_SHOW`)는 배경-텍스트 대비 **4.5:1 이상**을 확보해야 한다.
- **State-Driven**: 배지 배경이 밝은 색(`NO_SHOW #feca57`, `VISITED #f093fb` 등)인 동안, 시스템은 배지 텍스트를 어두운 색으로 렌더링하거나 배경을 진한 색으로 조정해야 한다.

### REQ-UX-003 — 최소 폰트 크기 적용 (F-4)

- **Ubiquitous**: 시스템은 본문 텍스트를 **16pt 이상**, 캡션·라벨 텍스트를 **14pt 이상**으로 렌더링해야 한다.
  - 분류 기준: 본문 = 사용자가 읽는 주요 정보 텍스트(이름, 금액, 상태, 설명, 입력값). 캡션·라벨 = 보조 주석(필드 라벨, 배지, 날짜 캡션, 통계 라벨, 단위 표기).
- **Ubiquitous**: 시스템은 사용자 표시 텍스트에 14pt 미만의 폰트 크기를 사용하지 않아야 한다(shall not).

### REQ-UX-004 — 터치 타깃 44pt 확보 (F-5)

- **Ubiquitous**: 모든 상호작용(터치) 가능한 컨트롤은 최소 **44×44pt**의 유효 터치 영역을 제공해야 한다.
- **State-Driven**: 상호작용 요소의 가시 크기가 44pt 미만인 동안, 시스템은 `hitSlop` 또는 `minHeight:44`로 44pt 유효 터치 영역을 확보해야 한다.

### REQ-UX-005 — 접근성 라벨 추가 (F-1/F-6)

- **Ubiquitous**: 시스템은 `src/ui/atoms/BaseButton`에 `accessibilityLabel`/`accessibilityRole` props를 표준화하여 노출해야 한다.
- **Ubiquitous**: 모든 아이콘 전용 상호작용 요소는 `accessibilityLabel`과, 요소 의미에 부합하는 `accessibilityRole` 값(버튼은 `button`, 링크는 `link`)을 제공해야 한다.
- **Event-Driven**: 스크린리더가 아이콘 전용 버튼(예: 홈 새로고침·월간·달력 이동)에 포커스하면, 시스템은 해당 동작을 설명하는 한국어 라벨을 제공해야 한다.

### REQ-UX-006 — 홈 오류 화면 재시도 버튼 (F-15)

- **Event-Driven**: 홈 대시보드 데이터 로드가 실패하여 `dashboardData`가 없을 때, 시스템은 큰 "다시 시도" 버튼을 포함한 오류 화면을 표시해야 한다.
- **Event-Driven**: 사용자가 "다시 시도"를 누르면, 시스템은 기존 `onHeaderRefresh` 로직을 재실행해야 한다.

### REQ-UX-007 — 조용한 실패 인라인 안내 (F-16)

- **Unwanted**: **If** 직원 목록 로드(`BookingForm`) 또는 주간 시술 로드(`홈`)가 실패하면, **then** 시스템은 이를 콘솔 로그만으로 처리(무음 실패)해서는 안 된다(shall not).
- **Event-Driven**: 직원 목록 또는 주간 시술 로드가 실패하면, 시스템은 인라인 안내 메시지와 재시도 수단을 표시해야 한다.

### REQ-UX-008 — 프로덕션 로그 게이팅 (Perf F-9)

- **Ubiquitous**: 시스템은 API 요청 경로에서 실행되는 모든 진단용 `console.*` 호출을 `if (__DEV__)` 가드로 게이팅해야 한다.
- **Unwanted**: **If** 프로덕션 번들로 빌드되면, **then** 시스템은 API 요청 경로에서 미게이팅 `console.*`를 실행해서는 안 된다(shall not).

---

## 5. 제외 사항 (Exclusions — What NOT to Build)

본 SPEC은 아래 항목을 **명시적으로 제외**한다. 스타일·props·소규모 방어 코드 이외의 변경은 후속 SPEC 소관이다.

- **예약 흐름 로직 변경** (직원/결제 전송 버그 수정 포함) → 후속 SPEC-3 소관.
- **FlatList 전환·메모이제이션 등 렌더 성능 구조 변경** → 후속 SPEC-2 소관.
- **react-query 캐싱 도입 및 홈 정보구조(IA) 재구성** → 후속 SPEC-4 소관.
- **데모 로그인 자격증명 제거** → 별도 보안 처리 트랙.
- **신규 색상/타이포 디자인 시스템 재설계·리브랜딩**: 토큰 값 상향만 수행하며 시각적 리브랜딩은 하지 않는다.
- **데이터 페칭·상태 관리·API 계약 변경**: 화면 흐름과 로직은 불변으로 유지한다.

---

## 6. 수용 기준 (Acceptance Criteria)

구체적·검증 가능 기준(개발 모드 `ddd` — 기존 동작에 대한 특성 테스트 우선).

| ID | 기준 | 검증 방법 | REQ |
|----|------|-----------|-----|
| AC-01 | 모든 텍스트 색상 토큰이 배경 대비 4.5:1 이상 | 토큰별 대비비 계산 검증(단위 테스트/스냅샷) | REQ-UX-001 |
| AC-02 | `#9ca3af`, `#999` 등 저대비 값이 본문/보조/플레이스홀더 색상에 0건 | `grep` 검증 | REQ-UX-001 |
| AC-03 | 전 상태 배지(5종) 배경-텍스트 대비 4.5:1 이상 | 배지 상태별 대비 검증 | REQ-UX-002 |
| AC-04 | 사용자 표시 텍스트의 `fontSize` 최솟값 ≥ 14 (본문 ≥ 16) | 스타일 정적 검사/`grep` | REQ-UX-003 |
| AC-05 | 상호작용 컨트롤의 유효 터치 영역 ≥ 44×44pt (`minHeight:44` 또는 `hitSlop`) | 스타일 정적 검사 | REQ-UX-004 |
| AC-06 | 아이콘 전용 `TouchableOpacity`/버튼에 `accessibilityLabel` 존재 | `grep` 검증 (현재 0건 → 전수 라벨링) | REQ-UX-005 |
| AC-07 | `BaseButton`이 `accessibilityLabel`/`accessibilityRole` props를 노출 | 컴포넌트 인터페이스 테스트 | REQ-UX-005 |
| AC-08 | 홈 오류 화면에 "다시 시도" 버튼 존재, 탭 시 `onHeaderRefresh` 호출 | 컴포넌트 렌더 테스트 | REQ-UX-006 |
| AC-09 | 직원/주간 시술 로드 실패 시 인라인 안내 + 재시도 노출(무음 실패 0건) | 실패 주입 렌더 테스트 | REQ-UX-007 |
| AC-10 | 프로덕션 번들 기준 API 요청 경로에 미게이팅 `console.*` 0건 | `grep`(비-`__DEV__` `console.*`) | REQ-UX-008 |
| AC-11 | 의도된 변경(색상 토큰·폰트 크기·접근성 props·로그 게이팅) 외 스냅샷 diff 0건 | 특성(스냅샷) 테스트 기준선 갱신 후, 갱신 diff가 위 4개 카테고리에만 국한됨을 리뷰로 확인 | 전체 |

### Definition of Done

- AC-01 ~ AC-11 전부 충족.
- 특성 테스트(스냅샷) 기준선 갱신 후, 의도된 변경(색상 토큰·폰트 크기·접근성 props·로그 게이팅) 외 diff 0건 확인.
- 변경이 스타일·props·소규모 가드에 한정되며, 로직/흐름 변경이 diff에 없음.

---

## 7. 위험 평가 (Risk Assessment)

- **전체 위험도: 낮음 (Low)** — 스타일 토큰·컴포넌트 props·소규모 방어 코드에 한정. 데이터 흐름·API 계약·상태 관리는 불변.
- **주의 지점**:
  - REQ-UX-002/003: 색상·폰트 토큰 상향이 스냅샷 diff를 유발 → 특성 테스트로 의도된 변경만 확인.
  - REQ-UX-006/007: 신규 JSX 분기(재시도 버튼·인라인 안내) 추가 → 기존 성공 경로 렌더 불변 검증.
  - REQ-UX-008: 로그 게이팅은 side-effect 제거일 뿐 제어 흐름을 바꾸지 않아야 함.
- **완화**: `development_mode: ddd`에 따라 변경 전 특성 테스트를 먼저 확보(ANALYZE-PRESERVE-IMPROVE).

## 8. 추적성 (Traceability)

| REQ | Finding | 로드맵 단계 |
|-----|---------|-------------|
| REQ-UX-001 | F-2 | Stage 1 |
| REQ-UX-002 | F-3 | Stage 1 |
| REQ-UX-003 | F-4 | Stage 1 |
| REQ-UX-004 | F-5 | Stage 1 |
| REQ-UX-005 | F-1, F-6 | Stage 1 |
| REQ-UX-006 | F-15 | Stage 1 |
| REQ-UX-007 | F-16 | Stage 1 |
| REQ-UX-008 | Perf F-9 | Stage 1 |

진단 근거(감사 결과 원문·file:line): `research.md` 참조.
