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
├── app/                    # Expo Router 기반 페이지
│   ├── (tabs)/            # 탭 네비게이션
│   │   ├── index.tsx      # 홈 화면
│   │   ├── booking.tsx    # 예약 화면
│   │   ├── management.tsx # 관리 화면
│   │   └── profile.tsx    # 프로필 화면
│   └── _layout.tsx        # 루트 레이아웃
├── components/            # 재사용 가능한 컴포넌트
├── services/             # API 서비스 및 데이터 관리
│   ├── api.ts           # Axios 설정
│   ├── index.ts         # 실제 API 서비스
│   └── mockServices.ts  # 목업 데이터 서비스
└── constants/           # 상수 및 테마 설정
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

## API 연동

현재 앱은 목업 데이터(`services/mockServices.ts`)를 사용하고 있습니다. 
실제 API와 연동하려면:

1. `services/api.ts`에서 API 기본 URL 확인
2. `services/index.ts`의 실제 API 호출 코드 활성화
3. 목업 서비스 대신 실제 서비스 임포트

### API 엔드포인트
- 기본 URL: `https://api-kmc2.daeho3.shop`
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