---
id: SPEC-PERF-003
version: 0.1.0
status: draft
created_at: 2026-07-07
updated: 2026-07-07
author: antam2010
priority: high
labels: [performance, rendering, flatlist, memoization, zustand-selector, senior]
issue_number: null
---

# SPEC-PERF-003 — 렌더링 성능 개선 (목록 가상화·메모이제이션·중복 요청 제거)

## HISTORY

- 2026-07-07 (v0.1.0): 초안 작성. 검증된 정적 성능 감사(읽기 전용)에서 확인된 9건(F-1/F-2/F-3/F-4/F-5/F-7/F-8/F-10/F-16)을 기반으로 4단계 시니어 UX·성능 로드맵의 2단계(Stage 2)를 정의. 모든 file:line은 현재 코드(SPEC-UX-001·SPEC-PERF-001·SPEC-REFACTOR-001 반영 후) 기준으로 재검증됨. 진단 근거·재검증 결과·특성 테스트 전략은 `research.md` 참조.

---

## 1. 개요 (Overview)

KMC Beauty Native 앱의 **주 사용자는 오너의 어머니(60대)**로, 매일 미용실 운영을 위해 앱을 직접 사용한다. 사용자는 **목록/스크롤 버벅임(S1)**, **버튼 반응 지연(S2)**, **전반적 느림(S3)**을 겪고 있다. 본 SPEC은 이 체감 성능 저하의 **정적으로 검증된 원인**을 제거한다.

본 SPEC은 4단계 로드맵의 **2단계(Stage 2)**이며, 다음 원칙을 따른다.

- **행위 보존(behavior-preserving)**: 화면·UI는 **픽셀 동일**하게 유지한다. 시각적/UX 변경은 하지 않는다.
- **대상**: 목록 가상화(FlatList), 렌더 파생값 메모이제이션, render 경로의 로케일 포맷 제거, 닫힌 모달의 마운트/요청 제거, 중복 API 요청 제거, 스토어 셀렉터 구독 전환.
- 검증 근거는 file:line 단위로 감사에서 확인되었으며, 현재 코드 기준으로 재검증되었다(`research.md`).
- 개발 방법론은 **DDD**(ANALYZE-PRESERVE-IMPROVE)이며, 변경 전에 **특성 테스트**(렌더 횟수·API 호출 횟수)를 먼저 확보한다.

## 2. 목표 (Goals)

- 최대 100행 목록(전화번호부)과 다중 목록(시술 메뉴/상세)을 **FlatList로 가상화**하여 스크롤 버벅임(S1)을 제거한다.
- render 경로에서 매 렌더 반복되는 **`toLocale*`·`new Date` 포맷·O(n) 필터·인라인 리터럴**을 데이터 수신 시점 파생 또는 메모이제이션으로 대체한다.
- **닫힌 월별 모달**이 유발하는 불필요한 마운트·월별 API 호출을 제거한다(S3).
- 홈 진입 시 **중복 대시보드 요청**을 1회로 수렴하고, 독립 요청을 **병렬화**한다(S3).
- 전체 스토어 구조분해 구독을 **셀렉터 구독**으로 전환하여 무관한 상태 변경에 의한 리렌더(S2/S3)를 차단한다.
- 위 모든 변경은 **시각적 변화 0**·**기존 테스트 회귀 0**을 만족한다.

## 3. 범위 (In Scope)

감사에서 file:line으로 검증되고 현재 코드 기준으로 재확인된 다음 9개 항목에 한정한다. (라인은 `research.md`에서 재검증된 현재 값)

| # | 항목 | Finding | 증상 | 대표 위치 (현재 기준) |
|---|------|---------|------|-----------------------|
| 1 | 전화번호부 목록 가상화 | F-1 | S1 | `PhonebookManagement.tsx` 목록 `250-262`, load size 100 `52-56`, 행 `formatPhoneNumber` `167` |
| 2 | 시술 메뉴 관리 가상화·조건부 모달 | F-2 | S1/S3 | `TreatmentMenuManagement.tsx` 목록 `267-299`,`313-337`, 행 날짜 `280`·가격 `319`, 상시 모달 `358`,`406` |
| 3 | 캘린더 파생 계산 메모이제이션 | F-3 | S1/S3 | `ImprovedCalendar.tsx` `generateCalendarDates` 호출 `224`, 필터 `79-84`/`116`, 셀 스타일·onPress `184-198`/`204`, `monthYearText` `225` |
| 4 | 예약 목록 잔여 최적화 | F-4 | S1 | `BookingListScreen.tsx` 행 포맷 `48-58`·`101`, `statusFilters` `284-291`, `FlatList` 튜닝 미비 `352-378` |
| 5 | 닫힌 월별 모달 마운트/요청 제거 | F-7 | S3 | `app/(tabs)/index.tsx` 모달 `490-511`(마운트 `509`) + `MonthlyDashboard.tsx` 마운트 시 API `54-56` |
| 6 | 홈 대시보드 중복 요청 제거·병렬화 | F-8 | S3 | `app/(tabs)/index.tsx` 이중 effect `97-102`,`112-117`, 직렬 await `76-78` |
| 7 | render 경로 로케일 포맷 제거 | F-10 | S1/S3 | 위 1~6 파일 + `app/(tabs)/index.tsx` 주간 위젯 `getCurrentWeek` `133`·`formatDateForDisplay` `148`·헤더 `249`·`formatCurrency`(`129`, 렌더 JSX `354`/`368`/`374`/`422`/`477`에서 호출) |
| 8 | 스토어 셀렉터 구독 전환 | F-16 | S2/S3 | 9파일: `StaffManagement.tsx:27`, `(tabs)/index.tsx:45`, `ShopHeader.tsx:18`, `StaffRegistrationModal.tsx:38`, `profile.tsx:15-16`, `login.tsx:16-17`, `index.tsx:14-15`, `AuthNavigator.tsx:8`, `(tabs)/_layout.tsx:14` |
| 9 | 직원 목록 인라인 리터럴 정리 | F-5 | S1 | `StaffManagement.tsx` 목록 `137-176`, 인라인 스타일 `143`, 인라인 onPress `161`/`164-167` |

> **주의(재검증 결과)**: 항목 4(F-4)는 선행 SPEC-PERF-001(commit `6ddb24a`)로 `FlatList`·`React.memo`·`keyExtractor`·`useCallback` 전환이 **이미 완료**되었다. 본 SPEC은 **잔여분(데이터 수신 시점 문자열 파생, `statusFilters` 모듈 상수화, FlatList 튜닝 props)**만 대상으로 한다. 상세는 `research.md` 참조.

---

## 4. 요구사항 (EARS Requirements)

요구사항은 제안 구현 순서(§8, 최저 위험 우선)와 동일한 번호 순서로 정의한다.

### REQ-PERF-003-01 — 홈 대시보드 중복 요청 제거·병렬화 (F-8)

- **Event-Driven**: 홈 화면(`app/(tabs)/index.tsx`)이 마운트되고 상점 로딩이 완료되면(`shopLoading === false`), 시스템은 오늘 요약 대시보드 데이터를 **정확히 1회** 로드해야 한다(shall).
- **Unwanted**: **If** 단일 마운트 사이클(상점 변경·`refreshTrigger` 발생이 없는 상태)이면, **then** 시스템은 `getTodayDetailedSummary`를 2회 이상 호출해서는 안 된다(shall not).
- **Ubiquitous**: 시스템은 상호 독립적인 오늘 요약 요청과 주간 시술 요청을 **병렬(`Promise.all`)**로 발행해야 한다.
- **Event-Driven** (불변식): 인증 만료·권한 오류가 발생하면(When), 시스템은 기존과 동일하게 해당 오류를 상위(인터셉터)로 전파하고, 주간 로드 실패는 `weeklyError` 인라인 안내(SPEC-UX-001 REQ-UX-007)로 처리하는 동작을 유지해야 한다.

### REQ-PERF-003-02 — 닫힌 월별 모달 마운트/요청 방지 (F-7)

- **State-Driven**: 월별 모달이 닫혀 있는 동안(`showMonthlyModal === false`), 시스템은 `MonthlyDashboard`를 마운트하지 않아야 한다(shall not).
- **Unwanted**: **If** 월별 모달이 닫힌 상태이면, **then** 시스템은 월별 상세 요약 API(`getMonthlyDetailedSummary`)를 호출해서는 안 된다(shall not).
- **Event-Driven**: 사용자가 월별 버튼을 눌러 모달을 열면, 시스템은 그 시점에 `MonthlyDashboard`를 마운트하고 월별 데이터를 로드해야 한다.

### REQ-PERF-003-03 — 예약 목록 잔여 렌더 최적화 (F-4)

- **Ubiquitous**: 시스템은 예약 행에 표시할 날짜·시간·합계 금액 문자열을 목록 수신 시점(data-load)에 1회 파생하여 보관해야 한다.
- **Ubiquitous**: 시스템은 `BookingListScreen` 행 render 경로에서 `new Date(...).toLocaleTimeString`·`toLocaleString` 호출을 실행하지 않아야 한다(shall not).
- **Ubiquitous**: 시스템은 `statusFilters` 배열을 **모듈 상수**로 정의하여 render마다 재생성하지 않아야 한다.
- **Ubiquitous**: 시스템은 예약 목록 `FlatList`에 `initialNumToRender`·`maxToRenderPerBatch`·`windowSize`·`removeClippedSubviews` 튜닝 props를 지정해야 한다.

### REQ-PERF-003-04 — 전화번호부 목록 가상화 (F-1)

- **Ubiquitous**: 시스템은 전화번호부 목록(`PhonebookManagement`)을 `FlatList`(+`keyExtractor`)로 렌더해야 한다.
- **Ubiquitous**: 시스템은 전화번호부 행 컴포넌트를 `React.memo`로 메모화해야 한다.
- **Ubiquitous**: 시스템은 표시용 포맷 전화번호를 목록 수신 시점에 1회 계산하여 보관해야 한다.
- **Ubiquitous**: 시스템은 전화번호부 행 render 경로에서 `formatPhoneNumber`를 매 렌더 재계산하지 않아야 한다(shall not).

### REQ-PERF-003-05 — 시술 메뉴 관리 가상화·조건부 모달 (F-2)

- **Ubiquitous**: 시스템은 시술 메뉴 목록과 상세 목록을 각각 `FlatList`로 렌더해야 한다.
- **Ubiquitous**: 시스템은 메뉴 생성일·상세 가격 표시 문자열을 데이터 수신 시점에 파생해야 한다.
- **Ubiquitous**: 시스템은 메뉴/상세 행 render 경로에서 `new Date(...).toLocaleDateString`·`toLocaleString`을 실행하지 않아야 한다(shall not).
- **State-Driven**: 각 모달이 닫혀 있는 동안, 시스템은 해당 `Modal` 하위 트리를 마운트하지 않아야 한다(조건부 마운트 `{visible && <Modal .../>}`).

### REQ-PERF-003-06 — 캘린더 파생 계산 메모이제이션 (F-3)

- **Ubiquitous**: 시스템은 날짜→예약 건수 매핑을 `useMemo`로 1회 계산한 Map으로 조회해야 한다.
- **Ubiquitous**: 시스템은 매 렌더마다 `generateCalendarDates()` 전체와 O(days×treatments) 필터를 재실행하지 않아야 한다(shall not).
- **Ubiquitous**: 시스템은 날짜 셀을 메모화된 셀 컴포넌트로 분리하고, 셀 `onPress` 핸들러 및 파생 문자열(`monthYearText`)을 안정적 참조(메모)로 유지해야 한다.

### REQ-PERF-003-07 — render 경로 로케일 포맷 제거/캐시 (F-10)

- **Ubiquitous**: 시스템은 대상 파일(§3 항목 1~6 파일 + 홈 주간 위젯)의 render 경로에서 `toLocale*` 및 렌더 시 `new Date` 포맷 호출을 실행하지 않아야 한다(shall not).
- **Ubiquitous**: 시스템은 표시용 날짜/시간/통화 문자열을 데이터 수신 시점 파생 또는 **모듈 수준 캐시된 `Intl` 포맷터**로 생성해야 한다.
- **Ubiquitous**: 시스템은 홈 주간 위젯의 `getCurrentWeek()`·`formatDateForDisplay()` 결과를 `useMemo`로 메모화해야 한다.
- **Ubiquitous**: 시스템은 `formatCurrency`(`index.tsx:129`)의 `toLocaleString` 호출을 모듈 수준 캐시된 `Intl.NumberFormat` 포맷터(또는 수신 시 파생)로 대체해야 한다.

### REQ-PERF-003-08 — 스토어 셀렉터 구독 전환 (F-16)

- **Ubiquitous**: 시스템은 대상 9개 파일에서 스토어 훅 **전체 구조분해 구독**(`const { x } = useStore()`)을 사용하지 않아야 한다(shall not).
- **Ubiquitous**: 시스템은 각 스토어 접근에 **필드 셀렉터**(`useStore(s => s.x)`)를 사용하고, 다중 필드 구독에는 `useShallow`를 적용해야 한다.
- **Event-Driven** (불변식): 셀렉터 전환 이후에도 `useEffect` 의존성(예: `shopLoading`, `selectedShop`)이 변경되면(When), 시스템은 기존과 동일한 로드 트리거 동작을 유지해야 한다.

### REQ-PERF-003-09 — 직원 목록 인라인 리터럴 정리 (F-5)

- **Ubiquitous**: 시스템은 직원 목록 행의 인라인 스타일 객체 리터럴을 정적 스타일로 대체해야 한다(소규모 목록이므로 `ScrollView`는 유지).
- **Ubiquitous**: 시스템은 직원 목록 행 render 경로에서 새 스타일 객체 리터럴을 매 렌더 생성하지 않아야 한다(shall not).

---

## 5. 제외 사항 (Exclusions — What NOT to Build)

본 SPEC은 아래 항목을 **명시적으로 제외**한다. 렌더 성능 구조 변경 이외의 아키텍처 변경은 후속 SPEC 소관이다.

- **react-query·캐싱 계층 도입** (F-12) → 후속 SPEC-4 소관.
- **레거시 서비스 계층 통합** (F-13) → 후속 SPEC-4 소관.
- **페이지네이션 상한 조정** (F-14) → 후속 SPEC-4 소관.
- **예약 흐름(BookingForm 등) 로직 변경** → SPEC-3 소관.
- **시각적/UX 변경**: 색상·타이포·레이아웃·문구·아이콘 등 화면에 보이는 모든 요소는 **불변**으로 유지한다(픽셀 동일). 본 SPEC은 행위 보존 성능 작업이다.
- **데이터 계약·API 응답 스키마 변경**: 서버 요청/응답 형태는 변경하지 않는다(요청 *횟수/타이밍* 최적화만 수행).
- **BookingListScreen의 FlatList/memo 재전환**: SPEC-PERF-001에서 이미 완료됨. 본 SPEC은 잔여분(REQ-PERF-003-03)만 다룬다.
- **app/_layout.tsx 스토어 구독**: SPEC-REFACTOR-001(REQ-REF-003)에서 이미 셀렉터로 전환됨 → F-16 대상 아님.

---

## 6. 수용 기준 (Acceptance Criteria)

구체적·이진 판정 가능 기준(개발 모드 `ddd` — 기존 동작에 대한 특성 테스트 우선; 렌더 횟수·API 호출 횟수는 jest 모킹으로 측정).

| ID | 기준 | 검증 방법 | REQ |
|----|------|-----------|-----|
| AC-01 | 홈 단일 마운트 사이클에서 `getTodayDetailedSummary` 호출 **정확히 1회** | jest 모킹(서비스 spy) 렌더 테스트 | REQ-PERF-003-01 |
| AC-02 | 오늘 요약·주간 시술 요청이 병렬(`Promise.all`) 발행 | jest spy 동시성 테스트 + `grep` (`Promise.all`) | REQ-PERF-003-01 |
| AC-03 | 월별 모달 **닫힌 상태**에서 `getMonthlyDetailedSummary` 호출 **0회** | jest 모킹 렌더 테스트 | REQ-PERF-003-02 |
| AC-04 | 월별 모달이 조건부 마운트(`{showMonthlyModal && ...}`)로 렌더 | `grep` 검증 | REQ-PERF-003-02 |
| AC-05 | `BookingListScreen` 행 render 경로에 `toLocaleTimeString`/`toLocaleString` **0건**, `statusFilters` 모듈 상수, FlatList 튜닝 props 존재 | `grep` 검증 | REQ-PERF-003-03 |
| AC-06 | `PhonebookManagement`가 `FlatList`로 렌더 + 행 컴포넌트 `React.memo` + render 경로 `formatPhoneNumber` **0건** | `grep` 검증 | REQ-PERF-003-04 |
| AC-07 | `TreatmentMenuManagement` 메뉴/상세가 `FlatList` + render 경로 `toLocaleDateString`/`toLocaleString` **0건** + 조건부 모달 마운트 | `grep` 검증 | REQ-PERF-003-05 |
| AC-08 | `ImprovedCalendar`가 `useMemo` 기반 날짜→건수 Map 사용 + 메모화 셀 컴포넌트 존재 + render마다 `generateCalendarDates` 전체 재실행 없음 | `grep` + 컴포넌트/렌더 테스트 | REQ-PERF-003-06 |
| AC-09 | 대상 파일 render 경로 `toLocale*` **0건** + 홈 주간 위젯 `useMemo` 적용 | `grep` 검증 | REQ-PERF-003-07 |
| AC-10 | 대상 **9파일에서 전체 구조분해 스토어 구독 0건** + 셀렉터/`useShallow` 사용 | `grep` 검증 | REQ-PERF-003-08 |
| AC-11 | 직원 목록 행 render 경로 인라인 스타일 객체 리터럴 **0건** | `grep` 검증 | REQ-PERF-003-09 |
| AC-12 | 기존 jest **테스트 25개(4개 스위트) 전부 통과** + `tsc --noEmit` 신규 오류 **0건**(기준선 대비) | `npx jest`, `npx tsc --noEmit` | 전체 |
| AC-13 | 의도된 성능 리팩토링 외 **시각적 변화 0**(스냅샷 diff 0건) | 특성(스냅샷) 테스트 | 전체 |

### Definition of Done

- AC-01 ~ AC-13 전부 충족.
- 변경 전 특성 테스트(렌더 횟수·API 호출 횟수·스냅샷) 기준선을 먼저 확보(PRESERVE)한 뒤 IMPROVE.
- 최종 diff가 렌더 성능 구조(가상화·메모이제이션·요청 수렴·셀렉터 구독)에 한정되며, 데이터 계약·화면 흐름·시각 요소 변경이 diff에 없음.

---

## 7. 위험 평가 (Risk Assessment)

- **전체 위험도: 중간 (Medium)** — 스타일 한정이었던 SPEC-UX-001과 달리 본 SPEC은 **로직 인접 리팩토링**(요청 수렴, effect 통합, 셀렉터 구독 전환, 목록 렌더 구조)을 포함한다.
- **주의 지점**:
  - REQ-PERF-003-01: 이중 effect 통합·`Promise.all` 병렬화 시 **인증 오류 전파·`weeklyError` 인라인 안내** 동작을 반드시 보존해야 한다(SPEC-UX-001 회귀 금지).
  - REQ-PERF-003-02: 조건부 마운트로 전환 시 모달 애니메이션(`presentationStyle="pageSheet"`)·`onRequestClose` 동작이 기존과 동일해야 한다.
  - REQ-PERF-003-08: 셀렉터 전환 시 **객체 리터럴 셀렉터를 `useShallow` 없이 사용하면 무한 리렌더**가 발생한다. 다중 필드는 반드시 `useShallow` 적용. `useEffect` 의존성 참조 안정성 변화로 effect 트리거 횟수가 달라지지 않는지 검증한다.
  - REQ-PERF-003-03/06: 데이터 수신 시점 파생 문자열이 원본 렌더 결과(포맷)와 **문자 단위로 동일**해야 스냅샷 회귀가 없다(로케일·`hour12` 옵션 보존).
- **완화**: `development_mode: ddd`에 따라 각 항목 변경 전 특성 테스트(렌더 횟수/API 호출 횟수/스냅샷)를 먼저 확보하고, §8 순서(최저 위험 우선)로 항목별 커밋·검증한다.

## 8. 구현 순서 (Suggested Implementation Order)

최저 위험(격리된 effect·모달)부터 광범위(전역 셀렉터)까지 순차 진행하며, 각 단계마다 특성 테스트를 먼저 확보한다.

1. **REQ-PERF-003-01 (F-8)** — 홈 이중 effect 통합·병렬화 (격리된 단일 화면)
2. **REQ-PERF-003-02 (F-7)** — 닫힌 월별 모달 조건부 마운트
3. **REQ-PERF-003-03 (F-4)** — 예약 목록 잔여 최적화 (구조는 이미 완료, 저위험 잔여분)
4. **REQ-PERF-003-04 (F-1)** — 전화번호부 FlatList 전환
5. **REQ-PERF-003-05 (F-2)** — 시술 메뉴 FlatList + 조건부 모달
6. **REQ-PERF-003-06 (F-3)** — 캘린더 메모이제이션
7. **REQ-PERF-003-07 (F-10)** — render 경로 로케일 포맷 제거/캐시
8. **REQ-PERF-003-08 (F-16)** — 스토어 셀렉터 구독 전환 (9파일, 광범위·주의)
9. **REQ-PERF-003-09 (F-5)** — 직원 목록 인라인 리터럴 정리 (마무리)

## 9. 추적성 (Traceability)

| REQ | Finding | 증상 | 우선순위 | 로드맵 단계 |
|-----|---------|------|----------|-------------|
| REQ-PERF-003-01 | F-8 | S3 | P2 | Stage 2 |
| REQ-PERF-003-02 | F-7 | S3 | P2 | Stage 2 |
| REQ-PERF-003-03 | F-4 | S1 | P2 | Stage 2 |
| REQ-PERF-003-04 | F-1 | S1 | P1 | Stage 2 |
| REQ-PERF-003-05 | F-2 | S1/S3 | P2 | Stage 2 |
| REQ-PERF-003-06 | F-3 | S1/S3 | P2 | Stage 2 |
| REQ-PERF-003-07 | F-10 | S1/S3 | P2 | Stage 2 |
| REQ-PERF-003-08 | F-16 | S2/S3 | P2 | Stage 2 |
| REQ-PERF-003-09 | F-5 | S1 | P3 | Stage 2 |

진단 근거(감사 결과 원문·file:line 재검증·특성 테스트 전략): `research.md` 참조.
