# SPEC-SECURITY-002 구현 계획

> 대상 SPEC: `spec.md` v0.1.2 · Tier M · 개발 방식 TDD(`.moai/config/sections/quality.yaml`의 `constitution.development_mode: tdd`)
> 기준 커밋 `5731c73` · 브랜치 `feature/refactor-hardening-2026-07`
> 표시 ✔는 이번 plan 단계에서 명령 실행이나 파일 읽기로 다시 확인한 사실이다. 표시가 없는 근거는 조사 보고서의 렌즈 결과(정적 읽기·Node 시뮬레이션, 기기 재현 없음)다.

## §A 맥락과 결정

### §A.1 작업 위치

- 앱: Expo SDK 54.0.8, React Native 0.81.4, TypeScript ~5.9, axios 1.18.1(package.json 선언은 `^1.11.0`), jest-expo ~54 ✔
- 브랜치: `feature/refactor-hardening-2026-07`에 이어 쌓는다. 이 브랜치에는 열린 PR #1이 있다 ✔. 새 브랜치를 만들지 않는다.
- git 모드: manual(`.moai/config/sections/git-strategy.yaml`) ✔. 에이전트는 push하지 않는다. 커밋 시점과 묶음은 오케스트레이터가 정한다.
- frontmatter의 `phase: "v1.0.0 target"`은 `app.json`과 `package.json`의 `version: "1.0.0"`에서 가져왔다 ✔. 저장소에는 릴리스 태그가 없고 버전 규칙도 정해지지 않았다(product.md 로드맵 18번). 버전을 올리는 일은 이 SPEC 범위가 아니다.

### §A.2 사용자 결정 (2026-10-17, 오케스트레이터가 AskUserQuestion으로 받음)

| ID | 결정 | 내용 |
|----|------|------|
| D-1 | 방식: 개발 빌드 전용 게이팅 | base.ts의 진단용 `console.*`를 모두 `if (__DEV__)` 안으로 옮긴다. 운영 빌드에서 base.ts는 콘솔을 한 번도 부르지 않는다. 개발 빌드에서도 요청 본문(`data`), `this.client.defaults.headers`, 요청 `config`, 성공 `response.data`(로그인 토큰 응답), 스택, `JSON.stringify(data)`는 남기지 않는다. 개발 빌드는 url, method, status, statusText, message, 서버 오류 세부 정보(422 `detail`/`errors`)를 남길 수 있다. 서버 검증 세부 정보는 개발 빌드에서만 보인다. 새 헬퍼·logger 파일은 만들지 않는다. SPEC-UX-001 REQ-UX-008의 게이팅 규칙에 일부러 맞췄다. |
| D-2 | 범위: 인증 경로까지 | (a) base.ts 전체(`get()`·`post()`). (b) spec.md §3.2의 8곳은 빌드와 관계없이 메시지와 HTTP 상태 코드만 남긴다. 에러 객체와 그것을 담은 객체는 넘기지 않는다. (c) client.ts 토큰 갱신 실패 로그(:97, :102, :103, :112, :115)는 D-1과 같이 `if (__DEV__)`로 가리고 게이트 안에서도 에러 객체와 `error.request`(XHR)를 넘기지 않는다. 남기는 것은 상태·메시지·서버 오류 세부 정보뿐이다. |
| D-3 | Tier M | 산출물은 spec.md, plan.md, acceptance.md, spec-compact.md, progress.md다. research.md와 design.md는 두지 않는다. 요구사항 16개와 수용 기준 16개가 각각의 상한이다. plan-auditor 통과 기준은 0.80이다. |
| D-4 | 감사 깊이: thorough | 리뷰 관점, plan-auditor, sync-auditor로 교차 검증한다. 요구사항은 하나씩 따로 시험할 수 있게 쓰고 수용 기준의 명령은 적힌 그대로 실행되게 한다. |

### §A.3 이 계획이 해석한 지점 (휴먼 검토에서 바꿀 수 있음)

결정이 바뀔 가능성이 가장 큰 곳이라 맨 앞에 둔다.

| ID | 해석 | 근거 | 바꿀 때 고칠 곳 |
|----|------|------|-----------------|
| I-1 | D-1의 "서버 오류 세부 정보"를 서버 오류 응답 본문(`error.response.data`)과 그 안의 `detail`·`errors`로 읽었다. 이 백엔드의 오류 본문은 `{ "detail": … }` 형태라 두 표현이 같은 정보를 가리킨다 | §H.6 | `detail`·`errors`만 허용하도록 좁히려면 spec.md REQ-SEC-002-003의 비규범 참고를 고친다. 수용 기준은 그대로 쓸 수 있다 |
| I-2 | D-1의 금지 목록에 에러 객체, `error.config`, `error.request`, 응답 객체 전체, Authorization 값을 더했다. 모두 요청 설정이나 본문을 품고 있어 금지 목록을 우회하는 통로가 된다 | §H.2, §H.3 | 결정의 뜻을 넓히거나 좁히지 않는다 |
| I-3 | "새 헬퍼·logger 파일 금지"는 운영 코드에 적용하고 테스트 전용 판정 도구(`__tests__/utils/consoleArgs.ts`)는 허용한다 | 조사 §13의 선택지(제거·게이팅·정제 헬퍼) 가운데 헬퍼 방식은 운영 로그를 정제하는 용도였다 | 테스트 도구까지 금지로 읽으면 판정 함수를 각 테스트 파일 안에 둔다 |
| I-4 | 8곳의 로그는 운영 빌드에도 남는다. `__DEV__`로 가리거나 운영에서 지워지는 `console.warn`·`console.log`로 바꾸지 않는다 | D-2(b) "빌드와 관계없이" | — |

미결 질문은 없다. 위 해석은 결정 내용과 충돌하지 않는 범위에서 정했다.

## §B 알려진 위험과 대응

| ID | 위험 | 대응 | 확인 |
|----|------|------|------|
| B-1 | toJSON 함정. 에러를 객체로 감싸 넘기면(`console.error('x', { error })`) 운영 빌드의 ExceptionsManager가 `stringifySafe` 안의 `JSON.stringify`로 안쪽 `AxiosError.toJSON()`을 부른다. 그 결과 `config.data`(비밀번호)와 Authorization 앞 100자(`Bearer eyJ…`)가 non-fatal 예외 메시지에 들어간다(§H.3) | REQ-SEC-002-006이 금지한다. 판정 도구가 `JSON.stringify(arg)` 렌더링으로 같은 경로를 흉내 내고 정적 검사가 `{ error }`·`{ err: error }` 형태를 잡는다 | AC-SEC-002-06~09 |
| B-2 | URLSearchParams 의존. 로그인 동작과 지금의 `{}` 출력은 Expo winter 런타임이 전역 `URLSearchParams`를 WHATWG 구현으로 바꾼 결과다. auth.ts의 본문 구성을 바꾸면 로그인이 깨질 수 있다(§H.4) | auth.ts를 바꾸지 않는다(REQ-SEC-002-011). 판정 도구는 `String(arg)`와 심볼 키 순회로 URLSearchParams 내용까지 본다 | AC-SEC-002-03, -13 |
| B-3 | 인터셉터의 에러 동일성과 재시도 본문. client.ts 수정이 인터셉터로 번지면 `rejects.toBe(err)`와 401 재시도가 깨진다 | client.ts 수정은 `refreshAccessToken()` catch 블록 안으로 한정한다. 기존 특성 테스트 11개는 바꾸지 않고 통과시킨다 | AC-SEC-002-12 |
| B-4 | 응답 없는 에러. 401 → 리프레시 실패 → performLogout, 403, SHOP_NOT_SELECTED에서 인터셉터는 `response`·`config`가 없는 `Error`를 돌려준다(client.ts:341, :352, :419 ✔). `error.response.status`처럼 바로 읽으면 TypeError가 난다 | 상태 코드는 선택적 체이닝으로 읽는다. 테스트에 응답 없는 경우를 넣는다 | AC-SEC-002-05, -07, -08 |
| B-5 | 서버의 입력값 반사. FastAPI 422 `detail[].input`이 제출값(비밀번호)을 되돌려 줄 수 있고 개발 빌드는 이를 그대로 보여 준다(§H.6) | D-1이 받아들인 개발 빌드 한정 위험이다. 운영 빌드는 base.ts 콘솔 호출이 0건이다 | AC-SEC-002-01 |
| B-6 | 객체 `detail` 422의 TypeError(기존 잠재 결함). base.ts:106-107의 `errorMessage.includes`가 객체에서 예외를 던져 원래 에러를 가린다. 지금은 운영 빌드에서도 실행된다(§H.7) | REQ-SEC-002-004. 문자열일 때만 `includes`를 부른다 | AC-SEC-002-05 |
| B-7 | 테스트 사이 `__DEV__` 누수. `global.__DEV__`를 바꾼 채 두면 같은 파일의 다른 테스트 결과가 섞인다 | 값을 바꾼 테스트가 `afterEach`나 `finally`에서 원래 값으로 되돌린다. 콘솔 스파이도 `jest.restoreAllMocks()`로 되돌린다 | 각 새 테스트 파일 |
| B-8 | 타입 검사 기준선. `tsconfig.json`이 `strict: true`라 annotation 없는 catch 변수는 `unknown`이다(`app/login.tsx:48`, `src/stores/authStore.ts:179` ✔). 그대로 `error?.message`를 쓰면 tsc 오류가 늘어난다. 새 테스트 파일도 `tsc --noEmit` 대상이다(`include`가 `**/*.ts`, `**/*.tsx`) | catch 절에 annotation을 붙이거나 로그 줄 안에서 `(error as any)`로 좁힌다. 별도 줄에서 좁히면 AC-SEC-002-09 명령 6이 실패한다. 테스트도 타입 오류 없이 쓴다 | AC-SEC-002-09, -14 |
| B-9 | 린트 기준선. 경고 5건 중 4건이 authStore.ts의 쓰지 않는 catch 변수다(:26, :47, :75, :78 ✔). 새 코드가 같은 경고를 늘릴 수 있다 | 린트 결과가 오류 2건·경고 5건을 넘지 않게 한다 | AC-SEC-002-14 |
| B-10 | 부하 중 jest 타임아웃. tsc·lint와 jest를 동시에 돌리면 일부 테스트가 5초 타임아웃으로 실패한 기록이 있다(tech.md §5.4) | jest는 다른 무거운 명령 없이 단독으로 돌린다 | AC-SEC-002-14 |
| B-11 | 줄 번호 이동. spec.md의 file:line은 `5731c73` 기준이며 M2~M4에서 줄이 밀린다 | 정적 검사는 줄 번호 대신 패턴과 개수로 판정한다. client.ts 변경 범위 검사만 `5731c73` 기준 줄 번호를 쓴다 | AC-SEC-002-04, -09, -13 |
| B-12 | 포매터 의존. 지금 8곳이 운영 빌드에서 메시지만 남기는 것은 RN 포매터가 에러를 줄여 주기 때문이다. 크래시 SDK를 붙이거나 포매터가 바뀌면 보호가 사라진다 | 원시 인자에서 에러 객체를 없앤다(REQ-SEC-002-006). 포매터 동작에 기대지 않는다 | AC-SEC-002-06~09 |

## §C 시작 전 확인

```bash
git branch --show-current                     # 기대: feature/refactor-hardening-2026-07
git status --short                            # .moai/harness/, .moai/lessons-inbox.jsonl은 이 SPEC과 무관하다. 건드리지 않는다
npx jest --silent 2>&1 | tail -n 5            # 기준(5731c73): Test Suites 24 passed, Tests 112 passed, Snapshots 1 passed
npx tsc --noEmit 2>&1 | grep -c "error TS"    # 기준: 2
npm run lint 2>&1 | command grep -E '^✖ [0-9]+ problems?'   # 기준: ✖ 7 problems (2 errors, 5 warnings). 문제 0건이면 출력 없음
```

jest는 tsc·lint와 동시에 돌리지 않는다(B-10). 기준값과 다르면 작업을 시작하기 전에 오케스트레이터에게 알린다.

## §D 제약

- spec.md §5의 C-1~C-11을 지킨다.
- 손대지 않는 파일: `src/api/services/auth.ts`, `src/api/services/invite.ts`, `babel.config.js`, 기존 테스트 파일 전부(특히 `__tests__/clientInterceptors.test.ts`, `__tests__/api-client.test.ts`, `__tests__/storeLoaders.test.ts`, `__tests__/profileDeadMenu.test.tsx`, `__tests__/loginFormDemo.test.tsx`, `__tests__/treatmentPagination.test.ts`, `__tests__/store-selector.test.tsx`), `.moai/specs/SPEC-UX-001/`를 포함한 다른 SPEC 디렉터리, `.moai/harness/`, `.moai/lessons-inbox.jsonl`.
- `src/api/client.ts`는 `refreshAccessToken()` catch 블록(`5731c73` 기준 :96-119) 밖을 바꾸지 않는다.
- 금지 명령: `git add -A`, `git add .`, `git commit -a`(경로를 지정해 스테이징한다), `--no-verify`, `git push`, 기본 체크아웃에서의 브랜치 전환·`git stash`·`git reset --hard`.
- 커밋 메시지는 한국어 Conventional Commits로 쓴다(`.moai/config/sections/language.yaml`의 `git_commit_messages: ko`). 마지막 줄은 `🗿 MoAI <email@mo.ai.kr>`이다.

## §E 자체 검증 산출물 (manager-develop가 보고)

각 항목은 실행한 명령, 그 출력 원문, 기준 커밋을 함께 적는다(verification-claim-integrity 5단 형식).

- E1. 수용 기준 판정표: AC-SEC-002-01~15 각각의 명령, 실제 출력, PASS/FAIL
- E2. RED 출력: M1에서 GREEN 전에 받은 실패 출력 원문(AC-SEC-002-01, -02, -03, -05, -06, -07, -08, -10, -11)
- E3. 기준선 비교: `npx jest --silent`, `npx tsc --noEmit`, `npm run lint`의 실행 결과
- E4. 범위 확인: AC-SEC-002-13의 `git diff` 출력
- E5. MX 태그 보고: 추가한 태그와 파일별 개수
- E6. 막힘 보고(있을 때만): 사용자 결정이 필요한 점은 직접 묻지 않고 보고한다

## §F 마일스톤 (TDD: RED → GREEN → REFACTOR)

결정이 바뀌면 함께 바뀌는 부분(무엇을 누출로 볼지, 개발 빌드에 무엇을 남길지)을 담은 M1을 먼저 하고 기계적인 작업(MX 태그, 기준선 확인)은 마지막에 둔다. 모두 우선순위 높음이며 M1 → M2 → M3 → M4 → M5 순서로 진행한다.

### M1 — RED: 실패하는 테스트 먼저

- 판정 도구: acceptance.md §1의 `includesText`, `containsRef`, `hasExactValue`. `__tests__/utils/consoleArgs.ts`에 두거나 각 테스트 파일 안에 둔다(I-3).
- `__tests__/baseServiceLogging.test.ts`: AC-SEC-002-01~05. `@/src/api/client`를 가짜 클라이언트로 모킹하고 `BaseApiService`를 상속한 시험용 서비스로 `get()`·`post()`를 부른다. 에러는 실제 `AxiosError`로 만든다.
- `__tests__/authStoreLogging.test.ts`: AC-SEC-002-06~07. `@/src/api/services/auth`를 모킹하고 실제 `useAuthStore`를 쓴다. jest-expo가 `ExpoSecureStore`를 모킹하므로 스토어를 그대로 불러올 수 있다(§H.8).
- `__tests__/profilePasswordLogging.test.tsx`: AC-SEC-002-08. `profileDeadMenu.test.tsx:11-25`의 모킹 방식을 따른다.
- `__tests__/refreshLogging.test.ts`: AC-SEC-002-10~11. `clientInterceptors.test.ts:27-35`의 모킹과 `:59`의 `jest.spyOn(axios, 'post')`를 따르고 `authDebugUtils.testRefreshToken()`(client.ts:509-521)으로 `refreshAccessToken()`을 실행한다.
- 테스트 이름에 수용 기준 ID를 넣는다(acceptance.md §1.7).
- 새 테스트를 돌려 실패를 확인하고 그 출력 원문을 progress.md §E.2에 남긴다(manager-develop 담당).
- 예상 RED: AC-SEC-002-01(콘솔 호출 수가 0이 아님), AC-SEC-002-02(`requestData`·`JSON.stringify(data)`, `get()` 요청 로그의 `config`), AC-SEC-002-03(`defaults.headers`·`data`·`config`·`response.data`), AC-SEC-002-05 e 경우(객체 `detail`에서 TypeError), AC-SEC-002-06~08(에러 객체 참조), AC-SEC-002-10(`console.error` 호출), AC-SEC-002-11(에러 객체·XHR 참조).
- AC-05의 e 외 경우는 지금도 통과한다. 회귀를 막는 용도로 그대로 둔다.

### M2 — GREEN: `base.ts`

- `get()`·`post()`의 진단 로그를 모두 `if (__DEV__)` 안으로 옮긴다.
- 금지 값을 뺀다: `get()` 요청 로그의 `config`, `post()` 요청 로그의 `headers`·`data`·`config`, 성공 로그의 `data`, 실패 로그의 `requestData`·`stack`, 422의 `JSON.stringify(data)`, 401의 `requestData`.
- 422 누락 필드 추정 분기는 `detail`(또는 `message`)이 문자열일 때만 `includes`를 부르게 바꾼다(REQ-SEC-002-004). 이 분기도 게이트 안에 둔다.
- `throw error`는 그대로 둔다. `put`·`patch`·`delete`·`buildQueryString`은 건드리지 않는다.

### M3 — GREEN: `client.ts`의 `refreshAccessToken()` catch 블록

- :97, :102, :103, :112, :115를 `if (__DEV__)` 안으로 옮긴다.
- :97은 에러 객체 대신 `error.message`를, :112는 `error.request` 대신 `error.message`를 남긴다. :102의 상태와 :103의 서버 오류 내용(`error.response.data`)은 그대로 남긴다.
- catch 블록(:96-119) 밖은 바꾸지 않는다. 인터셉터, 대기 큐, performLogout, authDebugUtils는 그대로다.

### M4 — GREEN: 인증 경로 8곳

- 각 줄의 기존 문구는 그대로 두고 두 번째 인자부터를 `error.message`와 HTTP 상태 코드 `error.response?.status` 두 개로 바꾼다. annotation 없는 catch 두 곳은 이 둘을 `(error as any).message`, `(error as any).response?.status`로 쓸 수 있다(B-8). 두 인자는 이 식 그대로 쓰고 다른 인자를 덧붙이지 않는다. 호출은 지금처럼 한 줄로 두고 `);`로 끝내며, 다섯 파일에서 8곳의 로그 줄과 catch 절 말고는 바꾸지 않는다(AC-SEC-002-09 명령 5·6).
- annotation 없는 catch 변수(`app/login.tsx:48`, `src/stores/authStore.ts:179`)는 타입 오류가 늘지 않게 다룬다(B-8).
- 알림 문구, 다시 던지기, 상태 갱신, 화면 이동은 손대지 않는다(REQ-SEC-002-007).

### M5 — REFACTOR와 마무리

- 중복이 생겼으면 정리하되 새 운영 파일은 만들지 않는다.
- §F.1의 MX 태그를 단다.
- acceptance.md의 정적 검사(AC-SEC-002-04, -09, -12, -13, -15)와 회귀 기준(AC-SEC-002-14)을 돌린다. jest는 단독으로 돌린다(B-10).

### §F.1 MX 태그 계획

`.moai/config/sections/language.yaml`의 `code_comments: ko`에 따라 태그 설명은 한국어로 쓰고 `[AUTO]` 접두를 붙인다. 파일당 상한(ANCHOR 3, WARN 5)을 넘지 않는다.

| 대상 | 태그 | 근거 |
|------|------|------|
| `base.ts`의 `post()` | `@MX:ANCHOR` + `@MX:REASON` + `@MX:SPEC: SPEC-SECURITY-002` | fan_in 13(auth·invite·phonebook·shop·staff·treatment·treatmentMenu 7개 서비스, §H.1) ✔. 실패 로그 규칙과 다시 던지기 규칙이 모든 POST 호출에 걸린다 |
| `base.ts`의 `get()` | `@MX:ANCHOR` + `@MX:REASON` | fan_in 15(dashboard·invite·phonebook·shop·staff·treatment·treatmentMenu 7개 서비스, §H.1) ✔. `post()`와 서비스 집합이 다르다. fan_in 3 이상은 ANCHOR 대상이다 |
| `post()` catch의 로그 지점 | `@MX:WARN` + `@MX:REASON` | 요청 본문·요청 설정·에러 객체·`error.request`·`error.response`를 로그에 넣지 않게 표시한다 |

예시 문구:

```ts
// @MX:ANCHOR: [AUTO] 서비스 7곳의 POST 요청 13건이 지나는 공통 경계. 실패하면 잡은 에러를 그대로 다시 던진다.
// @MX:REASON: fan_in 13. 여기서 에러를 바꿔 던지거나 로그 내용을 늘리면 모든 POST 호출의 오류 처리와 로그 노출이 함께 바뀐다.
// @MX:SPEC: SPEC-SECURITY-002 (REQ-SEC-002-001~004)
```

```ts
// @MX:WARN: [AUTO] 이 로그에 요청 본문(data)·요청 설정(config)·에러 객체·error.request·error.response를 넣지 않는다.
// @MX:REASON: 초대 가입 본문에는 비밀번호가 들어 있다. 에러를 객체로 감싸면 운영 빌드의 ExceptionsManager가 AxiosError.toJSON()으로 config.data와 Bearer 토큰을 직렬화한다.
```

## §G 하지 말 것

- 에러를 객체로 감싸 넘기기(`{ error }`, `{ err: error }`). 운영 빌드에서 새 누출이 생긴다(B-1).
- 8곳을 `__DEV__`로 가리거나 `console.warn`·`console.log`로 바꾸기. 운영 빌드에서 로그가 사라진다(I-4).
- `JSON.stringify(mock.calls)` 한 번으로 누출을 판정하기. URLSearchParams의 심볼 키 데이터와 `Error`의 열거 불가 속성을 놓쳐 수정 전에도 통과할 수 있다. 원시 인자를 깊게 탐색한다(acceptance.md §1.3).
- babel 설정으로 해결하기. 범위 밖이며 envName 사전 설정에 따라 스트립이 조용히 꺼질 수 있다(조사 C3).
- 정제(sanitize·redact) 헬퍼나 logger를 운영 코드에 만들기.
- 인터셉터에서 에러를 복제하거나 감싸기, 401 재시도 전에 `config.data` 비우기.
- auth.ts의 로그인 본문을 일반 객체나 문자열로 바꾸기.
- 기존 테스트의 기대값 고치기.
- axios의 `redact` 옵션에 기대기. 키 기준으로만 가려서 이미 문자열이 된 `config.data` 안의 비밀번호는 `redact: ['password']`로 가려지지 않는다(조사 §9).

## §H 조사 근거와 참조

조사 원문은 `.moai/reports/research/SPEC-SECURITY-002-research.md`(종합)와 `SPEC-SECURITY-002-research-lenses.md`(관점별)다. 둘 다 gitignore 대상이라 커밋되지 않으므로 SPEC에 필요한 근거를 여기에 줄여 옮긴다. 렌즈 약어: CP(codebase-precedent), CR(constraints-risks), ED(external-docs), PM(prior-SPEC-memory).

### §H.1 호출 지점 인벤토리

| 위치 | 넘기는 값 | 운영 빌드 | 지금 운영 로그 내용 | 이 SPEC |
|------|-----------|-----------|---------------------|---------|
| base.ts:80-89 ✔ | 요청 본문(`requestData` :83), 서버 응답 본문(:86), message, 스택(:88) | 남음 | 가입 실패: 비밀번호·초대 코드·이메일·전화번호 원문. 로그인 실패: `requestData: {}` | REQ-SEC-002-001, REQ-SEC-002-002 |
| base.ts:94 ✔ | `JSON.stringify(data)` | 남음 | 가입: 비밀번호가 든 JSON. 로그인: `'{}'` | REQ-SEC-002-001, REQ-SEC-002-002 |
| base.ts:95, :98, :102 ✔ | 서버 응답 JSON, `detail`, `errors` | 남음 | 서버가 입력값을 되돌려 주면 비밀번호(§H.6) | REQ-SEC-002-001 |
| base.ts:113-120 ✔ | 요청 본문(:118), 서버 응답 본문, Authorization 유무 | 남음 | 이미 재시도한 요청이 다시 401을 받을 때만. 첫 401은 인터셉터가 응답 없는 `Error`로 바꾼다 | REQ-SEC-002-001, REQ-SEC-002-002 |
| base.ts:33-49 ✔ | 서버 응답 본문, Authorization 유무 | 남음 | GET에는 요청 본문이 없다 | REQ-SEC-002-001 |
| base.ts:15-29, :62-76 ✔ | 호출자 `config`, `defaults.headers`, 요청 본문, 성공 `response.data` | 지워짐(`console.log`) | 개발 빌드에서 가입 비밀번호 원문과 로그인 토큰 응답 | REQ-SEC-002-002 |
| spec.md §3.2의 8곳 ✔ | AxiosError 통째 | 남음 | `AxiosError: <message>`만(§H.2) | REQ-SEC-002-005, REQ-SEC-002-006 |
| client.ts:97, :102, :103, :112, :115 ✔ | 리프레시 AxiosError, 상태, 응답 본문, XHR 객체, message | 남음 | :97은 메시지만, :103은 서버 응답 본문, :112는 XHR 객체 | REQ-SEC-002-008, REQ-SEC-002-009 |
| LoginForm.tsx:42, :54 ✔ | AsyncStorage 에러 | 남음 | AxiosError가 아니며 요청 본문이 없다 | 제외 |
| client.ts:91, :136, :165, :171, :184, :321, :327, :350, :415 ✔ | 스토어·라우터·로그아웃 처리 에러 | 남음 | 요청 에러가 아니다 | 제외 |
| client.ts:40, :247, :268, :427 ✔ | 스토어 조회 에러, 기타 API 에러(:427) | 지워짐(`if (__DEV__)`) | — | 제외 |
| client.ts:81, :406 ✔ | 고정 문구, `refreshError.message` | 남음 | 메시지만 | 제외 |

- `post()` 호출 지점 13곳(서비스 7개) ✔: staff.ts:89, phonebook.ts:54, treatmentMenu.ts:52·:67·:77, invite.ts:45·:92, auth.ts:15·:24·:31, treatment.ts:25, shop.ts:64·:69. 그래서 `requestData`는 자격 증명 말고도 전화번호부·시술·매장 요청 본문의 개인정보를 운영 로그에 남긴다(CR F13).
- `get()` 호출 지점 15곳(서비스 7개) ✔: dashboard.ts:15·:32, invite.ts:57, phonebook.ts:49·:59·:75·:86, shop.ts:54·:59·:79, staff.ts:61, treatment.ts:15·:20, treatmentMenu.ts:47·:72. `post()`와 서비스 집합이 다르다. dashboard.ts가 들어가고 auth.ts가 빠진다(auth.ts:37의 `getMe()`는 `this.client.get`을 직접 부른다).
- 앱 전체 집계 ✔: `grep -rnE "console\.error\(.*,[[:space:]]*error[[:space:]]*\);" app components src hooks contexts --include=*.ts --include=*.tsx | wc -l` → `88`, 같은 패턴에 `-rlE`를 쓰면 `27`(파일 수). 한 줄짜리 호출과 변수명 `error`만 세므로 근사치다. 이 SPEC은 그중 9곳(8곳과 client.ts:97)을 고친다.

### §H.2 운영 빌드에서 지금 찍히는 형태 (CP F5, CR F3, ED F4)

- 에러 객체를 독립 인자로 넘기면 메시지만 남는다. RN `inspect`는 `message`를 가진 Error를 `[Name: message]`로 줄이고(console.js:85-91, :194-195) ExceptionsManager의 `stringifySafe`는 `instanceof Error`인 값을 `name: message`로 바꾼다(stringifySafe.js:90-91). axios 1.18.1은 `message`를 열거 가능한 속성으로 정의한다(AxiosError.js:116-125).
- 일반 객체와 문자열은 전부 찍힌다. Node에서 설치된 console.js를 `__DEV__=false`로 실행한 결과, `{ url, requestData: { …, password } }`와 `JSON.stringify(data)`, `err.toJSON()`, `err.response.data`가 그대로 나왔다(CR, ED).
- Node의 `util.inspect(AxiosError)`는 비밀번호와 토큰을 모두 보여 준다(CR E3). jest·Node 출력과 개발 도구에서는 에러 객체 속 값이 그대로 드러난다.

### §H.3 toJSON 함정 (CR F5 Node 시뮬레이션)

- `console.error('x', { error })` 형태면 `stringifySafe`가 객체를 `JSON.stringify`하면서 중첩된 `AxiosError.toJSON()`이 불린다. 그 결과 `config.data`(비밀번호)와 Authorization 앞 100자가 soft exception 메시지에 들어간다. 시뮬레이션 출력: `contains NEW-PW-123? true | contains Bearer prefix? true`.
- `toJSON()`은 `{message, name, description, number, fileName, lineNumber, columnNumber, stack, config, code, status}`를 돌려주며 `config`에 headers와 data가 들어간다(ED F3).

### §H.4 로그인 본문과 URLSearchParams (CP F5, CR F3·F14, 중간 신뢰도)

- Expo SDK 54의 winter 런타임이 전역 `URLSearchParams`를 `whatwg-url-without-unicode` 구현으로 바꾼다(expo/src/winter/runtime.native.ts:16, url.ts:12). 이 구현은 데이터를 열거 불가 심볼 키에 둔다.
- axios는 이 객체를 URLSearchParams로 알아보고 `config.data`를 `'username=…&password=…&grant_type=password'`로 직렬화한다. base.ts 로그는 같은 객체를 `{}`와 `'{}'`로 찍는다. 우연히 생긴 보호다.
- RN 0.81.4 자체 구현이었다면 axios가 본문을 `_searchParams=%5Bobject+Map%5D`로 잘못 직렬화한다(CR F14). 로그인 동작이 이 교체에 기대므로 auth.ts:8-20을 바꾸지 않는다(C-5).
- jest-expo 환경에서 어느 구현이 쓰이는지는 확인하지 않았다. 판정 도구는 `String(value)`와 심볼 키 순회로 두 구현을 모두 다룬다(acceptance.md §1.3).

### §H.5 babel 스트립과 `__DEV__` ✔

- `babel.config.js:10`: `env.production.plugins: [['transform-remove-console', { exclude: ['error'] }]]`(커밋 b8d9096).
- babel-preset-expo는 운영 변환에서 `__DEV__`를 `false` 상수로 바꿔 넣는다(`node_modules/babel-preset-expo/build/index.js:129-131`). 운영 여부는 Metro가 넘기는 `caller.isDev`로 판단한다(`build/common.js:97-103`, `@expo/metro-config/build/babel-transformer.js:54`의 `isDev: options.dev`). Metro 프렐류드도 같은 값으로 `__DEV__`를 정한다(`metro/src/lib/getPreludeCode.js:11`).
- 그래서 `if (__DEV__)` 게이트는 운영 빌드에서 닫힌다. envName(`BABEL_ENV`/`NODE_ENV`)을 미리 설정하면 스트립이 조용히 꺼질 수 있다는 조사 쟁점(C3)과 관계없다.
- jest에서는 `NODE_ENV=test`라 이 치환이 일어나지 않는다. `__DEV__`는 `react-native/jest/setup.js:21-27`에서 `writable: true`로 정의한 전역이므로 테스트 안에서 바꿀 수 있다. babel 스트립도 jest에서는 돌지 않는다.

### §H.6 서버 422의 입력값 반사 (ED F5, 중간 신뢰도)

- 형제 저장소 kmcbeauty-fastapi는 fastapi 0.139.0, pydantic 2.13.4이며 커스텀 예외 핸들러는 RateLimitExceeded 하나다(app/main.py:96). 기본 검증 핸들러는 `{"detail": jsonable_encoder(exc.errors())}`를 돌려준다.
- pydantic은 오류마다 검증에 들어온 값을 `input`에 넣는다. 백엔드 venv에서 실행한 결과 비밀번호가 짧으면 `"input": "abc"`, 필드가 빠지면 본문 전체가 들어갔다. `UserCreate.password`와 `UserUpdate.password`는 모두 `min_length` 제약이 있다(app/schemas/user.py:59-62, :79-82).
- 실행 중인 백엔드에 요청해 확인하지는 않았다.
- 이 백엔드의 오류 본문이 `{ "detail": … }` 형태라는 점이 I-1 해석의 근거다. 한편 클라이언트는 `detail`이 `{ code, detail, hint }` 객체인 응답도 다룬다(client.ts:295-297, :308 ✔).

### §H.7 객체 `detail` 422에서 생기는 TypeError ✔ (이번에 찾은 잠재 결함)

- base.ts:106은 `const errorMessage = error.response.data?.detail || error.response.data?.message || '';`이고 :107이 `errorMessage.includes('required')`를 부른다.
- `detail`이 객체면 `includes`가 없어 `TypeError: errorMessage.includes is not a function`이 catch 블록 안에서 던져지고 원래 AxiosError를 대신한다. 이 두 줄의 로직을 Node로 흉내 내 확인했다. `detail`이 배열이면 `Array.prototype.includes`가 원소 일치만 보므로 추정 문구가 나오지 않는다.
- 이 줄들은 `console.*` 호출이 아니어서 babel이 지우지 않는다. 지금 운영 빌드에서도 실행된다. 백엔드가 객체 `detail`로 422를 돌려주는 경로가 있는지는 확인하지 못했다.
- 대응: REQ-SEC-002-004, AC-SEC-002-05의 e 경우.

### §H.8 테스트 현황과 기준선 ✔

- `console.error`를 spy하는 테스트는 없다. 콘솔 spy는 `treatmentPagination.test.ts:16`의 `console.warn` 하나뿐이다(SPEC-DATA-001 상한 경고).
- base.ts, auth.ts, invite.ts, `authStore.login`, app/login.tsx를 실행하는 테스트는 없다. 서비스를 쓰는 테스트는 서비스 모듈을 mock한다.
- jest-expo가 `ExpoSecureStore` 네이티브 모듈을 mock한다(`node_modules/jest-expo/src/preset/moduleMocks/expoModules.js:602`, `:1237`). 그래서 authStore를 실제로 불러 테스트할 수 있다.
- `axios`는 `AxiosError` 클래스와 `toJSON`을 export한다(`node -e`로 확인).
- 기준선(`5731c73`, 2026-10-17 측정):
  - `npx jest --silent` → `Test Suites: 24 passed, 24 total`, `Tests: 112 passed, 112 total`, `Snapshots: 1 passed, 1 total`
  - 보존 대상 7개 파일(clientInterceptors, api-client, storeLoaders, profileDeadMenu, loginFormDemo, treatmentPagination, store-selector) → `Test Suites: 7 passed`, `Tests: 23 passed`. clientInterceptors는 11개다
  - `npx tsc --noEmit` → `error TS` 2건(`components/modals/EditTreatmentModal.tsx(123,11)`, `(395,9)`), exit 2
  - `npm run lint` → `✖ 7 problems (2 errors, 5 warnings)`. 오류는 `src/types/unified.ts` 2건, 경고는 `src/api/client.ts:198` 1건과 `src/stores/authStore.ts` 4건(:26, :47, :75, :78)

### §H.9 로그가 가는 곳 (CR F6, ED F2, 기기 재현 없음)

- RN 콘솔 폴리필이 `nativeLoggingHook`으로 출력한다. Hermes와 JSC가 같다.
- Android: logcat main 버퍼에 태그 `ReactNativeJS`, ERROR 수준으로 쓴다(JSLogging.cpp:17-19). ExceptionsManager가 운영 빌드의 `console.error`를 non-fatal 예외로 보고하면서 `FLog.e("ReactNative", …)`로 한 번 더 남긴다(ExceptionsManagerModule.kt:56). 같은 내용이 두 번 기록된다.
- iOS: `os_log`(`com.facebook.react.log`, `javascript`)에 `%{public}s`로 쓴다(RCTLog.mm:100, :113). 가려지지 않으며 error 수준 메시지는 기기 로그 저장소에 남는다.
- 크래시 리포팅·로그 수집 SDK는 없다(package.json, app.json). 노출 범위는 기기 로그와 기기에 연결한 도구다.

### §H.10 출처와 이력 ✔ (`git log -S` 확인)

- invite.ts:86-89의 `password: '***'` 가림은 05b5f76(2025-09-16 "직원관리")에서 들어왔다. e967a4e가 아니다. 이 가림은 `console.log` 안에 있어 운영에서는 어차피 지워지고 같은 흐름의 base.ts:66이 가리지 않은 본문을 다시 찍으므로 효과가 없다.
- `'PRESENT'`/`'NONE'` 표시는 e967a4e(2026-07-03)에서 들어왔다. 코드 주석은 SPEC-SECURITY-001 REQ-SEC-005를 인용한다.
- client.ts의 `if (__DEV__)` 게이팅은 2025-09부터 있었고 cc2177f(2026-07-07, SPEC-UX-001)가 넓혔다.
- `transform-remove-console`은 b8d9096(2026-07-07 보안 핫픽스)에서 들어왔다. 커밋 메시지의 "고객 PII·서버 에러 원문 로깅 전역 해소"는 `console.error`에는 해당하지 않는다.
- base.ts의 마지막 수정은 05b5f76(2025-09-16)이다. 2026년의 어느 SPEC도 base.ts를 바꾸지 않았다.

### §H.11 참고 구현 ✔

- `__DEV__` 게이팅: client.ts:36, :40, :51, :225-227, :229, :247, :251-265, :268, :280-282, :289-304, :426-428.
- 값 대신 유무만 남기기: client.ts:260·:300의 `'PRESENT'`/`'NONE'`, :226의 `{ hasToken: true }`, base.ts:47·:116의 `'있음'`/`'없음'`.
- 서비스·스토어 모킹 테스트: `profileDeadMenu.test.tsx:11-25`.
- 인터셉터 핸들러 직접 호출과 bare axios 스파이: `clientInterceptors.test.ts:27-35`(storeLoaders·expo-router 모킹), `:56`(mock adapter), `:59`(`jest.spyOn(axios, 'post')`).

### §H.12 관련 문서

- `.moai/project/product.md` §6.1(:165), §9.1 로드맵 1번(:240-245), 로드맵 13번(:287)
- `.moai/project/tech.md` §5.4(jest 타임아웃), §6.2(:278-283), §6.3(:285-290)
- `.moai/specs/SPEC-UX-001/spec.md` :54(범위표), :98-101(REQ-UX-008), :133(AC-10)
- 외부 기준: OWASP MASVS-STORAGE-2, MASWE-0005, CWE-532, OWASP Logging Cheat Sheet(spec.md §8)
