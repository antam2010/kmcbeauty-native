# SPEC-PERF-003 — 진단 근거 및 코드베이스 분석 (research)

> 대상 SPEC: `SPEC-PERF-003` (렌더링 성능 개선)
> 방법론: DDD (ANALYZE-PRESERVE-IMPROVE)
> 재검증 기준: `feature/refactor-hardening-2026-07` HEAD (SPEC-UX-001·SPEC-PERF-001·SPEC-REFACTOR-001 반영 후)
> 재검증일: 2026-07-07

이 문서는 정적 성능 감사에서 도출된 9개 finding을 **현재 코드 기준으로 재검증**한 결과와, 각 항목의 원인/조치/위험/특성 테스트 전략을 정리한다. 모든 file:line은 본 세션에서 실제 파일을 읽어 확인했다.

---

## 0. 선행 SPEC과의 관계 (중요)

본 SPEC은 이미 반영된 선행 작업 위에서 동작하므로, 감사 원본과 현재 코드 사이에 **라인 이동·부분 완료**가 존재한다. 이를 먼저 정리한다.

| 선행 SPEC | 영향 | 본 SPEC에 미치는 결과 |
|-----------|------|-----------------------|
| SPEC-UX-001 (commit 전 작업 트리) | `index.tsx`·`BookingListScreen.tsx` 등에 접근성/인라인 안내 JSX 추가 → **라인 하향 이동** | 감사 원본 라인과 다름 → 본 문서에서 전부 재검증 |
| SPEC-PERF-001 (`6ddb24a`) | `BookingListScreen.tsx`를 `FlatList`+`React.memo`+`keyExtractor`+`useCallback`으로 전환 | **F-4 구조 부분 이미 완료** → 본 SPEC은 잔여분만 |
| SPEC-REFACTOR-001 (REQ-REF-003) | `app/_layout.tsx` 스토어 구독을 셀렉터로 전환 (`_layout.tsx:12` 주석 근거) | **_layout.tsx는 F-16 대상 아님** |

---

## 1. 재검증된 Finding별 분석

### F-1 [P1·S1] 전화번호부 목록 — `components/management/PhonebookManagement.tsx`

- **증거**:
  - 로드 크기 100: `loadPhonebooks()` `size: 100` (`:52-56`).
  - 목록 렌더: `<ScrollView>` + `phonebooks.map(renderContactItem)` (`:250-262`) — 최대 100행을 한 번에 마운트.
  - 행마다 재계산: `renderContactItem` 내부 `formatPhoneNumber(contact.phone_number)` (`:167`).
- **원인**: `ScrollView`는 자식 전체를 즉시 마운트한다. 100행 × (View 트리 + 문자열 포맷) → 초기/리렌더 비용 S1.
- **조치**: `FlatList` + `keyExtractor={c => String(c.id)}`, 행을 `React.memo` 컴포넌트로 분리, `formatPhoneNumber`는 `loadPhonebooks` 수신 시점에 1회 계산하여 `displayPhone` 필드로 보관.
- **주의**: 검색/편집 모달에서 `formatPhoneNumber`(`:91`)는 입력 경로이므로 유지(대상은 **render 경로**만).

### F-2 [P2·S1/S3] 시술 메뉴 관리 — `components/management/TreatmentMenuManagement.tsx`

- **증거**:
  - 이중 목록: 메뉴 `<ScrollView>`+`menus.map` (`:267-299`), 상세 `<ScrollView>`+`menuDetails.map` (`:313-337`).
  - 행 파생값: `new Date(menu.created_at).toLocaleDateString('ko-KR')` (`:280`), `detail.base_price.toLocaleString()` (`:319`).
  - 상시 마운트 모달: `showMenuModal` 모달 `:358`, `showDetailModal` 모달 `:406` — `visible` prop만 false일 뿐 하위 트리는 상시 마운트.
- **조치**: 두 목록 모두 `FlatList` 전환, 날짜/가격 문자열을 수신 시점 파생, 모달을 `{showMenuModal && <Modal .../>}` 조건부 마운트.
- **주의**: `<Modal>`의 `presentationStyle`/애니메이션은 조건부 마운트 후에도 동일하게 동작해야 함(스냅샷 회귀 검증).

### F-3 [P2·S1/S3] 캘린더 — `components/calendar/ImprovedCalendar.tsx`

- **증거**:
  - 매 렌더 전체 재생성: `const calendarDates = generateCalendarDates();` (`:224`) — 42셀 배열을 렌더마다 생성.
  - O(days×treatments) 필터: `getBookingCountByDate` (`:79-84`)를 현재 달 루프에서 매일 호출 (`:116`).
  - 셀 스타일 배열·인라인 핸들러: `cellStyle`/`textStyle` 배열 재생성 (`:184-198`), `onPress={() => handleDateSelect(dateData)}` (`:204`).
  - 파생 문자열: `monthYearText = currentMonth.toLocaleDateString('ko-KR', ...)` (`:225`), 선택일 `toLocaleDateString` (`:287`).
- **조치**: `treatments` → `useMemo`로 `Map<dateString, count>` 1회 구성 후 O(1) 조회. `generateCalendarDates`를 `useMemo([currentMonth, selectedDate, countMap])`로. 셀을 `React.memo` 컴포넌트로 분리하고 `onPress`는 `date` 인자 콜백으로 안정화. `monthYearText`는 `useMemo`.

### F-4 [P2·S1] 예약 목록 — `components/booking/BookingListScreen.tsx` (부분 완료)

- **이미 완료(SPEC-PERF-001 `6ddb24a`)**: `FlatList` (`:352`), `BookingListItem = memo(...)` (`:47`), `renderBookingItem = useCallback` (`:276`), `keyExtractor` (`:355`). → **재전환 금지**.
- **잔여 증거(본 SPEC 대상)**:
  - 행 render 시 포맷: `formatDateTime`이 `new Date(...).toLocaleTimeString('ko-KR', ...)` 실행 (`:48-58`, 특히 `:52`), 합계 `totalPrice.toLocaleString()` (`:101`). memo 덕분에 리렌더는 줄었으나, 행이 렌더될 때마다 여전히 실행됨.
  - `statusFilters` 배열이 컴포넌트 본문에서 render마다 재생성 (`:284-291`).
  - `FlatList` 튜닝 props 부재: `:352-378`에 `initialNumToRender`/`maxToRenderPerBatch`/`windowSize`/`removeClippedSubviews` 없음.
- **조치**: `reserved_at` → `{date,time}` 및 합계 문자열을 목록 수신 시점 파생(예: `mapToRow()`), `statusFilters`를 모듈 상수로 승격, FlatList 튜닝 props 추가.

### F-7 [P2·S3] 닫힌 월별 모달 — `app/(tabs)/index.tsx` + `components/dashboard/MonthlyDashboard.tsx`

- **증거**:
  - 홈 모달이 `MonthlyDashboard`를 상시 마운트: `<Modal visible={showMonthlyModal} ...>` 내부에 `<MonthlyDashboard .../>` (`:490-511`, 마운트 `:509`).
  - `MonthlyDashboard`는 마운트 즉시 월별 API 호출: `useEffect(() => loadMonthlyData(...), [...])` (`:54-56`) → `getMonthlyDetailedSummary` (`:38`).
- **결과**: 홈이 로드될 때마다(모달을 열지 않아도) 월별 요약 API가 발행됨 → 불필요한 네트워크·상태 갱신(S3).
- **조치**: `{showMonthlyModal && (<Modal>...<MonthlyDashboard/></Modal>)}` 조건부 마운트. 열릴 때만 마운트→API 발행.

### F-8 [P2·S3] 홈 중복/직렬 요청 — `app/(tabs)/index.tsx`

- **증거**:
  - 이중 마운트 트리거: effect A `useEffect(..., [loadDashboardData, shopLoading])` (`:97-102`)와 effect C `useEffect(..., [shopLoading, selectedShop, loadDashboardData])` (`:112-117`)가 **둘 다** 마운트 시 `!shopLoading` 조건에서 `loadDashboardData()` 호출 → 초기 이중 fetch.
  - 직렬 await: `loadDashboardData` 내부에서 `getTodayDetailedSummary` (`:76-77`) 완료 후 `await loadWeeklyTreatments()` (`:78`) — 두 요청은 상호 독립인데 순차 실행.
- **조치**: 마운트 트리거 effect를 단일화(상점 변경 감지 1개로 통합)하고, 오늘 요약과 주간 시술을 `Promise.all`로 병렬화.
- **불변식(회귀 금지)**: 인증 만료/권한 오류 재throw 경로(`:57-59`, `:83-90`)와 `weeklyError` 인라인 안내(`:52`,`:62`; SPEC-UX-001 REQ-UX-007)를 보존. `Promise.all`은 하나가 reject되면 전체가 reject되므로, 주간 실패가 오늘 요약까지 실패시키지 않도록 `allSettled` 또는 개별 catch로 기존 오류 격리를 유지할 것.

### F-10 [P2·S1/S3] render 경로 로케일 포맷 — 다수 파일

- **본 SPEC 범위**: §3 항목 1~6 파일의 **render 경로** occurrence + 홈 주간 위젯.
  - 홈 주간 위젯: `getCurrentWeek()` (`:133`, 호출 `:299`), `formatDateForDisplay()` (`:148`, 호출 `:300`) — 렌더마다 7일 배열 + 필터 재계산.
  - 홈 헤더 날짜: `new Date().toLocaleDateString('ko-KR', ...)` (`:249`).
  - (F-1/F-2/F-3/F-4의 toLocale*는 해당 REQ에서 함께 제거되므로 F-10은 **잔여 render-path 포맷 + 홈 위젯 메모이제이션**에 집중.)
- **조치**: 표시 문자열을 수신 시점 파생하거나 **모듈 수준 캐시 `Intl.DateTimeFormat`/`Intl.NumberFormat`** 인스턴스 재사용(매 호출 새 포맷터 생성 비용 제거). 홈 주간 위젯 결과는 `useMemo([weeklyTreatments, selectedDate])`.
- **주의(범위 밖)**: `handleDateSelect`(`:181`,`:189`) 등 **이벤트 핸들러** 내 toLocale*는 render 경로가 아니므로 대상 아님.

### F-16 [P2·S2/S3] 전체 스토어 구독 — 9파일

- **재검증(전수 grep)**: 감사가 지정한 9개 파일 모두 현재도 전체 구조분해 구독 유지.

  | 파일 | 현재 라인 | 코드 |
  |------|-----------|------|
  | `components/management/StaffManagement.tsx` | 27 | `const { selectedShop } = useShopStore();` |
  | `app/(tabs)/index.tsx` | 45 (감사 원본 43) | `const { selectedShop, loading: shopLoading } = useShopStore();` |
  | `components/navigation/ShopHeader.tsx` | 18 | `const { selectedShop, loading, loadSelectedShop } = useShopStore();` |
  | `components/modals/StaffRegistrationModal.tsx` | 38 | `const { selectedShop } = useShopStore();` |
  | `app/(tabs)/profile.tsx` | 15-16 | `useAuthStore()` / `useShopStore()` |
  | `app/login.tsx` | 16-17 | `useAuthStore()` / `useShopStore()` |
  | `app/index.tsx` | 14-15 | `useAuthStore()` / `useShopStore()` |
  | `components/navigation/AuthNavigator.tsx` | 8 | `const { isAuthenticated, isLoading } = useAuthStore();` |
  | `app/(tabs)/_layout.tsx` | 14 | `const { isAuthenticated, isLoading } = useAuthStore();` |

- **원인**: `const { x } = useStore()`는 스토어 전체를 구독하므로, 무관한 필드(`loading`/`error` 등) 변경 시에도 리렌더 → 버튼 반응 지연(S2)·전반 느림(S3).
- **조치**: `useStore(s => s.x)` 필드 셀렉터. 다중 필드는 `import { useShallow } from 'zustand/react/shallow'` 후 `useStore(useShallow(s => ({ a: s.a, b: s.b })))`.
- **위험**: 객체 리터럴 셀렉터를 `useShallow` 없이 쓰면 매 렌더 새 참조 → 무한 리렌더. `useEffect` 의존성 참조 안정성이 바뀌면 effect 트리거 횟수 변화 가능 → 특성 테스트로 검증.

- **감사 목록에 없던 추가 관찰(10번째 site)**:
  - `app/shop-selection.tsx:22` — `const { selectShop } = useShopStore();` (액션만 구조분해).
  - `git status`상 `shop-selection.tsx`는 수정 대상이며, 동일 안티패턴이다. **본 SPEC의 AC-10은 감사가 명시한 9파일로 한정**(범위 규율)하되, 구현 시 이 site도 함께 셀렉터화하는 것을 권장한다. 액션은 안정 참조이나 전체 구독은 여전히 무관 상태 변경에 리렌더를 유발한다.
  - `app/_layout.tsx`는 **이미 셀렉터 전환됨**(SPEC-REFACTOR-001) → 대상 아님.

### F-5 [P3·S1] 직원 목록 인라인 리터럴 — `components/management/StaffManagement.tsx`

- **증거**: 직원 목록 `staffList.map(...)` (`:137-176`), 행마다 인라인 스타일 객체 `index === staffList.length - 1 ? { marginBottom: 0 } : {}` (`:143`), 인라인 onPress (`:161`, `:164-167`).
- **조치**: 마지막 행 여백은 정적 스타일(`styles.lastCard`) 또는 `contentContainerStyle`로 이동, 인라인 리터럴 제거. **목록 규모가 작아 `ScrollView` 유지**(FlatList 불필요). 마무리 정리 단계.

---

## 2. 특성 테스트 전략 (DDD PRESERVE)

기존 하네스: `jest-expo` 프리셋, `jest.config.js`, `__tests__/` (현재 **4 스위트 / 25 테스트 / 스냅샷 1** — 본 세션에서 `npx jest` 실행으로 확인, 전부 통과). 본 SPEC은 이 위에 **렌더 횟수·API 호출 횟수** 특성 테스트를 추가한다.

### 2.1 API 호출 횟수 (F-7, F-8)

- 서비스 모듈을 `jest.spyOn`으로 계측:
  - `dashboardApiService.getTodayDetailedSummary`, `getMonthlyDetailedSummary`, `treatmentApiService.getWeeklyTreatments`.
- 기준선(PRESERVE) 테스트로 **현재 동작을 먼저 캡처**:
  - 홈 마운트 시 오늘 요약 호출 횟수(현재 이중), 월별 요약 호출 여부(현재 모달 닫혀도 1회).
- IMPROVE 후 목표:
  - 오늘 요약 **정확히 1회**, 닫힌 모달 상태 월별 요약 **0회**, 오늘/주간 **병렬** 발행.
- 스토어(`useShopStore`/`useAuthStore`)와 `expo-router`는 모킹하여 `selectedShop` 존재/`shopLoading` 전이 시나리오를 재현.

### 2.2 렌더 횟수 (F-16, F-1/F-3 메모화)

- 계측 방법(택1):
  - 행/셀 컴포넌트에 렌더 카운터를 주입한 테스트 전용 래퍼, 또는 `jest.fn()`을 `React.memo` 대상 함수에 스파이.
  - 상위 상태 변경(무관 필드)을 유발한 뒤 자식 렌더 횟수가 증가하지 않음을 단언.
- F-16: 스토어의 무관 필드(`loading`)만 갱신했을 때 소비 컴포넌트가 리렌더되지 않음을 검증(셀렉터 전환 전=리렌더 발생 → 전환 후=미발생).

### 2.3 스냅샷 (전 항목, 시각 불변)

- 각 대상 컴포넌트의 렌더 출력 스냅샷을 IMPROVE 전 기준선으로 확보 → IMPROVE 후 **diff 0건**이어야 한다(AC-13).
- 로케일 포맷 파생 전환 시, 파생 문자열이 원본과 **문자 단위 동일**해야 스냅샷이 유지된다(`toLocaleTimeString`의 `hour12:false`, `toLocaleDateString('ko-KR')` 옵션을 캐시 포맷터에 동일 반영).

### 2.4 정적 검증 (grep 기반 AC)

- render 경로 `toLocale*`/`new Date` 포맷 잔존 0건, 전체 구조분해 구독 0건(9파일), `FlatList`/`React.memo`/`useShallow` 존재 여부는 `grep`로 이진 판정(AC-05~AC-11).

---

## 3. 회귀 가드 요약

| 보존해야 할 기존 동작 | 근거 위치 | 관련 REQ |
|-----------------------|-----------|----------|
| 인증 만료/권한 오류 상위 전파 | `index.tsx:57-59`, `:83-90` | REQ-PERF-003-01 |
| 주간 실패 인라인 안내(`weeklyError`) | `index.tsx:52`,`:62`,`:283-297` (SPEC-UX-001) | REQ-PERF-003-01 |
| 모달 애니메이션·`onRequestClose` | `index.tsx:490-511`, `TreatmentMenuManagement.tsx:358`,`:406` | REQ-PERF-003-02/05 |
| 상점 미선택 시 로드 스킵 | `index.tsx:68-73` | REQ-PERF-003-01 |
| effect 의존성 기반 로드 트리거 동작 | `index.tsx:97-117` | REQ-PERF-003-08 |
| 배지 색/문구·접근성 라벨(SPEC-UX-001) | `BookingListScreen.tsx:30-39`, `index.tsx:211-222` | 전체(시각 불변) |

---

## 4. 근거 파일 목록 (본 세션에서 실제 확인)

- `components/management/PhonebookManagement.tsx`
- `components/management/TreatmentMenuManagement.tsx`
- `components/calendar/ImprovedCalendar.tsx`
- `components/booking/BookingListScreen.tsx`
- `components/dashboard/MonthlyDashboard.tsx` (`:1-80`)
- `app/(tabs)/index.tsx`
- `components/management/StaffManagement.tsx` (`:120-189`)
- `jest.config.js`, `__tests__/` (스위트/테스트 수는 `npx jest` 실행으로 확인)
- F-16 전수 grep (`useShopStore()`/`useAuthStore()` 구조분해)
