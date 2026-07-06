# KMC Beauty Native — 기술 문서

> 문서 기준: 리팩토링 목표 상태 (branch: feature/refactor-hardening-2026-07)
> 최종 업데이트: 2026-07-06

---

## 기술 스택 개요

| 분류 | 기술 | 버전 |
|------|------|------|
| 언어 | TypeScript | 5.9.2 (strict, `@/*` 경로 별칭) |
| UI 프레임워크 | React | 19.1.0 |
| 모바일 런타임 | React Native | 0.81.4 |
| 앱 플랫폼 | Expo SDK | 54.0.8 (newArchEnabled, typedRoutes) |
| 라우팅 | expo-router | 6.0.7 (파일 기반) |
| 탭 네비게이션 | @react-navigation/bottom-tabs | 7.3.10 |
| 전역 상태 | Zustand | 5.0.8 (persist) |
| HTTP 클라이언트 | Axios | 1.11.0 |
| 날짜 처리 | dayjs | 1.11.18 |
| 애니메이션 | react-native-reanimated | 4.1.0 |
| 보안 저장소 | expo-secure-store | 15.0.7 |
| 일반 저장소 | AsyncStorage | 2.2.0 |
| 린터 | ESLint | 9 + eslint-config-expo |
| 패키지 매니저 | npm | — |

### 주요 라이브러리 (Expo 모듈 및 서드파티)
- `expo-contacts`: 기기 연락처 읽기 (전화번호부 동기화)
- `expo-haptics`: 햅틱 피드백
- `expo-blur`: 블러 효과
- `expo-image`: 최적화 이미지 렌더링
- `react-native-ui-datepicker`: 예약 날짜 선택 (서드파티, Expo 패키지 아님)

---

## 프레임워크 선택 근거

**Expo SDK + expo-router**: 파일 기반 라우팅으로 화면 추가가 디렉터리 구조와 1:1 대응됩니다. `newArchEnabled`로 React Native 신규 아키텍처(Fabric/JSI)를 활성화하여 렌더링 성능을 확보합니다.

**Zustand**: Redux 대비 보일러플레이트가 적고 `persist` 미들웨어로 AsyncStorage / SecureStore 어댑터를 교체할 수 있습니다. `secureHybridStorage` 패턴(SPEC-SECURITY-001)으로 민감도에 따라 저장소를 분리합니다.

**Axios + 단일 client.ts**: 인터셉터 기반으로 인증 헤더·샵 ID 주입·토큰 갱신을 중앙에서 처리합니다. 이전의 삼중 클라이언트 구조를 단일 인스턴스로 통합하여 일관성을 확보했습니다.

---

## 개발 환경 요구사항

```bash
# 필수
Node.js >= 20.x (Expo SDK 54 권장 버전; 프로젝트 package.json에 engines 필드 미설정)
npm >= 10.x
Expo CLI + EAS CLI (별도 설치)
  npm install -g eas-cli

# Android 빌드 로컬 실행 시
Android Studio + SDK (API 34+)
JAVA_HOME 설정

# iOS 빌드 로컬 실행 시
macOS + Xcode 16+
CocoaPods
```

### 환경 변수

| 변수 | 용도 | 필수 |
|------|------|------|
| `EXPO_PUBLIC_API_BASE_URL` | 백엔드 REST API 베이스 URL | 필수 |

`EXPO_PUBLIC_` 접두사가 있는 변수는 빌드 시 번들에 포함됩니다. `.env` 파일은 gitignore 처리합니다.

### 로컬 개발 실행

```bash
npm install
npx expo start          # Metro 번들러 시작
npx expo start --tunnel # 물리 기기 연결 시
```

---

## 빌드 및 배포 설정

### EAS 빌드 프로파일 (eas.json)

| 프로파일 | 플랫폼 | 출력 형식 | 용도 |
|----------|--------|-----------|------|
| development | Android | APK (internal) | 개발 디버그 |
| preview | Android | APK (internal) | 내부 테스트 |
| production | Android | App Bundle (AAB) | 스토어 배포 |

`autoIncrement: true` 설정으로 빌드 시 `versionCode`가 자동 증가합니다.

### app.json 주요 설정

- **번들 ID**: `com.antam2010.kmcbeautynative` (iOS bundleIdentifier / Android package)
- **Expo 플러그인**: `expo-router`, `expo-splash-screen`, `expo-contacts`
- `newArchEnabled: true` — React Native 신규 아키텍처 활성화
- `typedRoutes: true` — expo-router 타입 안전 라우팅

### EAS 빌드 실행

```bash
# 프리뷰 APK
eas build --platform android --profile preview

# 프로덕션 AAB
eas build --platform android --profile production
```

---

## 테스트 현황

현재 프로젝트에 테스트 프레임워크가 설정되어 있지 않습니다 (87개 소스 파일, 테스트 파일 0개). 리팩토링 목표 상태로의 이전이 완료되면, 기존 동작을 고정하는 **특성 테스트(characterization tests)** 작성이 필요합니다.

---

## 소스 규모 참고

| 지표 | 수치 |
|------|------|
| 소스 파일 수 | 87 |
| 총 코드 라인 | ~20,726 LOC |
| 테스트 파일 수 | 0 |
| TypeScript 엄격 모드 | 활성화 (strict) |
