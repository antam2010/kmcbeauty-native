# KMC Beauty Native — 구조 문서

> 문서 기준: 리팩토링 목표 상태 (branch: feature/refactor-hardening-2026-07)
> 최종 업데이트: 2026-07-06

---

## 디렉터리 트리

```
kmcbeauty-native/
├── app/                        # expo-router 파일 기반 라우팅 (11 routes)
│   ├── _layout.tsx             # 루트 레이아웃 (앱 진입점 오케스트레이터)
│   ├── index.tsx               # 스플래시 / 인증 분기
│   ├── login.tsx
│   ├── shop-selection.tsx
│   ├── monthly-dashboard.tsx
│   ├── +not-found.tsx
│   └── (tabs)/
│       ├── _layout.tsx         # 하단 탭 레이아웃
│       ├── index.tsx           # 홈 탭
│       ├── booking.tsx
│       ├── management.tsx
│       └── profile.tsx
├── components/                 # 기능별 UI 컴포넌트 (31 files, 8 folders)
│   ├── HapticTab.tsx
│   ├── ThemedText.tsx
│   ├── ThemedView.tsx
│   ├── booking/
│   │   └── BookingListScreen.tsx
│   ├── calendar/
│   │   └── ImprovedCalendar.tsx
│   ├── dashboard/
│   │   └── MonthlyDashboard.tsx
│   ├── forms/
│   │   ├── BookingForm.tsx
│   │   ├── BookingForm.styles.ts
│   │   ├── LoginForm.tsx
│   │   ├── InviteSignupForm.tsx
│   │   └── SelectedTreatmentItem.tsx
│   ├── management/
│   │   ├── PhonebookManagement.tsx
│   │   ├── PhonebookManagement.styles.ts
│   │   ├── StaffManagement.tsx
│   │   └── TreatmentMenuManagement.tsx
│   ├── modals/                 # 9개 모달 컴포넌트 + 스타일
│   │   ├── StaffRegistrationModal.tsx (외 8개)
│   │   └── CustomerRegistrationModal.styles.ts
│   ├── navigation/
│   │   ├── AuthNavigator.tsx
│   │   └── ShopHeader.tsx
│   └── ui/                    # 로컬 UI 기본 컴포넌트
├── src/
│   ├── api/                   # 중앙화 API 계층 (목표 상태)
│   │   ├── client.ts          # @MX:ANCHOR — 단일 axios 인스턴스
│   │   └── services/          # 도메인별 서비스 파일 (10개, 도메인 클래스 8개)
│   │       ├── base.ts        # BaseApiService 추상 클래스
│   │       ├── index.ts       # 배럴 export
│   │       ├── auth.ts
│   │       ├── treatment.ts
│   │       ├── treatmentMenu.ts
│   │       ├── dashboard.ts
│   │       ├── shop.ts
│   │       ├── phonebook.ts
│   │       ├── invite.ts
│   │       └── staff.ts       # userApiService 포함
│   ├── stores/                # Zustand 전역 상태
│   │   ├── authStore.ts       # 인증 상태 + secureHybridStorage
│   │   └── shopStore.ts       # 선택된 샵 + 영속화
│   ├── types/                 # TypeScript 타입 정의 (10 files)
│   │   ├── unified.ts         # 중앙 재수출 허브
│   │   ├── index.ts           # 배럴 export
│   │   ├── models.d.ts        # 전역 타입 선언
│   │   ├── auth.ts
│   │   ├── common.ts          # Page<T>, ApiResponse<T>
│   │   ├── treatment.ts
│   │   ├── dashboard.ts
│   │   ├── shop.ts
│   │   ├── user.ts
│   │   └── phonebook.ts
│   ├── ui/                    # 공유 디자인 시스템
│   │   ├── atoms/             # TextInput, BaseButton, Card, Button, BaseInput
│   │   ├── molecules/         # BaseModal
│   │   ├── DatePicker.tsx     # 날짜 선택 컴포넌트 (react-native-ui-datepicker 래퍼)
│   │   ├── theme.ts
│   │   ├── types.ts
│   │   └── index.ts           # 배럴 export
│   ├── utils/                 # 유틸리티 (3 files)
│   └── services/              # [레거시] 통합 진행 중 (4 files)
│       ├── api/               # phonebook.ts, treatment-menu.ts
│       ├── storage/           # userDataService.ts
│       └── contactSync.ts
├── hooks/                     # 커스텀 훅 (3 files)
├── contexts/                  # [레거시] 미사용 (DashboardContext.tsx 1개)
├── package.json
├── app.json                   # Expo 앱 설정, EAS 플러그인
├── tsconfig.json              # strict + @/* 경로 별칭
└── .env / EXPO_PUBLIC_*       # 환경 변수 (gitignore)
```

---

## 핵심 모듈 역할과 경계

### `app/` — 라우팅 및 화면 진입

expo-router의 파일 기반 라우팅 규칙을 따릅니다. 각 파일은 화면 단위이며, UI 로직은 `components/`로 위임합니다.

**`app/_layout.tsx` 진입 순서:**
1. 폰트 로딩 (`expo-font`)
2. `StoreInitializer` 실행: `loadUser()` → `loadSelectedShop()` (비동기 hydration)
3. 테마 적용
4. `Stack` 네비게이터 마운트

인증 상태에 따라 `index.tsx`가 `/login` 또는 `/(tabs)/index`로 분기합니다.

---

### `src/api/client.ts` — API 계층의 단일 진실 소스 (@MX:ANCHOR)

모든 API 통신은 이 파일의 단일 axios 인스턴스를 통해 이루어집니다. 이전의 삼중 클라이언트 구조에서 통합된 결과물입니다.

**요청 인터셉터 계약:**
- `Authorization: Bearer {accessToken}` 자동 주입 (authStore에서 읽음)
- `X-Shop-ID: {selectedShopId}` 자동 주입 (shopStore에서 읽음)
- Shop ID 미선택 시 X-Shop-ID 헤더 없이 요청 진행 (차단 없음; 서버가 `SHOP_NOT_SELECTED` 에러를 반환하면 응답 인터셉터에서 `/shop-selection`으로 리다이렉트)

**응답 인터셉터 우선순위 (순서 중요):**
1. `SHOP_NOT_SELECTED` 에러 코드 → `/shop-selection` 리다이렉트
2. HTTP 403 → 강제 로그아웃
3. HTTP 401 → 단일 리프레시 시도 + `failedQueue` 동시 요청 재처리
   - `refreshAccessToken` 함수는 인터셉터 재귀 방지를 위해 bare axios 사용 (@MX:WARN)

**경계 규칙:**
- `src/api/services/` 이외의 코드는 axios 인스턴스를 직접 import하지 않습니다. 단, 레거시 파일 2개(`src/services/api/phonebook.ts`, `src/services/api/treatment-menu.ts`)가 현재 `apiClient`를 직접 import하며 이전 대상입니다.
- `src/services/` (레거시)의 나머지 파일은 `src/api/services/`로 점진적 이전 중입니다.

---

### `src/api/services/` — 도메인 서비스 계층

`BaseApiService` 추상 클래스를 상속한 8개의 도메인 서비스 클래스로 구성됩니다 (`base.ts` 추상 클래스와 `index.ts` 배럴 export 포함 시 파일 수 10개).

| 서비스 | 주요 메서드 / 특이사항 |
|--------|----------------------|
| `auth` | 로그인, 로그아웃, 리프레시 |
| `treatment` | 월간 조회 시 `Promise.allSettled` 병렬 페이지네이션 |
| `treatmentMenu` | 시술 메뉴 CRUD |
| `dashboard` | 월간 통계 조회 |
| `shop` | 샵 목록 조회, 샵 생성 |
| `phonebook` | 서버 전화번호부 동기화 |
| `invite` | 초대 코드 생성 / 초대 가입 |
| `staff` | 직원 목록, 주 소유자(`is_primary_owner`) 지정 변경; 역할(role)/비밀번호는 클라이언트가 공급하지 않음(SECURITY-001); `userApiService`(사용자 프로필 조회)도 이 파일에서 export |

---

### `src/stores/` — Zustand 전역 상태 경계

**`authStore`:**
- `secureHybridStorage` 어댑터 사용:
  - 액세스 토큰 → `expo-secure-store` (`auth_access_token` key)
  - `user`, `isAuthenticated` → AsyncStorage (`auth-storage` key)
- 로그아웃 시 `remembered-email` 키는 보존, 나머지는 전체 초기화
- 스토어 액션(`login`, `logout`, `loadUser`)이 `authApiService`를 직접 호출하고 응답을 상태로 저장함 (의존 방향: 스토어 → 서비스)

**`shopStore`:**
- `selectedShop` AsyncStorage 영속화 (`shop-storage` key)
- `client.ts` 인터셉터가 직접 읽어 `X-Shop-ID` 헤더 주입

**스토어 경계 규칙:**
- 스토어 액션이 도메인 서비스를 호출하고 응답을 스토어 상태로 저장합니다 (의존 방향: 스토어 → 서비스). `authStore.login()`이 `authApiService.login()`을 호출하고, `shopStore`가 `shopApiService`를 호출하는 것이 실제 패턴입니다.
- `client.ts`는 스토어를 읽기 전용으로 참조합니다 (토큰·샵 ID 헤더 주입 목적).

---

### `src/types/unified.ts` — 타입 허브

모든 공개 타입은 `unified.ts`에서 재수출됩니다. 소비자 대부분은 `unified.ts`를 재수출하는 `@/src/types` 배럴(`index.ts`)을 통해 타입을 import합니다 (`unified.ts` 직접 import 건수: 0). 일부 파일은 개별 타입 파일을 직접 import하는 경우도 있습니다.

공통 제네릭:
- `Page<T>`: 페이지네이션 응답 (`content`, `totalPages`, `number` 등)
- `ApiResponse<T>`: 표준 API 응답 래퍼

---

### `components/` — 기능 모듈 경계

각 하위 폴더는 단일 기능 도메인을 담당합니다. 도메인 간 공유 컴포넌트는 `components/ui/` 또는 `src/ui/`에 배치합니다.

- `forms/`: 입력 화면 전용. 직접 API 호출 금지, 부모로부터 핸들러 수신
- `modals/`: 오버레이 레이어. 모달 상태는 호출 화면이 관리
- `navigation/`: 앱 전역 네비게이션 크롬 (`ShopHeader`, `AuthNavigator`)

---

## 데이터 흐름

```
로그인
  └─► LoginForm → authStore.login()   // 스토어 액션이 서비스를 호출
        └─► authApiService.login()    // SecureStore에 토큰 저장 (persist)
              └─► authApiService.getMe() → 사용자 정보 저장
                    └─► /shop-selection 화면

샵 선택
  └─► shopStore.setSelectedShop()
        └─► client.ts 인터셉터 활성화  // 이후 모든 요청에 X-Shop-ID 주입

API 요청 (예: 예약 목록)
  └─► BookingListScreen
        └─► treatment.service.list()
              └─► client.ts (axios)
                    ├─ 요청 인터셉터: Authorization + X-Shop-ID 헤더 주입
                    ├─ 서버 응답
                    └─ 응답 인터셉터: 401 감지 시 토큰 갱신 → 재시도
```

---

## 레거시 현황

| 경로 | 상태 | 조치 |
|------|------|------|
| `src/services/` | 레거시, 일부 잔존 | `src/api/services/`로 이전 진행 중 |
| `contexts/` | 미사용 (프로젝트 루트 위치) | 추후 제거 예정 |
