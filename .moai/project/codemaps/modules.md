# KMC Beauty Native — 모듈 코드맵

> 기준: feature/refactor-hardening-2026-07 | 최종 업데이트: 2026-07-06

---

## app/ — 라우팅 및 화면 진입

**책임**: expo-router 파일 기반 라우팅. 각 파일이 화면 단위이며 UI 로직은 components/로 위임한다.

**공개 인터페이스**: 파일 경로 = URL 경로 (expo-router 규칙)

| 파일 | 경로 | 역할 |
|------|------|------|
| `_layout.tsx` | (루트) | 폰트 로딩 → StoreInitializer → 테마 → Stack 마운트 |
| `index.tsx` | `/` | 스플래시 / 인증 상태 분기 |
| `login.tsx` | `/login` | 로그인 화면 |
| `shop-selection.tsx` | `/shop-selection` | 샵 선택 화면 |
| `monthly-dashboard.tsx` | `/monthly-dashboard` | 월간 대시보드 |
| `+not-found.tsx` | `*` | 404 처리 |
| `(tabs)/_layout.tsx` | (탭 그룹) | 하단 탭 레이아웃 |
| `(tabs)/index.tsx` | `/(tabs)/` | 홈 탭 |
| `(tabs)/booking.tsx` | `/(tabs)/booking` | 예약 탭 |
| `(tabs)/management.tsx` | `/(tabs)/management` | 관리 탭 |
| `(tabs)/profile.tsx` | `/(tabs)/profile` | 프로필 탭 |

---

## components/ — 기능별 UI 컴포넌트 (31 files, 8 folders)

**책임**: 화면에서 분리된 UI 로직. 각 하위 폴더가 단일 기능 도메인을 담당한다.

| 폴더 / 파일 | 책임 | 규칙 |
|------------|------|------|
| `booking/BookingListScreen.tsx` | 예약 목록 렌더링 | — |
| `calendar/ImprovedCalendar.tsx` | 날짜 캘린더 UI | — |
| `dashboard/MonthlyDashboard.tsx` | 월간 통계 대시보드 | — |
| `forms/` | 입력 화면 (LoginForm, BookingForm 등) | 직접 API 호출 금지; 핸들러는 부모로부터 수신 |
| `management/` | 전화번호부·직원·시술메뉴 관리 | — |
| `modals/` | 9개 오버레이 컴포넌트 | 모달 상태는 호출 화면이 관리 |
| `navigation/` | ShopHeader, AuthNavigator | 앱 전역 네비게이션 크롬 |
| `ui/` | 로컬 기본 UI 컴포넌트 | — |
| `HapticTab.tsx` | 햅틱 피드백 탭 | — |
| `ThemedText.tsx` / `ThemedView.tsx` | 테마 적용 기본 컴포넌트 | — |

---

## src/api/client.ts — 단일 Axios 인스턴스 (@MX:ANCHOR)

**책임**: 모든 HTTP 통신의 단일 진입점. 인증 헤더·샵 ID 주입·토큰 갱신 중앙 처리.

**공개 인터페이스**: `apiClient` (default export) — 서비스 계층만 직접 import 허용.

---

## src/api/services/ — 도메인 서비스 계층 (10 files)

**책임**: BaseApiService를 상속한 8개 도메인 클래스. 스토어 액션이 직접 호출한다.

| 파일 | 서비스 클래스 | 주요 공개 메서드 |
|------|------------|----------------|
| `base.ts` | `BaseApiService` | get, post, put, delete (추상) |
| `auth.ts` | `authApiService` | login, logout, refreshToken, getMe |
| `treatment.ts` | `treatmentApiService` | list (Promise.allSettled 페이지네이션) |
| `treatmentMenu.ts` | `treatmentMenuApiService` | CRUD |
| `dashboard.ts` | `dashboardApiService` | getMonthlyStats |
| `shop.ts` | `shopApiService` | list, create |
| `phonebook.ts` | `phonebookApiService` | sync |
| `invite.ts` | `inviteApiService` | create, join |
| `staff.ts` | `staffApiService`, `userApiService` | list, updatePrimaryOwner; getProfile |
| `index.ts` | (배럴) | 모든 서비스 re-export |

---

## src/stores/ — Zustand 전역 상태 (2 files)

**책임**: 앱 전역 상태 관리 및 로컬 영속화.

| 스토어 | 상태 | 영속화 |
|--------|------|--------|
| `authStore.ts` | user, isAuthenticated, accessToken | SecureStore (토큰) + AsyncStorage (user/isAuthenticated) |
| `shopStore.ts` | selectedShop | AsyncStorage (`shop-storage`) |

---

## src/types/ — 타입 정의 (10 files)

**책임**: 앱 전체 TypeScript 타입의 단일 소스.

**공개 인터페이스**: `@/src/types` 배럴(index.ts) → unified.ts 경유. 소비자는 배럴만 import.

공통 제네릭: `Page<T>` (페이지네이션), `ApiResponse<T>` (표준 응답 래퍼)

---

## src/ui/ — 공유 디자인 시스템

**책임**: 앱 전체 공유 원자(atoms) 및 분자(molecules) 컴포넌트.

- `atoms/`: TextInput, BaseButton, Card, Button, BaseInput
- `molecules/`: BaseModal
- `DatePicker.tsx`: react-native-ui-datepicker 래퍼
- `theme.ts`, `types.ts`: 디자인 토큰 및 타입

---

## src/utils/ — 유틸리티 (3 files)

**책임**: 순수 함수 유틸리티.

| 파일 | 역할 |
|------|------|
| `authDebug.ts` | 인증 상태 디버깅 |
| `dateUtils.ts` | 날짜 포맷 (dayjs 래퍼) |
| `phoneFormat.ts` | 전화번호 형식 변환 |

---

## hooks/ — 커스텀 훅 (3 files, 루트 위치)

**책임**: 색상 스킴 감지 및 테마 색상 접근.

| 파일 | 역할 |
|------|------|
| `useColorScheme.ts` | OS 다크/라이트 모드 감지 |
| `useColorScheme.web.ts` | 웹 환경 폴백 |
| `useThemeColor.ts` | 테마 색상 훅 |

---

## src/services/ — [레거시] 이전 진행 중 (4 files)

**책임**: 구 API 레이어 잔존 파일. `src/api/services/`로 점진적 이전 중.

| 파일 | 상태 |
|------|------|
| `api/phonebook.ts` | apiClient 직접 import (이전 대상) |
| `api/treatment-menu.ts` | apiClient 직접 import (이전 대상) |
| `storage/userDataService.ts` | 레거시 스토리지 서비스 |
| `contactSync.ts` | 연락처 동기화 로직 |

---

## contexts/ — [레거시] 미사용 (루트 위치)

`DashboardContext.tsx` 1개. 현재 미사용, 추후 제거 예정.
