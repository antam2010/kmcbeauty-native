---
id: SPEC-SECURITY-002
title: "운영 빌드 로그의 비밀번호·토큰·요청 본문 노출 제거"
version: "0.1.3"
status: draft
created: 2026-10-17
updated: 2026-11-09
author: antam2010
priority: P1
phase: "v1.0.0 target"
module: "src/api"
lifecycle: spec-anchored
tags: "security, logging, credentials, dev-gating, masvs-storage-2, cwe-532"
tier: M
---

# SPEC-SECURITY-002 — 운영 빌드 로그의 비밀번호·토큰·요청 본문 노출 제거

## HISTORY

- 2026-10-17 (v0.1.0): 초안. 로드맵 1번(`.moai/project/product.md` §9.1)과 2026-10-17에 받은 사용자 결정 4건(plan.md §A.2)으로 범위를 정했다. 조사 근거는 plan.md §H에 요약했다. 조사 원문(`.moai/reports/research/SPEC-SECURITY-002-research.md`, `SPEC-SECURITY-002-research-lenses.md`)은 gitignore 대상이라 로컬에만 있다.
- 2026-10-17 (v0.1.1): plan-auditor 1회차 감사(FAIL, 0.79)의 지적을 반영했다. 차단 결함 D1~D5는 수용 기준 AC-SEC-002-02·-03·-09·-13·-14를 보강해 해소했고, 선택 결함 D6~D19는 해당 문장을 그 자리에서 고쳤다. D20은 §4 첫 문단의 관례대로 두었다. 사용자 결정 D-1~D-4와 요구사항·수용 기준 번호는 바꾸지 않았다.
- 2026-10-18 (v0.1.2): plan-auditor 2회차 감사(PASS, 0.92)가 착수 승인 전에 고치라고 한 차단 결함 N2·N1을 해소했다. AC-SEC-002-09 명령 5를 로그 줄 전체 모양 판정으로 바꾸고, AC-SEC-002-06·-07·-08의 에러 응답 본문에 표식을 넣었으며, acceptance.md §3에 E-10을 더했다. 선택 결함 N3에 따라 MX 태그 조항을 REQ-SEC-002-013으로 떼어 내 AC-SEC-002-15와 연결했고, N4에 따라 REQ-SEC-002-002 1번의 예외 문장을 고쳤다. 사용자 결정 D-1~D-4와 기존 요구사항·수용 기준 번호는 바꾸지 않았다.
- 2026-11-09 (v0.1.3): plan을 확정한 뒤 이 SPEC 밖의 커밋 `a53f3b3`(비밀번호 최소 길이 4자→8자)과 `80b5e8a`(입력란 안내 문구 '(8자 이상)')가 인증 경로 파일을 고쳤다. 그래서 코드·테스트 비교 기준을 `5731c73`에서 `80b5e8a`로 옮겼다. acceptance.md의 `git diff`·복사본 기준과 AC-SEC-002-08의 입력란 문구를 고치고 "지금 값"을 `80b5e8a`에서 다시 쟀다. 두 커밋이 한 줄을 한 줄로 바꿔 줄 번호는 그대로다. 요구사항·수용 기준의 뜻과 번호, 표식, 기대값은 바꾸지 않았다.

---

## 1. 개요

운영 빌드는 `console.error`를 지우지 않는다. `babel.config.js:10`의 `transform-remove-console`이 `exclude: ['error']`로 설정돼 있기 때문이다. 그런데 API 서비스의 공통 부모 클래스인 `src/api/services/base.ts`는 `post()`가 실패할 때마다 요청 본문을 `console.error`로 남긴다(`requestData`, base.ts:83). 초대 가입이 실패하면 비밀번호·초대 코드·이메일·전화번호 원문이 Android logcat과 iOS 통합 로그에 기록된다. 422 응답이면 본문을 `JSON.stringify`해 한 번 더 남긴다(base.ts:94). `post()`를 부르는 곳은 서비스 7개에 13곳이 있어 고객 개인정보가 담긴 요청 본문도 같은 경로로 남는다.

로그인·초대 가입·비밀번호 변경 경로에는 AxiosError를 통째로 `console.error`에 넘기는 곳이 8곳 있다. 운영 빌드의 React Native 콘솔 포매터는 독립 인자로 받은 에러를 `AxiosError: <message>`로 줄여 찍으므로 지금은 메시지만 남는다. 개발 빌드, jest·Node 출력, 앞으로 붙일 수 있는 크래시 SDK에서는 `config.data`(비밀번호)와 `config.headers.Authorization`(Bearer 토큰)이 그대로 드러난다.

이 SPEC은 위 경로에서 비밀번호·토큰·요청 본문이 로그로 나가지 않게 한다. 방식은 SPEC-UX-001 REQ-UX-008이 정한 개발 빌드 전용 게이팅(`if (__DEV__)`)이다. 새 로깅 헬퍼나 logger는 만들지 않는다.

## 2. 목표

- 운영 빌드에서 `base.ts`는 콘솔을 한 번도 호출하지 않는다.
- 어떤 빌드에서도 `base.ts` 로그에 요청 본문·클라이언트 기본 헤더·요청 설정·성공 응답 본문·스택이 담기지 않는다. 개발 빌드는 요청 경로·상태 코드·메시지와 422 세부 정보를 계속 보여 준다.
- 인증 경로 8곳은 빌드와 관계없이 기존 문구 외에는 에러 메시지와 HTTP 상태 코드만 남긴다.
- 토큰 갱신 실패 로그는 개발 빌드에서만 남으며 에러 객체와 XHR 객체를 담지 않는다.
- 실패 뒤 동작(알림, 다시 던지기, 화면 이동), 로그인 요청 형식, 기존 계약 테스트는 그대로다.

## 3. 범위

줄 번호는 모두 기준 커밋 `5731c73` 기준이며 비교 기준 커밋 `80b5e8a`에서도 같다(acceptance.md 머리말).

### 3.1 `src/api/services/base.ts` 전체

| 위치 | 지금 남기는 값 | 지금 운영 빌드에 남는가 |
|------|----------------|------------------------|
| :15-20 `get()` 요청 | url, method, 시각, 호출자가 넘긴 `config` | 아니오 (`console.log`, babel이 지움) |
| :24-29 `get()` 성공 | url, status, `typeof response.data`, 시각 | 아니오 |
| :33-41 `get()` 실패 | url, method, status, statusText, 서버 응답 본문, message, 시각 | 예 |
| :45-49 `get()` 401 | url, Authorization 유무(`'있음'`/`'없음'`), 서버 응답 본문 | 예 |
| :62-68 `post()` 요청 | url, method, `this.client.defaults.headers`, 요청 본문 `data`, `config` | 아니오 |
| :72-76 `post()` 성공 | status, statusText, `response.data`(로그인이면 토큰 응답) | 아니오 |
| :80-89 `post()` 실패 | url, method, 요청 본문(`requestData`, :83), status, statusText, 서버 응답 본문, message, 스택 앞 3줄 | 예 |
| :92-110 `post()` 422 | `JSON.stringify(data)`(:94), 서버 응답 JSON(:95), `detail`(:98), `errors`(:102), 누락 필드 추정 문구(:108) | 예 |
| :113-120 `post()` 401 | url, Authorization 유무, 서버 응답 본문, 요청 본문(`requestData`, :118) | 예 (이미 재시도한 요청이 다시 401을 받은 경우만) |

### 3.2 인증 경로에서 에러를 통째로 넘기는 8곳

| # | 위치 | 경로 | 에러가 담은 민감값 | 실패 뒤 동작 (유지 대상) |
|---|------|------|--------------------|--------------------------|
| 1 | `app/login.tsx:49` | 로그인 | `config.data`: `username=…&password=…&grant_type=password` | Alert('로그인 실패', '이메일 또는 비밀번호가 올바르지 않습니다.'). 다시 던지지 않는다 |
| 2 | `app/login.tsx:91` | 초대 가입 | `config.data`: 비밀번호가 든 JSON | 다시 던진다(:92) |
| 3 | `components/forms/InviteSignupForm.tsx:122` | 초대 가입 | 2와 같음 | Alert('회원가입 실패', `error.message` 또는 기본 문구) |
| 4 | `components/forms/LoginForm.tsx:80` | 로그인 | 해당 없음 (아래 설명) | Alert('로그인 실패', `error.message` 또는 기본 문구) |
| 5 | `src/stores/authStore.ts:162` | 로그인 (토큰을 받은 뒤 `getMe()` 실패 포함) | `config.headers.Authorization`: 새 Bearer 토큰 | `setError`, 다시 던진다(:164) |
| 6 | `src/stores/authStore.ts:180` | 로그아웃 API 실패 | Bearer 토큰 | 로컬 정리(`clearAuth`, :184)는 계속한다 |
| 7 | `src/stores/authStore.ts:210` | 앱 시작 때 사용자 정보 조회 | Bearer 토큰 | `setError`(:212) |
| 8 | `app/(tabs)/profile.tsx:73` | 비밀번호 변경 | `config.data`: 새 비밀번호, Bearer 토큰 | 인증 오류 문구면 반환(:76-79), 422면 Alert('오류', '입력한 정보가 올바르지 않습니다.') |

4번은 로그인 API가 실패해도 실행되지 않는다. `LoginForm`을 쓰는 곳은 `app/login.tsx:101` 하나이며 `login.tsx:48-55`가 에러를 잡은 뒤 다시 던지지 않기 때문이다. 사용자 결정 2에 따라 범위에 넣었다.

비밀번호 변경은 `base.ts`를 거치지 않는다. `src/api/services/auth.ts:42`가 axios 인스턴스로 `PUT /users/me`를 직접 보낸다. 이 경로에서 운영 빌드에 남는 앱 로그는 8번 하나다.

### 3.3 `src/api/client.ts` 토큰 갱신 실패 로그

`refreshAccessToken()`의 catch 블록(client.ts:96-119)에 있는 다섯 줄이다. 리프레시 요청은 전역 `axios`로 보내며(client.ts:73-75) 리프레시 토큰은 HttpOnly 쿠키로 관리된다. 다섯 줄 모두 지금 운영 빌드에 남는다.

| 위치 | 지금 남기는 값 |
|------|----------------|
| :97 | 리프레시 요청의 AxiosError 통째 |
| :102 | 응답 상태 |
| :103 | 서버 응답 본문 `error.response.data` |
| :112 | XHR 객체 `error.request` |
| :115 | `error.message` |

### 3.4 변경 표시 (Delta)

- [MODIFY] `src/api/services/base.ts`: `get()`·`post()`의 진단 로그 전부
- [MODIFY] `src/api/client.ts`: `refreshAccessToken()` catch 블록의 다섯 줄만
- [MODIFY] `app/login.tsx`(:49, :91), `components/forms/InviteSignupForm.tsx`(:122), `components/forms/LoginForm.tsx`(:80), `src/stores/authStore.ts`(:162, :180, :210), `app/(tabs)/profile.tsx`(:73)
- [NEW] `__tests__/baseServiceLogging.test.ts`, `__tests__/authStoreLogging.test.ts`, `__tests__/profilePasswordLogging.test.tsx`, `__tests__/refreshLogging.test.ts`
- [NEW, 선택] `__tests__/utils/consoleArgs.ts`: 콘솔 원시 인자를 판정하는 테스트 전용 도구 (acceptance.md §1)
- [EXISTING] `src/api/services/auth.ts`, `src/api/services/invite.ts`, `babel.config.js`: 바꾸지 않는다

## 4. 요구사항 (GEARS)

요구사항 문장의 주어는 바뀌는 코드 단위다. 각 요구사항은 acceptance.md의 수용 기준으로 따로 확인한다(§9).

ID는 SPEC 린트가 읽는 형식(`REQ-[A-Z]{2,5}-NNN-NNN`, `AC-<영역>-NNN-NN`)에 맞춰 `REQ-SEC-002-NNN`과 `AC-SEC-002-NN`으로 쓴다. SPEC-SECURITY-001의 `REQ-SEC-005`와는 다른 번호 체계다.

### 4.1 `base.ts`

#### REQ-SEC-002-001 — 운영 빌드에서 base.ts 콘솔 호출 0건

- REQ-SEC-002-001: **State-driven (While)** 앱이 운영 빌드로 실행되는 동안(`__DEV__`가 `false`) `BaseApiService`의 `get()`·`post()`는 요청 전, 성공, 실패, 401, 422 어느 경로에서도 `console` 메서드를 호출하지 않아야 한다(shall not).

#### REQ-SEC-002-002 — base.ts 로그에 담지 않는 값

- REQ-SEC-002-002: **Ubiquitous (shall not)** `base.ts`는 빌드 종류와 관계없이 아래 값을 로그에 담지 않아야 한다(shall not).
  1. 요청 본문 `data`. 원본뿐 아니라 일부 필드, 이름을 바꾼 필드(`requestData` 등), `JSON.stringify` 결과도 포함한다. 서버가 `error.response.data` 안에 되돌려 준 값(422 `detail[].input` 등)은 이 항목이 아니라 REQ-SEC-002-003이 남기라고 한 값과 같은 요구사항의 비규범 참고가 허용한 서버 오류 응답 본문을 따른다.
  2. `this.client.defaults.headers`
  3. 호출자가 넘긴 요청 설정 `config`와 에러의 `error.config`
  4. `error.request`, 그리고 응답 객체 전체 `error.response`(요청 설정과 XHR 객체를 함께 품고 있다)
  5. 에러 객체 자체와, 에러 객체를 담은 객체·배열
  6. 성공 응답 본문 `response.data` (로그인이면 액세스 토큰이 들어 있다)
  7. `error.stack`
  8. Authorization 헤더 값과 그 일부

#### REQ-SEC-002-003 — 개발 빌드의 실패 진단 정보 유지

- REQ-SEC-002-003: **State-driven + Event-driven (While … When)** 개발 빌드로 실행되는 동안(`__DEV__`가 `true`) `get()`·`post()` 요청이 실패하면 `base.ts`는 요청 경로(url), HTTP 상태 코드, 에러 메시지를 로그에 남겨야 한다(shall). 응답 상태가 422이면 서버가 돌려준 `detail`과 `errors`도 남겨야 한다(shall).
- (비규범 참고) 사용자 결정 1에 따라 메서드, 상태 문구(statusText), 서버 오류 응답 본문, Authorization 유무 표시(값은 제외), 시각은 개발 빌드 로그에 남아도 된다(plan.md §A.3 I-1). 이 백엔드(FastAPI·pydantic)는 422 `detail`의 `input` 항목으로 제출값을 되돌려 줄 수 있어 개발 빌드 로그에는 비밀번호가 보일 수 있다. 결정 1이 받아들인 개발 빌드 한정 위험이며 운영 빌드에서는 REQ-SEC-002-001에 따라 드러나지 않는다.

#### REQ-SEC-002-004 — 잡은 에러를 그대로 다시 던지기

- REQ-SEC-002-004: **Ubiquitous** `get()`·`post()`는 두 빌드 모두에서 잡은 에러 객체를 같은 참조 그대로 다시 던져야 한다(shall). 응답이 없는 에러, `detail`이 문자열·배열·객체인 422 응답, Axios가 아닌 에러에도 똑같이 적용한다.
- **Ubiquitous (shall not)**: 로그를 남기는 코드가 예외를 일으켜 원래 에러를 가리지 않아야 한다(shall not).
- (비규범 참고) 지금 코드는 `detail`이 객체인 422 응답에서 `errorMessage.includes`가 `TypeError`를 던져 원래 에러를 가린다(base.ts:106-107, plan.md §H.7).

### 4.2 인증 경로 8곳

#### REQ-SEC-002-005 — 에러 메시지와 HTTP 상태 코드만 남기기

- REQ-SEC-002-005: **Event-driven (When)** §3.2의 8곳 중 한 곳이 에러를 잡으면 그 지점은 빌드와 관계없이 기존 문구 외에는 에러 메시지와 HTTP 상태 코드만 `console.error`로 남겨야 한다(shall).
- **Ubiquitous (shall not)**: 이 로그를 `__DEV__`로 가리거나 운영 빌드에서 지워지는 메서드(`console.log`, `console.warn` 등)로 바꾸지 않아야 한다(shall not).
- (비규범 참고) 응답이 없는 에러에서는 상태 코드 자리가 비어 있다.

#### REQ-SEC-002-006 — 에러 객체를 콘솔에 넘기지 않기

- REQ-SEC-002-006: **Ubiquitous (shall not)** 8곳은 `console`에 에러 객체, 에러 객체를 담은 객체·배열(`{ error }` 포함), `error.toJSON()`, `JSON.stringify(error)`, `error.config`, `error.request`, `error.response`를 넘기지 않아야 한다(shall not).
- (비규범 참고) `console.error('x', { error })`처럼 감싸면 운영 빌드에서 새 누출이 생긴다. ExceptionsManager가 인자를 `stringifySafe`로 직렬화할 때 안쪽 `AxiosError.toJSON()`이 불린다. 그 결과에 `config.data`와 Bearer 토큰 앞부분이 들어간다(plan.md §H.3).

#### REQ-SEC-002-007 — 실패 뒤 동작 유지

- REQ-SEC-002-007: **Ubiquitous** 8곳의 로그를 바꿔도 실패 뒤 동작은 그대로여야 한다(shall). 같은 Alert(제목과 문구), 같은 다시 던지기(`app/login.tsx:92`에서 `InviteSignupForm`으로, `src/stores/authStore.ts:164`), 같은 상태 갱신(`setError`, `clearAuth`, `setLoading`), 같은 화면 이동을 유지한다.

### 4.3 `client.ts` 토큰 갱신 실패

#### REQ-SEC-002-008 — 운영 빌드에서 갱신 실패 로그 0건

- REQ-SEC-002-008: **State-driven (While)** 앱이 운영 빌드로 실행되는 동안 `refreshAccessToken()`의 실패 처리 로그(§3.3의 다섯 줄)는 실행되지 않아야 한다(shall not).

#### REQ-SEC-002-009 — 개발 빌드의 갱신 실패 로그 내용

- REQ-SEC-002-009: **State-driven (While)** 개발 빌드로 실행되는 동안 그 실패 처리 로그는 HTTP 상태 코드, 에러 메시지, 서버 오류 내용(`error.response.data`)만 담아야 하며(shall) 에러 객체, `error.request`(XHR), `error.config`를 넘기지 않아야 한다(shall not).

### 4.4 유지할 계약

#### REQ-SEC-002-010 — client.ts 계약 유지

- REQ-SEC-002-010: **Ubiquitous** 이 변경은 §5의 C-1~C-4를 모두 지켜야 한다(shall). `client.ts`에서는 `refreshAccessToken()` catch 블록(client.ts:96-119) 안만 바꿔야 한다(shall).

#### REQ-SEC-002-011 — 바뀌지 않는 파일과 새로 만들지 않는 파일

- REQ-SEC-002-011: **Ubiquitous** 이 변경은 §5의 C-5~C-7을 모두 지켜야 한다(shall). 로그인 요청 구성(`src/api/services/auth.ts:8-20`), 비밀번호 변경 흐름(`auth.ts:37-55`), `src/api/services/invite.ts`, `babel.config.js`는 바꾸지 않아야 한다(shall not).
- **Ubiquitous (shall not)**: 운영 코드(`app/`, `components/`, `src/`, `hooks/`, `contexts/`)에 로깅용 헬퍼나 logger 파일을 새로 만들지 않아야 한다(shall not).

#### REQ-SEC-002-012 — 화면·스토어 계약 유지

- REQ-SEC-002-012: **Ubiquitous** 이 변경은 §5의 C-8~C-11을 모두 지켜야 한다(shall).

### 4.5 `base.ts`의 코드 표시

#### REQ-SEC-002-013 — base.ts의 MX 태그

- REQ-SEC-002-013: **Ubiquitous** `base.ts`는 `get()`·`post()`와 실패 로그 지점에 MX 태그(`@MX:ANCHOR`, `@MX:WARN`, `@MX:REASON`, `@MX:SPEC`)를 달아 REQ-SEC-002-002의 금지 사항과 REQ-SEC-002-004의 다시 던지기 규칙을 코드에 표시해야 한다(shall).

## 5. 제약 (깨면 안 되는 계약)

| ID | 계약 | 위치 | 출처 | 확인 수단 |
|----|------|------|------|-----------|
| C-1 | 요청 인터셉터가 Authorization·X-Shop-ID를 붙이는 단일 지점이다(`@MX:ANCHOR`) | `src/api/client.ts:206-210` | SPEC-REFACTOR-001 REQ-REF-001/004 | `clientInterceptors.test.ts` 요청 인터셉터 (a)~(d) |
| C-2 | 동시에 401을 받아도 리프레시는 한 번이며 나머지 요청은 대기 큐에서 기다린다(`@MX:WARN`). 리프레시는 bare `axios`로 보낸다 | `client.ts:360-364` | SPEC-REFACTOR-001 REQ-REF-002 | 401 리프레시 (a)~(c), bare axios 테스트 |
| C-3 | 스토어 지연 import는 처음 한 번 한 뒤 캐시한다 | `client.ts:4-6`, `src/api/storeLoaders.ts` | SPEC-DATA-001 REQ-DATA-001-08 | `storeLoaders.test.ts` |
| C-4 | 인터셉터는 에러를 감싸거나 복제하지 않는다(`rejects.toBe(err)`). 401 재시도 전에 `config.data`를 비우지 않는다. `authDebugUtils` export를 유지한다 | `client.ts:277-432`, `:435` | 특성 테스트 11개(커밋 32d0df2) | 응답 인터셉터 (c), 401 (a)(b), `api-client.test.ts:29` |
| C-5 | 로그인 본문은 `URLSearchParams` 폼 데이터로 만든다. 로그인이 동작하는 것도, 지금 base.ts 로그에 로그인 비밀번호가 `{}`로 찍히는 것도 Expo가 전역 `URLSearchParams`를 바꿔 끼운 결과다 | `src/api/services/auth.ts:8-20` | plan.md §H.4 | AC-SEC-002-13 |
| C-6 | 비밀번호 변경은 `getMe()` 뒤 `PUT /users/me`를 axios 인스턴스로 직접 보낸다 | `auth.ts:37-55` | `.moai/project/tech.md` §6.3 | AC-SEC-002-13 |
| C-7 | `invite.ts`(클라이언트는 role을 보내지 않는다)와 `babel.config.js`를 그대로 둔다 | `invite.ts:83`, `babel.config.js:10` | tech.md §6.2, §6.3 | AC-SEC-002-13 |
| C-8 | 액세스 토큰은 `secureHybridStorage`로 SecureStore에만 저장한다(`@MX:ANCHOR`) | `src/stores/authStore.ts:8-12` | SPEC-SECURITY-001 REQ-SEC-005 | AC-SEC-002-09 명령 6, AC-SEC-002-12 |
| C-9 | 프로필의 정상 항목(비밀번호 변경·앱 정보)과 로그아웃을 유지하고 스토어는 필드 셀렉터로 구독한다 | `app/(tabs)/profile.tsx:16-20`, `app/login.tsx:17-21` | SPEC-HOME-001 REQ-HOME-001-07, SPEC-PERF-003 #8 | `profileDeadMenu.test.tsx`, AC-SEC-002-09 명령 6, AC-SEC-002-12 |
| C-10 | 하드코딩 데모 로그인이 제거된 상태를 유지한다 | `components/forms/LoginForm.tsx` | 보안 핫픽스 b8d9096 | `loginFormDemo.test.tsx`, AC-SEC-002-09 명령 6 |
| C-11 | 페이지 상한을 넘으면 '상한 초과' `console.warn`을 계속 남긴다 | `src/api/services/treatment.ts:60`, `:132` | SPEC-DATA-001 REQ-DATA-001-07/AC-13 | `treatmentPagination.test.ts` |

## 6. 제외 사항 (Out of Scope)

### Out of Scope — 빌드 설정과 로깅 구조

- `babel.config.js`는 바꾸지 않는다. 운영 스트립 범위를 넓히거나 `console.error`까지 지우는 설정을 넣지 않는다.
- sanitize·redact 헬퍼, logger 추상화, 전역 콘솔 래퍼를 운영 코드에 만들지 않는다. 테스트 전용 판정 도구는 이 제외에 해당하지 않는다(plan.md §A.3 I-3).
- 크래시 리포팅·로그 수집 SDK는 들이지 않는다.

### Out of Scope — 인증 요청과 비밀번호 변경 흐름

- `src/api/services/auth.ts`의 로그인 요청 구성은 바꾸지 않는다(C-5).
- 비밀번호 변경 흐름은 바꾸지 않는다. 현재 비밀번호 확인을 더하는 일과 role 재전송을 없애는 일은 이 SPEC 밖이다(`.moai/project/tech.md` §6.3).
- 제거된 데모 계정의 비밀번호 교체는 백엔드 작업이라 다루지 않는다.

### Out of Scope — 범위 밖 로그 지점

- 앱 전체에서 에러를 통째로 넘기는 나머지 `console.error`. 한 줄 정규식으로 세면 88곳(27개 파일)이며 이 SPEC은 그중 9곳(§3.2의 8곳과 `client.ts:97`)만 고친다. 숫자는 근사치다(plan.md §H.1).
- `components/forms/LoginForm.tsx:42`, `:54`의 AsyncStorage(`remembered-email`) 로그.
- `src/api/client.ts`의 스토어·라우터·로그아웃 처리 로그(:91, :136, :165, :171, :184, :321, :327, :350, :415), 이미 `if (__DEV__)` 안에 있는 :40, :247, :268, :427, 고정 문구나 메시지만 남기는 :81과 :406.
- `authDebugUtils`의 로그(client.ts:504, :519, :570).
- `src/api/services/invite.ts`의 로그 전부(:61, :75의 에러 통째 전달 포함). 파일을 바꾸지 않는다(C-7).
- 운영 빌드에서 babel이 지우는 `console.log`·`console.warn` 전반. `base.ts` 안의 호출만은 REQ-SEC-002-001에 따라 모두 게이팅한다.

### Out of Scope — 문서와 기기 검증

- README.md:120의 "빌드 시 console.* 제거" 문구 정정(로드맵 13번).
- SPEC-UX-001 문서 수정. 그 SPEC은 draft 상태 그대로 둔다.
- 실제 기기·에뮬레이터 재현. 선택 확인일 뿐 통과 조건이 아니다(acceptance.md §6).

## 7. 기존 SPEC과의 관계

- **SPEC-UX-001 REQ-UX-008** (draft): API 요청 경로의 진단용 `console.*`를 모두 `if (__DEV__)`로 게이팅하라고 요구한다(SPEC-UX-001 spec.md:98-101, AC-10은 :133). 그 범위표(:54)에는 `client.ts:33,48,227`과 `BookingListScreen.tsx`만 있었고 구현 커밋 cc2177f도 base.ts를 열지 않았다. 이 SPEC은 같은 게이팅 규칙을 base.ts 전체와 client.ts 토큰 갱신 실패 로그 다섯 줄로 넓혀 API 요청 경로의 해당 부분을 완성한다. client.ts의 다른 미게이팅 로그(§6)는 남으므로 이 SPEC만으로 REQ-UX-008이 client.ts 전체에서 충족되지는 않는다. §3.2의 8곳은 화면·스토어의 오류 보고이며 결정 D-2(b)에 따라 REQ-UX-008의 게이팅 대상이 아니다. SPEC-UX-001 문서는 바꾸지 않는다.
- **SPEC-SECURITY-001** (커밋 e967a4e, SPEC 문서 없음): client.ts 로그의 토큰을 `'PRESENT'`/`'NONE'`과 `{ hasToken: true }`로 바꿨다(REQ-SEC-005). 요청 본문·비밀번호·에러 객체는 다루지 않았으며 이 SPEC이 그 부분을 맡는다. 001은 이미 쓴 번호라 002를 쓴다.
- **SPEC-REFACTOR-001, SPEC-DATA-001, SPEC-HOME-001, SPEC-PERF-003**: 이 SPEC이 건드리는 파일에 남긴 계약을 §5의 C-1~C-11로 지킨다. SPEC-REFACTOR-001은 SPEC 문서가 없으며 그 계약은 client.ts:206-210·:360-364의 MX 태그와 `__tests__/clientInterceptors.test.ts`에 있다.

## 8. 외부 기준

- OWASP MASVS-STORAGE-2 "The app prevents leakage of sensitive data." 설명에서 로그를 누출 경로로 든다.
- OWASP MASWE-0005 "Insertion of Sensitive Data into Logs" (MASVS-STORAGE-2, CWE-532 등과 연결). 완화책 가운데 이 SPEC은 "Avoid Logging Sensitive Data"(인증 경로 8곳, 개발 빌드 로그 내용 제한)와 "Disable Logging in Production"(base.ts, 토큰 갱신 실패 로그)을 택했다.
- CWE-532 "Insertion of Sensitive Information into Log File": "Do not write secrets into the log files."
- OWASP Logging Cheat Sheet "Data to exclude": 인증 비밀번호, 세션 식별값, 액세스 토큰, 개인정보.
- 프로젝트 규칙: `.moai/project/tech.md` §6.2. 개발 모드 요청 로그는 Authorization 값 대신 PRESENT/NONE만 찍고(:280) `console.error`에 넘기는 값에는 요청 본문·토큰·비밀번호가 담기지 않아야 한다(:282).

## 9. 수용 기준 색인과 추적성 (Acceptance Criteria)

수용 기준의 Given/When/Then 본문과 실행 명령은 acceptance.md에 있다. 아래 색인은 각 기준이 맡는 요구사항만 적는다.

- AC-SEC-002-01: 운영 모드에서 base.ts 콘솔 호출 0건 (maps REQ-SEC-002-001)
- AC-SEC-002-02: 개발 모드 get·post 실패 로그에 표식 없음, 진단 정보 유지 (maps REQ-SEC-002-002, REQ-SEC-002-003)
- AC-SEC-002-03: 개발 모드 요청·성공 로그에 표식 없음 (maps REQ-SEC-002-002)
- AC-SEC-002-04: base.ts 정적 검사 (maps REQ-SEC-002-002)
- AC-SEC-002-05: 잡은 에러를 같은 참조로 다시 던짐 (maps REQ-SEC-002-004)
- AC-SEC-002-06: authStore 로그인 실패 (maps REQ-SEC-002-005, REQ-SEC-002-006, REQ-SEC-002-007)
- AC-SEC-002-07: authStore 로그아웃·사용자 조회 실패 (maps REQ-SEC-002-005, REQ-SEC-002-006, REQ-SEC-002-007)
- AC-SEC-002-08: 프로필 비밀번호 변경 실패 (maps REQ-SEC-002-005, REQ-SEC-002-006, REQ-SEC-002-007)
- AC-SEC-002-09: 인증 경로 8곳 정적 검사와 변경 범위 (maps REQ-SEC-002-005, REQ-SEC-002-006, REQ-SEC-002-007, REQ-SEC-002-012)
- AC-SEC-002-10: 운영 모드 토큰 갱신 실패 `console.error` 0건 (maps REQ-SEC-002-008)
- AC-SEC-002-11: 개발 모드 토큰 갱신 실패 로그에 에러 객체·XHR 없음 (maps REQ-SEC-002-009)
- AC-SEC-002-12: 기존 계약 유지 (maps REQ-SEC-002-010, REQ-SEC-002-012)
- AC-SEC-002-13: 바뀌지 않는 파일과 변경 범위 (maps REQ-SEC-002-010, REQ-SEC-002-011)
- AC-SEC-002-14: 전체 회귀 기준 (maps REQ-SEC-002-010, REQ-SEC-002-012)
- AC-SEC-002-15: MX 태그 (maps REQ-SEC-002-013)

| 요구사항 | 수용 기준 | 근거 (plan.md) |
|----------|-----------|----------------|
| REQ-SEC-002-001 | AC-SEC-002-01 | §H.1, §H.5 |
| REQ-SEC-002-002 | AC-SEC-002-02, AC-SEC-002-03, AC-SEC-002-04 | §H.1, §H.2 |
| REQ-SEC-002-003 | AC-SEC-002-02 | §H.6 |
| REQ-SEC-002-004 | AC-SEC-002-05 | §H.7 |
| REQ-SEC-002-005 | AC-SEC-002-06, AC-SEC-002-07, AC-SEC-002-08(세 기준 모두 에러 응답 본문에 표식), AC-SEC-002-09(명령 3~6, 명령 5는 로그 줄 전체 모양 판정) | §H.1, §H.2, §H.6 |
| REQ-SEC-002-006 | AC-SEC-002-06, AC-SEC-002-07, AC-SEC-002-08, AC-SEC-002-09(명령 1·2·5) | §H.3 |
| REQ-SEC-002-007 | AC-SEC-002-06, AC-SEC-002-07, AC-SEC-002-08, AC-SEC-002-09(명령 6) | §H.1 |
| REQ-SEC-002-008 | AC-SEC-002-10 | §H.1 |
| REQ-SEC-002-009 | AC-SEC-002-11 | §H.1 |
| REQ-SEC-002-010 | AC-SEC-002-12, AC-SEC-002-13, AC-SEC-002-14 | §H.8, §H.11 |
| REQ-SEC-002-011 | AC-SEC-002-13 | §H.4 |
| REQ-SEC-002-012 | AC-SEC-002-09(명령 6, C-8~C-10), AC-SEC-002-12, AC-SEC-002-14 | §H.8 |
| REQ-SEC-002-013 | AC-SEC-002-15 | §F.1 |

## 10. 참조

- 같은 디렉터리: `plan.md`(결정·조사 근거·마일스톤), `acceptance.md`(수용 기준·판정 도구), `spec-compact.md`(요약본), `progress.md`
- `.moai/project/product.md` §6.1(:165), §9.1 로드맵 1번(:240-245)
- `.moai/project/tech.md` §6.2(:278-283), §6.3(:285-290)
- `.moai/specs/SPEC-UX-001/spec.md` :54, :98-101, :133
- 조사 원문(로컬, gitignore 대상): `.moai/reports/research/SPEC-SECURITY-002-research.md`, `.moai/reports/research/SPEC-SECURITY-002-research-lenses.md`
