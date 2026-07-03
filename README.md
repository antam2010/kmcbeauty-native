# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

# KMC Beauty Native App

KMC Beauty는 뷰티 서비스 관리를 위한 React Native 모바일 애플리케이션입니다.

## 주요 기능

### 🏠 홈 대시보드
- 오늘의 예약 현황 실시간 조회
- 월간 매출 및 통계 확인
- 인기 서비스 및 직원 현황
- 빠른 액션 버튼 (새 예약, 직원 추가)

### 📅 예약 관리
- 다양한 뷰티 서비스 선택 (화장, 눈썹, 두피케어, 스킨케어)
- 날짜 및 시간 선택
- 실시간 예약 상태 확인

### 👥 직원 관리
- 직원 목록 조회 (활성/비활성 분류)
- 직원 정보 수정 및 상태 변경
- 전문분야 및 포지션 관리

### 👤 프로필
- 사용자 정보 관리
- 예약 내역 조회
- 앱 설정 및 로그아웃

## 기술 스택

- **Frontend**: React Native + Expo
- **Language**: TypeScript
- **Routing**: Expo Router (File-based routing)
- **HTTP Client**: Axios
- **UI Components**: Custom themed components
- **Icons**: SF Symbols (IconSymbol component)

## 프로젝트 구조

```
kmcbeauty-native/
├── app/                          # Expo Router 기반 페이지
│   ├── (tabs)/                  # 탭 네비게이션
│   │   ├── index.tsx            # 홈 대시보드
│   │   ├── booking.tsx          # 예약 화면
│   │   ├── management.tsx       # 관리 화면
│   │   └── profile.tsx          # 프로필 화면
│   ├── login.tsx                # 로그인 화면
│   ├── shop-selection.tsx       # 상점 선택 화면
│   ├── monthly-dashboard.tsx    # 월간 대시보드
│   └── _layout.tsx              # 루트 레이아웃
├── src/
│   ├── api/                     # API 레이어 (단일 통합 클라이언트)
│   │   ├── client.ts            # 단일 Axios 인스턴스 (인증·X-Shop-ID 인터셉터 포함)
│   │   └── services/            # 도메인별 API 서비스 (10개)
│   │       ├── auth.ts          # 인증 (로그인·로그아웃·토큰 갱신)
│   │       ├── dashboard.ts     # 대시보드 통계
│   │       ├── treatment.ts     # 시술 예약 (예약 목록·생성·수정·삭제)
│   │       ├── treatmentMenu.ts # 시술 메뉴 관리
│   │       ├── shop.ts          # 상점 관리
│   │       ├── phonebook.ts     # 전화번호부
│   │       ├── staff.ts         # 직원 관리 (링크 모델 기반)
│   │       ├── invite.ts        # 초대 코드 (신규 직원 가입)
│   │       ├── base.ts          # BaseApiService 추상 클래스
│   │       └── index.ts         # 서비스 통합 export
│   ├── services/                # 앱 레벨 서비스
│   │   ├── contactSync.ts       # 기기 연락처 동기화
│   │   ├── storage/
│   │   │   └── userDataService.ts
│   │   └── api/                 # 레거시 스텁 (2개, 점진적 제거 예정)
│   │       ├── phonebook.ts
│   │       └── treatment-menu.ts
│   ├── stores/                  # Zustand 상태 저장소
│   │   ├── authStore.ts         # 인증 상태 (SecureStore 기반 persist)
│   │   └── shopStore.ts         # 상점 선택 상태
│   ├── types/                   # TypeScript 타입 정의
│   │   ├── auth.ts
│   │   ├── common.ts
│   │   ├── dashboard.ts
│   │   ├── phonebook.ts
│   │   ├── shop.ts
│   │   ├── treatment.ts
│   │   ├── user.ts
│   │   ├── unified.ts
│   │   └── index.ts
│   ├── ui/                      # 공통 UI 컴포넌트 시스템
│   │   ├── atoms/               # BaseButton, BaseInput 등 원자 컴포넌트
│   │   ├── molecules/           # BaseModal 등 복합 컴포넌트
│   │   ├── theme.ts             # 디자인 시스템 (색상·타이포·간격)
│   │   ├── types.ts             # UI 공통 타입
│   │   └── index.ts
│   └── utils/                   # 유틸리티 함수
│       ├── authDebug.ts
│       ├── dateUtils.ts
│       └── phoneFormat.ts
└── components/                  # 화면 수준 컴포넌트 (레거시 포함)
```

## 시작하기

### 필수 요구사항
- Node.js (v16 이상)
- npm 또는 yarn
- Expo CLI

### 설치 및 실행

1. 의존성 설치
```bash
npm install
```

2. 개발 서버 시작
```bash
npm start
```

3. 앱 실행
- **웹**: `w` 키 입력
- **iOS 시뮬레이터**: `i` 키 입력
- **Android 에뮬레이터**: `a` 키 입력
- **실제 기기**: Expo Go 앱으로 QR 코드 스캔

## 환경 변수 설정

앱 실행 전 반드시 `.env` 또는 `.env.local` 파일에 다음 환경 변수를 설정해야 합니다.

```env
EXPO_PUBLIC_API_BASE_URL=https://api-kmc2.daeho3.shop
```

`EXPO_PUBLIC_API_BASE_URL`이 설정되지 않으면 `src/api/client.ts` 초기화 시 즉시 에러가 발생합니다.

## API 연동

모든 HTTP 요청은 `src/api/client.ts`의 단일 Axios 인스턴스를 통해 처리됩니다.
목업 데이터 레이어(`mockServices`)는 리팩토링 과정에서 삭제되었습니다.

### 인터셉터 동작

- **요청 인터셉터**: `authStore`에서 액세스 토큰을 읽어 `Authorization: Bearer` 헤더를 부착하고, `shopStore.getState().selectedShop`에서 상점 ID를 읽어 `X-Shop-ID` 헤더를 부착합니다.
- **응답 인터셉터**: 401 응답 시 토큰 갱신을 시도하며, 갱신 중 도착하는 병렬 요청은 `failedQueue`에 대기시킵니다. 403 응답 또는 갱신 실패 시 강제 로그아웃하고 `/login`으로 이동합니다.

### 주요 API 엔드포인트

- 기본 URL: `https://api-kmc2.daeho3.shop` (환경 변수로 관리)
- OpenAPI 문서: `https://api-kmc2.daeho3.shop/openapi.json`

## 개발 스크립트

```bash
# 개발 서버 시작
npm start

# 프로젝트 초기화 (새로 시작하고 싶을 때)
npm run reset-project

# 코드 린팅
npm run lint

# Android 앱 실행
npm run android

# iOS 앱 실행
npm run ios

# 웹 앱 실행
npm run web
```

## 주요 특징

- **반응형 디자인**: 다양한 화면 크기에 최적화
- **다크/라이트 테마**: 시스템 설정에 따른 자동 테마 변경
- **타입 안전성**: TypeScript로 완전한 타입 정의
- **컴포넌트 재사용**: ThemedView, ThemedText 등 커스텀 컴포넌트
- **효율적인 상태 관리**: React Hooks 기반 상태 관리

## 문제 해결

### 포트 충돌 시
개발 서버가 8081 포트를 사용할 수 없는 경우, 자동으로 8082 포트를 사용합니다.

### 종속성 버전 경고
React Native 버전 불일치 경고가 표시될 수 있지만, 정상적으로 작동합니다.

## 라이선스

이 프로젝트는 KMC Beauty의 소유입니다.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
## Build the App

To build the app for Android using Expo's EAS (Expo Application Services), you can use the following command:

```bash
eas build -p android --profile preview
```

### Steps to Build

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to your Expo account**:
   ```bash
   eas login
   ```

3. **Run the build command**:
   ```bash
   eas build -p android --profile preview
   ```

   This will create a build using the `preview` profile defined in your `eas.json` file.

4. **Download the build**:
   Once the build is complete, you'll receive a link to download the APK or AAB file.

### Notes
- Ensure your `eas.json` file is properly configured for the `preview` profile.
- For more details, refer to the [EAS Build documentation](https://docs.expo.dev/build/introduction/).
- Make sure your project is linked to an Expo account and has the necessary credentials set up for Android builds.