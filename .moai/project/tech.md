# KMC Beauty Native — 기술 문서

> 기준: 2026-10-16 · 브랜치 `feature/refactor-hardening-2026-07` · HEAD `16ac428`
> 버전은 `package.json`의 선언 범위와 `package-lock.json`(lockfileVersion 3)의 잠금 버전을 함께 적는다. 실행 결과와 측정값은 모두 위 시점에 직접 실행해 얻었다.
> 제품 범위는 `product.md`, 디렉터리 구조와 모듈 경계는 `structure.md`를 본다.

---

## 1. 기술 스택

### 1.1 핵심 스택

| 분야 | 패키지 | 선언 범위 | 잠금 버전 | 쓰는 이유 |
|------|--------|----------|----------|----------|
| 언어 | `typescript` | `~5.9.2` | 5.9.2 | `strict` 모드로 타입 오류를 실행 전에 잡는다 |
| 앱 플랫폼 | `expo` | `54.0.8` | 54.0.8 | 네이티브 모듈, 설정 플러그인, EAS 빌드를 한 체계로 다룬다 |
| 모바일 런타임 | `react-native` | `0.81.4` | 0.81.4 | 신규 아키텍처(`newArchEnabled: true`)로 실행한다 |
| UI | `react` | `19.1.0` | 19.1.0 | `react-native@0.81.4`가 peer로 요구하는 버전(`^19.1.0`) |
| 라우팅 | `expo-router` | `~6.0.7` | 6.0.24 | 파일 경로가 곧 화면 경로다. `typedRoutes`로 경로 문자열도 타입 검사한다 |
| 탭·내비게이션 | `@react-navigation/bottom-tabs` · `native` · `elements` | `^7.3.10` · `^7.1.6` · `^2.3.8` | 7.4.7 · 7.1.17 · 2.6.4 | expo-router 탭의 바탕. 테마(`ThemeProvider`)와 탭 버튼 |
| 서버 상태 | `@tanstack/react-query` | `^5.101.2` | 5.101.2 | 읽기 캐시와 중복 요청 제거(SPEC-DATA-001) |
| 클라이언트 상태 | `zustand` | `^5.0.8` | 5.0.8 | 보일러플레이트가 적고 `persist`의 저장소를 바꿔 끼워 토큰만 SecureStore로 보낼 수 있다 |
| HTTP | `axios` | `^1.11.0` | 1.18.1 | 인터셉터 한 곳에서 인증 헤더·샵 헤더·토큰 갱신을 처리한다. npm audit 권고 대상(6.4절) |
| 보안 저장소 | `expo-secure-store` | `~15.0.7` | 15.0.8 | 액세스 토큰을 OS 보안 저장소에 둔다 |
| 일반 저장소 | `@react-native-async-storage/async-storage` | `2.2.0` | 2.2.0 | 민감하지 않은 persist 상태와 작은 설정값 |

### 1.2 기기 기능·화면 구성 모듈

| 패키지 | 잠금 버전 | 쓰는 곳 |
|--------|----------|--------|
| `expo-contacts` | 15.0.8 | `src/services/contactSync.ts`(동적 import). `app.json` 플러그인에서 권한 안내 문구를 정한다 |
| `expo-haptics` | 15.0.7 | `HapticTab`, `BookingForm`, `app/shop-selection.tsx` |
| `expo-symbols` | 1.0.7 | `components/ui/IconSymbol*.tsx`(iOS SF Symbols) |
| `@expo/vector-icons` | 15.0.2 | MaterialIcons(9개 파일) |
| `expo-blur` | 15.0.7 | iOS 탭 바 배경 |
| `react-native-ui-datepicker` | 3.1.2 | `src/ui/DatePicker.tsx`가 감싼다 |
| `react-native-safe-area-context` | 5.6.1 | 안전 영역 여백(10개 파일) |
| `expo-font` | 14.0.8 | `SpaceMono` 폰트 로딩 |
| `expo-status-bar` | 3.0.8 | 루트 레이아웃의 상태 표시줄 |

### 1.3 앱 코드가 직접 import하지 않는 의존성

`app/`·`components/`·`hooks/`·`contexts/`·`src/`를 정적으로 검색했을 때 직접 import하지 않는 선언 패키지다.

- **expo-router의 peer 의존성**: `react-native-screens`, `react-native-gesture-handler`, `react-native-reanimated`, `expo-linking`, `expo-constants`, `react-native-web`, `react-dom`, `@expo/metro-runtime`
- **설정·빌드에서 쓰는 것**: `expo-splash-screen`(`app.json` 플러그인), `expo-system-ui`(`userInterfaceStyle`을 적용하는 설정 플러그인 포함), `expo-dev-client`(development 프로필), `react-native-worklets`(`react-native-reanimated` 4의 peer)
- **쓰임을 확인하지 못한 것**: `dayjs`(`react-native-ui-datepicker`는 자체 `dayjs` 의존성을 따로 갖는다), `expo-image`, `expo-web-browser`. 정리하기 전에 depcheck 같은 도구로 다시 확인한다.

### 1.4 개발 의존성

| 분야 | 패키지 | 선언 범위 | 잠금 버전 |
|------|--------|----------|----------|
| 테스트 러너 | `jest` · `jest-expo` | `~29.7.0` · `~54.0.0` | 29.7.0 · 54.0.17 |
| 컴포넌트 테스트 | `@testing-library/react-native` · `react-test-renderer` | `^13.3.3` · `^19.1.0` | 13.3.3 · 19.1.0 |
| 타입 | `@types/jest` · `@types/react` | `^30.0.0` · `~19.1.0` | 30.0.0 · 19.1.13 |
| 린트 | `eslint` · `eslint-config-expo` | `^9.25.0` · `~10.0.0` | 9.35.0 · 10.0.0 |
| 빌드 변환 | `@babel/core` · `babel-plugin-transform-remove-console` | `^7.25.2` · `^6.9.4` | 7.29.7 · 6.9.4 |
| 빌드 변환 | `babel-plugin-transform-import-meta` · `@babel/plugin-syntax-import-meta` | `^2.3.3` · `^7.10.4` | 2.3.3 · 7.10.4 |
| 도구 | `@anthropic-ai/claude-code` | `^1.0.117` | 1.0.128 |

`typescript`와 `eslint-config-expo`는 `dependencies`와 `devDependencies` 양쪽에 같은 범위로 선언돼 있다.

---

## 2. 주요 기술 결정

| 결정 | 내용 | 근거 |
|------|------|------|
| HTTP 클라이언트 하나 | 흩어져 있던 axios 인스턴스 세 개를 `src/api/client.ts` 하나로 합쳤다. 인스턴스마다 인터셉터가 중복되거나 빠져 헤더 누락과 인증 버그가 생겼다 | SPEC-REFACTOR-001, REFACTORING_GUIDE.md |
| 서버 상태와 클라이언트 상태 분리 | 서버 데이터 캐시는 react-query, 로그인·선택한 샵은 Zustand가 맡는다. 화면을 오갈 때마다 다시 요청하던 문제를 캐시 대상 읽기 경로에서 줄였다(`structure.md` 5.2절) | SPEC-DATA-001 |
| 쓰기는 직접 호출 + 무효화 | 생성·수정·삭제는 기존처럼 서비스를 직접 부르고 성공한 뒤 관련 query 계열만 무효화한다. `useMutation`은 쓰지 않는다 | SPEC-DATA-001 |
| 토큰 저장 분리 | Zustand `persist` 저장소를 `secureHybridStorage`로 바꿨다. 액세스 토큰은 SecureStore에, 나머지는 AsyncStorage에 둔다 | SPEC-SECURITY-001 REQ-SEC-005 |
| 오프라인 캐시 미도입 | react-query persister를 쓰지 않고 메모리 캐시만 쓴다 | SPEC-DATA-001 |
| 점진적 리팩토링 | 변경 전에 특성 테스트로 현재 동작을 고정하고(DDD: ANALYZE-PRESERVE-IMPROVE) 화면 단위로 옮긴다 | SPEC-UX-001 ~ SPEC-HOME-001 |

이 문서가 인용하는 SPEC 가운데 SPEC-REFACTOR-001·SPEC-SECURITY-001·SPEC-PERF-001은 `.moai/specs/`에 문서가 없다. 내용은 REFACTORING_GUIDE.md·코드 주석·커밋 메시지에 남아 있다(`product.md` 8절).

---

## 3. 개발 환경

### 3.1 필요한 도구

| 도구 | 요구 사항 | 근거 |
|------|----------|------|
| Node.js | 20.19.4 이상 | `react-native@0.81.4`의 `engines`. `package.json`에는 `engines` 필드가 없다 |
| npm | 패키지 매니저 | `package-lock.json`(lockfileVersion 3) |
| EAS CLI | 16.18.0 이상 | `eas.json`의 `cli.version` |
| Android 로컬 빌드 | Android Studio와 Android SDK | `npm run android`(`expo run:android`) |
| iOS 로컬 빌드 | macOS와 Xcode | `npm run ios`(`expo run:ios`) |

2026-10-16 확인 환경: WSL2(Linux 6.6.87.1), Node v24.5.0, npm 11.5.1, eas-cli 16.18.1.

### 3.2 환경 변수

| 이름 | 필수 | 용도 |
|------|------|------|
| `EXPO_PUBLIC_API_BASE_URL` | 필수 | 백엔드 REST API 기본 주소. 비어 있으면 `src/api/client.ts`를 불러오는 순간 예외가 난다 |

- 코드가 읽는 환경 변수는 이것 하나다(Expo가 채우는 `EXPO_OS` 제외).
- `EXPO_PUBLIC_`로 시작하는 변수는 빌드할 때 앱 번들에 그대로 들어간다. 비밀 값은 넣지 않는다.
- 값은 루트의 `.env`에 둔다. `.env`는 git이 무시한다.
- 테스트에서는 `jest.setup.js`가 값이 비어 있을 때 테스트용 더미 주소를 채운다.

### 3.3 npm 스크립트

| 스크립트 | 실행 명령 | 용도 |
|----------|----------|------|
| `start` | `expo start` | Metro 개발 서버 |
| `android` | `expo run:android` | 네이티브 프로젝트를 만들어(prebuild) 로컬에서 빌드하고 Android에서 실행 |
| `ios` | `expo run:ios` | 같은 방식으로 iOS에서 실행(macOS 필요) |
| `web` | `expo start --web` | 웹으로 실행 |
| `emulator` | `bash scripts/run-android-emulator.sh` | WSL2에서 Windows Android 에뮬레이터로 실행(3.5절) |
| `lint` | `expo lint` | ESLint |
| `test` | `jest` | 테스트 |
| `reset-project` | `node ./scripts/reset-project.js` | Expo 템플릿 초기화 스크립트. `app/`·`components/`·`hooks/`·`scripts/` 등을 `app-example/`로 옮기거나 지운다. 이 프로젝트에서는 실행하지 않는다 |

`expo run:*`이 만드는 `android/`·`ios/` 디렉터리는 git이 무시한다. 타입 검사용 npm 스크립트는 없어서 `npx tsc --noEmit`를 직접 실행한다.

### 3.4 로컬 실행

```bash
npm install
# 루트 .env 에 EXPO_PUBLIC_API_BASE_URL 을 넣는다(값은 저장소에 기록하지 않는다)
npm start                 # expo start
npx expo start --tunnel   # 실기기를 같은 네트워크에 둘 수 없을 때
```

`development` 빌드 프로필은 `expo-dev-client`를 쓰고 WSL2 에뮬레이터 스크립트는 Expo Go(SDK 54)로 연다.

### 3.5 WSL2에서 Android 에뮬레이터 실행

`npm run emulator`(`scripts/run-android-emulator.sh`)가 다음을 차례로 한다. 자세한 설명과 수동 실행 방법은 `docs/running-on-emulator.md`에 있다.

1. Windows 쪽 Android SDK(`adb.exe`, `emulator.exe`)를 찾는다.
2. AVD `Pixel_7_API_36`을 부팅하고 부팅이 끝날 때까지 기다린다.
3. 로컬 백엔드를 에뮬레이터의 `localhost:3200`으로 쓰도록 `adb reverse tcp:3200 tcp:3200`을 건다.
4. Expo Go가 없으면 설치 방법을 안내한다.
5. 8081·8083을 피해 Metro 포트를 고르고 tunnel 모드(`npx expo start --go --tunnel`)로 띄운 뒤 Expo Go에서 앱을 연다.

WSL2의 NAT 네트워크 때문에 에뮬레이터가 WSL의 Metro에 직접 닿지 못해 tunnel 모드를 쓴다.

---

## 4. 빌드와 배포

### 4.1 EAS 빌드 프로필(`eas.json`)

| 프로필 | 배포 방식 | Android 산출물 | 그 밖의 설정 |
|--------|----------|---------------|-------------|
| `development` | `internal` | APK | `developmentClient: true`, `autoIncrement: true` |
| `preview` | `internal` | APK | `autoIncrement: true` |
| `production` | 스토어 | AAB(`buildType: app-bundle`) | `autoIncrement: true` |

- `cli.appVersionSource: remote`: 빌드 번호를 EAS 서버가 관리하고 `autoIncrement`가 빌드할 때마다 올린다.
- `submit.production`은 빈 설정이다.
- `eas.json`에는 Android 빌드 유형만 지정돼 있다. iOS 관련 값은 `app.json`의 `bundleIdentifier`와 `supportsTablet`뿐이다.

```bash
eas build --platform android --profile preview      # 내부 테스트용 APK
eas build --platform android --profile production   # 스토어 배포용 AAB
```

### 4.2 `app.json` 주요 설정

| 항목 | 값 |
|------|----|
| `name` · `slug` | `kmcbeauty-native` |
| `version` | `1.0.0` |
| `orientation` | `portrait` |
| `scheme` | `kmcbeautynative` |
| `userInterfaceStyle` | `automatic`(시스템 라이트/다크 모드를 따른다) |
| `newArchEnabled` | `true` |
| `experiments.typedRoutes` | `true` |
| iOS | `bundleIdentifier: com.antam2010.kmcbeautynative`, `supportsTablet: true` |
| Android | `package: com.antam2010.kmcbeautynative`, `edgeToEdgeEnabled: true`, 적응형 아이콘 |
| 플러그인 | `expo-router`, `expo-splash-screen`(이미지·배경색), `expo-contacts`(권한 문구 "연락처 동기화를 위해 연락처 접근 권한이 필요합니다.") |
| 웹 | `bundler: metro`, `output: static` |

### 4.3 번들 변환(`babel.config.js`)

- 프리셋은 `babel-preset-expo`다.
- 운영(`production`) 환경에서만 `transform-remove-console`을 적용하고 `exclude: ['error']`로 `console.error`는 남긴다. 운영 빌드에서 `console.log`·`console.warn` 같은 호출은 사라지지만 `console.error`는 그대로 남는다.
- 개발 환경의 동작은 바뀌지 않는다.

### 4.4 TypeScript·ESLint·Metro 설정

| 파일 | 내용 |
|------|------|
| `tsconfig.json` | `expo/tsconfig.base` 확장, `strict: true`, `jsx: react-jsx`, `esModuleInterop`, `allowSyntheticDefaultImports`, 경로 별칭 `@/*` → `./*`. `**/*.ts`·`**/*.tsx`·`.expo/types/**/*.ts`·`expo-env.d.ts`를 포함 |
| `eslint.config.js` | flat config. `eslint-config-expo/flat`을 그대로 쓰고 `dist/*`만 제외한다. 프로젝트 고유 규칙은 없다 |
| `metro.config.js` | `expo/metro-config`의 기본 설정 그대로 |

### 4.5 릴리스와 롤백

저장소에서 확인할 수 있는 것과 정해지지 않은 것을 나눠 적는다(2026-10-16 기준).

| 항목 | 현재 상태 |
|------|----------|
| 빌드 | EAS 빌드 프로필 3개(4.1절). 빌드 번호는 EAS 서버가 관리하고 `autoIncrement`가 빌드할 때마다 올린다 |
| 앱 버전 | `app.json`의 `version`은 `1.0.0`이다. 이 값을 올리는 규칙은 정해져 있지 않다 |
| 스토어 제출 | `eas.json`의 `submit.production`이 빈 설정이고 제출 절차를 적은 문서도 없다 |
| OTA 업데이트 | 쓰지 않는다. `expo-updates`가 의존성에 없고 `app.json`에 `updates`·`runtimeVersion` 설정도 없다. 그래서 JS 코드를 고쳐도 새 빌드를 배포해야 반영된다 |
| 릴리스 기록 | git 태그가 없고 `CHANGELOG` 파일도 없다 |
| 롤백 | 정의된 절차가 없다 |

릴리스·롤백 절차는 `product.md` 로드맵 18번 후보로 남겨 두었다.

---

## 5. 테스트와 검증

### 5.1 검증 명령

| 명령 | 하는 일 | 비고 |
|------|--------|------|
| `npm test` | Jest 전체 실행 | 스냅샷을 새로 쓰지 않으려면 `npm test -- --ci` |
| `npm run lint` | `expo lint`(ESLint) | 실행할 때 `.env`를 읽는다 |
| `npx tsc --noEmit` | 타입 검사 | 전용 npm 스크립트가 없다 |

### 5.2 현재 결과(2026-10-16, HEAD `16ac428`)

| 명령 | 종료 코드 | 결과 |
|------|----------|------|
| `npm test -- --ci` | 0 | 테스트 스위트 24개 통과, 테스트 112개 통과, 스냅샷 1개 통과 |
| `npm run lint` | 1 | 오류 2건, 경고 5건 |
| `npx tsc --noEmit` | 2 | 오류 2건 |

- **린트 오류 2건**: `src/types/unified.ts` 10행·12행 `import/export`("Multiple exports of name 'ShopUserResponse'"). `./shop`과 `./user`가 같은 타입을 다시 내보내기 때문이다.
- **린트 경고 5건**: `src/api/client.ts` 198행 `import/no-named-as-default-member`(`axios.create`), `src/stores/authStore.ts` 26·47·75·78행 `@typescript-eslint/no-unused-vars`.
- **타입 오류 2건**: `components/modals/EditTreatmentModal.tsx` 123행·395행 `TS2322`. SPEC-DATA-001과 SPEC-HOME-001이 "기준선"으로 남겨 둔 오류다. 새 코드는 이 수를 늘리지 않는다.

커버리지(같은 시점, `app/`·`components/`·`hooks/`·`contexts/`·`src/`의 `.ts`/`.tsx` 전체 기준, `.d.ts` 제외). 아래 명령을 세 번 실행했더니 결과가 조금씩 달라서 범위로 적는다.

| 항목 | 비율(3회 실행 범위) |
|------|------------------|
| Statements | 26.88~27.05% (967~973/3597) |
| Branches | 23.85~23.96% (427~429/1790) |
| Functions | 26.14~26.38% (222~224/849) |
| Lines | 26.63~26.81% (919~925/3450) |

```bash
npx jest --ci --coverage --coverageReporters=text-summary \
  --collectCoverageFrom='{app,components,hooks,contexts,src}/**/*.{ts,tsx}' \
  --collectCoverageFrom='!**/*.d.ts'
```

`jest.config.js`에는 `collectCoverageFrom`이 없어서 `--coverage`만 붙이면 테스트가 불러온 파일만 집계된다. 전체 기준으로 보려면 위 명령처럼 대상을 지정한다. TRUST 5 목표치(85%)와는 차이가 크다.

### 5.3 Jest 구성

- `preset: 'jest-expo'`로 React Native 0.81·Expo 54 환경을 흉내 낸다.
- `setupFiles: ['<rootDir>/jest.setup.js']`: AsyncStorage를 공식 jest 목으로 바꾸고 `EXPO_PUBLIC_API_BASE_URL`이 비어 있으면 더미 값을 채운다.
- `moduleNameMapper`: `^@/(.*)$` → `<rootDir>/$1`.
- `transformIgnorePatterns`: React Native·Expo·React Navigation·`zustand` 등 변환이 필요한 `node_modules` 패키지를 Babel 변환 대상에 넣는다.
- `testMatch`: `<rootDir>/__tests__/**/*.test.{ts,tsx}`. 테스트 파일 배치는 `structure.md` 13절에 있다.
- 서버 상태를 쓰는 화면은 `__tests__/utils/queryTestUtils.tsx`의 QueryClient 래퍼로 감싸 테스트한다.

### 5.4 부하가 걸린 상태의 타임아웃

이번 측정 중 Jest를 `tsc`·`lint`와 동시에 돌리자 `homeScreen.characterization.test.tsx`(CT-1)와 `managementInvalidation.test.tsx`(전화번호부 삭제)가 Jest 기본 타임아웃 5초를 넘겨 실패했다. 두 파일만 따로 다시 돌리자 7개 테스트가 모두 통과했다. 전체를 단독으로 돌려도 112개가 모두 통과했다. 실패가 나면 먼저 다른 무거운 작업 없이 단독으로 다시 돌려 본다.

### 5.5 CI

테스트·린트·타입 검사를 돌리는 CI는 없다. `.github/workflows/`에는 MoAI 도구용 `label-sync.yml`만 있다. 지금은 위 세 명령을 로컬에서 직접 돌려 확인한다(CI 추가는 `product.md` 로드맵 7번).

---

## 6. 보안 구현 (SPEC-SECURITY-001)

### 6.1 토큰 보관과 갱신

- 액세스 토큰은 `secureHybridStorage`(`src/stores/authStore.ts`)가 SecureStore 키 `auth_access_token`에 저장한다. AsyncStorage `auth-storage`에는 토큰 자리를 `null`로 비운 상태만 쓴다. SecureStore는 항목 하나에 약 2KB 제한이 있어 토큰만 넣는다(코드 주석 기준).
- SecureStore를 읽거나 쓰다 실패하면 앱을 멈추지 않고 미인증 상태로 넘어간다.
- 리프레시 토큰은 서버가 HttpOnly 쿠키로 관리한다. 앱은 `POST /auth/refresh`를 `withCredentials: true`로 보낸다.
- 동시에 여러 요청이 401을 받아도 토큰 갱신은 한 번만 일어나고 나머지는 대기열(`failedQueue`)에서 새 토큰을 기다린다.

### 6.2 로그 규칙

- 개발 모드 요청 로그는 `Authorization` 값 대신 `PRESENT`/`NONE`만 찍는다. 토큰 원문이나 일부를 남기지 않는다(REQ-SEC-005).
- `invite.ts`의 `signupWithInviteCode`는 자기 로그에서 비밀번호를 `***`로 가린다.
- 운영 빌드에서는 `console.error`만 남는다(4.3절). 그래서 `console.error`에 넘기는 값에 요청 본문·토큰·비밀번호가 담기지 않아야 한다.
- **해소됨(SPEC-SECURITY-002)**: `src/api/services/base.ts`의 `get()`·`post()` 요청·성공·실패 로그와 `src/api/client.ts`의 토큰 갱신 실패 로그는 모두 `if (__DEV__)` 안에 있어 운영 빌드에서는 남지 않는다. 개발 빌드에서도 url·메시지·상태 코드·서버 오류 응답 본문만 남기고 요청 본문·헤더·토큰·요청 설정·에러 객체 전체는 넘기지 않는다. 인증 경로의 `console.error` 8곳(`app/login.tsx`, `components/forms/InviteSignupForm.tsx`, `components/forms/LoginForm.tsx`, `src/stores/authStore.ts`, `app/(tabs)/profile.tsx`)은 빌드와 관계없이 메시지와 HTTP 상태만 남긴다.
- **남은 위험**:
  - `components/forms/LoginForm.tsx:42`, `:54`는 AsyncStorage(`remembered-email`) 읽기·쓰기가 실패하면 에러 객체를 통째로 `console.error`에 넘긴다. API 에러가 아니라 요청 본문은 담기지 않지만 SPEC-SECURITY-002 범위 밖으로 남겨 두었다(spec.md §6).
  - 개발 빌드에 한해 받아들인 노출: 서버가 422 `detail[].input`으로 되돌려 준 제출값(비밀번호일 수 있다)과 url에 든 쿼리 문자열은 개발 빌드 로그에 보일 수 있다. 운영 빌드에서는 남지 않는다.

### 6.3 인증·권한 처리

- 403 응답이나 토큰 갱신 실패는 강제 로그아웃으로 이어진다. 두 스토어를 초기화하고 AsyncStorage에서 `remembered-email`과 `system-*` 키를 뺀 나머지를 지운다.
- 초대 가입(`POST /users`)과 직원 연결(`POST /shops/{id}/users`) 요청 본문에는 `role`이 없다. 역할은 서버가 정한다.
- 하드코딩된 데모 계정 로그인은 제거했고 `__tests__/loginFormDemo.test.tsx`로 다시 들어오지 않게 지킨다.
- 비밀번호 변경(`authApiService.changePassword`)은 현재 비밀번호를 묻지 않고 `GET /users/me`로 받은 `name`·`email`·`role`을 새 비밀번호와 함께 `PUT /users/me`로 보낸다. 서버가 이 요청의 `role` 값을 어떻게 다루는지는 이 저장소에서 확인할 수 없다.

### 6.4 의존성 취약점(npm audit)

| 범위 | critical | high | moderate | 합계 |
|------|---------|------|----------|------|
| 전체(`npm audit`) | 1 | 63 | 20 | 84 |
| 운영 의존성만(`npm audit --omit=dev`) | 1 | 53 | 19 | 73 |

- critical 1건은 전이 의존성 `shell-quote`(1.11.0 미만 대상 권고)다.
- high 이상으로 표시된 직접 의존성: `axios`, `expo`, `react-native`, `jest`, `jest-expo`, `@anthropic-ai/claude-code`.
- 잠금 버전 `axios` 1.18.1은 1.20.0 미만을 대상으로 한 권고 여러 건에 걸린다.
- 보고 항목 84건 중 28건은 npm이 자동 수정 가능(`fixAvailable: true`)으로 표시한다.
- 이 수치는 npm 레지스트리 권고 기준이다. 앱 번들에 실제로 들어가는지, 실행 경로에서 영향이 있는지는 항목마다 따로 확인해야 한다.
- 2026-07-07 커밋 `d3cf395`가 `npm audit fix`로 37건을 20건으로 줄였다. 그 뒤 `package-lock.json`은 바뀌지 않았으므로 늘어난 건수는 그사이 새로 공개된 권고에서 왔다. 정리 계획은 `product.md` 로드맵 2번이다.

---

## 7. 성능 구현 (SPEC-PERF-001 · SPEC-PERF-003 · SPEC-DATA-001)

### 7.1 목록과 렌더링

SPEC-PERF-003 spec.md §3 항목 1~6의 대상 파일은 `BookingListScreen`, `PhonebookManagement`, `TreatmentMenuManagement`, `ImprovedCalendar`, `app/(tabs)/index.tsx`(홈), `MonthlyDashboard` 6개다. 로케일 포맷 규칙(항목 7)은 이 파일들과 홈 주간 위젯에 적용됐다. 항목 8(스토어 셀렉터 전환)은 9개 파일, 항목 9(인라인 리터럴 정리)는 `StaffManagement`가 대상이다. 아래는 규칙별 구현과 2026-10-16 현재 상태다.

- **긴 목록 가상화**
  - 규칙: 길어질 수 있는 목록은 `FlatList`로 렌더링하고 행은 `React.memo`로 감싼다.
  - 현재 상태: `FlatList`를 쓰는 화면은 `BookingListScreen`, `PhonebookManagement`, `TreatmentMenuManagement`, `app/shop-selection.tsx`다. 행을 memo로 감싼 곳은 `BookingListScreen`(`BookingListItem`)과 `PhonebookManagement`(`ContactItem`)이다. `TreatmentMenuManagement`는 `renderItem`에 인라인 함수를 넘긴다. 직원 목록은 항목 수가 적어 `ScrollView`를 유지한다(REQ-PERF-003-09). 그 밖의 목록은 측정하지 않았다.
  - `BookingListScreen`의 `FlatList` 설정: `initialNumToRender={8}`, `maxToRenderPerBatch={8}`, `windowSize={11}`, `removeClippedSubviews={true}`. 한 번에 20건씩 받고 `onEndReached`로 다음 페이지를 이어 받는다. 상태 필터 배열은 모듈 상수(`STATUS_FILTERS`)다. 행에 보일 날짜·시간·금액 문자열은 데이터를 받을 때 한 번 만든다(`toBookingRow`).
- **렌더 경로의 로케일 포맷**
  - 규칙: 렌더할 때 `toLocale*`로 표시 문자열을 만들지 않고 `src/utils/intlFormat.ts`의 모듈 수준 캐시 `Intl` 포맷터를 쓴다. 이 포맷터의 출력이 기존 `toLocale*`와 글자 단위로 같은지는 `__tests__/perf003-format.test.ts`가 확인한다.
  - 현재 상태: SPEC-PERF-003 항목 1~6의 대상 파일 6개에는 `toLocale*` 호출이 없다(`grep` 기준). 대상 밖 UI 파일 7개에는 렌더 중에 실행되는 호출이 15곳 남아 있다. JSX 안에서 바로 부르는 곳이 12곳, 렌더 중에 부르는 보조 함수 안이 3곳이다.

| 파일 | 위치(행) |
|------|---------|
| `app/(tabs)/profile.tsx` | 156 |
| `components/forms/BookingForm.tsx` | 830, 928, 965 |
| `components/forms/SelectedTreatmentItem.tsx` | 36, 109 |
| `components/modals/EditTreatmentModal.tsx` | 638, 822, 894 |
| `components/modals/UnifiedTreatmentModal.tsx` | 70·97(보조 함수), 313, 346 |
| `components/modals/ContactSyncModal.tsx` | 400 |
| `components/modals/InviteCodeGeneratorModal.tsx` | 162(보조 함수) |

`src/utils/dateUtils.ts`의 `formatKoreanDateTime`(32행)도 `toLocaleTimeString`을 쓰지만 지금 호출하는 곳은 없다. 정리 계획은 `product.md` 로드맵 17번이다.

- **달력**: 날짜별 예약 건수는 `buildBookingCountMap`으로 만든 `Map`(`useMemo`)에서 찾는다(`ImprovedCalendar` 122행).
- **모달 마운트**
  - 규칙: 닫힌 모달은 API를 호출하지 않는다. 마운트할 때 데이터를 불러오는 모달은 조건부로 마운트한다(REQ-PERF-003-02, REQ-PERF-003-05).
  - 조건부 마운트(`{조건 && ...}`) 5곳: 홈의 월간 현황 모달(`app/(tabs)/index.tsx` 261행), 예약 수정(`app/(tabs)/booking.tsx` 398행), 시술 메뉴 관리의 메뉴·세부 항목 모달(`TreatmentMenuManagement` 400·451행), 전화번호 관리의 연락처 동기화(`PhonebookManagement` 391행).
  - 항상 마운트된 모달 8곳: `UnifiedTreatmentModal`(홈 251행, 예약 탭 382행), `ShopRegistrationModal`(`shop-selection.tsx` 150행), `InviteCodeGeneratorModal`(`StaffManagement` 175행), `CustomerRegistrationModal`·`ContactSyncModal`(`BookingForm` 1088·1104행, `EditTreatmentModal` 980·993행). React Native `Modal`은 `visible`이 거짓이면 아무것도 그리지 않는다. 이 컴포넌트들의 API 호출은 `visible`일 때만 도는 effect나 버튼 처리 안에 있다(코드 확인).

### 7.2 상태 구독

- 스토어는 필드 셀렉터(`useStore((s) => s.x)`)로 구독하고 여러 필드는 `useShallow`로 묶는다. 인자 없는 스토어 훅 호출은 없다.
- `StoreInitializer`는 액션을 `getState()`로 꺼내 구독을 만들지 않고 처음 한 번만 실행된다.

### 7.3 네트워크

- react-query 기본값: `staleTime` 60초, `gcTime` 5분, `retry` 1. 같은 key로 60초 안에 다시 마운트하면 요청하지 않는다.
- 월간·주간 예약 조회는 첫 페이지(50건)로 전체 페이지 수를 안 뒤 나머지를 `Promise.allSettled`로 동시에 받는다. 동시 요청 페이지는 `MAX_PAGES = 20`(약 1,000건)으로 제한한다. 시술 메뉴·전화번호부 전체 조회에는 이 상한이 없다.
- 홈의 오늘 요약과 주간 예약은 별개 query로 동시에 요청된다. 다만 주간 예약 조회는 서비스가 오류를 삼켜 실패해도 빈 목록이 되므로 실패가 화면에 드러나지 않는다(8절, `structure.md` 6.10절).
- 요청 인터셉터가 스토어를 동적 import하는 비용은 `storeLoaders.ts`가 첫 호출 뒤 캐시해 없앤다.

---

## 8. 접근성 구현 (SPEC-UX-001)

SPEC-UX-001의 범위는 테마·홈·예약 폼·예약 목록·달력·프로필·샵 선택·`ShopHeader`와 모든 아이콘 버튼의 라벨이다(spec.md §3). 아래 현재 상태는 2026-10-16에 코드 전체를 정적으로 탐색한 결과다. 아이콘 버튼과 글자 크기는 TypeScript 구문 트리를 훑는 임시 스크립트로 셌다.

- **대비**
  - 규칙: 글자색은 배경 대비 4.5:1 이상이다. 예약 상태 배지 5종도 같다.
  - 구현: `src/utils/contrast.ts`의 `contrastRatio`·`meetsAA`(4.5:1). `__tests__/theme.test.ts`는 테마 글자색 토큰이 흰 배경에서 4.5:1 이상인지 확인한다. `__tests__/contrast.test.ts`는 계산 함수, 글자색 값 5개, 예약 목록 배지 5색을 검사한다(43~56행). 다만 배지 색은 `BookingListScreen`의 `statusColors`를 import하지 않고 값을 복사해 쓰므로 컴포넌트 값이 바뀌어도 테스트는 함께 바뀌지 않는다.
  - 현재 상태: 알려진 저대비 값(`#9ca3af`, `#999`)을 컴포넌트가 직접 쓰는 곳은 없다(`theme.ts`의 팔레트 정의에만 있다). 상태 배지는 `BookingListScreen`이 4.83~6.32:1로 기준을 넘는다. `UnifiedTreatmentModal`은 흰 글자에 예전 밝은 색(`#667eea`·`#f093fb`·`#4facfe`·`#ff6b6b`·`#feca57`)을 그대로 써서 1.52~3.66:1이다. 상세 모달 배지를 검사하는 테스트는 없어 WCAG 상대 휘도 공식으로 직접 계산했다.
- **글자 크기**
  - 규칙: 본문 16pt 이상, 캡션·라벨 14pt 이상이다.
  - 현재 상태: 14 미만인 `fontSize` 값이 8개 파일에 26곳 있다. `ContactSyncModal` 9, `EditTreatmentModal` 6, `UnifiedTreatmentModal` 3, `MonthlyDashboard` 2, `PhonebookManagement.styles.ts` 2, `StaffRegistrationModal` 2, `TreatmentMenuManagement` 1, `ShopHeader` 1이다. 12pt인 `Typography.fontSize.xs`를 참조하는 곳은 4곳이다(`LoginForm`, `StaffManagement`, `src/ui/atoms/TextInput.tsx`, 그리고 쓰는 곳이 없는 `theme.ts`의 `TextStyles.small`).
- **터치 영역**
  - 규칙: 누를 수 있는 요소는 `minHeight: 44` 또는 `hitSlop`으로 44×44pt를 확보한다. 홈의 새 예약 버튼처럼 핵심 버튼은 `minHeight: 56`이다(SPEC-HOME-001).
  - 현재 상태: 아이콘만 있는 터치 요소 34곳은 모두 `hitSlop`이 없다. 스타일로 추정한 크기가 44 미만인 곳은 26곳(7개 파일, 24~40)이다. 나머지 8곳은 44 이상이다(`PhonebookManagement` 머리글의 뒤로 가기·동기화·추가 버튼 2벌 6개는 48, `StaffManagement` 뒤로 가기 2개는 44). 추정값은 아이콘 크기에 세로 `padding`을 더한 값과 `minHeight`·`height` 가운데 큰 값이다. 같은 파일의 `StyleSheet`와 import한 `*.styles.ts`를 모두 읽고 `Spacing` 토큰 값을 풀어 계산했다. 런타임 레이아웃은 재지 않았다. 44 미만에는 홈 머리글의 달력·새로고침 버튼과 월간 현황 모달의 닫기 버튼(각각 추정 40)도 들어간다. `hitSlop`은 `BookingForm`·`UnifiedTreatmentModal`·`BaseModal`의 다른 버튼에만 쓰였다.
- **스크린 리더**
  - 규칙: 아이콘만 있는 버튼에 `accessibilityLabel`·`accessibilityRole`을 단다. `BaseButton`은 두 prop을 노출한다. 기본값은 `accessibilityRole`이 `button`, `accessibilityLabel`이 버튼 제목이다.
  - 현재 상태: 라벨이 없는 아이콘 전용 터치 요소가 6개 파일에 31곳 있다. `PhonebookManagement` 10, `TreatmentMenuManagement` 10, `StaffManagement` 6, `MonthlyDashboard` 3, `ContactSyncModal` 1, `StaffRegistrationModal` 1(미참조 파일)이다. `TouchableOpacity`·`Pressable` 등의 자식에 아이콘 컴포넌트만 있고 `Text`와 `accessibilityLabel`이 없는 경우를 셌다. 아이콘 대신 이모지 글자를 쓴 버튼은 세지 않았다.
- **조용한 실패 금지**
  - 규칙: 데이터를 불러오지 못하면 콘솔 로그로 끝내지 않고 화면에 안내와 재시도 수단을 보여 준다(REQ-UX-007).
  - 동작하는 곳: 예약 폼의 직원 목록 실패는 "직원 목록을 불러오지 못했습니다" 안내와 재시도 버튼으로 보여 준다(`shopApiService.getUsers`가 오류를 그대로 던진다). 홈의 오늘 요약을 못 불러오면 "다시 시도" 버튼이 있는 오류 화면을 띄운다.
  - 동작하지 않는 곳: 홈의 `weeklyError` 인라인 안내와 예약 폼·시술 메뉴 관리의 메뉴 로드 실패 알림은 지금 나타날 수 없다. `getWeeklyTreatments`·`getAllWithDetails` 등 서비스 읽기 7개가 오류를 삼키고 빈 값을 돌려주기 때문이다(6개는 모든 실패, `getCurrentShopUsers`는 첫 요청 실패만 삼킨다, `structure.md` 6.10절). 기존 테스트는 서비스를 모킹하므로 이 동작을 검사하지 못한다.

정리 계획은 `product.md` 로드맵에 있다. 조용한 실패는 3번(연락처 동기화 영향은 4번), 나머지는 11번이다.

---

## 9. 개발 규약

- **언어**: 코드 주석은 한국어로 쓴다. 최근 커밋은 Conventional Commits 형식에 한국어 제목을 쓴다(예: `feat(home): SPEC-HOME-001 …`).
- **경로 별칭**: `@/`는 저장소 루트다(`@/src/api/client`, `@/components/...`).
- **파일 이름**: 컴포넌트는 PascalCase `.tsx`, 분리한 스타일은 `*.styles.ts`, 훅은 `useXxx.ts`, 서비스·유틸리티는 camelCase `.ts`. 플랫폼 전용 파일은 `.ios.tsx`·`.web.ts` 접미사를 붙인다. 테스트 파일 이름은 camelCase·PascalCase·kebab-case가 섞여 있다.
- **`@MX` 주석 태그**: 바꾸면 안 되는 계약에는 `@MX:ANCHOR`, 위험 구간에는 `@MX:WARN`을 단다. 지금 `@MX:ANCHOR`는 5곳(`client.ts` 요청 인터셉터, `queryClient.ts` 기본값, `authStore.ts`의 `secureHybridStorage`, `bookingPayload.ts`의 예약 요청 본문, `intlFormat.ts` 포맷터), `@MX:WARN`은 1곳(`client.ts` 401 토큰 갱신)이다.
- **SPEC 표기**: 코드 주석에 관련 요구사항 ID를 남긴다(예: `SPEC-DATA-001 REQ-DATA-001-08`). 테스트 이름에도 같은 ID를 쓴다.
