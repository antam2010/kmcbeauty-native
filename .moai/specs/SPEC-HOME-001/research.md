# SPEC-HOME-001 연구 노트 (research.md)

홈 화면 "오늘" 중심 재구성(Stage 4b)의 코드 재검증·설계 근거. 모든 file:line은 현재 HEAD `a98b126`(Stage 1~4a 반영) 기준으로 재확인했다. 4단계 로드맵의 **마지막 단계(4b, IA 재구성)**이며 Stage 4a(SPEC-DATA-001, react-query 캐싱)에 의존한다.

---

## 1. 검증 기준선 (HEAD·테스트·타입)

- HEAD = `a98b126` (`refactor(data): SPEC-DATA-001 데이터 계층 정비 — react-query 캐싱 도입`). 배경 지침의 "HEAD a98b126"과 일치. (대화 시작 시점 git status 스냅샷의 `b714cfb`는 stale였고 실제 HEAD는 a98b126.)
- jest 스위트 = **19개**(`npx jest --listTests` = 19). 배경 지침의 78 테스트와 정합(스위트 목록: `useDashboardLoad`·`queryClient`·`queryDedup`·`shopUsersQuery`·`managementInvalidation`·`treatmentPagination`·`monthlyCalendar`·`BookingForm.flow`·`shopSelection.flow`·`bookingPayload`·`bookingStaffDefault`·`bookingFormat.slot`·`store-selector`·`storeLoaders`·`api-client`·`perf003-format`·`contrast`·`theme`·`BaseButton`). (참고: 메모리의 12스위트/57테스트는 SPEC-DATA-001 **초안 시점** 기준선이며, 구현 커밋 후 19스위트로 증가함.)
- `tsc --noEmit` 기준선 = **정확히 2건**, `components/modals/EditTreatmentModal.tsx(123,11)` + `(395,9)`. 재실행으로 확인. 본 SPEC은 이 기준선 유지(회귀 0)만 확인한다.
- `@tanstack/react-query` `^5.101.2` 설치됨(`package.json`). react-query 훅 4종 존재: `hooks/queries/useMonthlyTreatmentsQuery.ts`·`usePhonebookQuery.ts`·`useShopUsersQuery.ts`·`useTreatmentMenusQuery.ts`. **신규 API·신규 라이브러리 도입 불필요** — 오늘 데이터는 이미 캐싱된 경로에서 파생 가능.

## 2. 홈 화면 현재 구조 (F-7 과밀 확인) — `app/(tabs)/index.tsx`

한 화면(단일 `ScrollView`, `138-386`; `135`=`return (`)에 6개 섹션이 세로로 적층된다:

| # | 섹션 | 위치 | 숫자/항목 |
|---|------|------|-----------|
| 1 | 헤더(오늘의 현황 + 날짜 + 달력/새로고침 아이콘) | `152-179` | — |
| 2 | 주간 달력 위젯("이번 주 예약 현황") | `181-245` | 7일 셀 + 배지 |
| 3 | 매출 현황 카드 | `247-278` | 4 (오늘 매출·완료된 예약·예상 매출·이번 달 매출) |
| 4 | 예약 현황 카드 | `280-311` | 4 (총 예약·완료·취소·노쇼) |
| 5 | 인기 서비스 | `313-329` | 최대 5 (`sales.target_date.slice(0,5)`) |
| 6 | 고객 인사이트 카드 | `331-362` | 4 (오늘 고객·신규·재방문·정상방문) |
| 7 | VIP 고객 | `364-385` | 최대 5 (`customer_insights` 상위 5) |

감사 F-7의 "6 섹션·20+ 숫자" 주장은 현재 HEAD에서 **재확인됨**(주간위젯+매출+예약+인기서비스+고객인사이트+VIP = 6 데이터 섹션). 60대 사용자가 "오늘 할 일"을 즉시 찾기 어려운 구조.

- 데이터 소스: `useDashboardLoad()`(`3`, `28-38`) 훅이 `dashboardData`(오늘 요약, `getTodayDetailedSummary`)와 `weeklyTreatments`(주간 시술, `getWeeklyTreatments`)를 제공. **둘 다 이미 react-query 캐싱됨**(SPEC-DATA-001, `hooks/useDashboardLoad.ts:54-69`).
- 인기 서비스/고객 인사이트/VIP는 모두 **오늘(target_date) 데이터**(`dashboardData.sales.target_date`, `dashboardData.customer_insights`)에서 파생. 별도 API 없음.

## 3. "오늘의 예약 리스트" 데이터 경로 — 신규 API 불필요

- `weeklyTreatments: Treatment[]`(useDashboardLoad 반환, `index.tsx:32`)를 **오늘 날짜로 필터**하면 오늘의 예약 리스트가 된다. 현재 `weekDays` 계산(`44-73`)과 `handleDateSelect`(`82-85`)가 이미 동일 필터(`treatment.reserved_at.split('T')[0] === dateString`)를 사용 중.
- `Treatment` 항목 필드(모달·리스트가 사용): `reserved_at`, `phonebook?.name`, `treatment_items?.[0]?.menu_detail?.name`, `status`. 시간순 정렬은 `reserved_at` 기준.
- 따라서 오늘 리스트 = `weeklyTreatments.filter(오늘).sort(reserved_at)` — **추가 서비스 호출 0건**. useDashboardLoad의 기존 2개 query(오늘 요약 + 주간)만으로 충분.

## 4. 재사용 모달 (탭 → 상세) — `components/modals/`

- **`TreatmentDetailModal`(`TreatmentDetailModal.tsx`) / `TreatmentListModal`(`TreatmentListModal.tsx`)은 저장소 전체에서 소비자 0건인 죽은 코드다.** 저장소 grep(`grep -rn "TreatmentDetailModal\|TreatmentListModal" --include="*.tsx" --include="*.ts"`, HEAD `a98b126`) 결과 각 파일 내부의 인터페이스/`export default` 자기 참조만 검출되고, 이들을 `import`하는 화면은 **0건**이다. 따라서 이 둘은 재사용 후보가 아니라 정리 대상 수준의 미사용 컴포넌트다.
- **살아있는 재사용 대상 = `UnifiedTreatmentModal`**(`UnifiedTreatmentModal.tsx`, 내부 컴포넌트명 `TreatmentModal`). 예약 탭(`booking.tsx:5` import, `:382` 렌더)이 프로덕션에서 실사용한다. 이 컴포넌트는 두 죽은 모달의 역할을 **하나로 통합**한 후속 컴포넌트로, 내부에 `list`/`detail` 두 뷰(`ModalView` `24`)를 모두 보유한다.
  - props(`14-22`): `visible`, `treatments: Treatment[]`, `selectedTreatment?: Treatment | null`, `date: string`, `onClose`, `onNewBooking?`, `onEditRequest?`.
  - `selectedTreatment`가 전달되면 `useEffect`(`40-48`)로 **detail 뷰 자동 전환**, 없으면 list 뷰. → 홈 "오늘 리스트 항목 탭 → 상세"는 예약 탭 `handleTreatmentPress`(`booking.tsx:127-139`, `treatments=[]`·`date=''`·`selectedTreatment=탭한 예약`)와 동일 패턴으로 재사용하면 된다.
  - detail 뷰가 렌더하는 필드(`reserved_at`·`phonebook.name`·`treatment_items`·`status`·`staff_user`·`payment_method`·`memo`)는 `weeklyTreatments`의 `Treatment` 형상과 정합(§3). 신규 데이터 배선 불필요.
  - `onEditRequest`(→ `EditTreatmentModal`, tsc 기준선 2건 보유)는 **홈에서 배선하지 않는다** — 홈은 읽기 전용 "오늘 확인"이고 편집은 예약 탭 소관. 이로써 홈 재사용이 `EditTreatmentModal` 기준선 오류 경로와 분리된다.
- **재검증 불일치(중요)**: 감사/배경의 "TreatmentListModal이 홈에서 이제 사용될 수 있음 — 확인"은 **거짓**이며, 나아가 두 모달 자체가 죽은 코드다. `index.tsx`는 두 모달을 import하지 않으며(import 목록: `MonthlyDashboard`·`ShopHeader`·`useDashboardLoad`만), 날짜 탭 시 여전히 `Alert.alert`로 텍스트 목록을 표시한다(`handleDateSelect` `78-104`, `Alert.alert` `98-102`, 날짜 셀 `onPress={() => handleDateSelect(...)}` `210`). 예약 탭(`booking.tsx:4-5`)이 import하는 것은 `EditTreatmentModal`·`UnifiedTreatmentModal`이다(두 죽은 모달이 아님). 상세는 §7 D-4.
- **참고(테스트 커버리지)**: `UnifiedTreatmentModal`은 현재 전용 단위 테스트가 없다(`grep -rln "UnifiedTreatmentModal\|TreatmentModal" __tests__/` = 0). 프로덕션 실사용 경로이나, 홈 재사용의 회귀 가드로 spec AC-04(탭→모달 오픈 + `selectedTreatment` 전달) 렌더 테스트를 신규 확보한다.

## 5. "자세히 보기" 대상 = MonthlyDashboard — **범위 정합 주의(설계 핵심)**

- `components/dashboard/MonthlyDashboard.tsx`는 **월간 데이터**(`getMonthlyDetailedSummary(year, month)`, `39`)를 표시하며, 홈에서 이미 조건부 마운트되어 있다(`index.tsx:390` `{showMonthlyModal && (...)}`, 진입점 = 헤더 "달력 보기" 아이콘 `160-168`). 닫힌 동안 언마운트되어 월별 API 0회(REQ-PERF-003-02 불변식).
- MonthlyDashboard 실제 섹션: 요약 통계 카드(총예약/완료/대기중/취소, `227-255`), 매출 현황(`257-282`), 월간 총계(`284-301`), 인기 시술(월간, `303-321`). **`고객 인사이트`·`VIP 고객` 섹션은 존재하지 않으며, 데이터도 월간(month)이지 오늘(target_date)이 아니다.**
- **따라서 "홈의 인기 서비스·고객 인사이트·VIP를 월간 모달로 이전(migration)"은 문자 그대로 성립하지 않는다.** 홈의 상세 섹션은 오늘 데이터 기반이고 MonthlyDashboard는 월간 컴포넌트다. 정직한 설계는:
  1. 홈 primary surface에서 상세 통계 3섹션(인기 서비스·고객 인사이트·VIP)을 **직접 렌더 제거**(홈 렌더 0),
  2. 상세 통계 접근은 **이미 존재하는 월간 대시보드 모달**(달력/자세히 보기 버튼) 경로를 유지,
  3. MonthlyDashboard 내부에 오늘 데이터(VIP/인사이트)를 **복제하지 않는다**(월간 컴포넌트 동작 변경 + 신규 데이터 배선 필요 → 본 SPEC 범위 밖).
- 이 정합 결정은 §6 D-3에 불일치로 기록. spec의 REQ-05/AC는 "홈 직접 렌더 0 + 월간 모달 접근 경로 유지"로만 규정하고, "VIP/인사이트를 월간 모달에 재현"은 요구하지 않는다.

## 6. profile.tsx 죽은 메뉴 (F-13) — `app/(tabs)/profile.tsx`

세 설정 항목 중 **2개만** "준비중" Alert이며 숨김 대상, 나머지는 기능 정상 → 숨기면 안 됨:

| 항목 | 트리거 UI | 핸들러 | 상태 | 조치 |
|------|-----------|--------|------|------|
| 프로필 수정 | 편집 아이콘 버튼 `143-150`(`accessibilityLabel="프로필 수정"`) | `handleEditProfile` `92-94` → `Alert.alert('준비중', '프로필 수정 기능은 준비 중입니다.')` | 죽은 메뉴 | **노출 0** |
| 알림 설정 | 설정 항목 `220-226`(`onPress={handleNotificationSettings}`) | `handleNotificationSettings` `96-98` → `Alert.alert('준비중', '알림 설정 기능은 준비 중입니다.')` | 죽은 메뉴 | **노출 0** |
| 비밀번호 변경 | 설정 항목 `209-218` | `setShowPasswordModal(true)` → 실제 모달 `245-307` | **정상** | 유지 |
| 앱 정보 | 설정 항목 `228-234` | `handleAppInfo` `100-102` → `Alert.alert('앱 정보', ...)` | **정상** | 유지 |

- **재검증 불일치**: 감사 F-13 라인(`:88-94`, `:211-217`)은 어긋남. 현재: `handleEditProfile` `92-94`, `handleNotificationSettings` `96-98`; UI 트리거는 편집 아이콘 `143-150`·알림 설정 항목 `220-226`. §6 D-2 기록.
- 구현 재량: 코드 삭제 대신 조건 플래그/항목 제거 중 최소 diff 선택 가능. spec은 "노출 0"(렌더 부재)만 규정.

## 7. 재검증 불일치 요약 (Discrepancies)

| ID | 감사/배경 주장 | 재검증 결과 | 반영 |
|----|----------------|-------------|------|
| D-1 | F-12: 홈 주간 위젯 날짜 탭이 예약을 Alert 텍스트 목록으로 표시(위치 `index.tsx:184-189`) | **참(과밀·조작불가) 확인** — 단, 실제 위치는 `handleDateSelect` `78-104`(`Alert.alert` `98-102`), 날짜 셀 `210`. 감사 라인 `184-189`은 주간위젯 JSX 시작부(`weekCalendar`)였고 Alert 로직은 함수 상단 | REQ-06, §3 범위 |
| D-2 | F-13: 프로필 수정 `:88-94`·알림 설정 `:211-217` | 라인 이동: `handleEditProfile` `92-94`·`handleNotificationSettings` `96-98`; UI `143-150`·`220-226`. 정상 항목(비밀번호·앱정보)과 구분 필요 | REQ-07, §3 범위 |
| D-3 | 목표: 인기서비스·고객인사이트·VIP·매출 4카드를 "월간 대시보드 모달로 이전" | MonthlyDashboard는 **월간** 컴포넌트이고 고객인사이트/VIP 섹션 부재 → 문자적 이전 불가. "홈 직접 렌더 0 + 기존 월간 모달 접근 유지"로 재정의(오늘 VIP/인사이트 복제는 범위 밖) | REQ-05, §5 제외 |
| D-4 | 배경: "TreatmentListModal may now be used in home — verify" | **거짓** — `index.tsx`는 두 모달 미import, 여전히 Alert. 나아가 `TreatmentDetailModal`/`TreatmentListModal`은 **저장소 전체 소비자 0건인 죽은 코드**(정의 파일만 존재). booking.tsx(`4-5`)가 import하는 것은 `EditTreatmentModal`·`UnifiedTreatmentModal`이며, 홈 상세 재사용 대상은 살아있는 통합 모달 **`UnifiedTreatmentModal`**(`selectedTreatment` 전달 시 detail 뷰) — 죽은 모달 재활성화가 아님(§4) | §4, REQ-02, AC-04 |
| D-5 | 배경: jest 78 테스트(메모리 기준선 57) | 19 스위트 확인(78 테스트 정합). 메모리 57은 DATA-001 초안 시점 | AC-13 |
| D-6 | 배경: 새 예약 버튼 minHeight ≥56 | 기존 홈 버튼은 minHeight 44(retryButton `453`, inlineRetryButton `627`, SPEC-UX-001 44pt 기준). 신규 primary CTA는 56 하한 신규 도입 필요 | REQ-03, AC-05 |

## 8. DDD 특성 테스트 전략 (PRESERVE — 재구성 전 데이터 흐름 고정)

재구성 전, 현재 홈의 **데이터 흐름 불변식**을 특성 테스트로 고정한다(시각 스냅샷이 아니라 데이터/동작 계약). 모델: `__tests__/useDashboardLoad.test.tsx`.

- CT-1: 홈이 `useDashboardLoad`를 소비하고 `dashboardData`(오늘 요약)·`weeklyTreatments`(주간)를 렌더에 사용한다(서비스 호출 = 오늘 요약 + 주간 각 1회, 추가 호출 0).
- CT-2: pull-to-refresh(`onRefresh`) 시 `force_refresh`로 refetch 발생(SPEC-DATA-001 AC-03 불변).
- CT-3: `weeklyError` 시 인라인 안내 노출(SPEC-UX-001 REQ-UX-007 불변).
- CT-4: 월간 모달이 닫힌 동안 `MonthlyDashboard` 미마운트(월별 API 0회, REQ-PERF-003-02 불변).
- CT-5: `!dashboardData` 시 "다시 시도" 재시도 버튼 노출(SPEC-UX-001 REQ-UX-006 불변).

재구성 후 CT-1~5가 그대로 통과해야 하며(데이터 계층·불변식 무회귀), 새 render 테스트가 신규 홈 구조(오늘 리스트·새 예약 버튼·상세 3섹션 부재)를 검증한다.

## 9. 롤백 근거 (위험 완화)

- 본 SPEC의 코드 변경은 `app/(tabs)/index.tsx` 단일 파일 중심(+ `profile.tsx` 항목 숨김의 소폭 변경). 신규 컴포넌트는 홈 하위로 국한 가능.
- 시각 재구성이 문제 시 **해당 커밋 `git revert` 한 번으로 홈이 이전 상태로 복원**된다(데이터 훅·모달·query는 불변이므로 revert 후에도 정합). 위험도 HIGH를 단일 파일 중심 변경으로 국한하여 blast radius를 최소화.
