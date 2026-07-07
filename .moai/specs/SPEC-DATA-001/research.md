# SPEC-DATA-001 연구 노트 (research.md)

데이터 계층 정비(F-12/13/14/15)의 근거·재검증 결과·마이그레이션 매핑·특성 테스트 전략을 기록한다. 모든 file:line은 **현재 HEAD `befb336`**(Stage 1~3 반영: SPEC-UX-001·PERF-001/003·API-001·REFACTOR-001·BOOKING-001) 기준으로 직접 재검증했다.

---

## 1. 재검증 기준선 (Baseline)

| 항목 | 값 | 확인 방법 |
|------|-----|-----------|
| HEAD | `befb336` (`fix(booking): SPEC-BOOKING-001 …`) | `git rev-parse --short HEAD` |
| Jest 스위트 | 12 | `npx jest --listTests | wc -l` |
| Jest 테스트/스냅샷 | 57 tests / 1 snapshot (과제 명시, 회귀 가드 대상) | — |
| tsc 기준선 오류 | **정확히 2건** — `components/modals/EditTreatmentModal.tsx(123,11) TS2322`, `(395,9) TS2322` | `npx tsc --noEmit` |
| 캐싱/중복제거 계층 | **전무** — `react-query|@tanstack|useQuery|swr|QueryClient` grep **0건** | `grep -rniE` (src/app/hooks/components) |
| package.json 상태관리/캐시 | `zustand ^5.0.8`, `@react-native-async-storage/async-storage 2.2.0`, `expo-haptics ~15.0.7`. `@tanstack/*` **미존재** | `grep package.json` |

→ **F-12 확증**: 클라이언트 측 서버-상태 캐시/중복제거 계층이 코드베이스 어디에도 없다. 모든 화면이 마운트/탭 전환마다 재요청한다.

---

## 2. F-12 — 캐싱/중복제거 대상 읽기 경로 (재검증된 현재 위치)

Provider 설치 지점:
- `app/_layout.tsx` — 현재 `QueryClientProvider` 없음. 트리 래핑 지점은 `ThemeProvider`(`58-67`) 바깥 또는 `<StoreInitializer/>`(`57`)와 동렬. `app/(tabs)/` = `index.tsx`(홈 대시보드), `booking.tsx`(예약 목록·달력), `management.tsx`(직원/메뉴/전화번호부 관리), `profile.tsx`.

| # | 대상(F-12 하위) | 현재 데이터 소스 | 위치(현재) | 보존해야 할 화면 계약 |
|---|------|------------------|------------|------------------------|
| a | 홈 대시보드 | `dashboardApiService.getTodayDetailedSummary` + `treatmentApiService.getWeeklyTreatments` (`Promise.all`) | `hooks/useDashboardLoad.ts` `70-73`; effect `92-96`; `onRefresh` `105-108`; `weeklyError` state `33`·set `52` | 인증 오류 상위 전파(`48`), `weeklyError` 인라인 안내, 상점 미선택 시 스킵(`59`), pull-to-refresh=force_refresh(`107`) |
| b | 예약 목록·달력 | 목록: `treatmentApiService.list` — **두 호출부** `159`(`loadBookings` `133`)와 `233`(검색 debounce effect); 달력: `treatmentApiService.getMonthlyTreatments` `99`(`loadMonthlyTreatments` `97`) | `components/booking/BookingListScreen.tsx`(pagination state `125-127`, `RefreshControl` `348`); `components/calendar/ImprovedCalendar.tsx`(effects `109`·`116`, `onTreatmentsLoad?.` 콜백 `101`) | 무한스크롤/`hasMore`, 검색어·상태 debounce, `onTreatmentsLoad` 부모 콜백, pull-to-refresh |
| c | 시술 메뉴 | 관리화면: **레거시** `treatmentMenuAPI.getMenus`(`61`)/`getMenuDetails`(`73`); 폼: **도메인** `treatmentMenuApiService.getAllWithDetails`(`245`) | `components/management/TreatmentMenuManagement.tsx`; `components/forms/BookingForm.tsx` | 목록 로드·상세 로드 분리, 생성/수정/삭제 후 재조회(`loadMenus`) |
| d | 직원 목록 | 폼: `shopApiService.getCurrentShopUsers()`(`258`, `loadStaffUsers` `255`); 관리화면: `userApiService.getShopUsers(shopId)`(`40`·`61`) | `components/forms/BookingForm.tsx`; `components/management/StaffManagement.tsx` | **두 소스 종단 동일**(`GET /shops/{id}/users`, §6 D5 — 차이는 반환 형태·오류 의미론뿐), BOOKING-001 최근직원 복원(`258` 이후), 인라인 오류 안내 |
| e | 전화번호부 목록 | **레거시** `phonebookAPI.getPhonebooks`(`95`), 로드 effect `88` | `components/management/PhonebookManagement.tsx` | 검색·페이지, 생성/수정/삭제 후 재조회, ContactSync 모달 흐름 |

Mutation → invalidation 지점:
- 예약 생성: `BookingForm.tsx` `treatmentApiService.create`(`474`) → 성공 시 `onBookingComplete()`(`481`). 성공 후 **예약 목록·달력·대시보드 query** 무효화 필요.
- 메뉴 CUD: `TreatmentMenuManagement.tsx` `updateMenu`(`107`)/`createMenu`(`111`)/`deleteMenu`(`134`) + detail CUD → 메뉴 query 무효화.
- 전화번호부 CUD: `PhonebookManagement.tsx` `updatePhonebook`(`163`)/`createPhonebook`(`167`)/`deletePhonebook`(`190`) → 전화번호부 query 무효화.

---

## 3. F-13 — 레거시 서비스 계층: 소비자·삭제 조건·도메인 매핑

레거시 파일(직접 `apiClient` import)과 소비자(정확히 2건):

| 레거시 파일 | export | 유일 소비자 | import 라인 |
|-------------|--------|-------------|-------------|
| `src/services/api/phonebook.ts` | `phonebookAPI` | `components/management/PhonebookManagement.tsx` | `:2` |
| `src/services/api/treatment-menu.ts` | `treatmentMenuAPI` | `components/management/TreatmentMenuManagement.tsx` | `:1` |

도메인 대체 서비스: `src/api/services/phonebook.ts` `phonebookApiService`(`167`), `src/api/services/treatmentMenu.ts` `treatmentMenuApiService`(`126`) — 둘 다 `src/api/services/index.ts`에서 export됨(`4`,`8`,`20`,`21`).

### [중요] 순수 rename이 아님 — 메서드명·반환타입 차이

`phonebookAPI`(레거시) → `phonebookApiService`(도메인):

| 레거시 메서드 | 도메인 메서드 | 반환타입 차이 |
|---------------|---------------|----------------|
| `getPhonebooks(params)` | `list(params)` | 레거시 `PhonebookPageResponse`(`types/phonebook`) vs 도메인 `PhonebookResponse`(도메인 파일 내 인라인 인터페이스) |
| `getPhonebookGroups(withItems)` | `getGroups(withItems)` | 레거시 `PhonebookGroupedByGroupnameResponse[]` vs 도메인 `PhonebookGroup[]` |
| `getPhonebook(id)` | `getById(id)` | 레거시 `PhonebookResponse`(단건) vs 도메인 `Phonebook` |
| `createPhonebook(data)` | `create(data)` | 레거시 `PhonebookResponse` vs 도메인 `Phonebook` |
| `updatePhonebook(id,data)` | `update(id,data)` | 동일 패턴 차이 |
| `deletePhonebook(id)` | `remove(id)` | 둘 다 `void` |
| `checkDuplicate(phone)` | `checkDuplicate(phone)` | 레거시 `DuplicateCheckResponse` vs 도메인 `{ exists; phone_number? }` |

`treatmentMenuAPI`(레거시) → `treatmentMenuApiService`(도메인):

| 레거시 | 도메인 | 반환타입 차이 |
|--------|--------|----------------|
| `getMenus(params)` | `list(params)` | 둘 다 `TreatmentMenuResponse`(단, 레거시는 `@/src/types`, 도메인은 인라인 인터페이스) |
| `createMenu(data)` | `create(data)` | 레거시 `TreatmentMenuResponse` vs 도메인 `TreatmentMenu` |
| `updateMenu(id,data)` | `update(id,data)` | 위와 동일 |
| `deleteMenu(id)` | `remove(id)` | 둘 다 `void` |
| `restoreMenu(id)` | `restore(id)` | 둘 다 `void` |
| `getMenuDetails(id)` | `getDetails(id)` | 둘 다 `TreatmentMenuDetail[]` |
| `createMenuDetail(id,data)` | `createDetail(id,data)` | 동일 |
| `updateMenuDetail(id,detailId,data)` | `updateDetail(id,detailId,data)` | 동일 |
| `deleteMenuDetail(id,detailId)` | `removeDetail(id,detailId)` | 둘 다 `void` |

→ 마이그레이션은 **메서드명 치환 + 반환타입 정합(consumer의 타입 참조 정리)**를 동반한다. `tsc` 회귀 0을 만족하려면 소비자 컴포넌트의 지역 타입(`PhonebookCreate` 등)을 도메인 인터페이스 또는 `types/*`로 일관되게 맞춰야 한다.

삭제 조건: 위 소비자 2건을 도메인으로 전환한 뒤 `grep -rE "src/services/api/(phonebook|treatment-menu)" --include="*.ts*"` 결과가 0이면 두 레거시 파일 삭제. (주의: `-E` 없이 리터럴 `|`를 쓰면 항상 0건이 나와 거짓 통과하므로 반드시 `-rE` + 그룹핑 사용.) **`src/services/storage/userDataService.ts`·`src/services/contactSync.ts`는 삭제 대상 아님**(§6 참조).

---

## 4. F-14 — 페이지네이션 팬아웃 상한 부재

`src/api/services/treatment.ts`:
- `getMonthlyTreatments`: `const totalPages = firstPage.pages || 1;`(`51`) → `Promise.allSettled(Array.from({ length: Math.max(0, totalPages - 1) }, …))`(`54-58`). **상한 없음**.
- `getWeeklyTreatments`: `totalPages`(`118`) → 동일 팬아웃(`121-125`). **상한 없음**.

주의: 응답 필드는 `firstPage.pages`이며 지역변수명이 `totalPages`다(스키마에 `totalPages` 키는 없음). 상한 가드는 지역변수 `totalPages`에 `Math.min(totalPages, MAX)`로 적용한다. `MAX = 20`(정확값 — 월 ~50건/page × 20 = ~1000건 상한, 초과 시 `console.warn`). 이 상수는 spec REQ-DATA-001-07로 승격.

동일 무상한 팬아웃이 도메인 phonebook/treatmentMenu에도 존재(§6 D6): `phonebook.ts` `getAllContacts`(`99`)·`getContactsByGroup`(`137`), `treatmentMenu.ts` `getAllWithDetails`(`98`). 본 SPEC은 과제 지시대로 `treatment.ts` 월간/주간에 한정하되, 공용 상한 헬퍼로 구현하면 후속 확장이 용이하다.

---

## 5. F-15 — 요청 인터셉터 동적 import 반복

`src/api/client.ts`는 순환 참조 회피를 위해 요청마다 스토어를 `await import(...)`한다:
- `getAccessToken`: `await import('../stores/authStore')`(`30`) — **요청 인터셉터가 매 요청 호출**(`214`).
- 요청 인터셉터: `await import('../stores/shopStore')`(`237`) — **매 요청**.
- `refreshAccessToken`: authStore(`84`); `performLogout`: authStore(`126`)+shopStore(`127`); 401 핸들러: authStore(`382`).

→ 매 요청 경로(`30`,`237`)에서 반복 동적 import 발생. **최초 호출 시 lazy import 후 모듈 참조를 모듈 스코프에 캐시**하면 순환 참조 회피(초기화 시점 지연)를 유지하면서 반복 import 오버헤드를 제거한다. 계약: authStore·shopStore를 부착하는 유일 헤더 경계(`@MX:ANCHOR` `204-208`, SPEC-REFACTOR-001 REQ-REF-001/004) 동작은 불변.

---

## 6. 재검증 중 발견한 불일치 (Discrepancies)

- **D1 [scope 제거] `contexts/DashboardContext.tsx`는 미사용이 아님.** 과제 배경의 "verified unused (DashboardContext) — delete if grep confirms 0 imports"는 현재 HEAD에서 **거짓**. 참조 5건(import 4 + jest.mock 1): import 4건 — `hooks/useDashboardLoad.ts:7`(`useDashboard`), `components/modals/EditTreatmentModal.tsx:3`(`useDashboard`), `app/(tabs)/booking.tsx:7`(`useDashboard`), `app/(tabs)/_layout.tsx:7`(`DashboardProvider` 마운트); jest.mock 1건 — `__tests__/useDashboardLoad.test.tsx:19`(`jest.mock('@/contexts/DashboardContext', …)` — 테스트에서 여전히 활성 참조). → **삭제 금지**, 본 SPEC 범위에서 완전 제외.
- **D2 [관찰, 범위 외] `src/services/storage/userDataService.ts`는 외부 소비자 0건.** grep 결과 자기 자신 외 import 없음. F-13의 2-파일 범위 밖이므로 본 SPEC에서 건드리지 않되, 잠재적 데드코드로 후속 정리 후보. `contactSync.ts`는 소비자 존재(`ContactSyncModal.tsx` `contactSyncService`, `BookingForm.tsx:7` 타입) → 유지.
- **D3 [AC 반영] 레거시→도메인은 rename이 아님**(§3). 반환타입 차이로 소비자 타입 정합 필요 → AC에 `tsc` 회귀 0 명시.
- **D4 [순서 반영] F-12·F-13 중첩.** `TreatmentMenuManagement`·`PhonebookManagement`는 캐싱 도입 대상(F-12 c/e)이자 레거시 전환 대상(F-13). 이중 수정을 피하려면 **두 화면은 레거시→도메인 전환을 먼저(또는 캐싱과 동시에) 수행**. §8 순서를 그에 맞게 조정(전화번호부/메뉴 화면은 F-13 선행).
- **D5 [query key 설계 — 정정] 직원 소스 2종은 종단 엔드포인트가 동일하다.** review-1 D1 반영. `BookingForm`=`shopApiService.getCurrentShopUsers()`(shop.ts:83 — `getSelected()`(`GET /shops/selected`)로 shopId 해석 후 `getUsers(id)` 호출, `getUsers` shop.ts:78 = `GET /${shopId}/users`, basePath `/shops` shop.ts:49, 원시 `ShopUserResponse[]`, 실패 시 `[]` 폴백 shop.ts:87-90), `StaffManagement`=`userApiService.getShopUsers(shopId)`(staff.ts:59 — 명시 shopId, `GET /${shopId}/users`, basePath `/shops` staff.ts:54, `StaffUser[]` 뷰모델 변환 staff.ts:64-76, 실패 시 throw). **둘 다 종단은 동일한 `GET /shops/{shopId}/users`**이며, 다른 것은 (a) shopId 해석 경로(`/shops/selected` 선행 여부), (b) 반환 형태(원시 `ShopUserResponse[]` vs `StaffUser[]` 뷰모델), (c) 오류 의미론(`[]` 폴백 vs throw)뿐이다. → **하나의 공유 query key 계열 `['shopUsers', shopId]`**로 캐싱하고(동일 `shopId`), 반환 형태 차이는 react-query `select`(원본 캐시=원시 `ShopUserResponse[]`, `StaffManagement`가 `StaffUser[]`로 변환)로, 오류 의미론 차이는 **throw 페처(`shopApiService.getUsers(shopId)` — `[]` 폴백 없는 종단 호출) 채택 + 예약 폼의 `[]` 폴백 의존 제거(오류를 react-query 상태로 노출)**로 흡수한다. 별도 key로 묶으면 동일 데이터가 이중 캐시되어 화면 간 staleness가 어긋나므로 **공유 key가 정답**이다.
- **D6 [관찰] F-14 무상한 팬아웃은 도메인 phonebook/treatmentMenu에도 존재**(§4). 범위는 `treatment.ts`로 유지, 공용 헬퍼 권장.
- **D7 [명명] F-14 필드는 `.pages`**(지역변수 `totalPages`), 스키마에 `totalPages` 키 없음.
- **D8 [보존 주의] `BookingListScreen`은 fetch 2호출부**(`159` 무한스크롤·`233` 검색 debounce) + `hasMore`/`currentPage` 상태 → 캐싱 도입 시 query key=검색·상태·page. 단순 useQuery보다 복잡(무한쿼리 또는 파생 키).
- **D9 [보존 주의] `ImprovedCalendar`의 `onTreatmentsLoad?.` 콜백**(`101`)에 부모가 의존 → 캐싱 전환 후에도 로드 결과를 부모로 전달해야 함(콜백 유지 또는 쿼리 상위 이전).
- **D10 [범위 외 관찰] `BookingForm` 최근 고객 목록**(`phonebookApiService.list({size:10,page:1})` `107`)은 F-12의 명시 5대상(대시보드/예약/메뉴/직원/전화번호부 목록)에 없는 부수 읽기 경로 → 현행 유지(선택적 후속).

---

## 7. 특성 테스트 전략 (DDD ANALYZE→PRESERVE→IMPROVE)

모델: `__tests__/useDashboardLoad.test.tsx`(호출 횟수·병렬 발행·불변식 검증) — 서비스 모듈을 `jest.mock`으로 대체하고 spy 호출 횟수로 이진 판정.

- **PRESERVE(교체 전)**: 각 읽기 경로의 현재 동작(마운트당 fetch 횟수, 오류 전파, pull-to-refresh 시 refetch, `onTreatmentsLoad` 호출, pagination)에 대한 특성 테스트를 **먼저** 확보한다. 예: 대시보드는 "단일 마운트 → `getTodayDetailedSummary` 1회"(기존 AC-01) 유지.
- **IMPROVE(교체 후)**: react-query 도입 후 "동일 query key **마운트 2회에 fetch 1회**"(staleTime 내 dedup)를 신규 이진 AC로 추가. mutation invalidation은 `queryClient.invalidateQueries` spy로 검증.
- 테스트에서 `QueryClientProvider`는 매 테스트 새 `QueryClient`(재시도 off, gcTime 0)로 래핑해 결정성 확보.

## 8. react-query v5 도입 노트 (구현 참고, HOW)

- v5 API: `gcTime`(v4 `cacheTime` 대체), `useQuery({ queryKey, queryFn })`, `useMutation`, `queryClient.invalidateQueries({ queryKey })`(객체형). 전역 기본값은 `new QueryClient({ defaultOptions: { queries: { staleTime, gcTime, retry: 1, refetchOnWindowFocus off(RN 무관) } } })`.
- RN에서 추가 provider 불필요 — `QueryClientProvider`만 `app/_layout.tsx` 트리에 래핑.
- **비도입(제외)**: `@tanstack/react-query-persist-client`/AsyncStorage persister(오프라인 캐시)는 본 SPEC 제외(§SPEC 제외 사항).

---

진단 소스: 검증된 성능 감사(F-12~F-16, 읽기 전용) + 위 재검증. 요구사항·수용 기준은 `spec.md` 참조.
