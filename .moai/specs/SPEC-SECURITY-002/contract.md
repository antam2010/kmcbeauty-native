# SPEC-SECURITY-002 평가 계약 (Phase 10)

> 대상: `spec.md` v0.1.3 · `plan.md` · `acceptance.md`(2026-11-09 수정본, `71b0455`). plan.md와 acceptance.md는 바꾸지 않고, spec.md는 frontmatter 상태 전환만 허용한다(결정 D-C1). 하네스 thorough, 평가 프로필 strict, 협상 1회차와 오케스트레이터 결정으로 합의했다. 모든 기준의 상태는 `new`다.
> 이 계약은 수용 기준을 보충한다. 수용 기준과 이 계약이 같은 대상을 함께 재면 둘 다 만족해야 한다.
> 실행 규칙: 저장소 루트에서 `LC_ALL=C.UTF-8`로 실행하고 `grep`은 `command grep`(GNU grep)으로 부른다. acceptance.md의 bash 블록은 글자 그대로 뽑아 `bash <파일>`로 돌린다. 코드·테스트 비교 기준은 `80b5e8a`, SPEC 산출물 비교 기준은 `71b0455`이고 줄 번호는 `5731c73` 기준이다(인용한 줄은 `80b5e8a`에서도 같다, D-C6). `<증거>`는 구현 에이전트에게는 `.moai/state/verify/SPEC-SECURITY-002/<마일스톤>/`, 검토자에게는 자기 세션의 스크래치패드다.

## 협상 결과 (오케스트레이터 결정)

- **D-C1** spec.md frontmatter의 `status: draft → in-progress`와 `updated:` 전환은 첫 커밋(M1+M2)에서 한다(spec-frontmatter-schema.md Status Transition Ownership Matrix). 그 밖의 spec.md 변경은 금지한다. C-CM-01과 C-CM-06에 반영했다.
- **D-C2** 구현 에이전트는 원문 증거를 `.moai/state/verify/SPEC-SECURITY-002/<마일스톤>/`에 쓸 수 있다(gitignore 대상). 다른 `.moai/state/` 경로는 건드리지 않는다.
- **D-C3** 구현 에이전트는 M1이 끝나면 멈춘다. 새 테스트는 M1 검토를 통과하기 전까지 커밋하지 않고, 이후 테스트 파일을 바꾸면 보고한다.
- **D-C4** 판정 함수(`includesText`, `containsRef`, `hasExactValue`, 콘솔 스파이 도구)는 `__tests__/utils/consoleArgs.ts` 한 곳에 둔다.
- **D-C5** 첫 커밋 제목은 `M1+M2`로 시작한다. 이후 커밋은 마일스톤 번호(`M3`, `M4`, `M5`)로 시작한다.
- **D-C6** (2026-11-09, 사용자 결정) plan을 확정한 뒤 이 SPEC 밖의 커밋 `a53f3b3`(비밀번호 최소 길이 4자→8자)과 `80b5e8a`(입력란 안내 문구 8자)가 범위 파일 두 개를 바꿨다. 그래서 옛 기준 `5731c73`으로 재면 구현 전부터 AC-SEC-002-09 명령 6이 `12`를 내고 C-CM-01·C-M1-01이 실패했다. 수용 기준을 `71b0455`에서 정식으로 고쳤고(비교 기준 `80b5e8a`로 통일, plan 재감사 review-4 PASS 0.96), 이 계약의 비교 기준과 C-CM-01 해시도 같이 옮겼다.

## 공통 기준

판정 규칙
- 기준은 PASS와 FAIL로만 판정한다. 실행 증거가 없는 기준은 FAIL이다.
- 앞 마일스톤에서 통과한 정적 기준은 대상 파일이 다시 바뀌면 다시 돌린다. 회귀하면 그 마일스톤이 FAIL이다.
- 결함은 blocking(REQ·AC·이 계약 위반)과 optional로 나눈다. optional만 있으면 FAIL이 아니다.
- M1의 선택 보강 X1~X6은 판정 대상이 아니다. 없어도 검증하지 않은 경계 사례로 세지 않는다.

모든 마일스톤에서 확인하는 기준
- **C-CM-01** `new` SPEC 산출물 무변경. `git diff --stat 71b0455 -- .moai/specs/SPEC-SECURITY-002/plan.md .moai/specs/SPEC-SECURITY-002/acceptance.md` → 출력 없음. 두 파일의 `sha256sum` 앞 16자리 → `4ce63ed0f3a76741`, `fea860dfa63bdeb5`. spec.md는 M1에서 `sha256sum` 앞 16자리가 `79a9cc9482a717d7` 그대로이고, 첫 커밋(M1+M2)부터는 frontmatter의 `status`와 `updated` 두 줄만 바뀐다: `git diff -U0 71b0455 -- .moai/specs/SPEC-SECURITY-002/spec.md | command grep -E '^[+-][^+-]' | command grep -vcE '^[+-](status|updated): '` → `0`, `command grep -c '^status: in-progress$' .moai/specs/SPEC-SECURITY-002/spec.md` → `1`.
- **C-CM-02** `new` (M2~M5) 테스트 고정. 새 테스트 파일과 판정 도구 파일의 `sha256sum`이 M1 기록(C-M1-10)과 같다. 바뀌었다면 바뀐 파일로 C-M1-02·03을 기준 코드에서 다시 통과시킨다(스크래치 복사본의 운영 파일을 `git show 80b5e8a:<경로>`로 되돌린다). 그리고 diff에 단언·경우 삭제, 표식 값 변경, 조건 완화가 없음을 읽어 확인한다.
- **C-CM-03** `new` AC-SEC-002-13의 네 검사가 기대값을 낸다.
- **C-CM-04** `new` 테스트 제외·스냅숏 금지. `command grep -nE '\b(it|test|describe)\.(only|skip|todo)\b|\b(xit|xtest|xdescribe|fit|fdescribe)\(|toMatch(Inline)?Snapshot' __tests__/baseServiceLogging.test.ts __tests__/authStoreLogging.test.ts __tests__/profilePasswordLogging.test.tsx __tests__/refreshLogging.test.ts` → 출력 없음.
- **C-CM-05** `new` 헬퍼·정제·직렬화 금지. 아래 명령 → `0`(지금 `0`).
  ```bash
  git diff -U0 80b5e8a -- src/api/services/base.ts src/api/client.ts app/login.tsx components/forms/InviteSignupForm.tsx components/forms/LoginForm.tsx src/stores/authStore.ts 'app/(tabs)/profile.tsx' | command grep -E '^\+[^+]' | command grep -vE '^\+[[:space:]]*//' | command grep -cE '\bfunction\b|=>|redact|sanitize|toJSON|JSON\.stringify\([[:space:]]*error[[:space:]]*[,)]'
  ```
- **C-CM-06** `new` (M2~M5) 커밋. 마일스톤마다 새 커밋이 하나 이상 있다. 각 커밋의 제목은 `^[a-z]+\(SPEC-SECURITY-002\): M[1-5]` 꼴의 한국어이고(첫 커밋은 `M1+M2`로 시작), 메시지 마지막 줄은 `🗿 MoAI <email@mo.ai.kr>`다. `git show --name-only --format= <sha>`는 아래 목록 안에 있다. `git branch -r --contains HEAD`는 출력이 없다(push 안 함).
  - M1+M2: `src/api/services/base.ts`, `__tests__/baseServiceLogging.test.ts`, `__tests__/utils/consoleArgs.ts`, `.moai/specs/SPEC-SECURITY-002/spec.md`(frontmatter `status`·`updated`만)
  - M3: `src/api/client.ts`, `__tests__/refreshLogging.test.ts`
  - M4: spec.md §3.2의 다섯 파일, `__tests__/authStoreLogging.test.ts`, `__tests__/profilePasswordLogging.test.tsx`
  - M5: spec.md §3.4의 운영 파일 7개 가운데 바뀐 것
  - 모든 마일스톤: `.moai/specs/SPEC-SECURITY-002/progress.md`, `.moai/specs/SPEC-SECURITY-002/contract.md`

## M1

산출물은 새 테스트 4개와 판정 도구 파일 `__tests__/utils/consoleArgs.ts`다(D-C4). 운영 코드는 바꾸지 않고 커밋도 하지 않는다.

- **C-M1-01** `new` 범위. `git diff --name-only 80b5e8a -- app components src hooks contexts babel.config.js __tests__` → 출력 없음. `git ls-files --others --exclude-standard -- __tests__` → 새 테스트 4개와 `__tests__/utils/consoleArgs.ts`뿐이다.
- **C-M1-02** `new` RED 결과. 아래 실행 결과가 다음을 모두 만족한다.
  - (1) `runtimeError=0 pending=0 todo=0`이다.
  - (2) AC-SEC-002-01·02·03·06·07·08·10·11의 테스트는 모두 `failed`이고, ID마다 1개 이상이다.
  - (3) AC-SEC-002-05는 이름에 `[e]`가 든 테스트만 두 모드 모두 `failed`이고 나머지는 모두 `passed`다.
  - (4) AC ID가 없는 보조 테스트는 `passed`다.
  - (5) 각 ID가 정해진 파일에 있다: 01·02·03·05는 baseServiceLogging, 06·07은 authStoreLogging, 08은 profilePasswordLogging, 10·11은 refreshLogging.
  ```bash
  npx jest __tests__/baseServiceLogging.test.ts __tests__/authStoreLogging.test.ts __tests__/profilePasswordLogging.test.tsx __tests__/refreshLogging.test.ts --json --outputFile=<증거>/red.json > <증거>/red.txt 2>&1; echo "exit=$?"
  node -e "const r=require(process.argv[1]); console.log('runtimeError='+r.numRuntimeErrorTestSuites+' pending='+r.numPendingTests+' todo='+r.numTodoTests); for (const s of r.testResults) for (const a of s.assertionResults) console.log(a.status+' | '+require('path').basename(s.name)+' | '+a.fullName)" <증거 절대 경로>/red.json
  ```
- **C-M1-03** `new` RED 사유. `command grep -E 'Test suite failed to run|Cannot find module|SyntaxError|ReferenceError|Exceeded timeout|ENOTFOUND|ECONNREFUSED|EAI_AGAIN|is not a function' <증거>/red.txt | command grep -vc 'errorMessage.includes is not a function'` → `0`. `red.txt`의 실패 블록(`●`)을 읽고 실패한 단언이 다음과 같음을 확인한다.
  - AC-01·10: 콘솔 호출 수(기대 0)
  - AC-02·03·06·07·08·11: `includesText`나 `containsRef`에 거짓을 기대한 단언
  - AC-05 `[e]`: 거부값이 `TypeError: errorMessage.includes is not a function`
  - 진단 정보나 실패 뒤 동작을 보는 긍정 단언에서 실패했다면 사유가 틀린 것이다.
- **C-M1-04** `new` 보존 스위트. AC-SEC-002-12 표 첫 행의 jest 명령 → `Test Suites: 7 passed, 7 total`, `Tests: 23 passed, 23 total`.
- **C-M1-05** `new` 타입·린트. AC-SEC-002-14 명령 2·3·4가 기대값을 낸다. `command grep -nE '\bglobal(This)?\.__DEV__' <새 테스트 4개>` → 출력 없음. 모드 전환은 `(global as any).__DEV__`로 쓴다.
- **C-M1-06** `new` 판정 도구 구현. 판정 함수를 정의한 파일을 읽어 acceptance.md §1.2~1.5를 모두 갖췄는지 확인한다.
  - 스파이: 다섯 메서드(`log`·`info`·`warn`·`error`·`debug`)에 걸고 `mockImplementation(() => {})`로 막으며, 끝난 뒤 `jest.restoreAllMocks()`로 되돌린다.
  - `includesText`: `String(value)`, 예외를 잡은 `JSON.stringify`, Map·Set 항목, `Reflect.ownKeys`(열거 불가 키·심볼 키), getter 예외 건너뛰기, 방문 집합, 함수·`null`·`undefined` 건너뛰기를 모두 갖춘다.
  - `containsRef`는 같은 순회로 `===`를 비교하고, `hasExactValue`는 렌더링 없이 문자열·숫자만 비교한다.
  - `__DEV__`를 바꾼 테스트는 원래 값을 `afterEach`나 `finally`에서 되돌린다.
  - `command grep -nE 'JSON\.stringify\([^)]*mock' <새 테스트 파일과 판정 도구 파일>` → 출력 없음.
- **C-M1-07** `new` 판정 도구 프로브. 스크래치 복사본에서 아래 표를 실행해 결과가 모두 기대와 같다. 판정 함수는 `__tests__/utils/consoleArgs.ts`에서 불러온다. 표식 값은 acceptance.md §1.1을 따른다.

  | ID | 인자 | 호출 | 기대 |
  |----|------|------|------|
  | H-1 | `[new URLSearchParams({ username: 'u', password: PW })]` | `includesText(·, PW)` | 참 |
  | H-2 | 열거 불가 심볼 키에 PW를 둔 객체 | `includesText(·, PW)` | 참 |
  | H-3 | 열거 불가 속성에 PII를 둔 `Error` | `includesText(·, PII)` | 참 |
  | H-4 | `new Map([['k', TOKEN]])`, `new Map([[TOKEN, 1]])`, `new Set([XHR])` 각각 | `includesText` | 모두 참 |
  | H-5 | 자기 참조 객체 `{ a: PW, self }` | `includesText(·, PW)` / `(·, 'absent')` | 참 / 거짓, 끝까지 돈다 |
  | H-6 | 예외를 던지는 getter와 `ok: PW`를 가진 객체 | `includesText(·, PW)` | 참, 예외 없음 |
  | H-7 | §1.7 모양의 AxiosError(`config.data`에 PW) | `includesText(·, PW)` | 참 |
  | H-8 | `[{ a: 'safe' }, 'x', 1, null, undefined, () => 'PW-SENTINEL-7f3a']` | `includesText(·, PW)` | 거짓 |
  | H-9 | `['Request failed with status code 422']` / `[{ status: 422 }]` | `hasExactValue(·, '422')` | 거짓 / 참 |
  | H-10 | `t = {}`에 대해 `[{ nested: [t] }]` / `[{ ...t }]` | `containsRef(·, t)` | 참 / 거짓 |

- **C-M1-08** `new` 표식과 픽스처. `command grep -ohE '(PW|TOKEN|PII|XHR)-SENTINEL-[0-9a-z]+' <새 테스트 파일과 판정 도구 파일> | sort -u` → 정확히 `PII-SENTINEL-4b2d`, `PW-SENTINEL-7f3a`, `TOKEN-SENTINEL-9c1e`, `XHR-SENTINEL-1d8e` 네 줄. 에러는 §1.7대로 실제 `AxiosError`이고, 응답이 `config`·`request`를 품으며, 메시지에는 표식이 없다(읽기).
- **C-M1-09** `new` 경우 완전성. 각 테스트를 읽어 아래 경우표의 경우와 Then 조건을 빠짐없이 담았는지 확인한다. AC-05는 경우와 모드마다 테스트가 나뉘고 이름에 `[a]`~`[g]`가 든다.
- **C-M1-10** `new` RED 기록. progress.md §E.2에 다음이 있다: RED 명령, 종료 코드, C-M1-02의 상태 목록, AC마다 첫 실패 메시지 발췌(원문), 전체 출력 경로, 새 테스트 파일과 판정 도구 파일의 `sha256sum` 출력. 검토자가 다시 낸 상태 목록과 `sha256sum` 값이 기록과 같다.

경우표: 테스트가 반드시 담을 경계 사례(acceptance.md §3 E-1~E-10 포함)
- AC-01(운영): post 성공·500·422(detail 문자열, errors 객체)·401, get 성공·500·401. 다섯 스파이 호출 합이 0이다.
- AC-02(개발): post 500·422(배열 detail과 errors, `input` 없음)·401, get 500·401(`params.q`에 PII), post·get 각각 응답 없는 `Error`.
  - 표식 4종은 거짓, 메시지와 경로는 참이다.
  - 응답이 있으면 `hasExactValue(String(status))`가 참이고, 422는 서버 문구 둘이 참이다.
- AC-03(개발): URLSearchParams 로그인 post(Authorization이 든 config), 가입 post, get(`params`·Authorization). `defaults.headers`와 성공 응답에 표식을 넣는다. 표식 3종이 거짓이다.
- AC-05(두 모드): a·b·f·g는 get과 post, c·d·e는 post에서 실행하고 모두 `rejects.toBe(error)`다.
- AC-06(두 모드): login 성공 뒤 getMe가 AxiosError 500(Bearer 표식, 응답 본문 PII)으로 거부한다.
  - `rejects.toBe`가 성립한다.
  - 표식 3종, `containsRef(error)`, `containsRef(error.config)`는 거짓이다.
  - `console.error` 인자에 메시지와 `'500'`이 있다.
  - `error` 상태는 메시지와 같고 `isLoading`은 false다.
- AC-07: 호출마다 스토어를 정해진 상태로 둔 뒤 logout(AxiosError 500)과 loadUser(AxiosError 401 / 응답 없는 `Error`)를 부른다.
  - 거부되지 않는다.
  - logout 뒤 `isAuthenticated`는 false, `accessToken`은 null이고, loadUser 뒤 `error`는 메시지와 같다.
  - TOKEN, PII, `containsRef(error)`는 거짓이다.
  - 메시지는 참이고, AxiosError면 상태도 참이다.
- AC-08: 화면을 그리고 '비밀번호 변경'을 누른 뒤 두 입력란에 PW를 넣고 '변경'을 누른다.
  - a 422(`config.data`에 PW, Bearer, 응답 `input`에 PW)는 Alert('오류', '입력한 정보가 올바르지 않습니다.')가 1회 불린다.
  - b 응답 없는 `Error`는 제목 '오류'인 Alert가 불리지 않는다.
  - 두 경우 PW, TOKEN, `containsRef(error)`는 거짓이고 메시지는 참이다. a는 `'422'`도 참이다.
- AC-10(운영, 모듈을 불러온 뒤 스파이): a 401(`detail`, XHR), b `ERR_NETWORK`(request만), c 응답·요청 없는 `Error`. `testRefreshToken()` 동안 `console.error` 호출이 0이다.
- AC-11(개발): AC-10과 같은 세 경우.
  - error·request·config의 `containsRef`와 XHR 표식은 거짓이다.
  - 메시지는 참이고, a는 `'401'`과 'Refresh token expired'도 참이다.

선택 보강(판정에 넣지 않음)
- X1: AC-02 본문의 `name`에도 PII 표식을 넣은 추가 경우
- X2: AC-02 가에 셋째 인자 `{ headers: { Authorization: 'Bearer ' + TOKEN_SENTINEL } }`를 준 추가 경우
- X3: AC-11에 `includesText(args, TOKEN_SENTINEL)`이 거짓이라는 단언 추가
- X4: AC-07·08을 운영 모드에서도 실행
- X5: H-1~H-10을 새 테스트 파일 안의 자기 검사로 둔다(새 파일은 만들지 않는다)
- X6: 새 테스트 4개를 `--randomize`로 seed를 바꿔 두 번 실행

## M2

- **C-M2-01** `new` `npx jest __tests__/baseServiceLogging.test.ts 2>&1 | tail -n 5` → 실패 0. AC-SEC-002-01·02·03·05의 확인 명령(`-t`) → 각각 실패 0, 통과 1개 이상.
- **C-M2-02** `new` AC-SEC-002-04의 다섯 명령 → `0`, `0`, `0`, `0`, `1` 이상.
- **C-M2-03** `new` 요청 본문 `data`와 호출자 `config`(REQ-SEC-002-002 1·3번)는 매개변수 선언과 `this.client.*()` 호출 인자로만 쓴다. 아래 명령 → `0`(지금 `7`).
  ```bash
  command grep -nE '((^|[^.?[:alnum:]_])|\.\.\.)(data|config)\b' src/api/services/base.ts | command grep -vE '^[0-9]+:[[:space:]]*//' | command grep -vcE '(data|config)\?: any|this\.client\.(get|post|put|patch|delete)\('
  ```
- **C-M2-04** `new` Authorization 값과 `error.config`(REQ-SEC-002-002 3·8번)는 유무 표시 삼항식에만 쓴다. `command grep -nE 'Authorization|\berror\??\.config\b' src/api/services/base.ts | command grep -vE '^[0-9]+:[[:space:]]*//' | command grep -vcF "Authorization ? '있음' : '없음'"` → `0`.
- **C-M2-05** `new` 게이트와 다시 던지기. `git diff 80b5e8a -- src/api/services/base.ts`를 읽어 다음을 확인한다.
  - get()·post()의 콘솔 호출은 모두 `if (__DEV__)` 블록 안에 있다.
  - 422 누락 필드 추정 분기는 게이트 안에 있고, 값이 문자열일 때만 `includes`를 부른다.
  - `command grep -c 'throw error;' src/api/services/base.ts` → `2`.
- **C-M2-06** `new` 기존 로그 문구 유지(acceptance.md §4). 아래 명령 → 출력 없음.
  ```bash
  git diff -U0 80b5e8a -- src/api/services/base.ts src/api/client.ts | command grep -E '^\+[^+]' | command grep -oE "console\.[a-z]+\('[^']*'" | sed -E "s/^console\.[a-z]+\(//" | sort -u | while IFS= read -r p; do git show 80b5e8a:src/api/services/base.ts 80b5e8a:src/api/client.ts | command grep -qF -- "$p" || echo "NEW $p"; done
  ```
- **C-M2-07** `new` 운영 코드에 로그용 함수를 만들지 않는다(같은 파일 안의 지역 함수 포함). C-CM-05 → `0`, `command grep -cE '^  [A-Za-z_$]' src/api/services/base.ts` → `8`.
- **C-M2-08** `new` 범위.
  - 아래 awk → `0`(`put`·`patch`·`delete`·`buildQueryString`은 바꾸지 않는다):
    `git diff -U0 80b5e8a -- src/api/services/base.ts | awk '/^@@/ { split($2,a,","); s=substr(a[1],2)+0; n=(a[2]==""?1:a[2]+0); e=(n==0?s:s+n-1); if (e>=126) bad++ } END { print bad+0 }'`
  - `git diff --name-only 80b5e8a -- app components src hooks contexts babel.config.js` → `src/api/services/base.ts`. 이 파일 목록은 M2 시점의 기대값이다. 최종 트리의 파일 집합은 C-M4-05와 C-M5-06으로 판정한다(F8).
- **C-M2-09** `new` HT-05의 base.ts 부분을 만족한다.
- **C-M2-10** `new` 변이 MU-01~04가 모두 잡힌다(HT-06).

## M3

`<블록>`은 `sed -n '/^const refreshAccessToken/,/^};/p' src/api/client.ts | sed -n '/} catch (error/,$p'`의 출력이다.

- **C-M3-01** `new` `npx jest __tests__/refreshLogging.test.ts 2>&1 | tail -n 5` → 실패 0. AC-SEC-002-10·11의 확인 명령 → 각각 실패 0, 통과 1개 이상.
- **C-M3-02** `new` 범위. AC-SEC-002-13의 client.ts 변경 범위 검사 → `0`. `git diff --name-only 80b5e8a -- app components src hooks contexts babel.config.js` → `src/api/client.ts`, `src/api/services/base.ts`. 이 파일 목록은 M3 시점의 기대값이다. 최종 트리의 파일 집합은 C-M4-05와 C-M5-06으로 판정한다(F8).
- **C-M3-03** `new` catch 블록에 금지 값이 없다(REQ-SEC-002-009).
  - `<블록> | command grep -cE 'toJSON|JSON\.stringify|\bconfig\b|\bheaders\b'` → `0`(지금 `0`)
  - `<블록> | command grep -E 'console\.[a-z]+\(' | command grep -cE ',[[:space:]]*error[[:space:]]*[,)]|\berror\??\.request\b|\{[^}]*\berror\b[[:space:]]*[,}]'` → `0`(지금 `2`)
- **C-M3-04** `new` 다섯 줄.
  - `<블록> | command grep -cE "console\.[a-z]+\('(❌ 리프레시 토큰 갱신 실패|응답 상태|응답 데이터|네트워크 요청 실패|에러 메시지):'"` → `5`.
  - `<블록>`을 읽어 다섯 줄이 모두 `if (__DEV__)` 안에 있음을 확인한다.
  - 값 인자는 :97과 :112 자리가 `error.message`, :102가 상태, :103이 `error.response.data`다.
- **C-M3-05** `new` AC-SEC-002-12 전체(jest 7·23과 정적 검사) → 기대값.
- **C-M3-06** `new` C-M2-06 → 출력 없음. HT-05의 client.ts 부분을 만족한다.
- **C-M3-07** `new` 변이 MU-05·06이 잡힌다.

## M4

- **C-M4-01** `new` `npx jest __tests__/authStoreLogging.test.ts __tests__/profilePasswordLogging.test.tsx 2>&1 | tail -n 5` → 실패 0. AC-SEC-002-06·07·08의 확인 명령 → 각각 실패 0, 통과 1개 이상.
- **C-M4-02** `new` AC-SEC-002-09 명령 1~6의 기대값:
  - 명령 1: `components/forms/LoginForm.tsx`의 AsyncStorage 두 줄
  - 명령 2: 출력 없음
  - 명령 3: `2`·`1`·`3`·`3`·`1`
  - 명령 4: `0`·`0`·`0`·`2`·`0`
  - 명령 5: `8`
  - 명령 6: `0`
- **C-M4-03** `new` 지점마다 자기 문구를 지킨다. `command grep -noE "console\.error\('[^']*'" app/login.tsx components/forms/InviteSignupForm.tsx components/forms/LoginForm.tsx src/stores/authStore.ts 'app/(tabs)/profile.tsx'` → 아래와 한 글자도 다르지 않다(기준 커밋과 같은 값).
  ```text
  app/login.tsx:49:console.error('🔴 LoginScreen: 로그인 에러:'
  app/login.tsx:91:console.error('🔴 LoginScreen: 회원가입 에러:'
  components/forms/InviteSignupForm.tsx:122:console.error('회원가입 에러:'
  components/forms/LoginForm.tsx:42:console.error('저장된 이메일 로드 실패:'
  components/forms/LoginForm.tsx:54:console.error('이메일 저장 실패:'
  components/forms/LoginForm.tsx:80:console.error('🔴 LoginForm: 로그인 에러:'
  src/stores/authStore.ts:162:console.error('❌ 로그인 실패:'
  src/stores/authStore.ts:180:console.error('로그아웃 API 호출 실패:'
  src/stores/authStore.ts:210:console.error('❌ 사용자 정보 로드 실패:'
  app/(tabs)/profile.tsx:73:console.error('비밀번호 변경 실패:'
  ```
- **C-M4-04** `new` catch 줄은 annotation만 바꾼다(REQ-SEC-002-007). 아래 명령 → `0`(지금 `0`).
  ```bash
  git diff -U0 80b5e8a -- app/login.tsx components/forms/InviteSignupForm.tsx components/forms/LoginForm.tsx src/stores/authStore.ts 'app/(tabs)/profile.tsx' | command grep -E '^\+[[:space:]]*\}?[[:space:]]*catch' | command grep -vcE '^\+[[:space:]]*\}[[:space:]]*catch \(error: any\) \{[[:space:]]*$'
  ```
- **C-M4-05** `new` 범위와 계약. `git diff --name-only 80b5e8a -- app components src hooks contexts babel.config.js` → spec.md §3.4의 운영 파일 7개. AC-SEC-002-12 전체 → 기대값. C-CM-05 → `0`.
- **C-M4-06** `new` 변이 MU-07~10이 모두 잡힌다.

## M5

- **C-M5-01** `new` AC-SEC-002-15 → `2`, `1` 이상, `3` 이상, `1` 이상. `command grep -c '@MX:ANCHOR' src/api/services/base.ts` → `3` 이하, `command grep -c '@MX:WARN' src/api/services/base.ts` → `5` 이하.
- **C-M5-02** `new` 태그 위치.
  - `awk '/@MX:ANCHOR/{f=1;next} f && !/^[[:space:]]*(\/\/ @MX:|$)/{print; f=0}' src/api/services/base.ts` → `  protected async get<T>(`, `  protected async post<T>(` 두 줄.
  - `awk '/@MX:WARN/{f=1;next} f && !/^[[:space:]]*(\/\/ @MX:|$)/{print NR": "$0; f=0}' src/api/services/base.ts` → 한 줄. 이 줄은 post() 서명과 put() 서명 사이의 catch 안에 있고, `'❌ API POST 실패:'` 로그 호출이거나 그 호출을 바로 감싼 `if (__DEV__) {`다.
- **C-M5-03** `new` 태그 내용(읽기).
  - 설명은 한국어이고 `[AUTO]`로 시작한다.
  - ANCHOR는 서비스 공통 경계이며 잡은 에러를 같은 참조로 다시 던진다고 적는다.
  - REASON에 fan_in(get 15, post 13)이 있다.
  - WARN은 로그에 넣지 않는 값(요청 본문, 요청 설정, 에러 객체, `error.request`, `error.response`, Authorization 값)을 적는다.
  - `@MX:SPEC: SPEC-SECURITY-002`가 있다.
- **C-M5-04** `new` AC-SEC-002-01~15를 적힌 명령으로 실행해 모두 PASS다. progress.md §E.2에는 AC마다 명령, 출력 원문(50줄을 넘으면 종료 코드·끝부분·전체 출력 경로), 판정이 있고 §E.3이 채워져 있다.
- **C-M5-05** `new` 최종 트리에서 C-CM-01~05, C-M2-02~08, C-M3-02~04·06, C-M4-02~05를 다시 돌려 모두 PASS다.
- **C-M5-06** `new` 최종 파일 집합.
  - `git diff --name-only 80b5e8a HEAD -- app components src hooks contexts __tests__ babel.config.js` → 운영 파일 7개, 새 테스트 4개, `__tests__/utils/consoleArgs.ts`.
  - `git status --short -- app components src hooks contexts __tests__ babel.config.js` → 출력 없음.
- **C-M5-07** `new` 변이 재실행. 아래 명령이 `0`이 아니면 MU-01~10을 모두 다시 돌린다. `0`이면 M2~M4의 결과를 당시 커밋 SHA와 함께 인용한다.
  ```bash
  git diff -U0 <M4 커밋> HEAD -- src/api/services/base.ts src/api/client.ts app/login.tsx components/forms/InviteSignupForm.tsx components/forms/LoginForm.tsx src/stores/authStore.ts 'app/(tabs)/profile.tsx' | command grep -E '^[+-][^+-]' | command grep -vcE '^[+-][[:space:]]*(//|$)'
  ```
- **C-M5-08** `new` HT-01~HT-06을 모두 만족한다.

## 하드 임계값

- **HT-01** 전체 jest(AC-SEC-002-14 명령 1, 다른 무거운 명령 없이 단독 실행) → 실패 0, `Test Suites: 28 passed, 28 total`, `Tests: N passed, N total`(N ≥ 121), `Snapshots: 1 passed, 1 total`.
- **HT-02** 보존 스위트(AC-SEC-002-12의 jest) → `7 passed`, `23 passed`.
- **HT-03** 타입 검사(AC-SEC-002-14 명령 2·3) → `2` 이하, 파일은 `components/modals/EditTreatmentModal.tsx`뿐이다.
- **HT-04** 린트(AC-SEC-002-14 명령 4) → 오류 2개 이하, 경고 5개 이하. 요약 줄이 없으면 통과다.
- **HT-05** 범위를 좁힌 줄 커버리지. base.ts에서 get() 서명부터 put() 서명 전까지 실행되지 않은 줄이 0이고, client.ts의 갱신 실패 로그 다섯 줄이 모두 1회 이상 실행된다.
  - M2는 base.ts 부분, M3는 client.ts 부분, M5는 둘 다 본다. M2에서는 아래 첫 명령에서 refreshLogging과 client.ts 수집을 빼고, M3에서는 baseServiceLogging과 base.ts 수집을 뺀다.
  - 분기 커버리지와 저장소 전체 커버리지는 보고만 한다(acceptance.md §4).
  ```bash
  npx jest __tests__/baseServiceLogging.test.ts __tests__/refreshLogging.test.ts --coverage --collectCoverageFrom=src/api/services/base.ts --collectCoverageFrom=src/api/client.ts --coverageReporters=lcov --coverageDirectory=<증거>/cov > <증거>/cov.txt 2>&1
  G=$(command grep -n 'protected async get<T>(' src/api/services/base.ts | cut -d: -f1); P=$(command grep -n 'protected async put<T>(' src/api/services/base.ts | cut -d: -f1); awk -v g="$G" -v p="$P" '/^SF:.*src\/api\/services\/base\.ts$/{f=1;next} /^SF:/{f=0} f && /^DA:/{split(substr($0,4),a,","); if (a[1]+0>=g && a[1]+0<p && a[2]+0==0) print "UNCOVERED " a[1]}' <증거>/cov/lcov.info
  for n in $(command grep -nE "console\.[a-z]+\('(❌ 리프레시 토큰 갱신 실패|응답 상태|응답 데이터|네트워크 요청 실패|에러 메시지):'" src/api/client.ts | cut -d: -f1); do awk -v n="$n" '/^SF:.*src\/api\/client\.ts$/{f=1;next} /^SF:/{f=0} f && /^DA:/{split(substr($0,4),a,","); if (a[1]+0==n) print n, a[2]}' <증거>/cov/lcov.info; done
  ```
  기대: 둘째 명령은 출력이 없고, 셋째 명령은 다섯 줄을 내며 각 줄의 둘째 값이 1 이상이다.
- **HT-06** 살아남는 변이 0개. 스크래치 복사본에 아래 변경을 하나씩 넣고, 해당 기준의 확인 명령(`npx jest <파일> -t "<AC>"`)을 돌려 실패가 1개 이상 나와야 한다.

  | ID | 마일스톤 | 단일 변경 | 잡아야 하는 기준 |
  |----|----------|-----------|------------------|
  | MU-01 | M2 | post() catch 끝의 `throw error;`를 `return undefined as T;`로 바꾼다 | AC-SEC-002-05 |
  | MU-02 | M2 | get() catch 끝의 `throw error;`를 `throw new Error(error.message);`로 바꾼다 | AC-SEC-002-05 |
  | MU-03 | M2 | post() 개발 로그에서 `error.message` 값을 모두 지운다 | AC-SEC-002-02 |
  | MU-04 | M2 | post() 개발 로그에서 서버 응답 본문(`error.response.data`·`detail`·`errors`)을 담은 값을 모두 지운다 | AC-SEC-002-02 |
  | MU-05 | M3 | catch 블록에서 `error.response.data`를 남기는 로그를 지운다 | AC-SEC-002-11 |
  | MU-06 | M3 | catch 블록에서 상태 코드를 남기는 로그를 지운다 | AC-SEC-002-11 |
  | MU-07 | M4 | authStore `login` catch의 로그 줄을 `if (__DEV__)`로 감싼다 | AC-SEC-002-06 |
  | MU-08 | M4 | authStore `login` catch의 `throw error;`를 지운다 | AC-SEC-002-06 |
  | MU-09 | M4 | authStore `logout` finally의 `clearAuth();`를 지운다 | AC-SEC-002-07 |
  | MU-10 | M4 | profile.tsx의 422 알림 문구 '입력한 정보가 올바르지 않습니다.'를 바꾼다 | AC-SEC-002-08 |

- RED 유효성(C-M1-02·03)과 판정 도구 프로브(C-M1-07)도 임계값이다. 하나라도 어긋나면 M1은 FAIL이다.

## 보안 판정 기준

- strict 프로필에 따라 범위 안 발견이 하나라도 있으면 심각도와 관계없이 Security FAIL이고 전체도 FAIL이다.
- 범위는 base.ts 전체, client.ts `refreshAccessToken()`의 catch 블록, spec.md §3.2의 8곳, 새 테스트 파일이다.
- 판정 기준은 MASWE-0005, CWE-532, OWASP Logging Cheat Sheet의 "Data to exclude"(비밀번호, 토큰, 세션 식별값, 개인정보)다.
- 이 변경과 닿지 않는 OWASP 항목(입력 검증, 질의 매개변수화, 인증 엔드포인트 속도 제한, 보안 헤더)은 한 줄 사유와 함께 N/A로 적는다. N/A는 미검증이 아니다.
- 자격 증명 형태 검사: `command grep -nE 'eyJ[A-Za-z0-9_-]{10,}|PRIVATE KEY' <새 테스트 파일과 판정 도구 파일> <바뀐 운영 파일>` → 출력 없음.

마일스톤별 FAIL 조건
- M1: 다음 가운데 하나라도 해당하면 FAIL이다.
  - 운영 코드가 바뀐다(C-M1-01).
  - 누출을 보는 테스트가 RED에서 통과한다(C-M1-02 (2)).
  - H-1~H-7 가운데 하나가 기대와 다르다.
  - 자격 증명 형태 검사에 출력이 있다.
- M2: 다음 가운데 하나라도 해당하면 FAIL이다.
  - AC-SEC-002-01~04 가운데 하나가 실패한다.
  - C-M2-03·04·05 가운데 하나가 실패한다.
  - 개발 로그에 REQ-SEC-002-002의 여덟 값 가운데 하나가 들어 있다.
- M3: AC-SEC-002-10·11, C-M3-02·03·04, AC-SEC-002-12(인터셉터 계약 C-1~C-4) 가운데 하나라도 실패하면 FAIL이다.
- M4: 다음 가운데 하나라도 해당하면 FAIL이다.
  - AC-SEC-002-06·07·08, AC-SEC-002-09 명령 1·2·5, C-M4-04 가운데 하나가 실패한다.
  - 8곳 가운데 한 곳이라도 에러 객체, 에러 객체를 담은 객체·배열, `toJSON()`, `JSON.stringify(error)`, `error.config`·`error.request`·`error.response`를 넘긴다.
- M5: 다음 가운데 하나라도 해당하면 FAIL이다.
  - 위 조건 가운데 하나가 최종 트리에서 성립한다.
  - 검토자가 `git diff 80b5e8a HEAD -- <운영 파일 7개>`를 위 기준으로 읽다가 새 누출 경로를 찾는다.
  - 자격 증명 형태 검사에 출력이 있다.

발견으로 세지 않는 것(SPEC이 받아들인 위험)
- 개발 빌드 base.ts 로그의 서버 오류 응답 본문과 거기에 되돌아온 422 `input`(E-6, 결정 D-1), url 속 쿼리 문자열(E-8), Authorization 유무 표시, 메서드·상태 문구·시각
- 개발 빌드 갱신 실패 로그의 상태·메시지·`error.response.data`(REQ-SEC-002-009)
- 8곳 운영 로그의 기존 문구·`error.message`·HTTP 상태 코드(REQ-SEC-002-005)
- jest 실패 출력에 찍히는 표식 문자열

범위 밖 관찰(보고는 하되 세지 않는다. 심각도 `info`, 수정 요구 없음)
- spec.md §6이 뺀 곳: 이 SPEC이 고치지 않는 에러 통째 전달 `console.error`, `LoginForm.tsx:42`·`:54`, client.ts의 다른 로그 줄과 `authDebugUtils`, `invite.ts`, `babel.config.js`, README

## 마일스톤별 검토 절차

공통
1. 읽을 것: 이 계약, acceptance.md §1과 해당 AC, plan.md §B와 §F의 해당 마일스톤, progress.md §E.2의 해당 기록, `git diff 80b5e8a -- <해당 파일>`. 이전 마일스톤 검토 보고서의 판정은 근거로 쓰지 않는다.
2. grep·git·`sha256sum` 같은 가벼운 검사는 한 번에 묶어 돌린다. jest·tsc·lint는 서로 겹치지 않게 하나씩 돌린다(plan.md B-10).
3. 출력 원문은 `<증거>`에 저장한다. 출력이 50줄이나 2KB를 넘으면 보고서에는 종료 코드와 끝부분만 옮긴다.
4. 변이와 프로브는 스크래치패드의 복사본에서만 한다.
   - 복사: `rsync -a --exclude node_modules --exclude .git --exclude .moai --exclude .claude <저장소>/ <스크래치>/repo/`. `node_modules`는 심볼릭 링크로 잇는다.
   - 실행: `npx jest <파일> -t "<AC>" --runInBand --cacheDirectory <스크래치>/jest-cache`
   - 변이는 한 번에 하나만 넣고, 다음 변이 전에 원래 파일로 되돌린다. 프로젝트 트리는 바꾸지 않는다.
5. 보고: 기준 ID마다 PASS/FAIL과 증거(명령과 출력 원문)를 적는다. FAIL은 구조화 결함 목록(blocking/optional, 파일:줄, 필요한 수정)으로 적는다.

마일스톤별 순서
- M1:
  1. C-CM-01·03·04·05
  2. C-M1-01, C-M1-05(grep), C-M1-06, C-M1-08
  3. C-M1-02·03(RED 실행 1회)
  4. C-M1-04
  5. tsc → lint
  6. C-M1-09(읽기)
  7. C-M1-07(프로브)
  8. C-M1-10
- M2:
  1. C-CM-01~06
  2. C-M2-02~08
  3. C-M2-01(파일 1회와 `-t` 4회)
  4. HT-05의 base.ts 부분
  5. MU-01~04
  6. tsc → lint
- M3(작은 변경, tsc와 lint는 M5에서 본다):
  1. C-CM-01~06
  2. C-M3-02·03·04
  3. C-M3-01(`-t` 2회)
  4. C-M3-05
  5. C-M3-06
  6. MU-05·06
- M4(작은 변경):
  1. C-CM-01~06
  2. C-M4-02(acceptance.md 블록을 글자 그대로 `bash`로), C-M4-03·04
  3. C-M4-01(`-t` 3회)
  4. C-M4-05
  5. MU-07~10
  6. tsc → lint
- M5(최종 전체 평가):
  1. C-CM-01~06
  2. C-M5-01~03·06
  3. C-M5-05
  4. 보안 판정 기준에 따른 최종 diff 읽기
  5. C-M5-04
  6. HT-05(두 부분)
  7. C-M5-07
  8. 판정 도구 파일이 M1 뒤에 바뀌었으면 C-M1-07을 다시 실행
  9. tsc → lint
  10. HT-01(맨 끝, 단독)
