# KMC Beauty Native — 모듈 코드맵

> 기준: 2026-10-17 · 브랜치 `feature/refactor-hardening-2026-07` · HEAD `16ac428`
> 폴더와 파일마다 맡은 일과 밖으로 내보내는 것(공개 표면)을 정리했다. 디렉터리 트리는 [structure.md](../structure.md) 2절, 계층 규칙은 3·5절이 정본이다. 내보내는 이름은 소스 파일의 `export` 선언을 TypeScript 구문 트리로 읽어 확인했다.

---

## 1. 라우트(`app/`)

expo-router가 파일 경로를 화면 경로로 쓴다. 레이아웃 2개와 화면 9개, 모두 11개 파일이며 파일마다 화면 컴포넌트 하나를 default로 내보낸다. 경로별 화면 구성과 들어오는 길은 [entry-points.md](entry-points.md)에 있다.

---

## 2. 기능별 UI(`components/`)

| 파일 | 맡은 일 | 데이터를 얻는 곳 |
|------|--------|----------------|
| `components/HapticTab.tsx` | 탭 버튼. iOS에서 누를 때 햅틱을 낸다 | — |
| `components/ThemedText.tsx`, `components/ThemedView.tsx` | 테마 색을 입힌 텍스트·뷰(Expo 템플릿) | `useThemeColor` |
| `components/booking/BookingListScreen.tsx` | 예약 목록 보기(20건 단위 페이지, 상태 필터). 상태 배지 색 `statusColors`도 내보낸다 | `treatmentApiService.list` 직접 호출 |
| `components/calendar/ImprovedCalendar.tsx` | 월 달력과 날짜별 예약 건수. default가 아니라 이름(`ImprovedCalendar`)으로 내보낸다 | `useMonthlyTreatmentsQuery` |
| `components/dashboard/MonthlyDashboard.tsx` | 월간 현황. 화면과 모달 양쪽에서 쓴다 | `dashboardApiService.getMonthlyDetailedSummary` 직접 호출 |
| `components/forms/BookingForm.tsx` | 예약 등록 폼 | `useShopUsersQuery`·`useTreatmentMenusQuery`, 고객 조회·등록과 예약 생성은 서비스 직접 호출(structure.md 6.1절) |
| `components/forms/SelectedTreatmentItem.tsx` | 고른 시술 항목 한 줄(가격·시간 조정). 타입 `SelectedTreatmentItem`도 내보낸다 | — |
| `components/forms/LoginForm.tsx` | 로그인 폼과 "아이디 기억하기" | 부모의 `onLogin`, AsyncStorage `remembered-email` |
| `components/forms/InviteSignupForm.tsx` | 초대 코드 가입 폼 | 부모의 `onSignup` |
| `components/management/StaffManagement.tsx` | 직원 목록, 초대 코드 모달 열기 | `useStaffUsersQuery` |
| `components/management/PhonebookManagement.tsx` | 전화번호부 검색·추가·수정·삭제, 연락처 동기화 모달 열기 | `usePhonebookQuery`, 쓰기는 서비스 직접 호출 |
| `components/management/TreatmentMenuManagement.tsx` | 시술 메뉴와 세부 항목 관리 | `useTreatmentMenusQuery`, 쓰기는 서비스 직접 호출 |
| `components/navigation/ShopHeader.tsx` | 탭 화면 4개 위쪽의 샵 이름 버튼. 누르면 확인 창을 거쳐 샵 선택으로 간다 | `shopStore` |
| `components/navigation/AuthNavigator.tsx` | 인증 분기 컴포넌트. import하는 곳이 없다 | `authStore` |
| `components/ui/IconSymbol.tsx`, `components/ui/IconSymbol.ios.tsx` | 아이콘. iOS는 SF Symbols, 그 밖은 MaterialIcons | — |
| `components/ui/TabBarBackground.tsx`, `components/ui/TabBarBackground.ios.tsx` | 탭 바 배경. iOS는 블러 | — |

관리 탭의 하위 화면 3개는 라우트가 아니라 `app/(tabs)/management.tsx`의 상태 값으로 바뀐다. 세 화면 모두 `onGoBack`으로 메뉴에 돌아간다. 분리한 스타일 파일은 `components/forms/BookingForm.styles.ts`, `components/management/PhonebookManagement.styles.ts`, `components/modals/CustomerRegistrationModal.styles.ts` 세 개다.

### 2.1 모달

어느 화면이 어떤 모달을 여는지는 structure.md 11.2절에 있다.

| 파일 | 맡은 일 | 부르는 서비스 |
|------|--------|-------------|
| `components/modals/UnifiedTreatmentModal.tsx` | 예약 상세와 날짜별 예약 목록. default로 내보내는 함수 이름은 `TreatmentModal`이다 | 없음(받은 데이터만 그린다) |
| `components/modals/EditTreatmentModal.tsx` | 예약 수정 | 고객 `list`·`search`·`checkDuplicate`·`create`, `getCurrentShopUsers`, `getAllWithDetails`, 예약 `update` |
| `components/modals/CustomerRegistrationModal.tsx` | 고객 등록 | 고객 `getGroups`·`search`·`create` |
| `components/modals/ContactSyncModal.tsx` | 연락처 동기화 미리보기와 실행 | `contactSyncService`, 고객 `getGroups`·`getAllContacts`·`getContactsByGroup`(동적 import) |
| `components/modals/InviteCodeGeneratorModal.tsx` | 초대 코드 생성·복사·삭제 | `getCurrentInviteCode`·`generateInviteCode`·`deleteCurrentInviteCode` |
| `components/modals/ShopRegistrationModal.tsx` | 샵 등록 | 샵 `create` |
| `components/modals/StaffRegistrationModal.tsx` | 이메일로 기존 계정을 샵에 연결. import하는 곳이 없다 | `userApiService.createUser` |

---

## 3. 서버 상태 읽기와 테마 훅(`hooks/`)

| 내보내는 것 | 파일 | query key | 서비스 호출 | 요청 조건 | 쓰는 곳 |
|------------|------|-----------|------------|----------|--------|
| `useMonthlyTreatmentsQuery(shopId, year, month)`, `monthKey` | `hooks/queries/useMonthlyTreatmentsQuery.ts` | `['treatments', 'monthly', shopId, 'YYYY-MM']` | `getMonthlyTreatments` | `shopId` 있음 | `ImprovedCalendar` |
| `usePhonebookQuery({ shopId, search, page, size })` | `hooks/queries/usePhonebookQuery.ts` | `['phonebook', shopId, search, page]` | 고객 `list`(기본 100건) → `items` | `shopId` 있음 | `PhonebookManagement` |
| `useShopUsersQuery(shopId)`, `useStaffUsersQuery(shopId)`, `selectStaffUsers` | `hooks/queries/useShopUsersQuery.ts` | `['shopUsers', shopId]` | `getUsers`(실패를 그대로 던진다) | `shopId` 있음 | `BookingForm` / `StaffManagement`(`select`로 `StaffUser[]` 변환) |
| `useTreatmentMenusQuery(shopId)` | `hooks/queries/useTreatmentMenusQuery.ts` | `['treatmentMenus', shopId]` | `getAllWithDetails` | 조건 없음 | `BookingForm`, `TreatmentMenuManagement` |
| `useDashboardLoad()` | `hooks/useDashboardLoad.ts` | `['dashboard', 'today', …]`, `['treatments', 'weekly', …]` | `getTodayDetailedSummary`, `getWeeklyTreatments` | `shopId` 있음 | 홈 |
| `useColorScheme`, `useThemeColor` | `hooks/useColorScheme.ts`(웹은 `hooks/useColorScheme.web.ts`), `hooks/useThemeColor.ts` | — | — | — | 두 레이아웃, `ThemedText`·`ThemedView` |

`useDashboardLoad`는 `dashboardData`, `loading`, `refreshing`, `weeklyTreatments`, `weeklyError`, `loadWeeklyTreatments`, `onRefresh`, `onHeaderRefresh`, `retryDashboard`를 돌려준다. 캐시 설정과 다시 받는 시점은 [data-flow.md](data-flow.md) 4·5절에 있다.

---

## 4. 새로고침 신호(`contexts/`)

`contexts/DashboardContext.tsx`는 `DashboardProvider`와 `useDashboard()`를 내보낸다. 값은 `refreshTrigger`(숫자)와 `triggerRefresh()`다. Provider 밖에서 `useDashboard()`를 부르면 오류를 던진다. 탭 레이아웃(`app/(tabs)/_layout.tsx`)이 Provider로 탭 화면 전체를 감싼다. 쓰는 곳은 structure.md 6.3절에 있다.

---

## 5. HTTP 클라이언트와 캐시 설정(`src/api/`)

| 파일 | 내보내는 것 | 맡은 일 |
|------|------------|--------|
| `src/api/client.ts` | `apiClient`(default), `API_BASE_URL`, `authDebugUtils` | axios 인스턴스, 요청·응답 인터셉터, 토큰 갱신, 강제 로그아웃. 개발 모드에서는 `global.authDebug`도 등록한다 |
| `src/api/storeLoaders.ts` | `loadAuthStore`, `loadShopStore`, `importers`, `__resetStoreLoaders`(테스트 전용) | 스토어를 처음 쓸 때 동적 import하고 그 Promise를 캐시한다 |
| `src/api/queryClient.ts` | `queryClient`, `createQueryClient`, `DEFAULT_STALE_TIME`, `DEFAULT_GC_TIME`, `DEFAULT_RETRY` | 앱 전역 QueryClient. 기본값은 60초·5분·1회 |
| `src/api/queryKeys.ts` | `queryKeys`, `queryKeyPrefix` | query key 6종과 무효화 계열 5종(`dashboard`, `treatments`, `shopUsers`, `treatmentMenus`, `phonebook`) |

### 5.1 도메인 서비스(`src/api/services/`)

`src/api/services/base.ts`의 `BaseApiService`는 `get`·`post`·`put`·`patch`·`delete`·`buildQueryString`을 protected 메서드로 제공한다. 서비스 클래스 8개가 이를 상속하고 모듈 수준 인스턴스 하나를 내보낸다. 엔드포인트 기본 경로와 주요 소비자는 structure.md 8.3절에 있다.

| 파일 | 인스턴스 | 공개 메서드 | 호출하는 곳이 없는 메서드 |
|------|---------|------------|------------------------|
| `src/api/services/auth.ts` | `authApiService` | `login`, `logout`, `getMe`, `updateUser`, `changePassword`, `refreshToken` | `refreshToken`(토큰 갱신은 `src/api/client.ts`가 따로 한다) |
| `src/api/services/dashboard.ts` | `dashboardApiService` | `getSummary`, `getTodaySummary`, `getDateSummary`, `getDetailedSummary`, `getTodayDetailedSummary`, `getDateDetailedSummary`, `getMonthlyDetailedSummary`, `getMonthlyDetailedSummaryByString` | `getTodaySummary`, `getDateSummary`, `getDateDetailedSummary`, `getMonthlyDetailedSummaryByString` |
| `src/api/services/invite.ts` | `inviteApiService`(별칭 `inviteService`) | `generateInviteCode`, `getCurrentInviteCode`, `deleteCurrentInviteCode`, `signupWithInviteCode` | 없음 |
| `src/api/services/phonebook.ts` | `phonebookApiService` | `list`, `create`, `getById`, `update`, `remove`, `getGroups`, `search`, `checkDuplicate`, `getAllContacts`, `getContactsByGroup` | `getById` |
| `src/api/services/shop.ts` | `shopApiService` | `list`, `getSelected`, `select`, `create`, `update`, `getUsers`, `getCurrentShopUsers` | `update` |
| `src/api/services/staff.ts` | `userApiService` | `getShopUsers`, `createUser`, `updateUser`, `deleteUser` | `getShopUsers`, `updateUser`, `deleteUser`(`createUser`도 미참조 `StaffRegistrationModal`만 부른다) |
| `src/api/services/treatment.ts` | `treatmentApiService` | `list`, `getById`, `create`, `update`, `remove`, `getMonthlyTreatments`, `getDailyTreatments`, `getWeeklyTreatments` | `getById`, `remove`, `getDailyTreatments` |
| `src/api/services/treatmentMenu.ts` | `treatmentMenuApiService` | `list`, `create`, `update`, `remove`, `restore`, `getDetails`, `createDetail`, `updateDetail`, `removeDetail`, `getAllWithDetails` | `restore` |

- "호출하는 곳이 없는 메서드"는 테스트를 뺀 앱 코드에서 `인스턴스.메서드(` 호출과 클래스 안의 `this.메서드(` 호출을 검색한 결과다(14개, 2026-10-17).
- 서비스 파일은 요청·응답 타입(`Phonebook`, `Shop`, `StaffUser`, `TreatmentMenu` 등)도 내보낸다. 같은 이름의 타입이 `src/types/`에도 있다(structure.md 6.5절).
- `src/api/services/index.ts`는 인스턴스 7개와 `apiServices` 객체를 다시 내보내는 배럴인데 import하는 곳이 없다.

---

## 6. 클라이언트 상태(`src/stores/`)

| 파일 | 내보내는 것 | 상태 | 액션 |
|------|------------|------|------|
| `src/stores/authStore.ts` | `useAuthStore` | `user`, `isAuthenticated`, `isLoading`, `error`, `accessToken` | `login`, `logout`, `loadUser`, `setAccessToken`, `clearAuth`, `setUser`, `setLoading`, `setError` |
| `src/stores/shopStore.ts` | `useShopStore` | `selectedShop`, `loading`, `error` | `loadSelectedShop`, `selectShop`, `refreshShop`, `clearSelectedShop`, `setSelectedShop`, `setLoading`, `setError` |

토큰을 나눠 저장하는 `secureHybridStorage`는 `src/stores/authStore.ts` 안에만 있고 내보내지 않는다. 저장 키와 영속화 항목은 structure.md 10절에 있다.

---

## 7. 레거시 위치(`src/services/`)

| 파일 | 내보내는 것 | 맡은 일 |
|------|------------|--------|
| `src/services/contactSync.ts` | `contactSyncService`, 타입 `ContactSyncResult`·`DeviceContact` | 연락처 권한 확인·요청, 기기 연락처와 그룹 읽기, 서버 등록(`syncContactsWithServer`, `performFullSync`), 마지막 동기화 시각 저장·조회. 권한 안내 `Alert`·`Linking`도 직접 부른다(structure.md 6.4절) |
| `src/services/storage/userDataService.ts` | `userDataService`, 타입 `UserData` | 예전 사용자 데이터 저장 서비스. import하는 곳이 없다 |

---

## 8. 공통 타입(`src/types/`)

화면과 훅은 `@/src/types` 하나로 가져온다(`src/types/index.ts` → `src/types/unified.ts`). `src/types/unified.ts`는 `auth`·`common`·`dashboard`·`phonebook`·`shop`·`treatment`·`user`를 모두 다시 내보내고 하위 호환 타입(`UserRole`, `Booking` 등)을 덧붙인다. 주요 타입은 `Page<T>`·`ApiResponse<T>`(common), `Treatment`·`TreatmentCreate`·`TreatmentStatus`(treatment), `Phonebook`(phonebook)이다. 중복 선언과 미참조 `src/types/models.d.ts`는 structure.md 6.5절에 있다.

---

## 9. 디자인 시스템(`src/ui/`)

| 파일 | 내보내는 것 | 쓰는 곳 |
|------|------------|--------|
| `src/ui/theme.ts` | `Colors`, `Typography`, `Spacing`, `BorderRadius`, `Shadow`, `ThemeColors`, `ButtonStyles`, `TextStyles`, `CardStyles`, `InputStyles`, `LayoutStyles`, `Animation`, `Breakpoints` | `app/`·`components/`·`hooks/`의 12개 파일 |
| `src/ui/atoms/index.ts` | `Button`, `Card`, `TextInput`, `DatePicker`와 props 타입 | 9개 파일 |
| `src/ui/DatePicker.tsx` | `CustomDatePicker`(default) | atoms 배럴을 거쳐 `DatePicker`로 쓴다 |
| `src/ui/index.ts` | `BaseButton`, `BaseInput`, `BaseModal`, `src/ui/types.ts`의 props 타입 | 없음. `BaseButton`은 테스트에서만 쓴다 |

---

## 10. 유틸리티(`src/utils/`)

| 파일 | 내보내는 것 | 쓰는 곳 |
|------|------------|--------|
| `src/utils/authDebug.ts` | `authDebugUtils` | `app/index.tsx`가 개발 모드에서만 동적 import |
| `src/utils/bookingFormat.ts` | `toBookingRow`, `findFirstAvailableSlotAfter`, 타입 `BookingRow` | `BookingListScreen`, `BookingForm` |
| `src/utils/bookingPayload.ts` | `buildTreatmentPayload`, `persistLastStaff`, `loadLastStaffUserId`, `resolveRestoredStaff`, `LAST_STAFF_USER_ID_KEY` | `BookingForm` |
| `src/utils/calendarUtils.ts` | `buildBookingCountMap`, `generateCalendarDates` | `ImprovedCalendar` |
| `src/utils/contrast.ts` | `contrastRatio`, `meetsAA`, `relativeLuminance`, `hexToRgb` | 테스트 |
| `src/utils/dateUtils.ts` | `formatKoreanDate`, `formatKoreanDateTime`, `formatKoreanDateShort`, `formatTodayKorean` | 4개 파일 |
| `src/utils/intlFormat.ts` | `formatKrwNumber`, `formatTimeHm`, `formatKoreanShortDate`, `formatKoreanYearMonth`, `formatKoreanMonthDayWeekday`, `formatKoreanFullDate` | 5개 파일 |
| `src/utils/phoneFormat.ts` | `formatPhoneNumber`, `unformatPhoneNumber`, `isValidKoreanPhoneNumber`, `handlePhoneInputChange`, `detectInputType`, `extractNameAndPhone` | 6개 파일 |

---

## 11. 테스트와 스크립트

- 테스트 24개는 모두 `__tests__/`에 있다. 대상별 목록은 structure.md 13절, 실행 결과는 tech.md 5절에 있다.
- `scripts/`의 두 스크립트와 npm 스크립트는 [entry-points.md](entry-points.md) 6절에 있다.
