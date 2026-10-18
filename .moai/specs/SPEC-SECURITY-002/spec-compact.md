# SPEC-SECURITY-002 요약본

> `spec.md` v0.1.2의 요구사항, 수용 기준, 변경 파일, 제외 사항만 모았다. 근거와 해석은 spec.md, plan.md, acceptance.md에 있다. 줄 번호는 기준 커밋 `5731c73` 기준이다.

## 요구사항

| ID | 유형 | 내용 |
|----|------|------|
| REQ-SEC-002-001 | State-driven | 운영 빌드(`__DEV__` false)인 동안 `BaseApiService`의 `get()`·`post()`는 요청 전, 성공, 실패, 401, 422 어느 경로에서도 `console` 메서드를 호출하지 않아야 한다 |
| REQ-SEC-002-002 | Ubiquitous (shall not) | `base.ts` 로그에는 빌드와 관계없이 요청 본문(일부 필드, 이름을 바꾼 필드, `JSON.stringify` 결과 포함), `this.client.defaults.headers`, 요청 `config`·`error.config`, `error.request`, 응답 객체 전체 `error.response`, 에러 객체와 그것을 담은 객체·배열, 성공 `response.data`, `error.stack`, Authorization 값과 그 일부를 담지 않아야 한다. 서버가 `error.response.data` 안에 되돌려 준 값(422 `detail[].input` 등)은 REQ-SEC-002-003이 남기라고 한 값과 같은 요구사항의 비규범 참고가 허용한 서버 오류 응답 본문을 따른다 |
| REQ-SEC-002-003 | State-driven + Event-driven | 개발 빌드에서 `get()`·`post()` 요청이 실패하면 `base.ts`는 url, HTTP 상태 코드, 에러 메시지를 남겨야 하며 422면 서버의 `detail`·`errors`도 남겨야 한다 |
| REQ-SEC-002-004 | Ubiquitous (shall, shall not) | `get()`·`post()`는 두 빌드 모두에서 잡은 에러를 같은 참조로 다시 던져야 하며(응답 없는 에러, `detail`이 문자열·배열·객체인 422, Axios가 아닌 에러 포함) 로그 코드가 예외로 원래 에러를 가리지 않아야 한다 |
| REQ-SEC-002-005 | Event-driven + Ubiquitous (shall not) | 인증 경로 8곳은 에러를 잡으면 빌드와 관계없이 기존 문구 외에는 에러 메시지와 HTTP 상태 코드만 `console.error`로 남겨야 하며 이 로그를 `__DEV__`로 가리거나 운영에서 지워지는 메서드로 바꾸지 않아야 한다 |
| REQ-SEC-002-006 | Ubiquitous (shall not) | 8곳은 에러 객체, 그것을 담은 객체·배열(`{ error }` 포함), `error.toJSON()`, `JSON.stringify(error)`, `error.config`, `error.request`, `error.response`를 콘솔에 넘기지 않아야 한다 |
| REQ-SEC-002-007 | Ubiquitous | 8곳의 실패 뒤 동작(같은 Alert, 같은 다시 던지기, `setError`·`clearAuth`·`setLoading` 상태 갱신, 화면 이동)은 그대로여야 한다 |
| REQ-SEC-002-008 | State-driven | 운영 빌드에서 `refreshAccessToken()` 실패 처리 로그(client.ts:97, :102, :103, :112, :115)는 실행되지 않아야 한다 |
| REQ-SEC-002-009 | State-driven | 개발 빌드에서 그 로그는 상태, 메시지, 서버 오류 내용(`error.response.data`)만 담아야 하며 에러 객체·`error.request`·`error.config`를 넘기지 않아야 한다 |
| REQ-SEC-002-010 | Ubiquitous | client.ts 계약 C-1~C-4를 지켜야 하며 client.ts에서는 `refreshAccessToken()` catch 블록(:96-119) 안만 바꿔야 한다 |
| REQ-SEC-002-011 | Ubiquitous (shall, shall not) | C-5~C-7을 지켜야 하며 auth.ts 로그인 요청 구성(:8-20)·비밀번호 변경 흐름(:37-55), invite.ts, babel.config.js를 바꾸지 않아야 한다. 운영 코드(`app/`, `components/`, `src/`, `hooks/`, `contexts/`)에 로깅 헬퍼·logger 파일을 새로 만들지 않아야 한다 |
| REQ-SEC-002-012 | Ubiquitous | 화면·스토어 계약 C-8~C-11을 지켜야 한다 |
| REQ-SEC-002-013 | Ubiquitous | `base.ts`는 `get()`·`post()`와 실패 로그 지점에 MX 태그(`@MX:ANCHOR`, `@MX:WARN`, `@MX:REASON`, `@MX:SPEC`)를 달아 REQ-SEC-002-002의 금지 사항과 REQ-SEC-002-004의 다시 던지기 규칙을 코드에 표시해야 한다 |

## 수용 기준 (Given / When / Then 요약)

판정 도구(`includesText`, `containsRef`, `hasExactValue`)와 표식 문자열은 acceptance.md §1에 정의돼 있다.

| ID | Given | When | Then | 관련 요구사항 |
|----|-------|------|------|---------------|
| AC-SEC-002-01 | 운영 모드, 가짜 클라이언트 | `get()`·`post()`의 성공·500·422·401 경로 7가지 | 콘솔 다섯 메서드 호출 합 0 | REQ-SEC-002-001 |
| AC-SEC-002-02 | 개발 모드, 비밀번호·개인정보가 든 가입 본문, `config.params`에 표식이 든 GET 에러 | `post()` 500·422·401, `get()` 500·401, 두 메서드의 응답 없는 에러 | 표식 없음, url·메시지 있음, 응답이 있으면 상태 있음, 422는 `detail`·`errors` 있음 | REQ-SEC-002-002, REQ-SEC-002-003 |
| AC-SEC-002-03 | 개발 모드, 기본 헤더·로그인 요청 config의 Authorization·토큰 응답·GET 성공 본문에 표식 | 로그인(URLSearchParams)·가입 `post()` 성공, `get()` 성공 | 표식 없음 | REQ-SEC-002-002 |
| AC-SEC-002-04 | M2 완료 | base.ts에 `grep -c` 5개 | `requestData`·`JSON.stringify(data`·`defaults.headers`·`.stack` 0, `__DEV__` 1 이상 | REQ-SEC-002-002 |
| AC-SEC-002-05 | 두 모드 | 7가지 에러 형태(응답 없음, 422 `detail` 문자열·배열·객체, TypeError 등)로 실패 | `rejects.toBe(error)` | REQ-SEC-002-004 |
| AC-SEC-002-06 | 두 모드, `getMe`가 Bearer 표식과 응답 본문 표식(`PII_SENTINEL`)을 품은 AxiosError로 실패 | `login()` | 같은 에러로 거부, 표식(토큰·비밀번호·개인정보)·에러 참조 없음, 메시지·상태 있음, `error` 상태 갱신 | REQ-SEC-002-005, REQ-SEC-002-006, REQ-SEC-002-007 |
| AC-SEC-002-07 | 로그아웃·사용자 조회가 AxiosError(Bearer 표식, 응답 본문 표식)나 응답 없는 에러로 실패 | `logout()`, `loadUser()` | 거부 없음, 상태 정리·`error` 갱신, 표식(토큰·개인정보)·에러 참조 없음, 메시지 있음(AxiosError면 상태도 있음) | REQ-SEC-002-005, REQ-SEC-002-006, REQ-SEC-002-007 |
| AC-SEC-002-08 | 프로필 화면, `changePassword`가 422(응답 본문 `input`으로 비밀번호를 되돌려 줌)나 인증 만료 에러로 실패 | 비밀번호 변경 실행 | 같은 Alert(422) 또는 Alert 없음(인증 만료), 표식·에러 참조 없음, 메시지 있음(422는 상태도 있음) | REQ-SEC-002-005, REQ-SEC-002-006, REQ-SEC-002-007 |
| AC-SEC-002-09 | M4 완료, 8곳의 호출은 각각 한 줄 | 5개 파일에 grep 5개와 `git diff` 1개 | 에러 객체 전달 형태는 LoginForm AsyncStorage 2줄만, 여러 줄 형태 0, `console.error`·`__DEV__` 개수 유지, 기존 문구 뒤에 두 인자를 `error.message`·`error.response?.status`(또는 `(error as any)` 형태) 그대로 두고 `);`로 끝나는 한 줄짜리 로그 8, `console.error`·catch 절 밖의 변경 줄 0 | REQ-SEC-002-005, REQ-SEC-002-006, REQ-SEC-002-007, REQ-SEC-002-012 |
| AC-SEC-002-10 | 운영 모드, 리프레시가 401·네트워크·일반 에러로 실패 | `authDebugUtils.testRefreshToken()` | `console.error` 0건 | REQ-SEC-002-008 |
| AC-SEC-002-11 | 개발 모드, 같은 세 경우 | 같은 호출 | 에러 객체·XHR·config 참조와 XHR 표식 없음, 메시지 있음(401 경우는 상태와 서버 오류 내용도 있음) | REQ-SEC-002-009 |
| AC-SEC-002-12 | M1~M5 완료 | 보존 대상 7개 테스트와 grep | 7 suites·23 tests 통과, 테스트 파일 무변경, MX 태그·`authDebugUtils` export·셀렉터 구독 유지 | REQ-SEC-002-010, REQ-SEC-002-012 |
| AC-SEC-002-13 | M1~M5 완료 | `git diff`, `git ls-files --others`, hunk 범위 awk | auth.ts·invite.ts·babel.config.js·SPEC-UX-001 무변경, 커밋 여부와 관계없이 운영 코드와 SPEC-UX-001에 새 파일 없음, client.ts 변경은 :96-119 안 | REQ-SEC-002-010, REQ-SEC-002-011 |
| AC-SEC-002-14 | M1~M5 완료, 단독 실행 | `npx jest`, `npx tsc --noEmit`, `npm run lint` 요약 줄 grep | 실패 0(28 suites·113 tests 이상), `error TS` 2 이하(EditTreatmentModal만), 린트 오류 2·경고 5 이하(0건이면 요약 줄 없음) | REQ-SEC-002-010, REQ-SEC-002-012 |
| AC-SEC-002-15 | M5 완료 | base.ts에 MX 태그 grep | `@MX:ANCHOR: [AUTO]` 2, `@MX:WARN: [AUTO]` 1 이상, `@MX:REASON` 3 이상, `@MX:SPEC: SPEC-SECURITY-002` 1 이상 | REQ-SEC-002-013 |

## 변경 파일

- [MODIFY] `src/api/services/base.ts`
- [MODIFY] `src/api/client.ts` (`refreshAccessToken()` catch 블록만)
- [MODIFY] `app/login.tsx`, `components/forms/InviteSignupForm.tsx`, `components/forms/LoginForm.tsx`, `src/stores/authStore.ts`, `app/(tabs)/profile.tsx`
- [NEW] `__tests__/baseServiceLogging.test.ts`, `__tests__/authStoreLogging.test.ts`, `__tests__/profilePasswordLogging.test.tsx`, `__tests__/refreshLogging.test.ts`
- [NEW, 선택] `__tests__/utils/consoleArgs.ts` (테스트 전용)
- [EXISTING] `src/api/services/auth.ts`, `src/api/services/invite.ts`, `babel.config.js` (바꾸지 않음)

## 제외 사항

- 빌드 설정과 로깅 구조: `babel.config.js` 변경(운영 스트립 범위 확대, `console.error` 제거 설정), 운영 코드의 sanitize·redact 헬퍼·logger 추상화·전역 콘솔 래퍼(테스트 전용 판정 도구는 해당 없음), 크래시 리포팅·로그 수집 SDK 도입
- 인증 요청과 비밀번호 변경 흐름: auth.ts 로그인 요청 구성 변경(C-5), 비밀번호 변경 흐름 변경(현재 비밀번호 확인 추가, role 재전송 제거), 제거된 데모 계정의 비밀번호 교체(백엔드 작업)
- 범위 밖 로그 지점: 앱 전체에서 에러를 통째로 넘기는 나머지 `console.error`(한 줄 정규식 기준 88곳/27개 파일 가운데 9곳만 고침, 근사치), LoginForm.tsx:42·:54의 AsyncStorage 로그, client.ts의 :40·:81·:91·:136·:165·:171·:184·:247·:268·:321·:327·:350·:406·:415·:427, authDebugUtils(client.ts:504·:519·:570), invite.ts 로그 전부(:61·:75 포함), 운영 빌드에서 babel이 지우는 `console.log`·`console.warn` 전반(base.ts 안의 호출만은 REQ-SEC-002-001에 따라 게이팅)
- 문서와 기기 검증: README.md:120 정정(로드맵 13번), SPEC-UX-001 문서 수정, 실제 기기·에뮬레이터 재현(선택 확인, 통과 조건 아님)
