---
id: SPEC-HOME-001
version: 0.1.1
status: draft
created_at: 2026-07-07
updated: 2026-07-07
author: antam2010
priority: high
labels: [home, ux, ia, information-architecture, senior, accessibility, ddd, restructure]
issue_number: null
---

# SPEC-HOME-001 — 홈 화면 "오늘의 예약" 중심 재구성 및 죽은 메뉴 정리

## HISTORY

- 2026-07-07 (v0.1.0): 초안 작성. 검증된 UX 감사(읽기 전용)의 **F-7(홈 정보 과밀, P3→본 SPEC의 primary)**·**F-12(홈·예약 탭 달력 중복 + 홈 주간 위젯의 Alert 텍스트 예약 목록, P2)**·**F-13(프로필 죽은 메뉴, P3)**를 기반으로 4단계 시니어 UX·성능 로드맵의 **마지막 단계(Stage 4b, 홈 IA 재구성)**를 정의. 본 SPEC은 Stage 4a(SPEC-DATA-001, react-query 캐싱)에 의존하며 기존 데이터 훅·모달·query를 재사용한다(신규 API·신규 라이브러리 없음). 모든 file:line은 현재 HEAD `a98b126`(Stage 1~4a 반영) 기준으로 재검증했으며, 재검증 중 발견한 불일치 6건(특히 감사의 "TreatmentListModal이 홈에서 사용될 수 있음" 추정 반증, MonthlyDashboard 범위 정합)은 `research.md §7` 참조. 이것은 **시각 재설계 SPEC**이므로 이전 단계의 "시각 변화 0" 원칙은 홈 화면에 한해 적용 제외하고, 대신 신규 홈의 **접근성 수용 기준**으로 대체한다.
- 2026-07-07 (v0.1.1): 계획 감사(`.moai/reports/plan-audit/SPEC-HOME-001-review-1.md`, FAIL·0.80) 반영 — (D1) 상세 모달 재사용 대상 정정: `TreatmentDetailModal`/`TreatmentListModal`은 저장소 전체 **소비자 0건인 죽은 코드**임을 코드로 확인하고, REQ-02 상세 오픈 경로를 **프로덕션에서 실사용·검증되는 `UnifiedTreatmentModal`(booking.tsx:382 소비)** 재사용으로 규범화(내부 list/detail 뷰를 모두 보유하며 `selectedTreatment` 전달 시 detail 뷰 자동 전환, `Treatment` 타입 직접 수용 → `weeklyTreatments` 형상 정합). 죽은 코드 재활성화(경로 b)는 채택하지 않음. (D2) 오늘 예약 0건 빈 상태 AC 신설(AC-15). (D3) 신규 홈 UI 접근성 측정 AC 3건 신설(AC-16 리스트 항목 44pt+라벨, AC-17 폰트 하한, AC-18 AA 색상 토큰) — SPEC-UX-001 AC-02/04/05/06 방식 계승. (D4) "자세히 보기"→월간 모달 오픈 AC 신설(AC-19). (D6) §3 표 #1 `ScrollView` 라인 `135-386`→`138-386` 정정(135=`return (`). research.md §4·§7 D-4/D-5/D-6 병행 정정.

---

## 1. 개요 (Overview)

KMC Beauty Native 앱의 **주 사용자는 오너의 어머니(60대)**이며, 매일 하는 일은 세 가지다: (1) **오늘 예약 확인**, (2) **예약 등록**, (3) **고객 찾기**. 그러나 현재 홈 화면(`app/(tabs)/index.tsx`)은 단일 스크롤에 **6개 데이터 섹션**(주간 달력 위젯 + 매출 카드 4 + 예약 카드 4 + 인기 서비스 5 + 고객 인사이트 4 + VIP 5)을 적층해 **20개 이상의 숫자**를 한 번에 노출한다(`research.md §2`). 60대 사용자가 "오늘 할 일"을 즉시 찾기 어려운 **정보 과밀(F-7)**이다.

또한 홈의 주간 달력 위젯은 날짜를 탭하면 예약을 **`Alert.alert` 텍스트 목록**으로 표시(조작 불가)하며(`handleDateSelect`, `index.tsx:78-104`), 상세 달력은 예약 탭과 **중복(F-12)**된다. 프로필 화면에는 탭 시 "준비중" Alert만 뜨는 **죽은 메뉴 2개**(프로필 수정·알림 설정)가 실제 기능처럼 노출된다(F-13).

본 SPEC은 4단계 로드맵의 **마지막 단계(Stage 4b)**이며 다음 원칙을 따른다.

- **"오늘" 중심 재구성**: 홈 첫 화면(스크롤 전)을 **오늘의 예약 리스트**와 **큰 새 예약 버튼**으로 재편하여, 매일의 핵심 3작업(오늘 확인·예약 등록·고객 찾기 진입)을 즉시 도달하게 한다.
- **데이터·모달·query 재사용(신규 API 0)**: 오늘 리스트는 이미 캐싱된 `useDashboardLoad`의 `weeklyTreatments`를 오늘로 필터해 파생하고(`research.md §3`), 항목 탭 시 **프로덕션에서 실사용되는 `UnifiedTreatmentModal`**(예약 탭이 소비하는 통합 상세/목록 모달, `research.md §4`)을, 새 예약은 기존 `BookingForm` 흐름을, 상세 통계는 이미 존재하는 `MonthlyDashboard` 모달을 재사용한다.
- **상세 통계는 접기/경유**: 인기 서비스·고객 인사이트·VIP 3섹션을 홈 primary surface에서 제거하고, 상세는 "자세히 보기"(기존 월간 대시보드 모달) 경로로만 접근한다.
- **중복 제거**: 홈 주간 달력 위젯과 그 `Alert` 예약 목록 인터랙션을 제거한다(상세 달력의 단일 소스는 예약 탭).
- **접근성 계승**: SPEC-UX-001 기준(폰트 하한·44pt 터치·대비·`accessibilityLabel`)을 신규 홈 UI에도 적용하되, primary CTA는 56pt 하한을 신규 도입한다.
- 개발 방법론은 **DDD**(ANALYZE-PRESERVE-IMPROVE)이며, 재구성 전 **현재 홈의 데이터 흐름을 특성 테스트로 고정**한다(모델: `__tests__/useDashboardLoad.test.tsx`, `research.md §8`).

## 2. 목표 (Goals)

- 홈 첫 화면(스크롤 전)에 **오늘의 예약 리스트**(시간순, 큰 글씨)와 **화면 폭의 큰 새 예약 버튼**(최소 높이 56pt)을 렌더하여 매일의 핵심 작업을 즉시 도달하게 한다(F-7).
- 오늘 리스트 데이터는 **기존 `useDashboardLoad`의 `weeklyTreatments`를 오늘 날짜로 필터**해 파생하고, 항목 탭 시 **기존 `UnifiedTreatmentModal`**(예약 탭이 실사용하는 통합 상세 모달, `selectedTreatment` 전달 시 detail 뷰 자동 전환)로 상세를 연다 — **신규 API·신규 서비스 호출 0**(F-7/F-12).
- 오늘 요약은 **핵심 숫자 2~3개**(예: 오늘 매출·오늘 예약 건수)만 카드로 남기고, 상세 통계(인기 서비스·고객 인사이트·VIP)는 **홈 직접 렌더 0**으로 하여 "자세히 보기"(기존 `MonthlyDashboard` 모달) 경유로만 접근하게 한다(F-7).
- 홈 **주간 달력 위젯과 그 `Alert` 예약 목록 인터랙션을 제거**한다 — 상세 달력의 단일 소스는 예약 탭(F-12).
- 프로필의 **죽은 메뉴 2개(프로필 수정·알림 설정)를 노출 0**으로 하여, "준비중" Alert 트리거를 사용자가 만나지 못하게 한다(F-13).
- 신규 홈 UI에 **SPEC-UX-001 접근성 기준**(폰트 하한·터치 타깃·대비·`accessibilityRole`/`accessibilityLabel`)을 적용하고, 새 예약 버튼은 `minHeight = 56`(하한) + `accessibilityLabel`을 제공한다.
- 위 모든 변경은 **기존 78 테스트(19 스위트) 통과**·**`tsc` 회귀 0건**(기준선 = `EditTreatmentModal.tsx` 2건 유지)·**Stage 1~4a 불변식 무회귀**(react-query 캐싱·월간 모달 조건부 마운트·`weeklyError` 인라인·재시도)를 만족한다.

## 3. 범위 (In Scope)

감사에서 확인되고 현재 HEAD(`a98b126`)로 재검증된 다음 3개 Finding에 한정한다. (라인은 `research.md`에서 재검증한 현재 값)

| # | 항목 | Finding | 우선순위 | 대표 위치 (현재 기준) |
|---|------|---------|----------|-----------------------|
| 1 | 홈 "오늘" 중심 재구성(첫 화면 = 오늘 리스트 + 새 예약 버튼) | F-7 | P1 | `app/(tabs)/index.tsx` 단일 `ScrollView` `138-386`(135=`return (`); 데이터 훅 `useDashboardLoad` `28-38`(`dashboardData`·`weeklyTreatments` `32`) |
| 2 | 오늘의 예약 리스트(기존 데이터 파생) + 항목 탭 → 상세 모달 | F-7/F-12 | P1 | 파생: `weeklyTreatments` 오늘 필터(`index.tsx:82-85` 동일 필터 존재); 모달: **`components/modals/UnifiedTreatmentModal.tsx:14-22`**(예약 탭 `booking.tsx:382` 실소비, `selectedTreatment`/`treatments`/`date` props) |
| 3 | 큰 새 예약 버튼(≥56pt) → 기존 `BookingForm` 흐름 | F-7 | P1 | `components/forms/BookingForm.tsx`; 예약 탭 진입 `router.push('/booking')`(현행 `index.tsx:240`) 또는 booking.tsx 새 예약 흐름(`handleNewBookingRequest` `booking.tsx:86`) |
| 4 | 오늘 요약 핵심 숫자 2~3개만 유지 | F-7 | P2 | `dashboardData.summary.target_date`(오늘 매출 `253`·예약 건수 `286` 등 기존 데이터) |
| 5 | 상세 통계 3섹션 홈 직접 렌더 제거 + 월간 모달 경유 유지 | F-7 | P2 | 제거: 인기 서비스 `313-329`·고객 인사이트 `331-362`·VIP `364-385`; 경유: 기존 `MonthlyDashboard` 모달(`index.tsx:390-413`, 진입 아이콘 `160-168`) |
| 6 | 주간 달력 위젯 + Alert 예약 목록 인터랙션 제거 | F-12 | P2 | 위젯 `181-245`; `handleDateSelect` `78-104`(`Alert.alert` `98-102`); 날짜 셀 `onPress` `210` |
| 7 | 프로필 죽은 메뉴 2개 노출 0 | F-13 | P3 | 프로필 수정: 편집 아이콘 `profile.tsx:143-150` + `handleEditProfile` `92-94`; 알림 설정: 항목 `220-226` + `handleNotificationSettings` `96-98` |
| 8 | 신규 홈 UI 접근성/시인성(SPEC-UX-001 계승) | 접근성 | P2 | 새 예약 버튼 `minHeight=56` + `accessibilityLabel`; 리스트 항목 터치 타깃·폰트 하한·대비 |

> **주의(재검증 결과)**: (a) 감사/배경의 "홈이 이제 `TreatmentListModal`을 사용할 수 있음" 추정은 **거짓**이며, 나아가 `TreatmentDetailModal`·`TreatmentListModal` 두 컴포넌트는 저장소 전체에서 **소비자 0건인 죽은 코드**다(정의 파일만 존재). 예약 탭(`booking.tsx:4-5`)이 실사용하는 것은 `EditTreatmentModal`·`UnifiedTreatmentModal`이며, 상세/목록 렌더의 **살아있는 통합 후속 컴포넌트는 `UnifiedTreatmentModal`**(내부 list/detail 뷰 보유)이다. 따라서 본 SPEC은 REQ-02의 상세 오픈을 **죽은 모달 재활성화가 아니라 `UnifiedTreatmentModal` 재사용**으로 규정한다(`research.md §4·§7 D-4`). `index.tsx`는 여전히 두 모달을 import하지 않고 `Alert.alert`로 목록을 표시한다. (b) 목표의 "인기 서비스·고객 인사이트·VIP를 월간 대시보드 모달로 이전"은 문자 그대로 성립하지 않는다 — `MonthlyDashboard`는 **월간** 컴포넌트이고 고객 인사이트/VIP 섹션이 없으므로(`research.md §5`), 본 SPEC은 "홈 직접 렌더 0 + 기존 월간 모달 접근 경로 유지"로만 규정하고 오늘 VIP/인사이트의 월간 모달 재현은 **제외**한다. (c) 프로필의 나머지 두 항목(비밀번호 변경 `209-218`·앱 정보 `228-234`)은 정상 기능이므로 **유지**한다. 상세·불일치 6건은 `research.md §7` 참조.

---

## 4. 요구사항 (EARS Requirements)

요구사항은 제안 구현 순서(§8)와 동일한 번호 순서로 정의한다.

### REQ-HOME-001-01 — 홈 "오늘" 중심 재구성 (F-7)

- **Ubiquitous**: 시스템은 홈 첫 화면(스크롤 전 뷰포트)에 **오늘의 예약 리스트**와 **새 예약 버튼**을 함께 렌더해야 한다(shall) — 두 요소가 스크롤 없이 도달 가능해야 한다.
- **Ubiquitous**: 시스템은 홈 primary surface에 상세 통계 3섹션(인기 서비스·고객 인사이트·VIP 고객)을 직접 렌더하지 않아야 한다(shall not).
- **Ubiquitous**: 시스템은 홈 재구성 후에도 기존 데이터 훅 `useDashboardLoad`의 `dashboardData`·`weeklyTreatments` 소비 계약과 Stage 4a 캐싱 동작(동일 query key staleTime 내 재요청 0회)을 변경하지 않아야 한다(shall not).

### REQ-HOME-001-02 — 오늘의 예약 리스트 + 상세 모달 (F-7/F-12)

- **Ubiquitous**: 시스템은 오늘의 예약 리스트를 **기존 `weeklyTreatments`를 오늘 날짜로 필터·시간(`reserved_at`) 오름차순 정렬**해 구성해야 하며(shall), 이를 위해 신규 API 또는 추가 서비스 호출을 발생시키지 않아야 한다(shall not) — useDashboardLoad의 기존 2개 query(오늘 요약·주간) 외 호출 0.
- **Event-Driven**: 사용자가 오늘의 예약 리스트의 한 항목을 탭하면(When), 시스템은 해당 예약을 **기존 `UnifiedTreatmentModal`**로 상세 표시해야 한다 — 탭한 예약을 `selectedTreatment`로 전달하여 detail 뷰로 열며, 죽은 코드인 `TreatmentDetailModal`/`TreatmentListModal`을 재활성화하지 않아야 한다(shall not).
- **State-Driven**: 오늘 예약이 0건인 동안, 시스템은 리스트 대신 빈 상태 안내(예: "오늘 예약이 없습니다")를 렌더하되 새 예약 버튼은 계속 노출해야 한다.

### REQ-HOME-001-03 — 큰 새 예약 버튼 (F-7)

- **Ubiquitous**: 시스템은 새 예약 버튼을 **최소 높이 56pt(`minHeight ≥ 56`)·화면 폭**으로 렌더하고 `accessibilityRole="button"`과 비어있지 않은 `accessibilityLabel`을 제공해야 한다(shall).
- **Event-Driven**: 사용자가 새 예약 버튼을 누르면(When), 시스템은 기존 `BookingForm` 예약 생성 흐름에 진입해야 한다 — 예약 탭 이동(`router.push('/booking')`) 또는 `BookingForm` 모달 직접 오픈 중 하나로 하며, 신규 예약 폼을 새로 작성하지 않는다(기존 재사용).
- (비규범 참고) 진입 방식(탭 이동 vs 모달 직접 오픈)은 구현 재량이며, 최소 diff·롤백 용이성(§7) 관점에서 예약 탭 이동이 권장되나 강제하지 않는다.

### REQ-HOME-001-04 — 오늘 요약 핵심 숫자 (F-7)

- **Ubiquitous**: 시스템은 홈 요약 블록에 **오늘 요약 핵심 숫자 2~3개**(예: 오늘 매출·오늘 예약 건수)만 카드로 렌더해야 하며(shall), 이는 기존 `dashboardData.summary.target_date` 데이터에서 파생해야 한다(신규 데이터 없음).
- **Ubiquitous**: 시스템은 홈 요약 블록의 카드 수가 3개를 초과하지 않도록 해야 한다(shall not exceed 3).

### REQ-HOME-001-05 — 상세 통계 접기/경유 (F-7)

- **Ubiquitous**: 시스템은 상세 통계(인기 서비스·고객 인사이트·VIP)를 홈에서 직접 렌더하지 않아야 한다(shall not) — 접근은 "자세히 보기"(기존 `MonthlyDashboard` 월간 대시보드 모달) 경로로만 제공한다.
- **Event-Driven**: 사용자가 "자세히 보기"(달력/월간) 진입점을 누르면(When), 시스템은 기존 `MonthlyDashboard` 모달을 열어 상세 통계에 접근하게 해야 한다.
- **State-Driven**: 월간 대시보드 모달이 닫혀 있는 동안, 시스템은 `MonthlyDashboard`를 마운트하지 않아야 한다(shall not) — 월별 API 호출 0회(REQ-PERF-003-02 불변식 보존).
- (비규범 참고) 본 SPEC은 오늘 데이터 기반 인기 서비스/고객 인사이트/VIP를 `MonthlyDashboard`(월간 컴포넌트) 내부에 재현하지 않는다 — `research.md §5` 참조. 상세 통계 접근 수단은 기존 월간 모달로 충분하다.

### REQ-HOME-001-06 — 주간 위젯 및 Alert 목록 제거 (F-12)

- **Ubiquitous**: 시스템은 홈에 주간 달력 위젯("이번 주 예약 현황" 7일 셀)을 렌더하지 않아야 한다(shall not) — 상세 달력의 단일 소스는 예약 탭이다.
- **Ubiquitous**: 시스템은 날짜 선택 시 예약을 `Alert.alert` 텍스트 목록으로 표시하는 인터랙션을 제공하지 않아야 한다(shall not) — 오늘 예약 열람은 REQ-02의 리스트/상세 모달로 대체한다.
- **Ubiquitous**: 시스템은 예약 탭의 달력 화면(`app/(tabs)/booking.tsx` 및 `ImprovedCalendar`)을 변경하지 않아야 한다(shall not) — 본 SPEC은 홈에 한정한다.

### REQ-HOME-001-07 — 프로필 죽은 메뉴 정리 (F-13)

- **Ubiquitous**: 시스템은 프로필 화면에서 "프로필 수정"(편집 아이콘)과 "알림 설정" 항목을 노출하지 않아야 한다(shall not) — 두 항목은 "준비중" Alert만 트리거하는 미구현 기능이다.
- **Unwanted**: **If** 사용자가 프로필 화면을 조작하는 중 "준비중" Alert 트리거 항목(`handleEditProfile`/`handleNotificationSettings`)에 도달할 수 있으면, **then** 시스템은 해당 항목을 렌더 트리에서 제거하여 도달 경로를 0으로 만들어야 한다.
- **Ubiquitous**: 시스템은 정상 동작하는 프로필 항목(비밀번호 변경·앱 정보)과 로그아웃을 변경하지 않아야 한다(shall not).

### REQ-HOME-001-08 — 신규 홈 UI 접근성/시인성 (SPEC-UX-001 계승)

- **Ubiquitous**: 시스템은 신규 홈 UI(오늘 리스트 항목·새 예약 버튼·요약 카드)에 SPEC-UX-001의 접근성 기준(폰트 하한·터치 타깃 최소 44pt·대비·`accessibilityRole`/`accessibilityLabel`)을 적용해야 한다(shall).
- **Ubiquitous**: 시스템은 오늘 리스트의 각 예약 항목에 대해 터치 타깃 최소 높이 44pt와 스크린리더용 `accessibilityLabel`(시간·고객·서비스 요약)을 제공해야 한다(shall).

### REQ-HOME-001-09 — 무회귀 보증 (Stage 1~4a·테스트·타입)

- **Ubiquitous**: 시스템은 재구성 후에도 홈의 기존 불변식 — pull-to-refresh `force_refresh` refetch(SPEC-DATA-001 AC-03), `weeklyError` 인라인 안내(SPEC-UX-001 REQ-UX-007), `!dashboardData` 시 "다시 시도" 재시도(SPEC-UX-001 REQ-UX-006), 상점 미선택 시 로드 스킵 — 을 변경하지 않아야 한다(shall not).
- **Ubiquitous**: 시스템은 기존 78 테스트(19 스위트)를 모두 통과시키고 `tsc --noEmit` 신규 오류 0건(기준선 = `EditTreatmentModal.tsx:123`·`:395` 2건 유지)을 만족해야 한다(shall).

---

## 5. 제외 사항 (Exclusions — What NOT to Build)

본 SPEC은 아래 항목을 **명시적으로 제외**한다.

- **예약 탭 달력 화면 변경**: `app/(tabs)/booking.tsx`·`ImprovedCalendar`·`BookingListScreen`은 변경하지 않는다(홈에 한정).
- **탭 구조 변경**: 4탭 구조(홈·예약·관리·프로필)를 변경하지 않는다.
- **오늘 통계의 월간 모달 재현**: 오늘 데이터 기반 인기 서비스/고객 인사이트/VIP를 `MonthlyDashboard`(월간 컴포넌트) 내부에 복제하지 않는다 — 상세 접근은 기존 월간 모달 경로로 충분(`research.md §5`).
- **신규 API·신규 라이브러리 도입**: 오늘 리스트·요약은 기존 `useDashboardLoad`/react-query 캐시에서 파생하며 새 엔드포인트·새 패키지를 추가하지 않는다.
- **예약 흐름 로직 변경**: `BookingForm`의 payload·검증·성공 처리·스마트 기본값은 SPEC-BOOKING-001 소관으로 변경하지 않는다(본 SPEC은 진입점만 홈에서 재사용).
- **데이터 계층 변경**: react-query Provider·query key·mutation invalidation·서비스 통합은 SPEC-DATA-001 소관으로 변경하지 않는다(본 SPEC은 소비만).
- **프로필 정상 항목 변경**: 비밀번호 변경·앱 정보·로그아웃·내 정보/상점 정보 카드는 변경하지 않는다(죽은 메뉴 2개만 숨김).
- **미구현 기능 실제 구현**: "프로필 수정"·"알림 설정" 기능 자체를 구현하지 않는다(노출만 제거).
- **`EditTreatmentModal.tsx` 기존 tsc 오류 2건 수정**(`:123`, `:395`) → 별도 작업. 본 SPEC은 기준선 유지(회귀 0)만 확인한다.
- **`DashboardContext` 삭제·수정**: 활성 사용 중이며 본 SPEC 범위 밖(SPEC-DATA-001 `research.md §6 D1`).

---

## 6. 수용 기준 (Acceptance Criteria)

구체적·이진 판정 가능 기준(개발 모드 `ddd` — 재구성 전 현재 홈 데이터 흐름의 특성 테스트 우선; 렌더 존재/부재는 `@testing-library/react-native`의 `queryByText`/`queryByLabelText`, 호출 횟수는 jest 서비스 모킹 spy로 측정).

| ID | 기준 | 검증 방법 | REQ |
|----|------|-----------|-----|
| AC-01 | 홈 첫 화면(스크롤 전 렌더)에 **오늘의 예약 리스트**와 **새 예약 버튼**이 모두 렌더됨 | 렌더 테스트(리스트 컨테이너 testID + 새 예약 버튼 `queryByLabelText` 모두 non-null) | REQ-HOME-001-01, 03 |
| AC-02 | 홈 렌더 시 상세 통계 3섹션 텍스트("인기 서비스"·"고객 인사이트"·"VIP 고객")가 **직접 렌더 0** | 렌더 테스트(`queryByText` 각각 `null`) | REQ-HOME-001-01, 05 |
| AC-03 | 오늘 리스트가 `weeklyTreatments` 오늘 필터·`reserved_at` 오름차순으로 구성되고 **추가 서비스 호출 0**(오늘 요약·주간 각 1회 외 없음) | 단위/렌더 테스트(정렬·필터 assert + 서비스 spy call-count = 기존 2회) | REQ-HOME-001-02 |
| AC-04 | 오늘 리스트 항목 탭 → 기존 `UnifiedTreatmentModal` `visible=true` + detail 뷰로 전환(탭한 예약을 `selectedTreatment`로 전달) | 렌더 테스트(항목 `fireEvent.press` → 모달 노출 + `selectedTreatment` prop=탭한 예약 assert; 죽은 `TreatmentDetailModal`/`TreatmentListModal` import 0건 grep) | REQ-HOME-001-02 |
| AC-05 | 새 예약 버튼 style `minHeight >= 56` + `accessibilityRole==="button"` + 비어있지 않은 `accessibilityLabel` | 렌더 테스트(버튼 노드 style·props assert) | REQ-HOME-001-03, 08 |
| AC-06 | 새 예약 버튼 press → 예약 생성 진입점 활성화(`router.push('/booking')` spy 1회 **또는** `BookingForm` `visible=true` 중 하나) | 렌더 테스트(선택 구현 경로에 대한 spy/노출 assert) | REQ-HOME-001-03 |
| AC-07 | 홈 요약 카드 렌더 수가 **2~3개**(3 초과 없음), 데이터는 `summary.target_date` 파생 | 렌더 테스트(요약 블록 카드 노드 count in [2,3]) | REQ-HOME-001-04 |
| AC-08 | 주간 달력 위젯 **렌더 0**("이번 주 예약 현황" `queryByText`=`null`) + 날짜 탭 시 `Alert.alert` 예약 목록 호출 **0회** | 렌더 테스트(`queryByText` null + `Alert.alert` spy = 0) | REQ-HOME-001-06 |
| AC-09 | 프로필 화면에서 "프로필 수정"(편집 아이콘) 및 "알림 설정" 항목 **노출 0** | 렌더 테스트(`queryByLabelText("프로필 수정")`=`null` + `queryByText("알림 설정")`=`null`) | REQ-HOME-001-07 |
| AC-10 | 프로필 정상 항목(비밀번호 변경·앱 정보·로그아웃) **노출 유지** | 렌더 테스트(`queryByText` 각각 non-null) | REQ-HOME-001-07 |
| AC-11 | 월간 대시보드 모달이 닫힌 동안 `MonthlyDashboard` **미마운트**(월별 API 0회) | 렌더 테스트(모달 닫힘 상태에서 `getMonthlyDetailedSummary` spy = 0) | REQ-HOME-001-05 |
| AC-12 | 홈 불변식 무회귀: pull-to-refresh `force_refresh` refetch·`weeklyError` 인라인 안내·`!dashboardData` 재시도 버튼·상점 미선택 스킵 **동작 유지** | 기존 `useDashboardLoad` 특성 테스트 + 홈 렌더 테스트 통과 | REQ-HOME-001-09 |
| AC-13 | 기존 jest **테스트 78개(19 스위트) 전부 통과** | `npx jest` | 전체 |
| AC-14 | `tsc --noEmit` **신규 오류 0건**(기준선 = `EditTreatmentModal.tsx` 2건 유지) | `npx tsc --noEmit` | 전체 |
| AC-15 | 오늘 예약 **0건 모킹** 시 빈 상태 안내 텍스트(예: "오늘 예약이 없습니다")가 렌더되고 새 예약 버튼은 계속 노출 | 렌더 테스트(`weeklyTreatments`=오늘 0건 주입 → `queryByText("오늘 예약이 없습니다")` non-null **AND** 새 예약 버튼 `queryByLabelText` non-null) | REQ-HOME-001-02 |
| AC-16 | 오늘 리스트 **각 항목**의 터치 타깃 유효 높이 ≥ 44pt(`minHeight:44` 또는 `hitSlop`)이고 비어있지 않은 `accessibilityLabel`(시간·고객·서비스 요약) 보유 | 렌더 테스트(항목 노드 style `minHeight>=44` 또는 hitSlop assert + `accessibilityLabel` 문자열 길이 > 0 assert) | REQ-HOME-001-08 |
| AC-17 | 신규 홈 UI(오늘 리스트 항목·요약 카드·빈 상태) 사용자 표시 텍스트의 `fontSize` 최솟값 ≥ 14, 본문(이름·금액·상태·시간) ≥ 16 | 스타일 정적 검사/`grep`(SPEC-UX-001 AC-04 방식) | REQ-HOME-001-08 |
| AC-18 | 신규 홈 UI 텍스트 색상이 전부 theme의 AA 검증 토큰(`Colors.text.primary`/`secondary`/`muted` — `__tests__/contrast.test.ts`에서 배경 대비 4.5:1로 단언된 값)만 사용하고, 저대비 raw hex는 0건 | 스타일 정적 검사(텍스트 색상이 `Colors.text.*` 토큰 경유) + 신규 홈 UI 스타일에서 저대비 리터럴 `#9ca3af`·`#999`·`#999999`·`#ccc`·`#cccccc`를 **각각 개별** `grep -rn`(무-alternation) 검색 시 전부 0건(SPEC-UX-001 AC-02 방식) | REQ-HOME-001-08 |
| AC-19 | "자세히 보기"(달력/월간) 진입점 press → 기존 `MonthlyDashboard` 모달 오픈(마운트 + `visible=true`) | 렌더 테스트(진입점 `fireEvent.press` → `MonthlyDashboard` 마운트 노드 노출 assert; AC-11의 닫힘 상태 미마운트와 쌍) | REQ-HOME-001-05 |

### Definition of Done

- AC-01 ~ AC-19 전부 충족.
- 재구성 전(PRESERVE) 현재 홈의 데이터 흐름(useDashboardLoad 소비·pull-to-refresh·weeklyError·월간 모달 조건부 마운트·재시도)에 대한 특성 테스트(`research.md §8` CT-1~5)를 먼저 확보한다.
- 최종 diff가 홈 IA(`app/(tabs)/index.tsx` 중심)와 프로필 죽은 메뉴 숨김(`app/(tabs)/profile.tsx`)에 한정되며, 예약 탭 달력·데이터 계층·예약 흐름 로직·`MonthlyDashboard` 월간 로직·`EditTreatmentModal` 오류 수정이 diff에 없음.
- 신규 홈 UI가 SPEC-UX-001 접근성 기준을 **측정 가능한 AC로** 충족한다: 리스트 항목 44pt+`accessibilityLabel`(AC-16), 폰트 하한 본문16/캡션14(AC-17), AA 검증 색상 토큰만 사용(AC-18), 그리고 새 예약 버튼 `minHeight ≥ 56`(AC-05).

---

## 7. 위험 평가 (Risk Assessment)

- **전체 위험도: 높음 (HIGH)** — 메인 화면(홈)의 **시각·정보구조 재설계**로, 이전 단계의 "시각 변화 0/스냅샷 diff 0" 안전망이 홈에는 적용되지 않는다(의도된 예외). 사용자가 매일 처음 보는 화면이므로 회귀·혼란의 체감이 크다.
- **완화 — 롤백 용이성**: 코드 변경을 **`app/(tabs)/index.tsx` 단일 파일 중심**으로 국한한다(+ `profile.tsx` 항목 숨김의 소폭 변경). 데이터 훅·모달·query는 불변이므로, 시각 재구성이 문제 시 **해당 커밋 한 건을 `git revert`**하면 홈이 이전 상태로 복원되고 나머지 계층과 정합을 유지한다(`research.md §9`). → **커밋 분리 권장**: 홈 재구성과 프로필 정리를 별도 커밋으로 나눠 개별 revert 가능하게 한다.
- **주의 지점**:
  - REQ-02(오늘 리스트): `weeklyTreatments`는 주간 전체이므로 오늘 필터·정렬 로직이 정확해야 한다(빈 상태 포함). 추가 서비스 호출이 새로 들어가면 캐싱 이점이 훼손된다(`research.md §3`, AC-03).
  - REQ-02(상세 모달 재사용 대상 결정): 감사 D1로 확인된 대로 `TreatmentDetailModal`/`TreatmentListModal`은 **소비자 0건인 죽은 코드**이므로 재활성화(스타일·타입·SPEC-UX-001 기준 최신성 미보장)하지 않는다. 대신 예약 탭이 프로덕션에서 실사용하는 **`UnifiedTreatmentModal`**(내부 list/detail 뷰 보유, `Treatment` 직접 수용)을 재사용해 blast radius와 재활성화 위험을 회피한다(`research.md §4`). 단, `UnifiedTreatmentModal`은 현재 전용 단위 테스트가 없으므로, 홈 재사용 경로의 회귀 가드로 **AC-04(탭→모달 오픈 + `selectedTreatment` 전달) 렌더 테스트를 신규 확보**한다. 편집 경로(`onEditRequest`→`EditTreatmentModal`, tsc 기준선 2건 보유)는 홈 범위 밖이므로 홈에서 `onEditRequest`를 배선하지 않는다(예약 탭 소관).
  - REQ-05(상세 접기): "인기 서비스·VIP·인사이트를 월간 모달로 이전"을 문자 그대로 해석하면 `MonthlyDashboard`(월간) 동작 변경·신규 데이터 배선이 필요해 범위·위험이 급증한다. 본 SPEC은 **홈 렌더 제거 + 기존 월간 모달 접근 유지**로만 규정한다(`research.md §5`, D-3).
  - REQ-09(불변식): 홈 재구성이 Stage 4a 캐싱(동일 query key dedup)·REQ-PERF-003-02(월간 모달 조건부 마운트)·SPEC-UX-001 재시도/인라인 안내를 깨지 않아야 한다. 이들은 특성 테스트로 먼저 고정한다.
  - REQ-07(프로필): 죽은 메뉴 2개만 숨기고 정상 항목 4종(비밀번호·앱정보·로그아웃·내정보)은 유지해야 한다 — 항목 인덱스 착오로 정상 항목을 숨기지 않도록 `accessibilityLabel`/텍스트 기준으로 제거한다(`research.md §6`).
  - 접근성 회귀: 큰 글씨·56pt CTA 도입이 좁은 화면에서 레이아웃 깨짐을 유발하지 않도록 확인(터치 타깃 최소 44pt 유지).
- **완화(방법론)**: `development_mode: ddd`에 따라 재구성 전 특성 테스트(CT-1~5)를 먼저 확보하고, 각 커밋 후 `npx jest`·`npx tsc --noEmit`로 회귀 0(78 테스트·2 기준선)을 확인한다.

## 8. 구현 순서 (Suggested Implementation Order)

특성 테스트(PRESERVE) → 오늘 중심 골격 → 상세 접기/위젯 제거 → 프로필 정리 → 접근성·회귀 검증 순으로 진행한다.

1. **PRESERVE** — 현재 홈 데이터 흐름 특성 테스트(CT-1~5, `research.md §8`) 확보(회귀 가드).
2. **REQ-HOME-001-02 + 01** — 오늘의 예약 리스트(기존 `weeklyTreatments` 오늘 필터·정렬) + 항목 탭 → `UnifiedTreatmentModal`(`selectedTreatment` 전달) 재사용, 빈 상태(AC-15) 포함, 첫 화면 배치.
3. **REQ-HOME-001-03** — 큰 새 예약 버튼(≥56pt, `accessibilityLabel`) → 기존 예약 흐름 진입(예약 탭 이동 권장).
4. **REQ-HOME-001-04 + 05** — 오늘 요약 핵심 숫자 2~3개만 유지 + 상세 통계 3섹션 홈 렌더 제거(월간 모달 경유 유지).
5. **REQ-HOME-001-06** — 주간 달력 위젯 + `handleDateSelect` Alert 목록 인터랙션 제거.
6. **REQ-HOME-001-07** — 프로필 죽은 메뉴 2개 항목 제거(정상 항목 유지) — **별도 커밋**.
7. **REQ-HOME-001-08 + 09** — 신규 UI 접근성 기준 적용 + 78 테스트·tsc 기준선 회귀 0 확인.

## 9. 추적성 (Traceability)

| REQ | Finding | 우선순위 | 유형 | 로드맵 단계 |
|-----|---------|----------|------|-------------|
| REQ-HOME-001-01 | F-7 | P1 | IA(재구성) | Stage 4b |
| REQ-HOME-001-02 | F-7/F-12 | P1 | IA(재사용) | Stage 4b |
| REQ-HOME-001-03 | F-7 | P1 | UX(CTA) | Stage 4b |
| REQ-HOME-001-04 | F-7 | P2 | IA(간소화) | Stage 4b |
| REQ-HOME-001-05 | F-7 | P2 | IA(접기) | Stage 4b |
| REQ-HOME-001-06 | F-12 | P2 | 중복 제거 | Stage 4b |
| REQ-HOME-001-07 | F-13 | P3 | 정리(죽은 메뉴) | Stage 4b |
| REQ-HOME-001-08 | 접근성 | P2 | 접근성(계승) | Stage 4b |
| REQ-HOME-001-09 | 회귀 | P1 | 품질(무회귀) | Stage 4b |

진단 근거(재검증 결과·데이터 경로·모달 재사용·MonthlyDashboard 범위 정합·불일치 6건·특성 테스트 전략·롤백 근거): `research.md` 참조.
