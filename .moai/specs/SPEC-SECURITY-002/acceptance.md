# SPEC-SECURITY-002 수용 기준

> 대상: `spec.md` v0.1.3. 모든 명령은 저장소 루트에서 적힌 그대로 실행한다. `grep`은 GNU grep 3.x 기준이며, `grep`이 별칭이나 다른 구현을 가리키는 셸에서는 `command grep`으로 실행한다.
> 코드·테스트 비교 기준 커밋은 `80b5e8a`다. `git diff`와 복사본(`git show <커밋>:<경로>`)은 모두 이 커밋을 쓰고, §2의 "지금 값"은 2026-11-09에 이 커밋에서 다시 쟀다(§4의 커버리지는 product.md에서 옮긴 값이라 다시 재지 않았다). 처음 기준은 `5731c73`이었다. 그 뒤 이 SPEC 밖의 커밋 두 개가 인증 경로 파일을 고쳤다. `a53f3b3`은 비밀번호 최소 길이를 4자에서 8자로 올렸고(`app/(tabs)/profile.tsx:56-57`, `components/forms/InviteSignupForm.tsx:84-85`), `80b5e8a`는 입력란 안내 문구를 '(4자 이상)'에서 '(8자 이상)'으로 맞췄다(`app/(tabs)/profile.tsx:254`, `components/forms/InviteSignupForm.tsx:208`). `5731c73`과 비교하면 AC-SEC-002-09 명령 6이 이 SPEC과 관계없는 이 12줄을 세므로 비교 기준을 옮겼다. 기준을 옮긴 곳은 AC-SEC-002-09 명령 6과 그 복사본 확인, AC-SEC-002-12의 `git diff`, AC-SEC-002-13의 `git diff` 세 줄과 client.ts 변경 범위 검사다. 범위 파일 두 개(`app/(tabs)/profile.tsx`, `components/forms/InviteSignupForm.tsx`)에서는 두 커밋 모두 줄을 같은 수의 줄로 바꿔 줄 수가 그대로다. `a53f3b3`은 이 SPEC 밖의 `components/modals/EditTreatmentModal.tsx`(+2/-1)와 `eas.json`(+3)도 고쳤지만 두 파일에는 이 문서가 인용한 줄이 없다. 그래서 이 문서와 spec.md·plan.md·spec-compact.md에 적힌 줄 번호는 `5731c73` 기준 그대로이며 `80b5e8a`에서도 같다.
> 이 문서는 검증 계층이다. 요구사항 문장은 spec.md §4에만 있고 여기서는 Given/When/Then으로 판정 방법만 정한다.

## 0. 한눈에 보기

| ID | 판정 대상 | 관련 요구사항 | 방식 |
|----|-----------|---------------|------|
| AC-SEC-002-01 | 운영 모드 base.ts 콘솔 호출 0건 | REQ-SEC-002-001 | jest |
| AC-SEC-002-02 | 개발 모드 base.ts `get()`·`post()` 실패 로그의 표식 없음·진단 정보 유지 | REQ-SEC-002-002, REQ-SEC-002-003 | jest |
| AC-SEC-002-03 | 개발 모드 base.ts 요청·성공 로그의 표식 없음 | REQ-SEC-002-002 | jest |
| AC-SEC-002-04 | base.ts 정적 검사 | REQ-SEC-002-002 | grep |
| AC-SEC-002-05 | base.ts가 잡은 에러를 같은 참조로 다시 던짐 | REQ-SEC-002-004 | jest |
| AC-SEC-002-06 | authStore 로그인 실패 | REQ-SEC-002-005, REQ-SEC-002-006, REQ-SEC-002-007 | jest |
| AC-SEC-002-07 | authStore 로그아웃·사용자 조회 실패 | REQ-SEC-002-005, REQ-SEC-002-006, REQ-SEC-002-007 | jest |
| AC-SEC-002-08 | 프로필 비밀번호 변경 실패 | REQ-SEC-002-005, REQ-SEC-002-006, REQ-SEC-002-007 | jest |
| AC-SEC-002-09 | 인증 경로 8곳 정적 검사와 변경 범위 | REQ-SEC-002-005, REQ-SEC-002-006, REQ-SEC-002-007, REQ-SEC-002-012 | grep, git |
| AC-SEC-002-10 | 운영 모드 토큰 갱신 실패 `console.error` 0건 | REQ-SEC-002-008 | jest |
| AC-SEC-002-11 | 개발 모드 토큰 갱신 실패 로그의 에러 객체·XHR 없음 | REQ-SEC-002-009 | jest |
| AC-SEC-002-12 | 기존 계약 유지 | REQ-SEC-002-010, REQ-SEC-002-012 | jest, grep |
| AC-SEC-002-13 | 바뀌지 않는 파일과 변경 범위 | REQ-SEC-002-010, REQ-SEC-002-011 | git |
| AC-SEC-002-14 | 전체 회귀 기준(테스트·타입·린트) | REQ-SEC-002-010, REQ-SEC-002-012 | npm, tsc |
| AC-SEC-002-15 | MX 태그 | REQ-SEC-002-013 | grep |

## 1. 판정 도구 정의

AC-SEC-002-01~11의 jest 테스트가 쓰는 규칙이다. 함수는 `__tests__/utils/consoleArgs.ts`에 두거나 각 테스트 파일 안에 둔다(plan.md §A.3 I-3).

### 1.1 표식 문자열(sentinel)

| 이름 | 값 | 넣는 곳 |
|------|----|---------|
| `PW_SENTINEL` | `PW-SENTINEL-7f3a` | 요청 본문의 비밀번호, 직렬화된 `config.data`, 서버가 되돌려 준 422 응답 본문의 `input` |
| `TOKEN_SENTINEL` | `TOKEN-SENTINEL-9c1e` | `Authorization: Bearer …`, 로그인 응답의 `access_token`, `client.defaults.headers` |
| `PII_SENTINEL` | `PII-SENTINEL-4b2d` | 요청 본문의 이메일·전화번호·초대 코드, GET 요청의 `config.params`, GET 성공 응답 본문, 인증 경로 에러의 응답 본문 |
| `XHR_SENTINEL` | `XHR-SENTINEL-1d8e` | `error.request` 안 |

### 1.2 콘솔 원시 인자

- 검사 구간 동안 `console.log`, `console.info`, `console.warn`, `console.error`, `console.debug`에 건 `jest.spyOn` 스파이가 받은 모든 호출의 모든 인자를 모은다(`args`).
- 스파이는 `mockImplementation(() => {})`로 출력을 막는다. 테스트가 끝나면 `jest.restoreAllMocks()`로 되돌린다.

### 1.3 `includesText(args, text)` — 깊은 탐색

인자마다 아래 값을 차례로 보고 하나라도 `text`를 포함하면 참이다. 한 번 방문한 객체는 다시 보지 않는다.

1. 문자열이면 그 문자열, 숫자·불리언이면 `String(value)`.
2. 객체(배열, Error, Map, Set, URLSearchParams 포함)이면 다음을 모두 본다.
   - `String(value)` 결과. URLSearchParams의 `toString()`과 Error의 이름·메시지가 여기서 잡힌다.
   - `JSON.stringify(value)`가 예외 없이 끝나면 그 결과. `AxiosError.toJSON()` 경로가 여기서 잡힌다.
   - Map·Set이면 항목의 키와 값.
   - `Reflect.ownKeys(value)`가 돌려주는 모든 키(열거 불가 키와 심볼 키 포함)의 값. getter가 예외를 던지면 그 키는 건너뛴다.
   - 이렇게 얻은 값(Map·Set 항목의 키와 값, 각 키의 값)에는 1~3을 다시 적용한다. 순회는 재귀다.
3. 함수, `null`, `undefined`는 건너뛴다.

### 1.4 `containsRef(args, target)` — 참조 탐색

인자나 그 하위 값(1.3과 같은 재귀 순회) 가운데 `target`과 같은 참조(`===`)가 있으면 참이다.

### 1.5 `hasExactValue(args, text)` — 값 일치

1.3과 같은 재귀 순회를 하되 렌더링(`String`, `JSON.stringify`)은 보지 않는다. 만난 문자열이나 숫자 가운데 `String(value) === text`인 것이 있으면 참이다. 상태 코드가 메시지 문자열(`Request failed with status code 422`) 안에만 있는 경우와 따로 남은 경우를 구별하려고 쓴다.

### 1.6 운영 모드와 개발 모드

- 개발 모드는 jest 기본값이다(`global.__DEV__ === true`, `react-native/jest/setup.js:21-27`).
- 운영 모드는 테스트 안에서 `global.__DEV__ = false`로 바꾸고 테스트가 끝나면 원래 값으로 되돌린다. jest에서는 babel-preset-expo가 `__DEV__`를 상수로 바꾸지 않으므로(운영 변환에서만 바꾼다, `babel-preset-expo/build/index.js:129-131`) 실행 중에 바꾼 값이 그대로 읽힌다.

### 1.7 에러와 응답 만들기

- 에러는 실제 `AxiosError`로 만든다: `import { AxiosError } from 'axios'`, `new AxiosError(message, code, config, request, response)`.
- `config`: `{ url, method, data: <본문 JSON 문자열 또는 폼 문자열>, headers: { Authorization: 'Bearer ' + TOKEN_SENTINEL } }`
- `response`: `{ status, statusText, data, headers: {}, config, request }`. 실제 axios처럼 `config`와 `request`를 품게 한다.
- `request`: `{ _response: XHR_SENTINEL, readyState: 4 }`
- `message`: `'Request failed with status code <status>'`. 메시지에는 표식을 넣지 않는다.

### 1.8 테스트 이름 규칙

각 기준의 jest 테스트는 `describe`나 `it` 이름에 해당 ID(`AC-SEC-002-NN`)를 넣는다. `npx jest <파일> -t "AC-SEC-002-NN"`으로 그 기준만 돌린다. 판정은 "실패 0, 통과 1개 이상"이다. 이름이 일치하는 테스트가 없어 통과가 0개면 FAIL이다.

## 2. 수용 기준

### AC-SEC-002-01 — 운영 모드에서 base.ts 콘솔 호출 0건

- 관련 요구사항: REQ-SEC-002-001
- **Given** 운영 모드(1.6)이고 다섯 콘솔 메서드에 스파이(1.2)를 걸었다. `@/src/api/client`는 가짜 클라이언트(`get`·`post`는 `jest.fn`, `defaults.headers`는 객체)로 모킹했고 `BaseApiService`를 상속한 시험용 서비스(`basePath = '/probe'`)가 있다
- **When** 아래 7가지 경우를 하나씩 실행한다
  - `post()` 성공
  - `post()` 실패 500
  - `post()` 실패 422 (`detail`은 문자열 `'field required: password'`, `errors`는 `{ password: ['too short'] }`)
  - `post()` 실패 401
  - `get()` 성공
  - `get()` 실패 500
  - `get()` 실패 401
- **Then** 7가지 모두 다섯 스파이의 호출 수 합이 0이다
- 확인: `npx jest __tests__/baseServiceLogging.test.ts -t "AC-SEC-002-01"` → 실패 0, 통과 1개 이상
- 지금 코드에서의 예상: 실패. base.ts에 `__DEV__` 가드가 없어 7가지 모두 콘솔 호출이 1건 이상이다

### AC-SEC-002-02 — 개발 모드 실패 로그: 표식 없음, 진단 정보 유지

- 관련 요구사항: REQ-SEC-002-002, REQ-SEC-002-003
- **Given** 개발 모드, 스파이, 가짜 클라이언트, 시험용 서비스(`basePath = '/probe'`)가 있다. 요청 본문은 초대 가입 형태 `{ invite_code: 'INV-' + PII_SENTINEL, name: '홍길동', email: PII_SENTINEL + '@test.local', password: PW_SENTINEL, phone_number: '010-' + PII_SENTINEL }`다. 가짜 `post`는 이 본문을 `config.data`에 JSON 문자열로 담은 AxiosError(1.7)로, 가짜 `get`은 `config`에 `data` 대신 `params: { q: PII_SENTINEL }`을 담은 AxiosError(1.7)로 거부한다
- **When** 아래 경우마다 호출하고 거부를 받는다
  - 가. `post('/users', body)`: 응답 상태 500, 422, 401. 422 응답 본문은 `{ detail: [{ loc: ['body', 'password'], msg: 'String should have at least 8 characters', type: 'string_too_short' }], errors: { password: ['too short'] } }`이며 `input` 항목은 없다
  - 나. `get('/me', { params: { q: PII_SENTINEL } })`: 응답 상태 500, 401
  - 다. 가와 나의 두 호출: 가짜 메서드가 응답 없는 `new Error('인증이 만료되었습니다. 다시 로그인해주세요.')`로 거부한다
- **Then** 모든 경우에 다음이 성립한다
  - `includesText(args, PW_SENTINEL)`, `includesText(args, TOKEN_SENTINEL)`, `includesText(args, PII_SENTINEL)`, `includesText(args, XHR_SENTINEL)`이 모두 거짓이다
  - `includesText(args, error.message)`가 참이고, 요청 경로도 담긴다(`post`는 `includesText(args, '/probe/users')`, `get`은 `includesText(args, '/probe/me')`가 참)
  - 응답이 있는 경우(가, 나)에는 `hasExactValue(args, String(status))`도 참이다
  - 422 경우에는 `includesText(args, 'String should have at least 8 characters')`와 `includesText(args, 'too short')`도 참이다
- 확인: `npx jest __tests__/baseServiceLogging.test.ts -t "AC-SEC-002-02"` → 실패 0, 통과 1개 이상
- 지금 코드에서의 예상: 실패. `post()`에서는 `requestData`(base.ts:83, :118)와 `JSON.stringify(data)`(:94)가 본문을 남기고, `get()`에서는 요청 로그(:15-20)가 호출자 `config`의 `params`를 남긴다

### AC-SEC-002-03 — 개발 모드 요청·성공 로그: 표식 없음

- 관련 요구사항: REQ-SEC-002-002
- **Given** 개발 모드와 스파이가 있다. 가짜 클라이언트의 `defaults.headers`는 `{ common: { Authorization: 'Bearer ' + TOKEN_SENTINEL } }`다. `post`는 `{ status: 200, statusText: 'OK', data: { access_token: TOKEN_SENTINEL, token_type: 'bearer' } }`로, `get`은 `{ status: 200, statusText: 'OK', data: [{ id: 1, email: PII_SENTINEL + '@test.local' }] }`로 성공한다
- **When** 다음 세 호출을 한다
  - 로그인 형태: `URLSearchParams`에 `username`(`PII_SENTINEL + '@test.local'`), `password`(`PW_SENTINEL`), `grant_type`(`'password'`)을 넣고 `post('/login', form, { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'Bearer ' + TOKEN_SENTINEL } })`
  - 가입 형태: AC-SEC-002-02의 본문으로 `post('/users', body)`
  - 조회: `get('/me', { params: { q: PII_SENTINEL }, headers: { Authorization: 'Bearer ' + TOKEN_SENTINEL } })`
- **Then** 세 호출 모두 `includesText(args, PW_SENTINEL)`, `includesText(args, TOKEN_SENTINEL)`, `includesText(args, PII_SENTINEL)`이 거짓이다
- 확인: `npx jest __tests__/baseServiceLogging.test.ts -t "AC-SEC-002-03"` → 실패 0, 통과 1개 이상
- 지금 코드에서의 예상: 실패. `post()` 요청 로그(:62-68)가 `defaults.headers`·`data`·`config`를, 성공 로그(:72-76)가 `response.data`를, `get()` 요청 로그(:15-20)가 `config`를 남긴다

### AC-SEC-002-04 — base.ts 정적 검사

- 관련 요구사항: REQ-SEC-002-002
- **Given** M2를 마친 작업 트리
- **When** 아래 명령을 하나씩 실행한다
- **Then** 각 출력이 기대값과 같다

| 명령 | 기대값 | 지금 값 |
|------|--------|---------|
| `grep -c 'requestData' src/api/services/base.ts` | `0` | `2` |
| `grep -c 'JSON.stringify(data' src/api/services/base.ts` | `0` | `1` |
| `grep -c 'defaults.headers' src/api/services/base.ts` | `0` | `1` |
| `grep -cE '\.stack\b' src/api/services/base.ts` | `0` | `1` |
| `grep -c '__DEV__' src/api/services/base.ts` | `1` 이상 | `0` |

M2와 M5에서 base.ts에 다는 주석(MX 태그 설명 포함)에는 위 판정 문자열(`requestData`, `JSON.stringify(data`, `defaults.headers`, `.stack`)을 쓰지 않는다. 이 검사는 주석과 코드를 가리지 않고 센다.

### AC-SEC-002-05 — 잡은 에러를 같은 참조로 다시 던짐

- 관련 요구사항: REQ-SEC-002-004
- **Given** 개발 모드와 운영 모드 각각에서 가짜 클라이언트와 시험용 서비스가 있다
- **When** 가짜 `post`나 `get`이 아래 에러로 거부하게 하고 호출한다

| 경우 | 에러 | 대상 |
|------|------|------|
| a | AxiosError 500 | `get`, `post` |
| b | 응답이 없는 `new Error('인증이 만료되었습니다. 다시 로그인해주세요.')` | `get`, `post` |
| c | AxiosError 422, `detail`은 문자열 `'field required: password'` | `post` |
| d | AxiosError 422, `detail`은 AC-SEC-002-02의 배열 | `post` |
| e | AxiosError 422, `detail`은 객체 `{ code: 'VALIDATION_ERROR', detail: 'invalid' }` | `post` |
| f | AxiosError 401 | `get`, `post` |
| g | Axios가 아닌 `new TypeError('Network request failed')` | `get`, `post` |

- **Then** 두 모드의 모든 경우에 `await expect(promise).rejects.toBe(error)`가 성립한다(같은 참조)
- 확인: `npx jest __tests__/baseServiceLogging.test.ts -t "AC-SEC-002-05"` → 실패 0, 통과 1개 이상
- 지금 코드에서의 예상: 실패(e 경우, 두 모드 모두). base.ts:106-107이 `TypeError: errorMessage.includes is not a function`을 던져 원래 에러를 가린다. 나머지 경우는 지금도 성립한다

### AC-SEC-002-06 — authStore 로그인 실패: 메시지·상태만, 같은 에러 다시 던짐

- 관련 요구사항: REQ-SEC-002-005, REQ-SEC-002-006, REQ-SEC-002-007
- **Given** `@/src/api/services/auth`를 모킹했다. `authApiService.login`은 `{ access_token: TOKEN_SENTINEL, token_type: 'bearer' }`로 성공하고 `getMe`는 AxiosError 500으로 거부한다. 이 에러의 `config.headers.Authorization`은 `'Bearer ' + TOKEN_SENTINEL`이고 응답 본문 `response.data`는 `{ detail: '서버 오류 ' + PII_SENTINEL }`이다. 콘솔 스파이를 걸었다
- **When** 개발 모드와 운영 모드에서 각각 `useAuthStore.getState().login(PII_SENTINEL + '@test.local', PW_SENTINEL)`을 부른다
- **Then** 두 모드 모두 다음이 성립한다
  - 반환된 프라미스가 `getMe`의 에러와 같은 참조로 거부된다(`rejects.toBe(error)`)
  - `includesText(args, TOKEN_SENTINEL)`, `includesText(args, PW_SENTINEL)`, `includesText(args, PII_SENTINEL)`, `containsRef(args, error)`, `containsRef(args, error.config)`가 모두 거짓이다
  - `console.error` 호출의 인자에서 `includesText(…, error.message)`와 `hasExactValue(…, '500')`가 참이다(운영 모드에서도 로그가 남는다)
  - 끝난 뒤 `useAuthStore.getState().error`가 `error.message`와 같고 `isLoading`이 `false`다
- 확인: `npx jest __tests__/authStoreLogging.test.ts -t "AC-SEC-002-06"` → 실패 0, 통과 1개 이상
- 지금 코드에서의 예상: 실패. authStore.ts:162가 에러 객체를 넘겨 `containsRef(args, error)`가 참이고, 에러가 품은 응답 본문 때문에 `includesText(args, PII_SENTINEL)`도 참이다

### AC-SEC-002-07 — authStore 로그아웃·사용자 조회 실패

- 관련 요구사항: REQ-SEC-002-005, REQ-SEC-002-006, REQ-SEC-002-007
- **Given** AC-SEC-002-06과 같은 모킹에 더해 `authApiService.logout`은 AxiosError 500으로 거부한다. `getMe`는 경우에 따라 AxiosError 401이나 응답 없는 `new Error('인증이 만료되었습니다. 다시 로그인해주세요.')`로 거부한다. 두 AxiosError는 Authorization에 Bearer 표식을, 응답 본문 `response.data`에 `{ detail: '서버 오류 ' + PII_SENTINEL }`을 담는다. 각 호출 전에 스토어를 `{ accessToken: TOKEN_SENTINEL, isAuthenticated: true, user: { name: '홍길동', email: 'a@b.com', role: 'OWNER' } }`로 둔다
- **When** `logout()`과 `loadUser()`를 각각 부른다(`loadUser()`는 두 에러 경우를 모두)
- **Then** 다음이 성립한다
  - `logout()`은 거부되지 않고 끝나며 끝난 뒤 `isAuthenticated`가 `false`, `accessToken`이 `null`이다
  - `loadUser()`는 거부되지 않고 끝나며 끝난 뒤 `error`가 해당 에러의 `message`와 같다
  - 모든 경우에 `includesText(args, TOKEN_SENTINEL)`, `includesText(args, PII_SENTINEL)`, `containsRef(args, error)`가 거짓이다
  - 모든 경우에 `console.error` 인자에서 `includesText(…, error.message)`가 참이고 AxiosError 경우에는 `hasExactValue(…, String(status))`도 참이다
- 확인: `npx jest __tests__/authStoreLogging.test.ts -t "AC-SEC-002-07"` → 실패 0, 통과 1개 이상
- 지금 코드에서의 예상: 실패. authStore.ts:180과 :210이 에러 객체를 넘긴다

### AC-SEC-002-08 — 비밀번호 변경 실패: 메시지·상태만, 알림 유지

- 관련 요구사항: REQ-SEC-002-005, REQ-SEC-002-006, REQ-SEC-002-007
- **Given** `profileDeadMenu.test.tsx:11-25`와 같은 방식으로 스토어, `@/src/api/services/auth`(`changePassword: jest.fn()`), `ShopHeader`, `react-native-safe-area-context`를 모킹했다. `Alert.alert`와 콘솔에 스파이를 걸었다
- **When** 프로필 화면을 그리고 '비밀번호 변경'을 누른다. 두 입력란(placeholder '새 비밀번호를 입력하세요 (8자 이상)', '새 비밀번호를 다시 입력하세요')에 `PW_SENTINEL`을 넣고 '변경'을 누른다. `changePassword`는 경우에 따라 다음 에러로 거부한다
  - 경우 a: AxiosError 422. `config.data`는 `'{"name":"홍길동","email":"a@b.com","role":"OWNER","password":"PW-SENTINEL-7f3a"}'`이고 Authorization에 Bearer 표식이 있다. 응답 본문은 서버가 제출값을 되돌려 준 형태 `{ detail: [{ loc: ['body', 'password'], msg: 'String should have at least 8 characters', type: 'string_too_short', input: PW_SENTINEL }] }`다
  - 경우 b: 응답 없는 `new Error('인증이 만료되었습니다. 다시 로그인해주세요.')`
- **Then** 다음이 성립한다
  - 경우 a: `Alert.alert`가 `('오류', '입력한 정보가 올바르지 않습니다.')`로 한 번 불린다
  - 경우 b: `Alert.alert`가 제목 `'오류'`로 불리지 않는다(인터셉터 처리로 넘기고 반환한다)
  - 두 경우 모두 `includesText(args, PW_SENTINEL)`, `includesText(args, TOKEN_SENTINEL)`, `containsRef(args, error)`가 거짓이고 `console.error` 인자에서 `includesText(…, error.message)`가 참이다. 경우 a는 `hasExactValue(…, '422')`도 참이다
- 확인: `npx jest __tests__/profilePasswordLogging.test.tsx -t "AC-SEC-002-08"` → 실패 0, 통과 1개 이상
- 지금 코드에서의 예상: 실패. profile.tsx:73이 에러 객체를 넘긴다

### AC-SEC-002-09 — 인증 경로 8곳 정적 검사

- 관련 요구사항: REQ-SEC-002-005, REQ-SEC-002-006, REQ-SEC-002-007, REQ-SEC-002-012
- **Given** M4를 마친 작업 트리
- **When** 아래 여섯 명령을 실행한다
- **Then** 각 출력이 기대값과 같다
- 주의: 8곳의 `console.error` 호출은 지금처럼 각각 한 줄에 둔다. 여러 줄로 나누면 명령 5가 그곳을 세지 못하고 명령 6이 이어지는 줄을 범위 밖 변경으로 센다. catch 변수는 catch 절 annotation(`catch (error: any)`, plan.md §B B-8)이나 로그 줄 안의 `(error as any)`로 좁힌다. 별도 줄에서 좁히면 명령 5·6에, 로그 줄 안의 `String(error)`·`axios.isAxiosError(error)`는 명령 1에 걸린다. 명령 1과 5는 주석도 세므로 주석에 콘솔 호출을 적지 않는다.

명령 1. 한 줄짜리 콘솔 호출에서 에러 객체를 넘기는 형태(맨 에러, `{ error }`·`{ err: error }`, `error.toJSON`·`error.config`·`error.request`, `error.response` 통째, `JSON.stringify(error…)`)를 찾는다.

```bash
grep -nE 'console\.(error|warn|log|info|debug)\b.*([,(][[:space:]]*error[[:space:]]*[,)]|\{[^}]*\berror\b[[:space:]]*[,}]|\berror\??\.(toJSON|config|request)\b|\berror\??\.response[[:space:]]*[,)}]|JSON\.stringify\([[:space:]]*error\b)' app/login.tsx components/forms/InviteSignupForm.tsx components/forms/LoginForm.tsx src/stores/authStore.ts 'app/(tabs)/profile.tsx'
```

- 기대: 정확히 2줄. 둘 다 `components/forms/LoginForm.tsx`이며 문구가 '저장된 이메일 로드 실패'와 '이메일 저장 실패'인 AsyncStorage 로그다(범위 밖, spec.md §6)
- 지금 값: 10줄(8곳과 위 2줄)

명령 2. 여러 줄로 나눈 호출에서 `error`나 `err: error`만 홀로 놓인 줄을 찾는다.

```bash
grep -nE '(^|:)[[:space:]]*error[[:space:]]*,?[[:space:]]*$' app/login.tsx components/forms/InviteSignupForm.tsx components/forms/LoginForm.tsx src/stores/authStore.ts 'app/(tabs)/profile.tsx'
```

- 기대: 출력 없음(exit 1)
- 지금 값: 출력 없음

명령 3. 로그 줄이 지워지거나 다른 메서드로 바뀌지 않았는지 센다.

```bash
grep -c 'console.error' app/login.tsx components/forms/InviteSignupForm.tsx components/forms/LoginForm.tsx src/stores/authStore.ts 'app/(tabs)/profile.tsx'
```

- 기대: `app/login.tsx:2`, `components/forms/InviteSignupForm.tsx:1`, `components/forms/LoginForm.tsx:3`, `src/stores/authStore.ts:3`, `app/(tabs)/profile.tsx:1`
- 지금 값: 기대와 같다

명령 4. 8곳이 `__DEV__`로 가려지지 않았는지 센다.

```bash
grep -c '__DEV__' app/login.tsx components/forms/InviteSignupForm.tsx components/forms/LoginForm.tsx src/stores/authStore.ts 'app/(tabs)/profile.tsx'
```

- 기대: `app/login.tsx:0`, `components/forms/InviteSignupForm.tsx:0`, `components/forms/LoginForm.tsx:0`, `src/stores/authStore.ts:2`, `app/(tabs)/profile.tsx:0`
- 지금 값: 기대와 같다

명령 5. 8곳의 로그 줄이 정해진 모양인지 줄 전체를 맞춰 센다. 받아들이는 모양은 아래와 같으며 plan.md §F M4와 같다.

- 호출 전체가 한 줄에 있다.
- 첫 인자는 기존 문구 그대로다(`'🔴 LoginScreen: 로그인 에러:'` 등 8개).
- 그 뒤 인자는 둘이다. 에러 메시지 `error.message`가 먼저, HTTP 상태 코드 `error.response?.status`가 다음이다.
- 줄은 `);`로 끝나고 그 뒤에는 공백만 올 수 있다.
- catch 절에 annotation이 없는 두 곳(`app/login.tsx:48`, `src/stores/authStore.ts:179`)은 catch 절에 `: any`를 붙이거나 두 인자를 `(error as any).message`와 `(error as any).response?.status`로 쓴다(plan.md §B B-8).

예: `console.error('❌ 로그인 실패:', error.message, error.response?.status);`

이 모양을 벗어난 줄은 세지 않는다. 명령은 두 인자를 `error.message`·`(error as any).message`와 `error.response?.status`·`(error as any).response?.status`로만 맞추므로, 인자를 하나라도 덧붙이거나(`error as any`, `(error as any)`, `error.response?.data` 등) 두 인자 자리에 다른 식을 쓰면(`String(error.response?.data) + error.message`, 별도 줄에서 좁힌 `e.message` 등) 그 줄은 빠진다. 그래서 이 명령은 REQ-SEC-002-005의 "만" 조항을 판정하면서, jest 테스트로 실행하지 않는 UI 4곳(`app/login.tsx:49`·`:91`, `components/forms/InviteSignupForm.tsx:122`, `components/forms/LoginForm.tsx:80`)에서 에러 객체를 덧붙이는 REQ-SEC-002-006 위반도 잡는다. 상태 코드에 기본값을 붙인 `error.response?.status ?? ''`나 `error?.message`처럼 동작이 같은 변형도 세지 않으므로 위 모양을 그대로 쓴다.

```bash
grep -hE "console\.error\('(🔴 LoginScreen: (로그인|회원가입) 에러|회원가입 에러|🔴 LoginForm: 로그인 에러|❌ 로그인 실패|로그아웃 API 호출 실패|❌ 사용자 정보 로드 실패|비밀번호 변경 실패):', (error|\(error as any\))\.message, (error|\(error as any\))\.response\?\.status\);[[:space:]]*$" app/login.tsx components/forms/InviteSignupForm.tsx components/forms/LoginForm.tsx src/stores/authStore.ts 'app/(tabs)/profile.tsx' | wc -l
```

- 기대: `8`
- 지금 값: `0`. 첫 인자(기존 문구)만으로 고른 줄은 지금도 8줄이다(파일 순서대로 2·1·1·3·1)
- 정규식에 이모지와 한글이 들어 있어 UTF-8 로케일(`LC_ALL=C.UTF-8`)에서 쟀다. `LC_ALL=C`에서도 지금 값과 아래 복사본 결과가 모두 같았다

명령 6. 다섯 파일에서 `80b5e8a` 이후 바뀐 줄 가운데 `console.error` 줄도 catch 절 줄도 아닌 줄을 센다. 0이면 Alert 문구, 다시 던지기, `setError`·`clearAuth`·`setLoading`, 화면 이동과 spec.md §5 C-8~C-10의 대상 줄이 그대로다. 그래서 이 명령은 C-8~C-10의 확인 수단도 겸한다.

```bash
git diff -U0 80b5e8a -- app/login.tsx components/forms/InviteSignupForm.tsx components/forms/LoginForm.tsx src/stores/authStore.ts 'app/(tabs)/profile.tsx' | grep -E '^[+-]' | grep -cvE '^(\+\+\+ |--- |[+-][[:space:]]*console\.error\(|[+-][[:space:]]*\}?[[:space:]]*catch[[:space:]]*\()'
```

- 기대: `0`
- 지금 값: `0`(변경 없음)

명령 5와 6은 출력된 숫자로 판정한다. 명령 6 끝의 `grep -c`는 `0`을 출력할 때 exit 1로 끝난다. 복사본(다섯 파일을 `git show 80b5e8a:<경로>`로 꺼낸 임시 저장소)에서 확인한 결과는 다음과 같다. 8곳만 고치고 두 catch 절에 annotation을 붙이거나, annotation 대신 두 로그 줄 안에서 `(error as any)`로 좁히면 명령 5는 `8`, 명령 6은 `0`이다. 여기에 인자를 하나 덧붙이면(`app/login.tsx:49`에 `error as any`, `components/forms/InviteSignupForm.tsx:122`에 `(error as any)`, `app/login.tsx:91`에 `error.response?.data`) 명령 5가 `7`이 되고, 이때 명령 1은 2줄, 명령 6은 `0` 그대로다. `app/login.tsx:91`의 메시지 인자를 `String(error.response?.data) + error.message`로 바꿔 응답 본문을 이어 붙여도 명령 5가 `7`이다. 이 경우 명령 1은 2줄, 명령 6은 `0`으로 다른 명령은 잡지 못한다. 상태 자리에 `?? ''`를 붙여도 명령 5가 `7`이다. Alert 문구를 바꾸면 명령 6이 `2`, `throw error`를 지우면 `1`, 로그 줄을 `if (__DEV__)`로 가리면 `1`, catch 변수를 별도 줄에서 좁히면 `1`(이때 명령 5도 `7`), `secureHybridStorage` 줄을 바꾸면 `2`다. 로그에서 에러 정보를 빼면 명령 5가 `7`이고, 호출을 세 줄로 나누면 명령 5가 `7`, 명령 6이 `2`다.

### AC-SEC-002-10 — 운영 모드 토큰 갱신 실패: `console.error` 0건

- 관련 요구사항: REQ-SEC-002-008
- **Given** `clientInterceptors.test.ts:27-35`처럼 `@/src/api/storeLoaders`와 `expo-router`를 모킹하고 실제 `@/src/api/client`를 불러왔다. `jest.spyOn(axios, 'post')`가 아래 에러로 거부한다. 운영 모드이며 콘솔 스파이는 모듈을 불러온 뒤에 건다
  - 경우 a: AxiosError 401. `response.data`는 `{ detail: 'Refresh token expired' }`이고 `request`에 XHR 표식이 있다
  - 경우 b: 응답 없이 `request`만 있는 AxiosError(`code: 'ERR_NETWORK'`, XHR 표식)
  - 경우 c: 응답도 요청도 없는 `new Error('refresh failed')`
- **When** `await authDebugUtils.testRefreshToken()`을 부른다. 이 함수는 `refreshAccessToken()`을 실행한다(client.ts:509-521)
- **Then** 세 경우 모두 이 호출 동안 `console.error` 호출 수가 0이다
- 확인: `npx jest __tests__/refreshLogging.test.ts -t "AC-SEC-002-10"` → 실패 0, 통과 1개 이상
- 지금 코드에서의 예상: 실패. 경우 a에서 :97·:102·:103, 경우 b에서 :97·:112, 경우 c에서 :97·:115가 실행된다

### AC-SEC-002-11 — 개발 모드 토큰 갱신 실패: 에러 객체·XHR 없음

- 관련 요구사항: REQ-SEC-002-009
- **Given** AC-SEC-002-10과 같은 준비를 개발 모드에서 한다
- **When** 같은 세 경우로 `await authDebugUtils.testRefreshToken()`을 부른다
- **Then** 세 경우 모두 다음이 성립한다
  - `containsRef(args, error)`가 거짓이다. `error.request`가 있으면 `containsRef(args, error.request)`, `error.config`가 있으면 `containsRef(args, error.config)`도 거짓이다
  - `includesText(args, XHR_SENTINEL)`이 거짓이다
  - `includesText(args, error.message)`가 참이고 경우 a에서는 `hasExactValue(args, '401')`와 `includesText(args, 'Refresh token expired')`도 참이다
- 확인: `npx jest __tests__/refreshLogging.test.ts -t "AC-SEC-002-11"` → 실패 0, 통과 1개 이상
- 지금 코드에서의 예상: 실패. :97이 에러 객체를, :112가 `error.request`를 넘긴다

### AC-SEC-002-12 — 기존 계약 유지

- 관련 요구사항: REQ-SEC-002-010, REQ-SEC-002-012
- **Given** M1~M5를 마친 작업 트리
- **When** 아래 명령을 실행한다
- **Then** 각 출력이 기대값과 같다

| 명령 | 기대값 | 지금 값 |
|------|--------|---------|
| `npx jest __tests__/clientInterceptors.test.ts __tests__/api-client.test.ts __tests__/storeLoaders.test.ts __tests__/profileDeadMenu.test.tsx __tests__/loginFormDemo.test.tsx __tests__/treatmentPagination.test.ts __tests__/store-selector.test.tsx` | `Test Suites: 7 passed, 7 total`, `Tests: 23 passed, 23 total` | 기대와 같다 |
| `git diff --name-only 80b5e8a -- __tests__/clientInterceptors.test.ts __tests__/api-client.test.ts __tests__/storeLoaders.test.ts __tests__/profileDeadMenu.test.tsx __tests__/loginFormDemo.test.tsx __tests__/treatmentPagination.test.ts __tests__/store-selector.test.tsx` | 출력 없음 | 출력 없음 |
| `grep -c '@MX:ANCHOR' src/api/client.ts src/stores/authStore.ts` | `src/api/client.ts:1`, `src/stores/authStore.ts:1` | 기대와 같다 |
| `grep -c '@MX:WARN' src/api/client.ts` | `1` | `1` |
| `grep -c 'export const authDebugUtils' src/api/client.ts` | `1` | `1` |

인자 없는 스토어 훅 호출이 없는지(SPEC-PERF-003 #8 셀렉터 구독) 확인한다. 기대: 출력 없음(exit 1). 지금 값: 출력 없음.

```bash
grep -nE 'use(Auth|Shop)Store\(\)' app/login.tsx 'app/(tabs)/profile.tsx'
```

### AC-SEC-002-13 — 바뀌지 않는 파일과 변경 범위

- 관련 요구사항: REQ-SEC-002-010, REQ-SEC-002-011
- **Given** M1~M5를 마친 작업 트리
- **When** 아래 명령을 실행한다
- **Then** 각 출력이 기대값과 같다

| 명령 | 기대값 | 지금 값 |
|------|--------|---------|
| `git diff --stat 80b5e8a -- src/api/services/auth.ts src/api/services/invite.ts babel.config.js` | 출력 없음 | 출력 없음 |
| `git diff --name-only --diff-filter=A 80b5e8a -- app components src hooks contexts`, `git ls-files --others --exclude-standard -- app components src hooks contexts` | 둘 다 출력 없음(아직 커밋하지 않은 파일을 포함해 운영 코드에 새 파일 없음) | 둘 다 출력 없음 |
| `git diff --stat 80b5e8a -- .moai/specs/SPEC-UX-001`, `git ls-files --others --exclude-standard -- .moai/specs/SPEC-UX-001` | 둘 다 출력 없음 | 둘 다 출력 없음 |
| 아래 client.ts 변경 범위 검사 | `0` | `0` |

client.ts 변경 범위 검사는 비교 기준 `80b5e8a`의 줄 번호(`5731c73`과 같다)로 각 변경 덩어리(hunk)가 `refreshAccessToken()` catch 블록(:96-119) 안에 있는지 센다. 밖에 있는 덩어리 수를 출력한다.

```bash
git diff -U0 80b5e8a -- src/api/client.ts | awk '/^@@/ { split($2,a,","); s=substr(a[1],2)+0; n=(a[2]==""?1:a[2]+0); e=(n==0?s:s+n-1); if (s<96 || e>119) bad++ } END { print bad+0 }'
```

이 검사는 catch 블록 안을 고친 경우 `0`, 블록 밖(예: :406)을 고친 경우 `1` 이상을 출력하는 것을 복사본(`git show 80b5e8a:src/api/client.ts`)으로 확인했다.

### AC-SEC-002-14 — 전체 회귀 기준

- 관련 요구사항: REQ-SEC-002-010, REQ-SEC-002-012
- **Given** M1~M5를 마친 작업 트리이고 다른 무거운 명령이 돌고 있지 않다(plan.md §B B-10)
- **When** 아래 명령을 하나씩 실행한다
- **Then** 각 출력이 기대값을 만족한다

명령 1. 전체 테스트

```bash
npx jest --silent 2>&1 | tail -n 5
```

- 기대: 실패 0. `Test Suites` 통과 28개 이상, `Tests` 통과 113개 이상, `Snapshots: 1 passed`
- 지금 값: `Test Suites: 24 passed, 24 total`, `Tests: 112 passed, 112 total`, `Snapshots: 1 passed, 1 total`

명령 2. 타입 오류 수

```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
```

- 기대: `2` 이하. 지금 값: `2`

명령 3. 타입 오류가 난 파일

```bash
npx tsc --noEmit 2>&1 | grep "error TS" | cut -d'(' -f1 | sort -u
```

- 기대: `components/modals/EditTreatmentModal.tsx` 한 줄. 지금 값: 기대와 같다

명령 4. 린트 요약

```bash
npm run lint 2>&1 | command grep -E '^✖ [0-9]+ problems?'
```

- 기대: 요약 줄의 오류가 2개 이하, 경고가 5개 이하다. 문제가 0건이면 ESLint가 요약 줄을 찍지 않아 출력 없이 exit 1로 끝나며, 이 경우도 통과다. 지금 값: `✖ 7 problems (2 errors, 5 warnings)`
- 정규식 끝의 `s?`는 문제가 1건일 때 찍히는 단수 요약(`✖ 1 problem (…)`)도 잡는다(`node_modules/eslint/lib/cli-engine/formatters/stylish.js:21-22`, `:89-121`). 0건 출력은 `npm run lint -- app/login.tsx`(출력 없음, exit 1)로, 단수 형태는 `npm run lint -- src/api/client.ts`(`✖ 1 problem (0 errors, 1 warning)`)로 확인했다

### AC-SEC-002-15 — MX 태그

- 관련 요구사항: REQ-SEC-002-013
- **Given** M5를 마친 작업 트리
- **When** 아래 명령을 실행한다
- **Then** 각 출력이 기대값을 만족한다

| 명령 | 기대값 | 지금 값 |
|------|--------|---------|
| `grep -c '@MX:ANCHOR: \[AUTO\]' src/api/services/base.ts` | `2` (`get()`, `post()`) | `0` |
| `grep -c '@MX:WARN: \[AUTO\]' src/api/services/base.ts` | `1` 이상 | `0` |
| `grep -c '@MX:REASON' src/api/services/base.ts` | `3` 이상 | `0` |
| `grep -c '@MX:SPEC: SPEC-SECURITY-002' src/api/services/base.ts` | `1` 이상 | `0` |

## 3. 경계 사례

| ID | 경우 | 기대 동작 | 확인 |
|----|------|-----------|------|
| E-1 | 응답 없는 에러(인터셉터가 바꾼 401 갱신 실패·403·SHOP_NOT_SELECTED, client.ts:341, :352, :419) | base.ts와 8곳 모두 예외 없이 메시지를 남기고 상태 자리는 빈다. base.ts는 같은 에러를 다시 던진다 | AC-SEC-002-02 다, -05 b, -07, -08 b |
| E-2 | 422 `detail`이 문자열·배열·객체 | 누락 필드 추정 분기가 예외를 일으키지 않는다 | AC-SEC-002-05 c·d·e |
| E-3 | Axios가 아닌 에러(TypeError 등) | 메시지를 남기고 같은 에러를 다시 던진다 | AC-SEC-002-05 g |
| E-4 | URLSearchParams 로그인 본문 | `String()` 렌더링과 심볼 키까지 봐도 비밀번호가 없다 | AC-SEC-002-03 |
| E-5 | 다시 던지기 동일성 | base.ts와 authStore 로그인 모두 같은 참조 | AC-SEC-002-05, -06 |
| E-6 | 서버 422의 입력값 반사(`input`) | 개발 빌드에서는 보일 수 있다(결정 D-1이 받아들인 위험). 운영 빌드에서는 base.ts 콘솔 호출이 0건이다 | AC-SEC-002-01 |
| E-7 | 에러를 객체로 감싸기(`{ error }`) | 금지. 정적 검사와 참조 탐색이 잡는다 | AC-SEC-002-06~09 |
| E-8 | 쿼리 문자열 속 개인정보 | url을 남기는 개발 빌드 로그에는 보일 수 있다(D-1의 url 허용). 운영 빌드에서는 0건이다 | AC-SEC-002-01 |
| E-9 | `getMe()`가 실제 클라이언트에서 401을 받아 인터셉터가 갱신을 시도하는 흐름 | authStore 테스트는 서비스를 모킹하므로 인터셉터를 지나지 않는다. 인터셉터 쪽은 갱신 실패 테스트와 기존 특성 테스트가 맡는다 | AC-SEC-002-10~12 |
| E-10 | 8곳이 잡은 에러가 품은 서버 응답 본문(422 `detail[].input`으로 되돌아온 제출값, 서버 오류 문구) | 8곳의 로그는 운영 빌드에도 남으므로 응답 본문을 담지 않는다. 메시지와 상태 코드만 남긴다 | AC-SEC-002-06, -07, -08 a, -09 명령 5 |

## 4. 품질 게이트 (TRUST 5)

- Tested: AC-SEC-002-01~11의 새 테스트를 TDD로 먼저 쓰고 RED 출력을 남긴다. `get()`·`post()`의 로그 분기는 AC-SEC-002-01의 7가지 경우가 모두 실행한다.
- Readable: 린트 기준선을 넘지 않는다(AC-SEC-002-14). 기존 로그 문구는 바꾸지 않는다.
- Unified: 바꾸는 파일의 기존 문체를 따른다. package.json에는 포매터 스크립트가 없어 별도 포맷 게이트는 두지 않는다.
- Secured: MASWE-0005 완화책 "Avoid Logging Sensitive Data"와 "Disable Logging in Production"을 적용한다(spec.md §8).
- Trackable: MX 태그(AC-SEC-002-15)와 커밋 규칙(plan.md §D).
- 프로젝트 전체 줄 커버리지 85%는 이 SPEC의 게이트가 아니다. 지금 값은 26.63~26.81%다(product.md 로드맵 10번).

## 5. 완료 정의

- AC-SEC-002-01~15가 모두 PASS이고 각 명령과 실제 출력이 progress.md §E.2에 있다.
- M1의 RED 출력이 GREEN 전에 기록돼 있다.
- 바뀐 파일이 spec.md §3.4의 목록과 같다.
- spec.md §5의 C-1~C-11이 깨지지 않았다(AC-SEC-002-12~14).
- 사용자 결정이 필요한 점이 남았다면 막힘 보고로 올라가 있다.

## 6. 수동 확인 (선택, 통과 조건 아님)

- Android: release 변형 빌드(`npx expo run:android --variant release`)나 EAS `preview` 프로필 APK를 설치한다. `adb logcat -c`로 버퍼를 비운 뒤 `adb logcat -s ReactNativeJS ReactNative`를 켜 둔다. 8자 이상 비밀번호와 서버가 거부할 입력(예: 존재하지 않는 초대 코드)으로 초대 가입을 시도해 4xx 실패를 낸다. 8자 미만 비밀번호는 `a53f3b3` 이후 `InviteSignupForm.tsx:84-85`가 요청을 보내기 전에 막으므로 이 확인에 쓸 수 없다.
  - 기대: 로그에 비밀번호, 초대 코드, 이메일, 전화번호가 없다. base.ts의 로그는 없고 `app/login.tsx`와 `InviteSignupForm.tsx`의 로그는 문구, 메시지, 상태 코드만 담는다. 서버가 422를 돌려준 경우에는 응답의 `detail`·`errors`(되돌아온 입력값 포함)도 로그에 없는지 본다.
- iOS(선택): Console.app에서 하위 시스템 `com.facebook.react.log`로 걸러 같은 시나리오를 확인한다.
