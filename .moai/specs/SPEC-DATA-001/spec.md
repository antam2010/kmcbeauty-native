---
id: SPEC-DATA-001
version: 0.1.1
status: draft
created_at: 2026-07-07
updated: 2026-07-07
author: antam2010
priority: high
labels: [data, caching, react-query, tanstack, service-layer, pagination, interceptor, ddd, performance]
issue_number: null
---

# SPEC-DATA-001 — 데이터 계층 정비: react-query 캐싱 도입·레거시 서비스 통합·페이지네이션 방어

## HISTORY

- 2026-07-07 (v0.1.1): plan-audit review-1(FAIL, 0.82) 6결함 반영. **D1(major)** 직원 두 소스가 "다른 엔드포인트"라는 사실 오류를 정정 — 두 소스 모두 종단 `GET /shops/{id}/users`로 동일함을 코드 대조로 확인하고, "별도 query key" 처방을 **공유 query key 계열 `['shopUsers', shopId]` + `select` 뷰모델 변환 + throw 페처 채택**으로 재설계(REQ-04·AC-07·위험·§8·`research.md §2/§6 D5` 갱신). **D2(major)** AC-11 grep의 `-E` 누락(리터럴 `|` → 항상 0건 거짓 통과)을 `grep -rE "src/services/api/(phonebook|treatment-menu)"`로 교체(`research.md §3` 동반). **D3** REQ-05 허용형 절을 규범 Ubiquitous + 비규범 참고로 분리. **D4** `staleTime`·`MAX` 근사 상수를 `staleTime=60_000ms`·`MAX = 20`으로 고정하고 AC-01·AC-13이 값을 assert하도록 갱신. **D5** 직원 트리거 모호("직원 목록이 필요하면")를 구체 이벤트(`loadStaffUsers` 실행/직원 관리 화면 마운트)로 교체. **D6** `DashboardContext` "import 5건" → "참조 5건(import 4 + jest.mock 1)"으로 정정(L58·L134·`research.md §6 D1`). 모든 정정은 HEAD 코드(shop.ts·staff.ts·grep) 재대조로 검증.
- 2026-07-07 (v0.1.0): 초안 작성. 검증된 성능 감사(읽기 전용)의 F-12(캐싱 계층 전무, 구조적 근본 원인)·F-13(레거시 서비스 통합)·F-14(페이지네이션 팬아웃 상한)·F-15(인터셉터 동적 import 캐싱)를 기반으로 4단계 시니어 UX·성능 로드맵의 **4단계 a(Stage 4a)**를 정의. 홈 IA 재구성(Stage 4b)은 본 SPEC에 의존하는 별도 SPEC. 모든 file:line은 현재 HEAD `befb336`(Stage 1~3 반영) 기준으로 재검증했으며, 재검증 중 발견한 불일치 10건(특히 `DashboardContext` 미사용 주장 반증)은 `research.md §6` 참조.

---

## 1. 개요 (Overview)

KMC Beauty Native 앱의 **주 사용자는 오너의 어머니(60대)**이며, 모든 화면이 **마운트/탭 전환마다 서버를 재요청**한다. 클라이언트 측 서버-상태 캐시/중복제거 계층이 코드베이스 어디에도 없다(`react-query|@tanstack|useQuery|swr|QueryClient` grep 0건 — `research.md §1`). 이는 반복 대기·불필요한 네트워크·배터리 소모의 **구조적 근본 원인(F-12)**이다.

본 SPEC은 4단계 로드맵의 **4단계 a(Stage 4a, 데이터 계층)**이며 다음 원칙을 따른다.

- **점진적·화면 단위 도입**: `@tanstack/react-query` v5를 전역 설치하되, **트래픽이 높은 읽기 경로에만** 화면별로 순차 전환한다. 각 화면 전환은 **해당 화면의 관측 동작을 동일하게 유지**하여 blast radius를 최소화한다.
- **UX 계약 보존**: pull-to-refresh는 refetch를 유발하고, `weeklyError` 인라인 안내·인증 오류 인터셉터 흐름·`onTreatmentsLoad` 부모 콜백은 변경하지 않는다.
- **mutation은 현행 유지 + 무효화만 추가**: 예약 생성 등 mutation 코드는 그대로 두되, 성공 시 영향받는 query를 invalidate한다.
- **레거시 정리·방어(F-13/14/15)**: 직접 `apiClient`를 쓰는 레거시 서비스 2파일을 도메인 서비스로 통합·삭제하고, 무상한 페이지네이션 팬아웃에 상한을 두며, 요청마다 반복되는 동적 import를 캐시한다.
- 개발 방법론은 **DDD**(ANALYZE-PRESERVE-IMPROVE)이며, 각 읽기 경로 교체 전 **현재 fetch 동작의 특성 테스트를 먼저 확보**한다(모델: `__tests__/useDashboardLoad.test.tsx`).

## 2. 목표 (Goals)

- `@tanstack/react-query` v5의 `QueryClientProvider`를 `app/_layout.tsx`에 도입하고, 전역 기본값(`staleTime=60_000ms`, 유한한 `gcTime`, `retry: 1`)을 설정한다(F-12).
- **가장 트래픽이 높은 읽기 경로 5종**을 react-query로 순차 전환한다: (a) 홈 대시보드, (b) 예약 목록·달력, (c) 시술 메뉴, (d) 직원 목록, (e) 전화번호부 목록. 전환 후 **동일 query key 재마운트 시 staleTime 내 재요청이 0회**가 되게 한다(F-12).
- 예약 생성 등 mutation 성공 시 **관련 query를 invalidate**하여 신규 데이터가 목록/달력/대시보드에 반영되게 한다(F-12).
- 레거시 서비스 계층(`src/services/api/phonebook.ts`, `src/services/api/treatment-menu.ts`)의 소비자를 도메인 서비스로 전환하고 **두 레거시 파일을 삭제**한다(F-13).
- `treatment.ts` 월간/주간 동시 페이지네이션에 **팬아웃 상한(`Math.min(totalPages, MAX)`)과 경고**를 추가한다(F-14).
- 요청 인터셉터의 스토어 동적 import를 **최초 1회 후 캐시**하여 반복 import 오버헤드를 제거한다(순환 참조 회피 유지, F-15).
- 위 모든 변경은 **기존 57 테스트(12 스위트) 통과**·**tsc 회귀 0건**(기준선 = `EditTreatmentModal.tsx` 2건 유지)을 만족한다.

## 3. 범위 (In Scope)

감사에서 확인되고 현재 HEAD(`befb336`)로 재검증된 다음 4개 Finding에 한정한다. (라인은 `research.md`에서 재검증한 현재 값)

| # | 항목 | Finding | 우선순위 | 대표 위치 (현재 기준) |
|---|------|---------|----------|-----------------------|
| 1 | react-query 도입 + 전역 기본값(Provider) | F-12 | P1 | `app/_layout.tsx`(`QueryClientProvider` 없음; 래핑 지점 `ThemeProvider` `58-67`/`StoreInitializer` `57`); `package.json`(`@tanstack/*` 미존재, `zustand ^5.0.8` `53`) |
| 2 | 홈 대시보드 읽기 경로 캐싱 | F-12a | P1 | `hooks/useDashboardLoad.ts` `getTodayDetailedSummary`+`getWeeklyTreatments` `70-73`, effect `92-96`, `onRefresh` `105-108`, `weeklyError` `33`/`52` |
| 3 | 예약 목록·달력 읽기 경로 캐싱 | F-12b | P1 | `BookingListScreen.tsx` `list` 2호출부 `159`(`loadBookings` `133`)·`233`, pagination state `125-127`, `RefreshControl` `348`; `ImprovedCalendar.tsx` `getMonthlyTreatments` `99`, effects `109`/`116`, `onTreatmentsLoad?.` `101` |
| 4 | 시술 메뉴·직원·전화번호부 읽기 경로 캐싱 | F-12c/d/e | P2 | 메뉴: `TreatmentMenuManagement.tsx`(레거시 `getMenus` `61`)·`BookingForm.tsx`(`getAllWithDetails` `245`); 직원: `BookingForm.tsx`(`getCurrentShopUsers` `258`)·`StaffManagement.tsx`(`getShopUsers` `40`/`61`); 전화번호부: `PhonebookManagement.tsx`(레거시 `getPhonebooks` `95`) |
| 5 | mutation 후 관련 query 무효화 | F-12 | P1 | 예약: `BookingForm.tsx` `treatmentApiService.create` `474`→`onBookingComplete` `481`; 메뉴 CUD `TreatmentMenuManagement.tsx` `107`/`111`/`134`; 전화번호부 CUD `PhonebookManagement.tsx` `163`/`167`/`190` |
| 6 | 레거시 서비스 계층 통합·삭제 | F-13 | P2 | 레거시 `src/services/api/phonebook.ts`(소비자 `PhonebookManagement.tsx:2`)·`treatment-menu.ts`(소비자 `TreatmentMenuManagement.tsx:1`); 도메인 `phonebookApiService`(`src/api/services/phonebook.ts:167`)·`treatmentMenuApiService`(`src/api/services/treatmentMenu.ts:126`) |
| 7 | 페이지네이션 팬아웃 상한 | F-14 | P3 | `src/api/services/treatment.ts` `getMonthlyTreatments` totalPages `51`·팬아웃 `54-58`; `getWeeklyTreatments` totalPages `118`·팬아웃 `121-125` |
| 8 | 인터셉터 동적 import 캐싱 | F-15 | P3 | `src/api/client.ts` `getAccessToken` import `30`(요청 인터셉터 `214`), shopStore import `237`, authStore `84`/`126`/`382`, shopStore `127` |

> **주의(재검증 결과)**: 감사가 "미사용"으로 표기한 `contexts/DashboardContext.tsx`는 현재 HEAD에서 **참조 5건(import 4 + jest.mock 1)**으로 활성 사용 중이므로 **삭제하지 않으며 본 SPEC 범위에서 제외**한다(`research.md §6 D1`). `BookingForm`·`StaffManagement`는 이미 도메인 서비스를 사용하므로 F-13 대상이 아니다(레거시 소비자는 `PhonebookManagement`·`TreatmentMenuManagement` 2곳뿐). 상세·마이그레이션 매핑·기타 불일치 9건은 `research.md` 참조.

---

## 4. 요구사항 (EARS Requirements)

요구사항은 제안 구현 순서(§8)와 동일한 번호 순서로 정의한다.

### REQ-DATA-001-01 — react-query 도입 및 전역 기본값 (F-12)

- **Ubiquitous**: 시스템은 `app/_layout.tsx` 트리에 단일 `QueryClientProvider`를 제공해야 한다(shall), 모든 화면이 동일 `QueryClient`를 공유하도록.
- **Ubiquitous**: 시스템은 전역 query 기본값으로 `staleTime = 60_000ms`(60초, 정확값), 유한한 `gcTime`, `retry: 1`을 설정해야 한다(shall).
- **State-Driven**: 어떤 query가 `staleTime` 이내로 fresh인 동안, 시스템은 동일 query key에 대한 네트워크 재요청을 발행하지 않아야 한다(중복제거).
- **Ubiquitous**: 시스템은 오프라인 persistence(react-query persist / AsyncStorage persister)를 도입하지 않아야 한다(shall not) — 본 SPEC은 인메모리 캐시만 도입한다.
- **Ubiquitous**: 시스템은 기존 상태관리(`zustand`)를 react-query로 대체하거나 제거하지 않아야 한다(shall not) — 서버-상태만 react-query가 담당하고 클라이언트 상태는 zustand를 유지한다.

### REQ-DATA-001-02 — 홈 대시보드 읽기 경로 캐싱 (F-12a)

- **Event-Driven**: 홈 대시보드가 마운트되면(When), 시스템은 오늘 요약과 주간 시술을 query로 조회하되, 두 요청은 기존과 동일하게 병렬로 발행해야 한다.
- **State-Driven**: 대시보드 query가 fresh인 동안(예: 탭 이탈 후 staleTime 내 재진입), 시스템은 서버를 재요청하지 않고 캐시된 데이터를 렌더해야 한다.
- **Event-Driven**: 사용자가 pull-to-refresh(또는 헤더 새로고침)를 수행하면(When), 시스템은 `force_refresh`로 해당 query를 정확히 1회 refetch해야 한다.
- **Ubiquitous**: 시스템은 캐싱 도입 후에도 주간 시술 실패 시 `weeklyError` 인라인 안내와 인증 오류 상위 전파(인터셉터 처리)를 변경하지 않아야 한다(shall not) — 기존 불변식 보존.
- **State-Driven**: 상점이 선택되지 않은 동안, 시스템은 대시보드 query를 비활성화(요청 스킵)해야 한다.

### REQ-DATA-001-03 — 예약 목록·달력 읽기 경로 캐싱 (F-12b)

- **Event-Driven**: 예약 목록/달력이 마운트되거나 조회 파라미터(검색어·상태·월)가 바뀌면(When), 시스템은 해당 파라미터를 query key로 하는 query로 데이터를 조회해야 한다.
- **State-Driven**: 동일 query key가 fresh인 동안(예: 달력 월 재방문), 시스템은 서버를 재요청하지 않아야 한다.
- **Ubiquitous**: 시스템은 캐싱 도입 후에도 예약 목록의 무한스크롤(`hasMore`·페이지 누적)과 검색어 debounce 동작을 유지해야 한다(shall).
- **Ubiquitous**: 시스템은 달력 데이터 로드 결과를 부모로 전달하는 `onTreatmentsLoad` 콜백 계약을 유지해야 한다(shall).
- **Event-Driven**: 사용자가 pull-to-refresh를 수행하면(When), 시스템은 현재 조회 query를 refetch해야 한다.

### REQ-DATA-001-04 — 시술 메뉴·직원·전화번호부 읽기 경로 캐싱 (F-12c/d/e)

- **Event-Driven**: 시술 메뉴 관리 화면 또는 예약 폼의 메뉴 로드가 트리거되면(When), 시스템은 메뉴 목록을 query로 조회하고 fresh인 동안 재요청하지 않아야 한다.
- **Event-Driven**: 예약 폼의 직원 로드(`loadStaffUsers`)가 실행되거나 직원 관리 화면이 마운트되면(When), 시스템은 직원 목록을 query로 조회해야 한다. 두 화면은 **동일 종단 엔드포인트 `GET /shops/{shopId}/users`**(예약 폼 `shopApiService.getUsers`, 직원 관리 `userApiService.getShopUsers` — 둘 다 basePath `/shops`)를 사용하므로, 동일 `shopId`(예약 폼은 현재 선택 상점 컨텍스트에서 해석)에 대해 **하나의 공유 query key 계열 `['shopUsers', shopId]`**로 캐싱하여 두 화면이 단일 캐시 항목을 공유해야 한다(shall).
- **Ubiquitous**: 시스템은 직원 query의 원본 캐시를 원시 서버 응답(`ShopUserResponse[]`)으로 유지하고, 직원 관리 화면의 `StaffUser[]` 뷰모델 변환을 react-query `select`(또는 소비 측 후처리)로 적용하여, 반환 형태 차이가 캐시를 분리시키지 않도록 해야 한다(shall).
- **Ubiquitous**: 시스템은 직원 query의 `queryFn`으로 **오류를 throw하는 종단 페처(`shopApiService.getUsers(shopId)` — `[]` 폴백 없음)**를 사용해야 한다(shall) — react-query 오류 상태가 정상 동작하도록. 기존 예약 폼의 무음 `[]` 폴백(`getCurrentShopUsers`의 `catch → return []`)에 의존하는 소비자는 공유 query를 사용하도록 적응시키고 오류를 react-query 오류 상태로 노출해야 한다(shall).
- **Event-Driven**: 전화번호부 목록 화면이 마운트되면(When), 시스템은 목록을 query로 조회하고 fresh인 동안 재요청하지 않아야 한다.
- **Ubiquitous**: 시스템은 각 화면 전환 시 해당 화면의 기존 관측 동작(로딩 표시, 오류 안내, 검색·페이지, 상세 로드)을 변경하지 않아야 한다(shall not). 단, 예약 폼의 `staffLoadError` 인라인 안내는 예외로 한다 — 현재는 `getCurrentShopUsers`의 무음 `[]` 폴백 때문에 API 실패 시 도달 불가(휴면)이며, throw 페처 전환으로 이 안내가 의도대로 활성화되는 것은 SPEC-UX-001 REQ-UX-007의 원래 의도를 회복하는 **의도된 변경**이다.

### REQ-DATA-001-05 — mutation 후 관련 query 무효화 (F-12)

- **Event-Driven**: 예약 생성 mutation이 성공하면(When), 시스템은 예약 목록·달력·대시보드 관련 query를 invalidate하여 신규 예약이 각 화면에 반영되게 해야 한다.
- **Event-Driven**: 시술 메뉴 생성/수정/삭제가 성공하면(When), 시스템은 메뉴 관련 query를 invalidate해야 한다.
- **Event-Driven**: 전화번호부 생성/수정/삭제가 성공하면(When), 시스템은 전화번호부 관련 query를 invalidate해야 한다.
- **Ubiquitous**: 시스템은 각 mutation 성공 시 관련 query invalidation을 추가해야 한다(shall).
- (비규범 참고) 기존 mutation 코드의 react-query `useMutation` 이전은 본 SPEC에서 요구하지 않는다. 요청 payload·엔드포인트·성공 콜백 흐름은 현행 유지하며, 필수 변경은 invalidation 추가뿐이다.

### REQ-DATA-001-06 — 레거시 서비스 계층 통합·삭제 (F-13)

- **Ubiquitous**: 시스템은 `PhonebookManagement`·`TreatmentMenuManagement`이 레거시 `phonebookAPI`/`treatmentMenuAPI`(직접 `apiClient` import)를 참조하지 않아야 한다(shall not) — 도메인 `phonebookApiService`/`treatmentMenuApiService`로 대체한다.
- **Ubiquitous**: 시스템은 레거시 파일 `src/services/api/phonebook.ts`·`src/services/api/treatment-menu.ts`를 삭제해야 한다(shall) — 단, 삭제는 다른 소비자가 없음을 grep으로 확인한 뒤에만 수행한다.
- **Ubiquitous**: 시스템은 `src/services/storage/userDataService.ts`·`src/services/contactSync.ts`를 본 통합 작업에서 삭제하거나 변경하지 않아야 한다(shall not) — F-13 범위 밖.
- **Unwanted**: **If** 레거시→도메인 전환으로 반환타입 불일치가 발생하면, **then** 시스템은 소비자의 타입 참조를 도메인 인터페이스/`types/*`에 정합시켜 `tsc` 신규 오류가 0건이 되게 해야 한다.

### REQ-DATA-001-07 — 페이지네이션 팬아웃 상한 (F-14)

- **State-Driven**: `treatment.ts`의 월간/주간 동시 페이지네이션을 수행하는 동안, 시스템은 동시 요청 페이지 수를 `Math.min(totalPages, MAX)`(`MAX = 20`, 정확값)로 제한해야 한다 — 근거: 월 ~50건/page × 20 = ~1000건 상한으로, 단일 뷰 실사용 범위를 넉넉히 포괄한다.
- **Unwanted**: **If** 응답의 `totalPages`(응답 필드 `pages` 기반 지역변수)가 `MAX`를 초과하면, **then** 시스템은 `MAX` 페이지까지만 조회하고 경고(`console.warn`)로 절단 사실을 남겨야 한다.
- **Ubiquitous**: 시스템은 상한 도입으로 정상(≤MAX 페이지) 경로의 반환 결과·정렬 순서를 변경하지 않아야 한다(shall not).

### REQ-DATA-001-08 — 요청 인터셉터 동적 import 캐싱 (F-15)

- **Event-Driven**: 요청 인터셉터가 처음 스토어(`authStore`/`shopStore`)를 필요로 하면(When), 시스템은 이를 lazy 동적 import한 뒤 모듈 참조를 캐시해야 한다.
- **State-Driven**: 캐시가 채워진 동안, 시스템은 후속 요청에서 동일 스토어 모듈을 재-`import`하지 않고 캐시된 참조를 사용해야 한다.
- **Ubiquitous**: 시스템은 순환 참조 회피(최초 호출 전까지 스토어 미평가)와 헤더 부착 계약(`Authorization`/`X-Shop-ID`, SPEC-REFACTOR-001 REQ-REF-001/004)을 변경하지 않아야 한다(shall not).

---

## 5. 제외 사항 (Exclusions — What NOT to Build)

본 SPEC은 아래 항목을 **명시적으로 제외**한다.

- **홈 화면 IA/시각 재구성** → Stage 4b(본 SPEC에 의존하는 별도 SPEC) 소관.
- **오프라인 persistence**: `@tanstack/react-query-persist-client`·AsyncStorage persister 미도입(인메모리 캐시만).
- **신규 상태관리 교체**: `zustand`를 유지하며 클라이언트 상태를 react-query로 이관하지 않는다.
- **예약 흐름 변경**: payload·확인 흐름·성공 처리·스마트 기본값은 SPEC-BOOKING-001 소관으로 변경하지 않는다(본 SPEC은 예약 생성 mutation에 **invalidation만** 추가).
- **`EditTreatmentModal.tsx` 기존 tsc 오류 2건 수정**(`:123`, `:395`) → 별도 작업. 본 SPEC은 이 기준선을 유지(회귀 0)만 확인한다.
- **`contexts/DashboardContext.tsx` 삭제**: 활성 사용 중(참조 5건: import 4 + jest.mock 1)이므로 제외(`research.md §6 D1`).
- **`userDataService.ts`·`contactSync.ts` 정리**: F-13의 2-파일 범위 밖. `userDataService`가 소비자 0건으로 보이더라도 본 SPEC에서 삭제하지 않는다(후속 정리 후보).
- **`BookingForm` 최근 고객 목록**(`phonebookApiService.list` `107`)·기타 F-12 5대상 외 부수 읽기 경로의 캐싱 → 현행 유지(선택적 후속).
- **phonebook/treatmentMenu 도메인 서비스의 무상한 팬아웃**(`getAllContacts`/`getContactsByGroup`/`getAllWithDetails`) 상한 → 본 SPEC은 `treatment.ts` 월간/주간에 한정(공용 헬퍼로 확장 여지만 남김).
- **시각적/브랜드 재디자인**: 색상·타이포·레이아웃 변경 없음.

---

## 6. 수용 기준 (Acceptance Criteria)

구체적·이진 판정 가능 기준(개발 모드 `ddd` — 각 읽기 경로 교체 전 현재 fetch 동작의 특성 테스트 우선; 호출 횟수·invalidate는 jest 서비스/`queryClient` 모킹·spy로 측정).

| ID | 기준 | 검증 방법 | REQ |
|----|------|-----------|-----|
| AC-01 | `app/_layout.tsx`에 `QueryClientProvider` 존재 + 기본값 `staleTime === 60000`(ms)·유한 `gcTime`·`retry === 1` 설정 | `grep` + 단위 테스트(`QueryClient` 옵션 `staleTime===60000`·`retry===1` assert) | REQ-DATA-001-01 |
| AC-02 | 동일 query key 화면 **마운트 2회에 fetch 정확히 1회**(staleTime 내 dedup) | jest 서비스 모킹 spy call-count(대시보드 훅 테스트 모델) | REQ-DATA-001-01, 02 |
| AC-03 | 대시보드 pull-to-refresh/헤더 새로고침 시 refetch **정확히 1회** + `force_refresh` 전달 | jest 모킹 spy | REQ-DATA-001-02 |
| AC-04 | 대시보드 캐싱 후 `weeklyError` 인라인 안내·인증 오류 상위 전파·상점 미선택 스킵 **동작 불변** | 기존 `useDashboardLoad` 불변식 특성 테스트 통과 | REQ-DATA-001-02 |
| AC-05 | 예약 목록 무한스크롤(`hasMore`/페이지 누적)·검색 debounce **동작 유지** | 렌더/특성 테스트 | REQ-DATA-001-03 |
| AC-06 | 달력 동일 월 재방문 시 재요청 **0회** + `onTreatmentsLoad` 콜백 **호출 유지** | jest 모킹 spy | REQ-DATA-001-03 |
| AC-07 | 예약 폼·직원 관리 화면이 동일 `shopId`에 대해 **동일 query key `['shopUsers', shopId]`로 단일 캐시 공유**(한 화면 로드 후 다른 화면 재조회 시 fetch 0회) + 직원 관리 화면은 `select`로 `StaffUser[]` 뷰모델 획득 + `queryFn`이 throw 페처라 오류 시 react-query 오류 상태 노출(무음 `[]` 폴백 없음) | 단위 테스트(query key 동일성 + `select` 결과 + 오류 상태 assert) | REQ-DATA-001-04 |
| AC-08 | 메뉴·전화번호부 목록 화면 재진입 시 staleTime 내 재요청 **0회** | jest 모킹 spy call-count | REQ-DATA-001-04 |
| AC-09 | 예약 생성 mutation 성공 후 예약 목록·달력·대시보드 query **invalidate 호출**(각 key) | `queryClient.invalidateQueries` spy | REQ-DATA-001-05 |
| AC-10 | 메뉴/전화번호부 CUD 성공 후 해당 query **invalidate 호출** | `queryClient.invalidateQueries` spy | REQ-DATA-001-05 |
| AC-11 | 레거시 `src/services/api/phonebook.ts`·`treatment-menu.ts` **import 0건** + 두 파일 **삭제됨** | `grep -rE "src/services/api/(phonebook\|treatment-menu)" --include="*.ts*"` = 0 + 파일 부재 확인 | REQ-DATA-001-06 |
| AC-12 | 레거시→도메인 전환 후 `PhonebookManagement`·`TreatmentMenuManagement` 화면 동작(로딩/검색/CUD/상세) **불변** | 특성/렌더 테스트 | REQ-DATA-001-06 |
| AC-13 | `treatment.ts` 월간/주간 팬아웃이 `Math.min(totalPages, MAX)`(`MAX === 20`)로 제한 + `pages > 20` 시 `console.warn` 1회 + 동시 요청 페이지 수 ≤ 20 | 단위 테스트(`list` 모킹 `pages = 25` → 페처 호출 정확히 20회 + `console.warn` 1회 assert) | REQ-DATA-001-07 |
| AC-14 | `MAX` 이하 페이지 경로의 반환 항목·순서 **변경 없음** | 단위 테스트(회귀) | REQ-DATA-001-07 |
| AC-15 | 요청 인터셉터가 스토어 모듈을 **최초 1회만 동적 import**(반복 요청 시 재-import 0회) | 단위 테스트(`import` 모킹 call-count) 또는 캐시 참조 assert | REQ-DATA-001-08 |
| AC-16 | 기존 jest **테스트 57개(12 스위트) 전부 통과** | `npx jest` | 전체 |
| AC-17 | `tsc --noEmit` **신규 오류 0건**(기준선 = `EditTreatmentModal.tsx` 2건 유지) | `npx tsc --noEmit` | 전체 |

### Definition of Done

- AC-01 ~ AC-17 전부 충족.
- 각 읽기 경로(대시보드/예약·달력/메뉴·직원·전화번호부) 교체 전(PRESERVE) 현재 fetch 동작(마운트당 호출 횟수·오류 전파·pull-to-refresh·`onTreatmentsLoad`·pagination)에 대한 특성 테스트를 먼저 확보한다.
- 최종 diff가 데이터 계층(Provider·query/mutation·서비스 통합·페이지네이션 상한·인터셉터 캐시)에 한정되며, 예약 흐름 로직·시각적 재설계·`DashboardContext` 삭제·`EditTreatmentModal` 오류 수정이 diff에 없음.
- 두 레거시 파일 삭제 전 grep으로 잔여 소비자 0건을 확인한 로그를 남긴다.

---

## 7. 위험 평가 (Risk Assessment)

- **전체 위험도: 중상 (Medium-High)** — 데이터 계층은 다수 화면을 관통한다. 다만 **화면 단위 점진 도입**으로 blast radius를 국한하며, 각 화면 전환은 화면-레벨 동작을 동일하게 유지한다.
- **주의 지점**:
  - REQ-03(예약 목록): fetch 2호출부(무한스크롤 `159` + 검색 debounce `233`)와 `hasMore`/`currentPage` 상태가 있어 단순 useQuery로 대체 시 무한쿼리/파생 키 설계가 필요하다. 페이지 누적·검색 동작 회귀 금지(`research.md §6 D8`).
  - REQ-03(달력): `onTreatmentsLoad?.` 콜백(`101`)에 부모가 의존하므로 캐싱 전환 후에도 로드 결과를 부모로 전달해야 한다(`D9`).
  - REQ-04/06 중첩: `TreatmentMenuManagement`·`PhonebookManagement`는 캐싱 대상이자 레거시 전환 대상이다. **레거시→도메인 전환을 먼저(또는 캐싱과 동시에) 수행**하여 이중 수정을 피한다(§8 순서, `D4`).
  - REQ-04(직원): 두 직원 소스는 종단 엔드포인트 `GET /shops/{id}/users`가 동일하므로 동일 `shopId`에 대해 공유 query key `['shopUsers', shopId]`로 묶어 캐시를 공유하되, 반환 형태 차이(원시 `ShopUserResponse[]` vs `StaffUser[]` 뷰모델)는 `select`로, 오류 의미론 차이(`[]` 폴백 vs throw)는 throw 페처 채택 + `[]` 폴백 소비자 적응으로 흡수한다. 예약 폼이 동일 `shopId`를 해석하지 못해 서로 다른 key를 쓰면 동일 데이터가 이중 캐시되어 화면 간 staleness가 어긋난다(`D5`).
  - REQ-08(인터셉터): 캐시 도입이 순환 참조 회피(초기화 지연)를 깨지 않아야 한다 — lazy on first call, cached after. 헤더 부착 `@MX:ANCHOR` 계약 불변.
  - 반환타입 정합(REQ-06): 레거시/도메인 인터페이스 차이로 소비자 타입 정리가 필요하며, 미정합 시 `tsc` 회귀가 발생한다(`research.md §3`).
- **완화**: `development_mode: ddd`에 따라 각 항목 변경 전 특성 테스트(호출 횟수·흐름·pagination)를 먼저 확보하고, §8 순서로 화면별 커밋·검증한다. 각 커밋 후 `npx jest`·`npx tsc --noEmit`로 회귀 0을 확인한다.

## 8. 구현 순서 (Suggested Implementation Order)

기반 설치 → 저위험·고트래픽 화면 → 복잡 화면 → 레거시/방어 순으로 진행하며, 각 단계 전 특성 테스트를 먼저 확보한다.

1. **REQ-DATA-001-01** — `@tanstack/react-query` v5 설치 + `QueryClientProvider`·전역 기본값(`app/_layout.tsx`).
2. **REQ-DATA-001-02** — 홈 대시보드 캐싱(`useDashboardLoad`) — 기존 특성 테스트가 모델·회귀 가드.
3. **REQ-DATA-001-03** — 예약 목록·달력 캐싱(무한쿼리/월별 key, `onTreatmentsLoad` 유지).
4. **REQ-DATA-001-06(부분)+04** — 메뉴·전화번호부 화면은 **레거시→도메인 전환을 먼저** 수행한 뒤 캐싱 적용; 직원 캐싱(공유 key `['shopUsers', shopId]` + `select` + throw 페처)도 이 단계.
5. **REQ-DATA-001-05** — mutation invalidation(예약 생성 → 목록·달력·대시보드; 메뉴/전화번호부 CUD).
6. **REQ-DATA-001-06(잔여)** — 레거시 파일 2건 삭제(grep 0 확인 후).
7. **REQ-DATA-001-07** — `treatment.ts` 팬아웃 상한 + 경고.
8. **REQ-DATA-001-08** — 인터셉터 동적 import 캐싱.

## 9. 추적성 (Traceability)

| REQ | Finding | 우선순위 | 유형 | 로드맵 단계 |
|-----|---------|----------|------|-------------|
| REQ-DATA-001-01 | F-12 | P1 | 구조/성능 | Stage 4a |
| REQ-DATA-001-02 | F-12a | P1 | 성능(캐싱) | Stage 4a |
| REQ-DATA-001-03 | F-12b | P1 | 성능(캐싱) | Stage 4a |
| REQ-DATA-001-04 | F-12c/d/e | P2 | 성능(캐싱) | Stage 4a |
| REQ-DATA-001-05 | F-12 | P1 | 정합성(무효화) | Stage 4a |
| REQ-DATA-001-06 | F-13 | P2 | 유지보수(통합) | Stage 4a |
| REQ-DATA-001-07 | F-14 | P3 | 방어(상한) | Stage 4a |
| REQ-DATA-001-08 | F-15 | P3 | 성능(인터셉터) | Stage 4a |

진단 근거(재검증 결과·마이그레이션 매핑·불일치 10건·특성 테스트 전략): `research.md` 참조.
