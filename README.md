# KMC Beauty Native

뷰티샵 운영 관리를 위한 iOS / Android 모바일 앱입니다. 샵 오너·매니저·직원이 예약, 시술 메뉴, 직원, 전화번호부, 매출 현황을 하나의 앱에서 관리할 수 있습니다.

---

## 기능 도메인 (9개)

| 도메인 | 설명 |
|--------|------|
| 인증 | JWT Bearer + HttpOnly refresh cookie, 초대 코드 가입, 토큰 자동 갱신 |
| 샵 선택 | 멀티샵 지원, 선택된 샵 ID를 `X-Shop-ID` 헤더로 자동 주입 |
| 시술 예약 | 예약 생성·조회·상태 변경 (RESERVED / VISITED / CANCELLED / COMPLETED / NO_SHOW) |
| 시술 메뉴 | 시술 메뉴 CRUD, 통합 시술 모달 |
| 월간 대시보드 | 매출·직원·고객 인사이트, 병렬 페이지네이션 |
| 직원 관리 | 직원 목록·주 소유자 지정, 역할은 서버가 제어 (SECURITY-001) |
| 전화번호부 | 기기 연락처(`expo-contacts`) ↔ 서버 동기화 |
| 초대 코드 | 신규 직원 초대 링크 발급, 가입 시 샵 자동 소속 |
| 캘린더 | 월별 예약 현황 시각화, 날짜 선택 시 해당 일자 목록 표시 |

---

## 기술 스택

| 분류 | 기술 | 버전 |
|------|------|------|
| 언어 | TypeScript (strict) | 5.9.2 |
| UI 프레임워크 | React Native | 0.81.4 |
| 앱 플랫폼 | Expo SDK | 54.0.8 |
| 라우팅 | expo-router (파일 기반) | 6.0.7 |
| 전역 상태 | Zustand (persist) | 5.0.8 |
| 서버 상태 캐싱 | @tanstack/react-query | 5.x |
| HTTP 클라이언트 | Axios | 1.11.0 |
| 보안 저장소 | expo-secure-store (토큰) + AsyncStorage (일반) | 15.0.7 / 2.2.0 |
| 날짜 처리 | dayjs | 1.11.18 |
| 애니메이션 | react-native-reanimated | 4.1.0 |

---

## 구조 개요

```
kmcbeauty-native/
├── app/                    # expo-router 파일 기반 라우팅 (11 routes)
│   └── (tabs)/             # 홈·예약·관리·프로필 탭
├── components/             # 기능별 UI 컴포넌트 (booking, forms, modals, management 등)
├── hooks/
│   └── queries/            # @tanstack/react-query 커스텀 훅
│       ├── useShopUsersQuery.ts
│       ├── usePhonebookQuery.ts
│       ├── useTreatmentMenusQuery.ts
│       └── useMonthlyTreatmentsQuery.ts
└── src/
    ├── api/
    │   ├── client.ts       # 단일 Axios 인스턴스 (인증·X-Shop-ID 인터셉터)
    │   ├── queryClient.ts  # TanStack QueryClient 설정
    │   ├── queryKeys.ts    # 쿼리 키 상수
    │   └── services/       # 도메인별 서비스 클래스 8개 (auth, treatment, staff 등)
    ├── stores/             # Zustand 스토어 (authStore, shopStore)
    ├── types/              # TypeScript 타입 정의 (10 files, unified.ts 허브)
    ├── ui/                 # 공유 디자인 시스템 (atoms, molecules, theme.ts)
    └── utils/              # 유틸리티 (contrast.ts, dateUtils.ts, bookingFormat.ts 등)
```

> `src/services/` (레거시 2파일)는 `src/api/services/`로 이전 진행 중입니다.

---

## 시작하기

### 필수 요구사항

- Node.js >= 20.x
- npm >= 10.x
- Expo CLI + EAS CLI (`npm install -g eas-cli`)

### 설치 및 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정 (.env 파일 생성)
echo "EXPO_PUBLIC_API_BASE_URL=https://api-kmc2.daeho3.shop" > .env

# 3. 개발 서버 시작
npx expo start

# 물리 기기 연결 시
npx expo start --tunnel
```

`EXPO_PUBLIC_API_BASE_URL`이 없으면 `src/api/client.ts` 초기화 시 즉시 에러가 발생합니다.

### 플랫폼별 실행

| 명령 | 설명 |
|------|------|
| `npm run android` | Android 에뮬레이터 |
| `npm run ios` | iOS 시뮬레이터 (macOS 필요) |
| `npm run web` | 웹 브라우저 |

---

## 테스트

```bash
npm test
```

- 테스트 프레임워크: jest-expo (jest ~29.7, @testing-library/react-native)
- 24개 테스트 스위트 / 112개 테스트, `__tests__/` 디렉터리
- 주요 테스트 범위: API 클라이언트 인터셉터, 예약 페이로드, 쿼리 훅, 스토어 로더, WCAG 대비비

---

## 품질 및 접근성

- **WCAG AA 대비 검증**: `src/utils/contrast.ts` — 텍스트·배경 색상 대비비 계산 유틸
- **프로덕션 콘솔 스트리핑**: `babel-plugin-transform-remove-console` 적용 (빌드 시 console.* 제거)
- **TypeScript strict 모드**: `tsconfig.json` strict 활성화, `@/*` 경로 별칭
- **ESLint**: eslint-config-expo (ESLint 9)

---

## 빌드 (EAS)

```bash
# 프리뷰 APK (내부 테스트)
eas build --platform android --profile preview

# 프로덕션 AAB (스토어 배포)
eas build --platform android --profile production
```

`eas.json`에 development / preview / production 프로파일이 정의되어 있으며, `autoIncrement: true`로 versionCode가 자동 증가합니다.

---

## 최근 리팩토링 (2026-07)

2026-07 시니어 UX/성능 로드맵에 따라 다음 작업이 완료되었습니다.

- **시인성**: WCAG AA 대비비 검증 유틸 도입, 테마 색상 보정
- **렌더링 최적화**: `BookingListScreen` React.memo 적용, 불필요한 리렌더링 제거
- **서버 상태 캐싱**: `@tanstack/react-query` 도입, `hooks/queries/` 커스텀 훅 체계화
- **API 계층 단일화**: 삼중 클라이언트 → `src/api/client.ts` 단일 Axios 인스턴스로 통합
- **예약 흐름 간소화**: 홈 탭 재구성, 예약 페이로드 정규화

상세 이력은 `.moai/specs/` 및 `REFACTORING_GUIDE.md`를 참조하세요.

---

## 라이선스

이 프로젝트는 KMC Beauty의 소유입니다.
