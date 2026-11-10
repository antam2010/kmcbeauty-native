# SPEC-SECURITY-002 진행 기록

## §E.1 Plan-phase Audit-Ready Signal

- plan_complete_at: 2026-10-18T12:30:22+09:00
- plan_status: audit-ready
- plan_audit: 감사 3회(review-1 FAIL 0.79 → review-2 PASS 0.92 → review-3 PASS 0.97), sync-auditor 교차 검증 AGREE(독립 점수 0.94). 보고서는 `.moai/reports/plan-audit/`에 있으며 gitignore 대상이라 로컬에만 있다.
- 남은 선택 결함: review-3의 N5, 교차 검증의 F1~F7. 모두 개발 빌드 로그 판정을 보강하는 항목이다. plan 산출물 해시를 지키려고 고치지 않았고, sync 단계에서 코드로 확인한다.
- 사용자 결정: plan.md §A.2의 D-1~D-4(개발 빌드 전용 게이팅, 인증 경로까지, Tier M, 감사 thorough).
- 2026-11-09 비교 기준 갱신(spec.md v0.1.3, 사용자 결정): plan 뒤 들어온 `a53f3b3`(비밀번호 최소 길이 4자→8자)과 `80b5e8a`(입력란 안내 문구 '(8자 이상)')는 이 SPEC 밖의 변경이다. `5731c73`과 비교하면 AC-SEC-002-09 명령 6이 `12`를 출력해 기대값 `0`을 맞출 수 없었다. 코드·테스트 비교 기준을 모두 `80b5e8a`로 옮겼다(AC-SEC-002-09 명령 6과 복사본 확인, AC-SEC-002-12의 `git diff`, AC-SEC-002-13의 `git diff` 세 줄과 client.ts 변경 범위 검사). AC-SEC-002-08의 입력란 문구를 '(8자 이상)'으로 고쳤다. "지금 값"은 `80b5e8a`에서 다시 쟀고 명령 6만 달라졌다(`5731c73` 기준 `12`, `80b5e8a` 기준 `0`). 줄 번호는 그대로다. plan 산출물 해시가 바뀌었으므로 plan 재감사가 필요하다.
- 2026-11-10 문구 정리(spec.md v0.1.4, manager-spec): run 단계 최종 검토의 F3·F6·F7을 반영해 spec.md §3.4와 HISTORY v0.1.3 항목, acceptance.md 머리말과 §6의 문구만 고쳤다. 요구사항·수용 기준의 뜻과 번호, 표식, 기대값, 명령은 그대로다.

## §E.2 Run-phase Evidence

### M1 — RED (2026-11-09, manager-develop)

- 기준: HEAD `bc692d4`(브랜치 `feature/refactor-hardening-2026-07`)에 커밋하지 않은 M1 파일 5개를 더한 작업 트리. 운영 코드는 바꾸지 않았고 커밋하지 않았다(D-C3).
- 산출물: 새 테스트 4개(`__tests__/baseServiceLogging.test.ts`, `__tests__/authStoreLogging.test.ts`, `__tests__/profilePasswordLogging.test.tsx`, `__tests__/refreshLogging.test.ts`)와 판정 도구 `__tests__/utils/consoleArgs.ts`(D-C4).
- 원문 증거 위치(gitignore 대상): `.moai/state/verify/SPEC-SECURITY-002/M1/`. 전체 출력은 `red.txt`, JSON은 `red.json`이다. 상태 목록 `red-status.txt`, AC별 첫 실패 블록 `red-first-failures.txt`, 실패 38건의 실패 줄 `red-faillines.txt`, C-M1-02 기계 판정 `c-m1-02-check.txt`, C-M1-03 grep `c-m1-03-grep.txt`, 해시 `sha256.txt`가 함께 있다.

RED 명령(저장소 루트에서 `LC_ALL=C.UTF-8`로 실행, contract.md C-M1-02의 두 명령):

```bash
npx jest __tests__/baseServiceLogging.test.ts __tests__/authStoreLogging.test.ts __tests__/profilePasswordLogging.test.tsx __tests__/refreshLogging.test.ts --json --outputFile=.moai/state/verify/SPEC-SECURITY-002/M1/red.json > .moai/state/verify/SPEC-SECURITY-002/M1/red.txt 2>&1; echo "exit=$?"
node -e "const r=require(process.argv[1]); console.log('runtimeError='+r.numRuntimeErrorTestSuites+' pending='+r.numPendingTests+' todo='+r.numTodoTests); for (const s of r.testResults) for (const a of s.assertionResults) console.log(a.status+' | '+require('path').basename(s.name)+' | '+a.fullName)" /home/antam2010/workSpace/_myproject/kmcbeauty/kmcbeauty-native/.moai/state/verify/SPEC-SECURITY-002/M1/red.json
```

- 종료 코드: `exit=1`(jest). `red.txt` 끝부분: `Test Suites: 4 failed, 4 total`, `Tests:       38 failed, 20 passed, 58 total`, `Snapshots:   0 total`.

상태 목록(위 node 명령의 출력 원문):

```text
runtimeError=0 pending=0 todo=0
failed | refreshLogging.test.ts | SPEC-SECURITY-002 client.ts 토큰 갱신 실패 로그 AC-SEC-002-10 운영 모드 토큰 갱신 실패: console.error 0건 경우 a: AxiosError 401 (응답 detail, request에 XHR 표식)
failed | refreshLogging.test.ts | SPEC-SECURITY-002 client.ts 토큰 갱신 실패 로그 AC-SEC-002-10 운영 모드 토큰 갱신 실패: console.error 0건 경우 b: 응답 없이 request만 있는 AxiosError (ERR_NETWORK, XHR 표식)
failed | refreshLogging.test.ts | SPEC-SECURITY-002 client.ts 토큰 갱신 실패 로그 AC-SEC-002-10 운영 모드 토큰 갱신 실패: console.error 0건 경우 c: 응답도 요청도 없는 Error
failed | refreshLogging.test.ts | SPEC-SECURITY-002 client.ts 토큰 갱신 실패 로그 AC-SEC-002-11 개발 모드 토큰 갱신 실패: 에러 객체·XHR 없음 경우 a: AxiosError 401 (응답 detail, request에 XHR 표식)
failed | refreshLogging.test.ts | SPEC-SECURITY-002 client.ts 토큰 갱신 실패 로그 AC-SEC-002-11 개발 모드 토큰 갱신 실패: 에러 객체·XHR 없음 경우 b: 응답 없이 request만 있는 AxiosError (ERR_NETWORK, XHR 표식)
failed | refreshLogging.test.ts | SPEC-SECURITY-002 client.ts 토큰 갱신 실패 로그 AC-SEC-002-11 개발 모드 토큰 갱신 실패: 에러 객체·XHR 없음 경우 c: 응답도 요청도 없는 Error
failed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-01 운영 모드에서 base.ts는 콘솔을 호출하지 않는다 post() 성공
failed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-01 운영 모드에서 base.ts는 콘솔을 호출하지 않는다 post() 실패 500
failed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-01 운영 모드에서 base.ts는 콘솔을 호출하지 않는다 post() 실패 422 (detail 문자열, errors 객체)
failed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-01 운영 모드에서 base.ts는 콘솔을 호출하지 않는다 post() 실패 401
failed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-01 운영 모드에서 base.ts는 콘솔을 호출하지 않는다 get() 성공
failed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-01 운영 모드에서 base.ts는 콘솔을 호출하지 않는다 get() 실패 500
failed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-01 운영 모드에서 base.ts는 콘솔을 호출하지 않는다 get() 실패 401
failed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-02 개발 모드 실패 로그: 표식 없음, 진단 정보 유지 가. post() 응답 500
failed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-02 개발 모드 실패 로그: 표식 없음, 진단 정보 유지 가. post() 응답 422 (detail 배열, errors 객체, input 없음)
failed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-02 개발 모드 실패 로그: 표식 없음, 진단 정보 유지 가. post() 응답 401
failed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-02 개발 모드 실패 로그: 표식 없음, 진단 정보 유지 나. get() 응답 500 (params.q에 표식)
failed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-02 개발 모드 실패 로그: 표식 없음, 진단 정보 유지 나. get() 응답 401 (params.q에 표식)
failed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-02 개발 모드 실패 로그: 표식 없음, 진단 정보 유지 다. post() 응답 없는 Error
failed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-02 개발 모드 실패 로그: 표식 없음, 진단 정보 유지 다. get() 응답 없는 Error
failed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-02 개발 모드 실패 로그: 표식 없음, 진단 정보 유지 가. post() 응답 500, Authorization이 든 요청 설정 (선택 보강 X2)
failed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-03 개발 모드 요청·성공 로그: 표식 없음 로그인 형태 post(): URLSearchParams 본문, Authorization이 든 요청 설정
failed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-03 개발 모드 요청·성공 로그: 표식 없음 가입 형태 post()
failed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-03 개발 모드 요청·성공 로그: 표식 없음 조회 get(): params와 Authorization이 든 요청 설정
passed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 (개발 모드) [a] get() AxiosError 500
passed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 (개발 모드) [a] post() AxiosError 500
passed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 (개발 모드) [b] get() 응답 없는 Error
passed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 (개발 모드) [b] post() 응답 없는 Error
passed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 (개발 모드) [c] post() AxiosError 422, detail 문자열
passed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 (개발 모드) [d] post() AxiosError 422, detail 배열
failed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 (개발 모드) [e] post() AxiosError 422, detail 객체
passed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 (개발 모드) [f] get() AxiosError 401
passed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 (개발 모드) [f] post() AxiosError 401
passed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 (개발 모드) [g] get() Axios가 아닌 TypeError
passed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 (개발 모드) [g] post() Axios가 아닌 TypeError
passed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 (운영 모드) [a] get() AxiosError 500
passed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 (운영 모드) [a] post() AxiosError 500
passed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 (운영 모드) [b] get() 응답 없는 Error
passed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 (운영 모드) [b] post() 응답 없는 Error
passed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 (운영 모드) [c] post() AxiosError 422, detail 문자열
passed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 (운영 모드) [d] post() AxiosError 422, detail 배열
failed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 (운영 모드) [e] post() AxiosError 422, detail 객체
passed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 (운영 모드) [f] get() AxiosError 401
passed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 (운영 모드) [f] post() AxiosError 401
passed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 (운영 모드) [g] get() Axios가 아닌 TypeError
passed | baseServiceLogging.test.ts | SPEC-SECURITY-002 base.ts 로그 AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 (운영 모드) [g] post() Axios가 아닌 TypeError
failed | authStoreLogging.test.ts | SPEC-SECURITY-002 authStore 인증 경로 로그 AC-SEC-002-06 로그인 실패: 메시지·상태만 남기고 같은 에러를 다시 던진다 (개발 모드) 토큰을 받은 뒤 getMe()가 AxiosError 500으로 거부한다
failed | authStoreLogging.test.ts | SPEC-SECURITY-002 authStore 인증 경로 로그 AC-SEC-002-06 로그인 실패: 메시지·상태만 남기고 같은 에러를 다시 던진다 (운영 모드) 토큰을 받은 뒤 getMe()가 AxiosError 500으로 거부한다
failed | authStoreLogging.test.ts | SPEC-SECURITY-002 authStore 인증 경로 로그 AC-SEC-002-07 로그아웃·사용자 조회 실패: 메시지·상태만 남긴다 (개발 모드) logout(): 로그아웃 API가 AxiosError 500으로 거부한다
failed | authStoreLogging.test.ts | SPEC-SECURITY-002 authStore 인증 경로 로그 AC-SEC-002-07 로그아웃·사용자 조회 실패: 메시지·상태만 남긴다 (개발 모드) loadUser(): getMe()가 AxiosError 401로 거부한다
failed | authStoreLogging.test.ts | SPEC-SECURITY-002 authStore 인증 경로 로그 AC-SEC-002-07 로그아웃·사용자 조회 실패: 메시지·상태만 남긴다 (개발 모드) loadUser(): getMe()가 응답 없는 Error로 거부한다
failed | authStoreLogging.test.ts | SPEC-SECURITY-002 authStore 인증 경로 로그 AC-SEC-002-07 로그아웃·사용자 조회 실패: 메시지·상태만 남긴다 (운영 모드, 선택 보강 X4) logout(): 로그아웃 API가 AxiosError 500으로 거부한다
failed | authStoreLogging.test.ts | SPEC-SECURITY-002 authStore 인증 경로 로그 AC-SEC-002-07 로그아웃·사용자 조회 실패: 메시지·상태만 남긴다 (운영 모드, 선택 보강 X4) loadUser(): getMe()가 AxiosError 401로 거부한다
failed | authStoreLogging.test.ts | SPEC-SECURITY-002 authStore 인증 경로 로그 AC-SEC-002-07 로그아웃·사용자 조회 실패: 메시지·상태만 남긴다 (운영 모드, 선택 보강 X4) loadUser(): getMe()가 응답 없는 Error로 거부한다
failed | profilePasswordLogging.test.tsx | SPEC-SECURITY-002 프로필 비밀번호 변경 실패 로그 AC-SEC-002-08 비밀번호 변경 실패: 메시지·상태만 남기고 알림은 그대로다 (개발 모드) 경우 a: AxiosError 422 (요청 본문, Authorization, 응답의 input에 표식)
failed | profilePasswordLogging.test.tsx | SPEC-SECURITY-002 프로필 비밀번호 변경 실패 로그 AC-SEC-002-08 비밀번호 변경 실패: 메시지·상태만 남기고 알림은 그대로다 (개발 모드) 경우 b: 응답 없는 Error
failed | profilePasswordLogging.test.tsx | SPEC-SECURITY-002 프로필 비밀번호 변경 실패 로그 AC-SEC-002-08 비밀번호 변경 실패: 메시지·상태만 남기고 알림은 그대로다 (운영 모드, 선택 보강 X4) 경우 a: AxiosError 422 (요청 본문, Authorization, 응답의 input에 표식)
failed | profilePasswordLogging.test.tsx | SPEC-SECURITY-002 프로필 비밀번호 변경 실패 로그 AC-SEC-002-08 비밀번호 변경 실패: 메시지·상태만 남기고 알림은 그대로다 (운영 모드, 선택 보강 X4) 경우 b: 응답 없는 Error
```

C-M1-02 하위 조건의 기계 판정(`c-m1-02-check.txt` 원문):

```text
(1) runtimeError=0 pending=0 todo=0 -> OK
(2) AC-SEC-002-01: total=7 failed=7 -> OK
(2) AC-SEC-002-02: total=8 failed=8 -> OK
(2) AC-SEC-002-03: total=3 failed=3 -> OK
(2) AC-SEC-002-06: total=2 failed=2 -> OK
(2) AC-SEC-002-07: total=6 failed=6 -> OK
(2) AC-SEC-002-08: total=4 failed=4 -> OK
(2) AC-SEC-002-10: total=3 failed=3 -> OK
(2) AC-SEC-002-11: total=3 failed=3 -> OK
(3) AC-SEC-002-05: total=22 [e]=2 (failed dev=1, prod=1) others=20 passed=20 -> OK
(4) tests without AC ID: 0 (all passed=true) -> OK
(5) every ID in its designated file -> OK
totals: tests=58 failed=38 passed=20
C-M1-02 overall: PASS
```

AC별 첫 실패 발췌(`red.txt` 원문에서 제목, 판정 줄, 기대·실제 값, 실패 줄만 옮겼다. 블록 전체는 `red-first-failures.txt`):

```text
  ● SPEC-SECURITY-002 base.ts 로그 › AC-SEC-002-01 운영 모드에서 base.ts는 콘솔을 호출하지 않는다 › post() 성공
    expect(received).toBe(expected) // Object.is equality
    Expected: 0
    Received: 2
    > 116 |       expect(totalCalls(spies)).toBe(0);

  ● SPEC-SECURITY-002 base.ts 로그 › AC-SEC-002-02 개발 모드 실패 로그: 표식 없음, 진단 정보 유지 › 가. post() 응답 500
    expect(received).toBe(expected) // Object.is equality
    Expected: false
    Received: true
    > 242 |       expect(includesText(args, PW_SENTINEL)).toBe(false);

  ● SPEC-SECURITY-002 base.ts 로그 › AC-SEC-002-03 개발 모드 요청·성공 로그: 표식 없음 › 로그인 형태 post(): URLSearchParams 본문, Authorization이 든 요청 설정
    expect(received).toBe(expected) // Object.is equality
    Expected: false
    Received: true
    > 260 |       expect(includesText(args, PW_SENTINEL)).toBe(false);

  ● SPEC-SECURITY-002 base.ts 로그 › AC-SEC-002-05 잡은 에러를 같은 참조로 다시 던진다 (개발 모드) › [e] post() AxiosError 422, detail 객체
    expect(received).rejects.toBe(expected) // Object.is equality
    Expected: [AxiosError: Request failed with status code 422]
    Received: [TypeError: errorMessage.includes is not a function]
    > 335 |       await expect(method === 'post' ? callPostUsers() : callGetMe()).rejects.toBe(error);

  ● SPEC-SECURITY-002 authStore 인증 경로 로그 › AC-SEC-002-06 로그인 실패: 메시지·상태만 남기고 같은 에러를 다시 던진다 (개발 모드) › 토큰을 받은 뒤 getMe()가 AxiosError 500으로 거부한다
    expect(received).toBe(expected) // Object.is equality
    Expected: false
    Received: true
    > 78 |       expect(includesText(args, TOKEN_SENTINEL)).toBe(false);

  ● SPEC-SECURITY-002 authStore 인증 경로 로그 › AC-SEC-002-07 로그아웃·사용자 조회 실패: 메시지·상태만 남긴다 (개발 모드) › logout(): 로그아웃 API가 AxiosError 500으로 거부한다
    expect(received).toBe(expected) // Object.is equality
    Expected: false
    Received: true
    > 108 |       expect(includesText(args, TOKEN_SENTINEL)).toBe(false);

  ● SPEC-SECURITY-002 프로필 비밀번호 변경 실패 로그 › AC-SEC-002-08 비밀번호 변경 실패: 메시지·상태만 남기고 알림은 그대로다 (개발 모드) › 경우 a: AxiosError 422 (요청 본문, Authorization, 응답의 input에 표식)
    expect(received).toBe(expected) // Object.is equality
    Expected: false
    Received: true
    > 113 |       expect(includesText(args, PW_SENTINEL)).toBe(false);

  ● SPEC-SECURITY-002 client.ts 토큰 갱신 실패 로그 › AC-SEC-002-10 운영 모드 토큰 갱신 실패: console.error 0건 › 경우 a: AxiosError 401 (응답 detail, request에 XHR 표식)
    expect(jest.fn()).toHaveBeenCalledTimes(expected)
    Expected number of calls: 0
    Received number of calls: 3
    > 101 |       expect(spies.error).toHaveBeenCalledTimes(0);

  ● SPEC-SECURITY-002 client.ts 토큰 갱신 실패 로그 › AC-SEC-002-11 개발 모드 토큰 갱신 실패: 에러 객체·XHR 없음 › 경우 a: AxiosError 401 (응답 detail, request에 XHR 표식)
    expect(received).toBe(expected) // Object.is equality
    Expected: false
    Received: true
    > 124 |       expect(containsRef(args, error)).toBe(false);
```

실패 사유(C-M1-03):

- 금지 문구 grep(contract.md C-M1-03 명령, `red.txt` 대상) → `0`.
- 실패 38건의 실패 줄(`red-faillines.txt`의 실패 줄을 AC ID와 짝지어 `sort | uniq -c`로 센 값):
  - 콘솔 호출 수(기대 0): `expect(totalCalls(spies)).toBe(0)` 7건(AC-01), `expect(spies.error).toHaveBeenCalledTimes(0)` 3건(AC-10)
  - `includesText(args, PW_SENTINEL)` 거짓 기대 9건: AC-02 5건, AC-03 2건, AC-08 2건
  - `includesText(args, TOKEN_SENTINEL)` 거짓 기대 7건: AC-03 1건, AC-06 2건, AC-07 4건
  - `includesText(args, PII_SENTINEL)` 거짓 기대 3건: AC-02 3건
  - `containsRef(args, error)` 거짓 기대 7건: AC-07 2건, AC-08 2건, AC-11 3건
  - `rejects.toBe(error)` 2건: AC-05 `[e]` 두 모드. 거부값은 `TypeError: errorMessage.includes is not a function`
- 각 테스트는 긍정 단언(진단 정보 유지, 같은 참조로 다시 던지기, 알림·상태 갱신)을 부정 단언보다 먼저 둔다. 그래서 위 실패는 앞선 긍정 단언이 지금 코드에서 모두 통과한 뒤에 났다.
- 통과 20건은 AC-05의 `[e]` 외 경우 전부다. AC ID가 없는 보조 테스트는 두지 않았다.

새 테스트 파일과 판정 도구 파일의 `sha256sum`(C-M1-10, RED 직후 측정):

```text
b51a418e7205d4e67f452f816300677280aa778a9308c1c053b634226b3a49f6  __tests__/baseServiceLogging.test.ts
92356bf92e40ea460b1d4441e6ae24fc00990e825c4ace81bafdb1e182ac0960  __tests__/authStoreLogging.test.ts
c3740f79515a87e5684572a2f25e80d4511da483d7a1e2a22f637810956db22c  __tests__/profilePasswordLogging.test.tsx
1ebbbe7cb3e21c3bfa1bcf98750ccc224bcef60938044975b069885d1791d34c  __tests__/refreshLogging.test.ts
c6400e2ded381276fd82d4f6d56e9cb9875b93002a74131e79518d84f7274bb6  __tests__/utils/consoleArgs.ts
```

### M1 — 계약 기준 자체 점검 (같은 작업 트리, 구현 에이전트 판정)

acceptance.md·contract.md의 bash 블록은 글자 그대로 뽑아 `bash <파일>`로 돌렸다. jest·tsc·lint는 하나씩 따로 돌렸다(B-10). 원문은 모두 `.moai/state/verify/SPEC-SECURITY-002/M1/`에 있다.

| 기준 | 판정 | 명령 → 출력 원문 | 증거 파일 |
|------|------|------------------|-----------|
| C-CM-01 | PASS | `git diff --stat 71b0455 -- …/plan.md …/acceptance.md` → 출력 없음. `sha256sum` 앞 16자리 → `4ce63ed0f3a76741 plan.md`, `fea860dfa63bdeb5 acceptance.md`, `79a9cc9482a717d7 spec.md` | `static-checks.txt` |
| C-CM-03 | PASS | AC-SEC-002-13의 `git diff`·`git ls-files` 다섯 명령 → 모두 출력 없음. client.ts 변경 범위 awk → `0` | `static-checks.txt` |
| C-CM-04 | PASS | 제외·스냅숏 grep → 출력 없음(exit 1). 자격 증명 형태 grep(보안 판정 기준, 새 파일 5개)도 출력 없음 | `static-greps.txt` |
| C-CM-05 | PASS | 헬퍼·정제·직렬화 명령 → `0` | `static-checks.txt` |
| C-M1-01 | PASS | `git diff --name-only 80b5e8a -- app components src hooks contexts babel.config.js __tests__` → 출력 없음. `git ls-files --others --exclude-standard -- __tests__` → 새 테스트 4개와 `__tests__/utils/consoleArgs.ts` 다섯 줄 | `static-checks.txt` |
| C-M1-02 | PASS | 위 상태 목록과 기계 판정 | `red.json`, `red-status.txt`, `c-m1-02-check.txt` |
| C-M1-03 | PASS | 금지 문구 grep → `0`. 실패 줄 분포는 위 "실패 사유" | `c-m1-03-grep.txt`, `red-faillines.txt` |
| C-M1-04 | PASS | AC-SEC-002-12 표 첫 행 jest → `Test Suites: 7 passed, 7 total`, `Tests:       23 passed, 23 total` | `c-m1-04-preserved.txt` |
| C-M1-05 | PASS | AC-SEC-002-14 명령 2 → `2`, 명령 3 → `components/modals/EditTreatmentModal.tsx`, 명령 4 → `✖ 7 problems (2 errors, 5 warnings)`. `command grep -nE '\bglobal(This)?\.__DEV__'`(새 테스트 4개) → 출력 없음 | `c-m1-05-ac14-cmd2.txt`, `c-m1-05-ac14-cmd3.txt`, `c-m1-05-ac14-cmd4-lint.txt` |
| C-M1-06 | 자체 판정 PASS(읽기 기준) | `consoleArgs.ts`: 다섯 메서드 :14, `mockImplementation(() => {})` :22, `jest.restoreAllMocks()` :29, 함수·`null`·`undefined` 건너뛰기 :53, 방문 집합 :57-58, 예외를 잡은 `String(value)` :71, 예외를 잡은 `JSON.stringify` :80, Map·Set 항목 :89-90, `Reflect.ownKeys` :93, getter 예외 건너뛰기 :101, `includesText` :108, `containsRef`(`===`, 렌더링 없음) :119-121, `hasExactValue`(문자열·숫자, 렌더링 없음) :126-130. `__DEV__`를 바꾸는 세 파일과 refreshLogging 모두 최상위 `afterEach`에서 원래 값으로 되돌린다. `JSON.stringify(…mock…)` grep → 출력 없음 | 판정 도구 파일 |
| C-M1-07 | PASS | 아래 프로브 표 15행이 모두 기대와 같다 | `probe/probe-result.json`, `probe/probe-run.txt` |
| C-M1-08 | PASS | 표식 grep → `PII-SENTINEL-4b2d`, `PW-SENTINEL-7f3a`, `TOKEN-SENTINEL-9c1e`, `XHR-SENTINEL-1d8e` 네 줄. 에러는 `makeAxiosError`가 `new AxiosError(message, code, config, request, response)`로 만들고 응답이 `config`·`request`를 품는다. 메시지는 `Request failed with status code <status>`나 `Network Error`, 그 밖의 `Error`는 고정 문구이며 표식이 없다 | `c-m1-08-reading.txt` |
| C-M1-09 | 자체 판정 PASS(읽기 기준) | 아래 경우표 대응 | 새 테스트 4개 |
| C-M1-10 | 이 기록 | RED 명령, 종료 코드, 상태 목록, AC별 첫 실패 발췌, 전체 출력 경로, `sha256sum`이 위에 있다 | — |

C-M1-07 프로브: 저장소를 스크래치패드로 `rsync -a --exclude node_modules --exclude .git --exclude .moai --exclude .claude`로 복사하고 `node_modules`를 심볼릭 링크로 이었다. 프로브 원본(`probe/consoleArgs.probe.test.ts.txt`)을 복사본의 `__tests__/consoleArgs.probe.test.ts`로 두고 `npx jest __tests__/consoleArgs.probe.test.ts --runInBand --cacheDirectory <스크래치>/jest-cache`로 돌렸다(exit 0, `Tests: 1 passed`). 복사본의 판정 도구 해시는 저장소 파일과 같은 `c6400e2d…74bb6`이었다(`probe/probe-helper-hash.txt`). H-7은 테스트용 빌더를 쓰지 않고 §1.7 모양을 프로브 안에서 직접 만들었다. 실행 뒤 복사본은 지웠다.

| ID | 호출 | 기대 | 실제 |
|----|------|------|------|
| H-1 | `includesText([new URLSearchParams({ username: 'u', password: PW })], PW)` | 참 | 참 |
| H-2 | 열거 불가 심볼 키에 PW를 둔 객체 | 참 | 참 |
| H-3 | 열거 불가 속성 `detail`에 PII를 둔 `Error` | 참 | 참 |
| H-4 | `new Map([['k', TOKEN]])` / `new Map([[TOKEN, 1]])` / `new Set([XHR])` | 참·참·참 | 참·참·참 |
| H-5 | `{ a: PW, self }`에 PW / `'absent'` | 참 / 거짓, 끝까지 돈다 | 참 / 거짓, 예외 없이 끝남 |
| H-6 | 예외를 던지는 getter와 `ok: PW` | 참, 예외 없음 | 참, 예외 없음 |
| H-7 | §1.7 모양 AxiosError(`config.data`에 PW) | 참 | 참 |
| H-8 | `[{ a: 'safe' }, 'x', 1, null, undefined, () => 'PW-SENTINEL-7f3a']` | 거짓 | 거짓 |
| H-9 | `hasExactValue(['Request failed with status code 422'], '422')` / `hasExactValue([{ status: 422 }], '422')` | 거짓 / 참 | 거짓 / 참 |
| H-10 | `containsRef([{ nested: [t] }], t)` / `containsRef([{ ...t }], t)` | 참 / 거짓 | 참 / 거짓 |

참고: 같은 프로브에서 jest-expo 환경의 `URLSearchParams`는 `[object URLSearchParams]`, 자기 키는 `Symbol(impl)` 하나, `String()` 결과는 `username=u&password=PW-SENTINEL-7f3a`였다. plan.md §H.4가 확인하지 않았다고 적은 구현은 whatwg-url 계열이며, 판정 도구는 `String()` 렌더링으로 폼 내용을 본다.

경우표 대응(C-M1-09):

- AC-01(운영): `post()` 성공·500·422(detail 문자열, errors 객체)·401, `get()` 성공·500·401의 7개 테스트가 다섯 스파이 호출 합 `totalCalls(spies)`이 0인지 본다.
- AC-02(개발): 필수 경우 7개와 선택 보강 X2 1개다.
  - 가: `post()` 500·422(배열 detail과 errors, `input` 없음)·401
  - 나: `get()` 500·401(`params.q`에 PII)
  - 다: `post()`·`get()` 각각 응답 없는 `Error`
  - 모든 경우에 메시지·경로가 참이고 표식 4종이 거짓이다. 응답이 있으면 `hasExactValue(String(status))`가 참이고, 422는 서버 문구 두 개가 참이다.
- AC-03(개발): URLSearchParams 로그인 `post()`(Authorization이 든 요청 설정), 가입 `post()`, `get()`(`params`·Authorization)의 3개 테스트다. `defaults.headers`와 두 성공 응답에 표식을 넣었고, 표식 3종이 거짓인지 본다.
- AC-05: 경우·모드·메서드마다 테스트를 나눴다(두 모드 × 11개 = 22개). 이름에 `[a]`~`[g]`가 들고, `a·b·f·g`는 `get()`·`post()`, `c·d·e`는 `post()`에서 `rejects.toBe(error)`를 본다.
- AC-06(두 모드): 토큰을 받은 뒤 `getMe()`가 AxiosError 500(Bearer 표식, 응답 본문 PII)으로 거부하는 경우다.
  - `rejects.toBe(error)`가 성립한다.
  - `console.error` 인자에 메시지와 `'500'`이 있다.
  - `error` 상태가 메시지와 같고 `isLoading`이 `false`다.
  - 표식 3종, `containsRef(error)`, `containsRef(error.config)`가 거짓이다.
- AC-07: 호출 전마다 스토어를 정해진 상태로 둔다. 개발 모드 3개에 선택 보강 X4(운영 모드) 3개를 더했다.
  - `logout()`(AxiosError 500): 거부되지 않고, 끝난 뒤 `isAuthenticated`가 `false`, `accessToken`이 `null`이다.
  - `loadUser()`(AxiosError 401 / 응답 없는 `Error`): 거부되지 않고, 끝난 뒤 `error`가 메시지와 같다.
  - 모든 경우에 TOKEN·PII·`containsRef(error)`가 거짓이고 메시지가 참이다. AxiosError면 상태도 참이다.
- AC-08: 화면을 그리고 '비밀번호 변경'을 누른 뒤 두 입력란에 PW를 넣고 '변경'을 누른다. 개발 모드 2개에 선택 보강 X4(운영 모드) 2개를 더했다.
  - a(422, `config.data`·Bearer·응답 `input`에 표식): `Alert.alert('오류', '입력한 정보가 올바르지 않습니다.')`가 1회 불리고 `'422'`가 참이다.
  - b(응답 없는 `Error`): 제목 '오류'인 알림이 없다.
  - 두 경우 모두 PW·TOKEN·`containsRef(error)`가 거짓이고 메시지가 참이다.
- AC-10(운영, 모듈을 불러온 뒤 스파이): 경우 a 401(`detail`, XHR), b `ERR_NETWORK`(응답 없이 request), c 응답·요청 없는 `Error`의 3개 테스트다. `testRefreshToken()` 동안 `console.error` 호출 수가 0인지 본다.
- AC-11(개발): 같은 세 경우다.
  - `containsRef`(error·request·config)와 XHR 표식이 거짓이다.
  - 메시지가 참이고, a는 `'401'`과 'Refresh token expired'도 참이다.
  - 선택 보강 X3으로 TOKEN 표식이 거짓인지도 본다.

선택 보강 X6: 새 테스트 4개를 `--randomize --seed=1`과 `--seed=2`로 두 번 더 돌렸다. 두 번 모두 `tests=58 failed=38 passed=20 runtimeError=0`이고 `red.json`과 상태가 다른 테스트는 0개였다(`x6-compare.txt`). 테스트 사이 `__DEV__`·스파이 누수(B-7)는 관찰되지 않았다.

기록해 둘 점:

- `npm run lint`(`expo lint`)는 `src`, `app`, `components`만 린트한다(`DEBUG=expo:*lint*`로 인자를 확인). 그래서 AC-SEC-002-14 명령 4는 `__tests__`를 세지 않는다. 새 파일 5개는 `npx eslint`로 따로 돌려 문제 0건을 확인했다. 초안의 profilePasswordLogging에는 기존 `profileDeadMenu.test.tsx`와 같은 경고 2건(`@typescript-eslint/no-require-imports`, `import/first`)이 있었다. 공식 RED 실행과 해시 측정 전에 `jest.requireActual`로 바꾸고 import를 맨 위로 옮겨 고쳤다.
- 판정 도구 파일에는 §1.1 표식과 §1.7 AxiosError 빌더 `makeAxiosError`도 함께 두었다. 네 테스트가 같은 모양의 에러를 쓰게 하려는 것이다.
- M1 검토(sync-auditor strict, `.moai/reports/sync-audit/SPEC-SECURITY-002-M1-review.md`)는 PASS였다. 차단 결함은 없고 선택 관찰 O-1·O-2는 조치하지 않는다.

### M2 — GREEN: `src/api/services/base.ts` (2026-11-09, manager-develop)

- 기준: HEAD `bc692d4`에 M1 파일 5개와 이 변경을 더한 작업 트리. 테스트 파일 5개는 M1 해시 그대로다(C-CM-02).
- 변경: `get()`·`post()`의 진단 로그 전부를 `if (__DEV__)` 블록 6개 안으로 옮겼다(GET 요청·성공·실패, POST 요청·성공·실패).
- 뺀 값:
  - `get()` 요청 로그의 `config`
  - `post()` 요청 로그의 `headers`(`this.client.defaults.headers`)·`data`·`config`
  - `post()` 성공 로그의 응답 본문 `data`
  - 실패 로그의 요청 본문과 스택
  - 422 블록의 요청 본문 직렬화 줄('📝 요청 데이터:')
  - 401 로그의 요청 본문
- 남긴 값(개발 빌드만): 실패 로그의 url·method·status·statusText·서버 오류 응답 본문·message, 422의 서버 응답·`detail`·`errors`, 401의 Authorization 유무 표시. 기존 로그 문구는 바꾸지 않았다.
- 422 누락 필드 추정은 게이트 안에 두고 `typeof errorMessage === 'string'`일 때만 `includes`를 부른다. 객체 `detail`에서 `TypeError`가 원래 에러를 가리던 문제(AC-05 `[e]`)를 이렇게 고쳤다.
- `throw error;` 두 줄과 `put`·`patch`·`delete`·`buildQueryString`은 그대로다. MX 태그는 M5에서 단다(plan.md §F.1).
- 원문 증거(gitignore 대상): `.moai/state/verify/SPEC-SECURITY-002/M2/`. 결과는 아래와 같다.

| 기준 | 판정 | 명령 → 출력 원문 | 증거 파일 |
|------|------|------------------|-----------|
| C-M2-01 | PASS | `npx jest __tests__/baseServiceLogging.test.ts` → exit 0, `Tests:       40 passed, 40 total`. `-t "AC-SEC-002-01"` → `Tests:       33 skipped, 7 passed, 40 total`, `-02` → `32 skipped, 8 passed`, `-03` → `37 skipped, 3 passed`, `-05` → `18 skipped, 22 passed`(모두 exit 0) | `c-m2-01-file.txt`, `c-m2-01-t-ac01.txt`~`ac05.txt`, `c-m2-01-t-summary.txt` |
| C-M2-02 | PASS | AC-SEC-002-04의 다섯 명령 → `0`, `0`, `0`, `0`, `6` | `static-m2.txt` |
| C-M2-03 | PASS | 계약 블록 → `0`(M1 시점 `7`) | `static-m2.txt` |
| C-M2-04 | PASS | → `0` | `static-m2.txt` |
| C-M2-05 | PASS | `command grep -c 'throw error;' src/api/services/base.ts` → `2`. diff를 읽어 콘솔 호출이 모두 `if (__DEV__)` 안에 있고 422 추정 분기가 게이트 안에서 문자열일 때만 `includes`를 부르는 것을 확인했다 | `static-m2.txt`, `base-diff.txt` |
| C-M2-06 | PASS | 계약 블록 → 출력 없음 | `static-m2.txt` |
| C-M2-07 | PASS | C-CM-05 → `0`. `command grep -cE '^  [A-Za-z_$]' src/api/services/base.ts` → `8` | `static-m2.txt` |
| C-M2-08 | PASS | 범위 awk → `0`. `git diff --name-only 80b5e8a -- app components src hooks contexts babel.config.js` → `src/api/services/base.ts` | `static-m2.txt` |
| C-M2-09 | PASS | HT-05 base.ts 부분(M2 규칙대로 refreshLogging과 client.ts 수집을 뺐다): `G=8 P=129`, `UNCOVERED` 출력 없음(구간 DA 35줄). 참고: 파일 전체 `LF:48 LH:36 BRF:45 BRH:28` | `ht-05-base.txt`, `cov/lcov.info` |
| C-M2-10 | 자체 점검(검토자 판정) | 스크래치 복사본에 변이를 하나씩 넣고 `-t`로 돌렸다. MU-01 → AC-05 `14 failed`, MU-02 → AC-05 `8 failed`, MU-03 → AC-02 `5 failed`, MU-04 → AC-02 `1 failed`. 변이 전 복사본은 `40 passed`였고, 끝난 뒤 복사본을 지웠다 | `mu-01-04-selfcheck.txt` |
| C-CM-01 | PASS | plan.md·acceptance.md는 `71b0455`와 같고 해시 앞 16자리는 `4ce63ed0f3a76741`·`fea860dfa63bdeb5`다. spec.md는 `git diff -U0 71b0455` 기준으로 `status` 한 줄만 바뀌었다(`-status: draft`, `+status: in-progress`). 판정 명령 → `0`, `^status: in-progress$` → `1`. `updated:`는 이미 오늘 날짜(2026-11-09)라 두었다 | `c-cm-01-spec.txt` |
| C-CM-02 | PASS | `sha256sum -c M1/sha256.txt` → 5개 모두 `OK` | `static-m2.txt` |
| C-CM-03 | PASS | AC-SEC-002-13의 git 명령 5개 → 출력 없음, client.ts 범위 awk → `0` | `static-m2.txt` |
| C-CM-04 | PASS | 제외·스냅숏 grep → 출력 없음. 자격 증명 형태 grep(새 파일 5개와 base.ts) → 출력 없음 | `static-m2.txt` |
| C-CM-05 | PASS | → `0` | `static-m2.txt` |
| AC-SEC-002-12(보존 스위트) | PASS | `Test Suites: 7 passed, 7 total`, `Tests:       23 passed, 23 total` | `ac12-preserved.txt` |
| AC-SEC-002-14 명령 2·3·4 | PASS | `2` / `components/modals/EditTreatmentModal.tsx` / `✖ 7 problems (2 errors, 5 warnings)`. 린트 출력에 base.ts 문제는 없다 | `ac14-cmd2.txt`, `ac14-cmd3.txt`, `ac14-cmd4-lint.txt` |

M3·M4 대상 테스트 3개(authStoreLogging, profilePasswordLogging, refreshLogging)를 한 번 돌린 결과는 `Tests:       18 failed, 18 total`, `runtimeError=0`이다. M1 RED와 비교해 상태가 다른 테스트는 0개였다(`others-compare.txt`). 실패 줄도 RED와 같았다(`others-faillines.txt`). AC-06은 TOKEN 2건, AC-07은 TOKEN 4건과 `containsRef` 2건, AC-08은 PW 2건과 `containsRef` 2건, AC-10은 호출 수 3건, AC-11은 `containsRef` 3건이다. 금지 문구 grep은 `0`이다.

C-CM-06(커밋 형식과 파일 목록)은 커밋을 만든 뒤에야 잴 수 있다. 그래서 이 파일이 아니라 M2 완료 보고에 적는다.

- M2 커밋은 `2ff4a65`이고, M2 검토(sync-auditor strict, `.moai/reports/sync-audit/SPEC-SECURITY-002-M2-review.md`)는 PASS였다. 선택 관찰 O-1(base.ts가 `error` 자체에는 선택적 체이닝 없이 `error.response`를 읽음)은 기존 동작이라 고치지 않는다.
- 커밋 직전 `.git/index.lock`(2026-11-09 16:39:52, 0바이트)이 남아 있어 `git add`가 실패했다. WSL과 Windows 양쪽에 실행 중인 git 프로세스가 없었다. 진행 중인 merge·rebase·cherry-pick도 없었다. 이를 확인한 뒤 이 파일 하나만 지웠다(`.moai/state/verify/SPEC-SECURITY-002/M2/index-lock-recovery.txt`).

### M3 — GREEN: `src/api/client.ts` `refreshAccessToken()` catch 블록 (2026-11-10, manager-develop)

- 기준: HEAD `2ff4a65`에 이 변경을 더한 작업 트리. 커밋하지 않은 테스트 파일 3개는 M1 해시 그대로다(C-CM-02).
- 변경: catch 블록(`80b5e8a` 기준 :96-119)의 로깅 분기 전체를 `if (__DEV__)` 하나로 감싸고, 그 위에 한 줄 주석을 달았다.
  - 다섯 줄의 문구는 그대로다. 줄 번호는 :97→:99, :102→:104, :103→:105, :112→:114, :115→:117로 바뀌었다.
  - 값: :97과 :112 자리는 `error.message`로 바꿨다. :102는 `status`, :103은 `error.response.data`, :115는 `error.message`로 그대로 남겼다.
  - `return null;`과 분기 구조는 그대로다.
  - `console.log` 세 줄(:107, :109, :113)은 내용을 바꾸지 않고 게이트 안으로 들어갔다. 운영 빌드에서는 babel이 어차피 지우는 줄이다.
  - 분기 전체가 게이트 안에 있으므로, `null` 거부가 운영 빌드에서 `error.response`를 읽다 `TypeError`를 내던 경로(M2 검토 메모 7)도 운영 빌드에서는 실행되지 않는다.
- 원문 증거(gitignore 대상): `.moai/state/verify/SPEC-SECURITY-002/M3/`.

| 기준 | 판정 | 명령 → 출력 원문 | 증거 파일 |
|------|------|------------------|-----------|
| C-M3-01 | PASS | `npx jest __tests__/refreshLogging.test.ts` → exit 0, `Tests:       6 passed, 6 total`. `-t "AC-SEC-002-10"` → `Tests:       3 skipped, 3 passed, 6 total`, `-t "AC-SEC-002-11"` → `Tests:       3 skipped, 3 passed, 6 total`(둘 다 exit 0) | `c-m3-01-file.txt`, `c-m3-01-t-ac10.txt`, `c-m3-01-t-ac11.txt` |
| C-M3-02 | PASS | AC-SEC-002-13 client.ts 범위 awk → `0`(덩어리 머리 `@@ -97,11 +97,19 @@`, `@@ -109 +117 @@`, `@@ -111,5 +118,0 @@`). `git diff --name-only 80b5e8a -- app components src hooks contexts babel.config.js` → `src/api/client.ts`, `src/api/services/base.ts` | `static-m3.txt` |
| C-M3-03 | PASS | `<블록> \| command grep -cE 'toJSON\|JSON\.stringify\|\bconfig\b\|\bheaders\b'` → `0`. 콘솔 줄 검사 → `0`(M2 시점 `2`) | `static-m3.txt` |
| C-M3-04 | PASS | 다섯 문구 → `5`. `<블록>`을 읽어 다섯 줄이 모두 `if (__DEV__)` 안에 있고 값이 위와 같음을 확인했다. 다섯 문구는 client.ts 전체에서도 이 다섯 줄에만 있다 | `static-m3.txt`, `client-diff.txt` |
| C-M3-05 | PASS | AC-SEC-002-12 jest → `Test Suites: 7 passed, 7 total`, `Tests:       23 passed, 23 total`. 정적 행: 보존 테스트 diff 출력 없음, `@MX:ANCHOR` → `src/api/client.ts:1`·`src/stores/authStore.ts:1`, `@MX:WARN` → `1`, `export const authDebugUtils` → `1`, 스토어 훅 grep 출력 없음 | `ac12-preserved.txt`, `ac12-static.txt` |
| C-M3-06 | PASS | C-M2-06 블록 → 출력 없음. HT-05 client.ts 부분(M3 규칙대로 refreshLogging만 돌리고 client.ts만 수집) → `99 3`, `104 1`, `105 1`, `114 1`, `117 1` | `static-m3.txt`, `ht-05-client.txt`, `cov/lcov.info` |
| C-M3-07 | 자체 점검(검토자 판정) | 스크래치 복사본에서 MU-05('응답 데이터:' 줄 삭제) → AC-11 `1 failed`(실패 줄 `expect(includesText(args, serverText)).toBe(true)`). MU-06('응답 상태:' 줄 삭제) → AC-11 `1 failed`(실패 줄 `expect(hasExactValue(args, status)).toBe(true)`). 변이 전 복사본은 `6 passed`였고, 끝난 뒤 복사본을 지웠다 | `mu-05-06-selfcheck.txt` |
| C-CM-01 | PASS | plan.md·acceptance.md는 `71b0455`와 같고 해시 앞 16자리는 `4ce63ed0f3a76741`·`fea860dfa63bdeb5`다. spec.md 판정 → `0`, `^status: in-progress$` → `1`. M3에서는 spec.md를 바꾸지 않았다 | `static-m3.txt` |
| C-CM-02 | PASS | `sha256sum -c M1/sha256.txt` → 5개 모두 `OK` | `static-m3.txt` |
| C-CM-03 | PASS | AC-SEC-002-13 git 명령 5개 → 출력 없음, client.ts 범위 awk → `0` | `static-m3.txt` |
| C-CM-04 | PASS | 제외·스냅숏 grep → 출력 없음. 자격 증명 형태 grep → 출력 없음 | `static-m3.txt` |
| C-CM-05 | PASS | → `0` | `static-m3.txt` |

회귀 확인 결과는 다음과 같다.

- baseServiceLogging → `Tests:       40 passed, 40 total`(`base-suite.txt`).
- M4 대상 두 파일(authStoreLogging, profilePasswordLogging) → `Tests:       12 failed, 12 total`, `runtimeError=0`. M1 RED와 비교해 상태가 다른 테스트는 0개이고, 실패 줄은 AC-06·07·08의 누출 단언뿐이다(`m4-suites-compare.txt`, `m4-suites-faillines.txt`). 금지 문구 grep은 `0`이다.
- tsc(선택) → `2`이고 파일은 `components/modals/EditTreatmentModal.tsx`뿐이다(`tsc-summary.txt`).

C-CM-06은 커밋을 만든 뒤에 재고 M3 완료 보고에 적는다.

- M3 커밋은 `0adeeff`이고, M3 검토(sync-auditor strict, `.moai/reports/sync-audit/SPEC-SECURITY-002-M3-review.md`)는 PASS였다. 선택 관찰은 두 가지이며 조치하지 않는다. F1은 client.ts:111 분기가 실행되지 않았다는 것이다. F2는 `console.log` 세 줄도 게이트 안에 있다는 것으로, babel이 운영 빌드에서 `console.log`를 지우므로 운영 동작은 같다.

### M4 — GREEN: 인증 경로 8곳 (2026-11-10, manager-develop)

- 기준: HEAD `0adeeff`에 이 변경을 더한 작업 트리. 커밋하지 않은 테스트 2개는 M1 해시 그대로다(C-CM-02).
- 변경: 다섯 파일에서 10줄을 각각 한 줄로 바꿨다(10줄 추가, 10줄 삭제). 그래서 줄 번호가 그대로다.
  - 8곳의 로그 줄은 한 줄 그대로 `console.error('<기존 문구>', error.message, error.response?.status);`로 바꿨다. 대상은 app/login.tsx:49·:91, components/forms/InviteSignupForm.tsx:122, components/forms/LoginForm.tsx:80, src/stores/authStore.ts:162·:180·:210, app/(tabs)/profile.tsx:73이다.
  - annotation이 없던 catch 두 곳(app/login.tsx:48, src/stores/authStore.ts:179)은 `} catch (error: any) {`로 바꿨다(B-8).
  - `__DEV__`는 더하지 않았다(REQ-SEC-002-005). 알림 문구, `throw error`, `setError`·`clearAuth`·`setLoading`, 화면 이동, `secureHybridStorage` 줄은 그대로다. 범위 밖인 LoginForm.tsx:42·:54도 그대로다.
- 원문 증거(gitignore 대상): `.moai/state/verify/SPEC-SECURITY-002/M4/`. acceptance.md·contract.md의 bash 블록은 글자 그대로 뽑아 `LC_ALL=C.UTF-8 bash <파일>`로 돌렸다.

| 기준 | 판정 | 명령 → 출력 원문 | 증거 파일 |
|------|------|------------------|-----------|
| C-M4-01 | PASS | `npx jest __tests__/authStoreLogging.test.ts __tests__/profilePasswordLogging.test.tsx` → exit 0, `Tests:       12 passed, 12 total`. `-t "AC-SEC-002-06"` → `Tests:       6 skipped, 2 passed, 8 total`, `-t "AC-SEC-002-07"` → `Tests:       2 skipped, 6 passed, 8 total`, `-t "AC-SEC-002-08"`(profilePasswordLogging) → `Tests:       4 passed, 4 total`(모두 exit 0) | `c-m4-01-files.txt`, `c-m4-01-t-ac06.txt`, `c-m4-01-t-ac07.txt`, `c-m4-01-t-ac08.txt` |
| C-M4-02 | PASS | AC-SEC-002-09 명령 1 → `components/forms/LoginForm.tsx:42`·`:54`의 AsyncStorage 두 줄. 명령 2 → 출력 없음(exit 1). 명령 3 → `2`·`1`·`3`·`3`·`1`. 명령 4 → `0`·`0`·`0`·`2`·`0`. 명령 5 → `8`. 명령 6 → `0` | `static-m4.txt` |
| C-M4-03 | PASS | `command grep -noE "console\.error\('[^']*'" <다섯 파일>` → 10줄. 계약의 text 블록과 글자 그대로 같고(블록이 목록 항목 안에 있어 붙은 들여쓰기 2칸만 뺐다), `80b5e8a`에서 같은 명령을 돌린 값과도 같다 | `static-m4.txt` |
| C-M4-04 | PASS | 계약 블록 → `0` | `static-m4.txt` |
| C-M4-05 | PASS | `git diff --name-only 80b5e8a -- app components src hooks contexts babel.config.js` → spec.md §3.4의 운영 파일 7개. AC-SEC-002-12 jest → `Test Suites: 7 passed, 7 total`, `Tests:       23 passed, 23 total`. 정적 행: 보존 테스트 diff 출력 없음, `client.ts:1`·`authStore.ts:1`, `1`, `1`, 스토어 훅 grep 출력 없음. C-CM-05 → `0` | `static-m4.txt`, `ac12-preserved.txt`, `static-common-m4.txt` |
| C-M4-06 | 자체 점검(검토자 판정) | 스크래치 복사본 결과는 아래와 같다. 변이 전 복사본은 `12 passed`였고, 끝난 뒤 복사본을 지웠다.<br>MU-07(login 로그 줄을 `if (__DEV__)`로 감쌈) → AC-06 `1 failed`(운영 모드 `includesText(errorArgs, error.message)`)<br>MU-08(login `throw error;` 삭제) → AC-06 `2 failed`(`rejects.toBe(error)`)<br>MU-09(logout `clearAuth();` 삭제) → AC-07 `2 failed`(`isAuthenticated` 검사)<br>MU-10(422 알림 문구 변경) → AC-08 `2 failed`(`toHaveBeenCalledWith('오류', …)`) | `mu-07-10-selfcheck.txt` |
| C-CM-01 | PASS | plan.md·acceptance.md 해시 앞 16자리는 `4ce63ed0f3a76741`·`fea860dfa63bdeb5`다. spec.md 판정 → `0`, `^status: in-progress$` → `1`. M4에서는 spec.md를 바꾸지 않았다 | `static-common-m4.txt` |
| C-CM-02 | PASS | `sha256sum -c M1/sha256.txt` → 5개 모두 `OK` | `static-common-m4.txt` |
| C-CM-03 | PASS | AC-SEC-002-13 git 명령 5개 → 출력 없음, client.ts 범위 awk → `0` | `static-common-m4.txt` |
| C-CM-04 | PASS | 제외·스냅숏 grep → 출력 없음. 자격 증명 형태 grep(새 테스트 2개와 바뀐 운영 파일 5개) → 출력 없음 | `static-common-m4.txt` |
| C-CM-05 | PASS | → `0` | `static-m4.txt` |

회귀와 기준선 확인 결과는 다음과 같다. jest·tsc·lint는 하나씩 따로 돌렸다.

- baseServiceLogging → `Tests:       40 passed, 40 total`(`base-suite.txt`).
- refreshLogging → `Tests:       6 passed, 6 total`(`refresh-suite.txt`).
- AC-SEC-002-14 명령 2 → `2`, 명령 3 → `components/modals/EditTreatmentModal.tsx`, 명령 4 → `✖ 7 problems (2 errors, 5 warnings)`(`ac14-cmd2.txt`, `ac14-cmd3.txt`, `ac14-cmd4-lint.txt`).
- 린트 문제 7건은 기준선과 같은 목록이다. client.ts 경고 1건이 :198에서 :201로 옮긴 것은 M3가 그 위에 3줄을 더했기 때문이다.

C-CM-06은 커밋을 만든 뒤에 재고 M4 완료 보고에 적는다.

- M4 커밋은 `2e779ad`이고, M4 검토(sync-auditor strict, `.moai/reports/sync-audit/SPEC-SECURITY-002-M4-review.md`)는 PASS였다. 선택 관찰 두 가지는 조치하지 않는다. F1(app/login.tsx:49의 가상 `null` 거부)은 AC가 로그 줄 모양을 이렇게 정했기 때문이다. I1(LoginForm.tsx:42·:54)은 spec.md §6이 범위에서 뺐기 때문이다.

### M5 — REFACTOR와 최종 검증 (2026-11-10, manager-develop)

- 기준: HEAD `2e779ad`에 이 변경을 더한 작업 트리. 판정 도구 해시는 `c6400e2d…74bb6` 그대로다(C-M1-07을 다시 할 필요 없음).
- 변경: `src/api/services/base.ts`에 MX 태그 주석 7줄만 더했다(plan.md §F.1). 실행 줄은 바꾸지 않았다. 커밋 전 C-M5-07 형태 `git diff -U0 2e779ad -- <운영 파일 7개> | … | command grep -vcE '^[+-][[:space:]]*(//|$)'`의 결과는 `0`이다.
  - `get()` 위(:8-9): `@MX:ANCHOR: [AUTO]`(서비스 공통 경계, 잡은 에러를 같은 참조로 다시 던짐)와 `@MX:REASON`(fan_in 15)
  - `post()` 위(:63-65): `@MX:ANCHOR: [AUTO]`, `@MX:REASON`(fan_in 13), `@MX:SPEC: SPEC-SECURITY-002 (REQ-SEC-002-001~004)`
  - `post()` catch의 `if (__DEV__) {` 바로 위(:90-91): `@MX:WARN: [AUTO]`와 `@MX:REASON`. WARN은 로그에 넣지 않는 값(요청 본문, 요청 설정, 에러 객체, error.request, error.response, Authorization 값)을 적었다.
- REFACTOR 판단: M2~M4 변경에 정리할 중복이 없어 코드는 더 바꾸지 않았다. 새 운영 파일도 만들지 않았다.
- M3 검토 F2: client.ts 갱신 실패 catch 블록의 고정 문구 `console.log` 세 줄도 다섯 줄과 같은 `if (__DEV__)` 안에 있다. 운영 빌드에서는 babel이 `console.log`를 이미 지우므로 운영 동작은 같다. spec.md §3.4가 바꿀 대상으로 적은 것은 "다섯 줄만"이다.
- 원문 증거(gitignore 대상): `.moai/state/verify/SPEC-SECURITY-002/M5/`. acceptance.md의 bash 블록과 표 안 명령은 글자 그대로 뽑아 `LC_ALL=C.UTF-8 bash <파일>`로 돌렸다. jest·tsc·lint는 하나씩 따로 돌렸고, 전체 jest는 맨 끝에 단독으로 돌렸다.

수용 기준 판정(C-M5-04). jest 확인 명령은 모두 exit 0, 실패 0이다.

| AC | 명령 | 출력 원문 | 판정 | 증거 파일 |
|----|------|-----------|------|-----------|
| AC-SEC-002-01 | `npx jest __tests__/baseServiceLogging.test.ts -t "AC-SEC-002-01"` | `Tests:       33 skipped, 7 passed, 40 total` | PASS | `ac01-jest.txt` |
| AC-SEC-002-02 | 같은 파일 `-t "AC-SEC-002-02"` | `Tests:       32 skipped, 8 passed, 40 total` | PASS | `ac02-jest.txt` |
| AC-SEC-002-03 | 같은 파일 `-t "AC-SEC-002-03"` | `Tests:       37 skipped, 3 passed, 40 total` | PASS | `ac03-jest.txt` |
| AC-SEC-002-04 | 표의 grep 다섯 개 | `0`, `0`, `0`, `0`, `6` | PASS | `ac-static.txt` |
| AC-SEC-002-05 | 같은 파일 `-t "AC-SEC-002-05"` | `Tests:       18 skipped, 22 passed, 40 total` | PASS | `ac05-jest.txt` |
| AC-SEC-002-06 | `npx jest __tests__/authStoreLogging.test.ts -t "AC-SEC-002-06"` | `Tests:       6 skipped, 2 passed, 8 total` | PASS | `ac06-jest.txt` |
| AC-SEC-002-07 | 같은 파일 `-t "AC-SEC-002-07"` | `Tests:       2 skipped, 6 passed, 8 total` | PASS | `ac07-jest.txt` |
| AC-SEC-002-08 | `npx jest __tests__/profilePasswordLogging.test.tsx -t "AC-SEC-002-08"` | `Tests:       4 passed, 4 total` | PASS | `ac08-jest.txt` |
| AC-SEC-002-09 | 명령 1~6 | 1: `components/forms/LoginForm.tsx:42`·`:54` 두 줄. 2: 출력 없음(exit 1). 3: `2`·`1`·`3`·`3`·`1`. 4: `0`·`0`·`0`·`2`·`0`. 5: `8`. 6: `0` | PASS | `ac-static.txt` |
| AC-SEC-002-10 | `npx jest __tests__/refreshLogging.test.ts -t "AC-SEC-002-10"` | `Tests:       3 skipped, 3 passed, 6 total` | PASS | `ac10-jest.txt` |
| AC-SEC-002-11 | 같은 파일 `-t "AC-SEC-002-11"` | `Tests:       3 skipped, 3 passed, 6 total` | PASS | `ac11-jest.txt` |
| AC-SEC-002-12 | 표의 jest와 정적 명령 4개, 스토어 훅 블록 | jest `Test Suites: 7 passed, 7 total`, `Tests:       23 passed, 23 total`. 보존 테스트 diff 출력 없음, `src/api/client.ts:1`·`src/stores/authStore.ts:1`, `1`, `1`, 스토어 훅 grep 출력 없음(exit 1) | PASS | `ac12-jest.txt`, `ac-static.txt` |
| AC-SEC-002-13 | 표의 git 명령 5개와 client.ts 범위 블록 | 다섯 명령 모두 출력 없음, 범위 블록 `0` | PASS | `ac-static.txt` |
| AC-SEC-002-14 | 명령 1~4 | 1: `Test Suites: 28 passed, 28 total`, `Tests:       170 passed, 170 total`, `Snapshots:   1 passed, 1 total`. 2: `2`. 3: `components/modals/EditTreatmentModal.tsx`. 4: `✖ 7 problems (2 errors, 5 warnings)` | PASS | `ht-01-ac14-cmd1.txt`, `ac14-cmd2.txt`, `ac14-cmd3.txt`, `ac14-cmd4-lint.txt` |
| AC-SEC-002-15 | 표의 grep 네 개 | `2`, `1`, `3`, `1` | PASS | `ac-static.txt` |

M5 계약 기준:

| 기준 | 판정 | 명령 → 출력 원문 | 증거 파일 |
|------|------|------------------|-----------|
| C-M5-01 | PASS | AC-SEC-002-15 → `2`, `1`, `3`, `1`. `@MX:ANCHOR` → `2`(3 이하), `@MX:WARN` → `1`(5 이하) | `mx-tags-check.txt` |
| C-M5-02 | PASS | ANCHOR awk → `  protected async get<T>(`, `  protected async post<T>(`. WARN awk → `92:       if (__DEV__) {`. 이 줄은 post() 서명(:66)과 put() 서명(:136) 사이에 있고 `'❌ API POST 실패:'` 로그(:93)를 바로 감싼다 | `mx-tags-check.txt` |
| C-M5-03 | 자체 판정 PASS(읽기) | 설명은 한국어이고 `[AUTO]`로 시작한다. ANCHOR는 공통 경계와 같은 참조 다시 던지기를, REASON은 fan_in 15·13을, WARN은 넣지 않는 값 목록을 적었다. `@MX:SPEC: SPEC-SECURITY-002`도 있다 | base.ts :8-9, :63-65, :90-91 |
| C-M5-04 | PASS | 위 표에서 AC-SEC-002-01~15가 모두 PASS다 | 위 표의 파일 |
| C-M5-05 | PASS | 최종 트리에서 다시 돌린 결과는 아래와 같다.<br>C-CM-01: plan·acceptance 해시 그대로, spec.md 판정 `0`·`1`<br>C-CM-02: 5개 `OK`<br>C-CM-03: 출력 없음, `0`<br>C-CM-04: 출력 없음<br>C-CM-05: `0`<br>C-M2-02: `0,0,0,0,6`. C-M2-03: `0`. C-M2-04: `0`. C-M2-05: `throw error;` `2`. C-M2-06: 출력 없음. C-M2-07: `0`·`8`. C-M2-08 awk: `0`<br>C-M3-02 awk: `0`. C-M3-03: `0`·`0`. C-M3-04: `5`. C-M3-06: C-M2-06 출력 없음, HT-05 client.ts 부분 통과<br>C-M4-02: AC-09 표와 같다. C-M4-03: 계약 블록과 같다(10줄). C-M4-04: `0`. C-M4-05: 운영 파일 7개, AC-12 기대값, C-CM-05 `0`<br>C-M2-08·C-M3-02의 name-only 부분은 그 마일스톤 시점의 기대값이라, 최종 트리의 파일 집합은 C-M4-05와 C-M5-06으로 판정했다 | `c-m5-05-recheck.txt`, `ac-static.txt` |
| C-M5-06 | PASS(작업 트리) | `git diff --name-only 80b5e8a -- app components src hooks contexts __tests__ babel.config.js` → 운영 파일 7개, 새 테스트 4개, `__tests__/utils/consoleArgs.ts`(12줄). 커밋 뒤의 `git diff --name-only 80b5e8a HEAD …`와 `git status --short …`는 M5 완료 보고에 적는다 | `c-m5-05-recheck.txt` |
| C-M5-07 | PASS(커밋 전 형태) | `2e779ad` 이후 실행 줄 변경이 `0`이다. 그래서 변이는 다시 돌리지 않고 검토 결과를 인용한다. MU-01~04는 M2 검토(커밋 `2ff4a65`), MU-05·06은 M3 검토(커밋 `0adeeff`, 추가 변이 4개도 잡힘), MU-07~10은 M4 검토(커밋 `2e779ad`)에서 모두 잡혔다 | `mx-tags-check.txt`, 검토 보고서 |
| C-M5-08 | PASS | 아래 HT-01~06 | — |

하드 임계값:

- HT-01 PASS: AC-SEC-002-14 명령 1을 맨 끝에 단독으로 돌렸다. 시작 전 다른 jest·tsc·eslint 프로세스는 없었다. 결과는 `Test Suites: 28 passed, 28 total`, `Tests:       170 passed, 170 total`, `Snapshots:   1 passed, 1 total`이고 실패는 0이다(`ht-01-ac14-cmd1.txt`).
- HT-02 PASS: `Test Suites: 7 passed, 7 total`, `Tests:       23 passed, 23 total`(`ac12-jest.txt`).
- HT-03 PASS: 오류 `2`개, 파일은 `components/modals/EditTreatmentModal.tsx`뿐이다(`ac14-cmd2.txt`, `ac14-cmd3.txt`).
- HT-04 PASS: `✖ 7 problems (2 errors, 5 warnings)`. 목록은 기준선과 같고 base.ts 문제는 없다(`ac14-cmd4-lint.txt`).
- HT-05 PASS: 계약 블록을 `<증거>` 자리만 바꿔 그대로 돌렸다(`ht-05.txt`).
  - base.ts 부분: `UNCOVERED` 출력이 없다. `G=10`, `P=136` 구간의 DA 35줄이 모두 1회 이상 실행됐다.
  - client.ts 부분: `99 3`, `104 1`, `105 1`, `114 1`, `117 1`.
  - 참고: base.ts는 `LF:48 LH:36 BRF:45 BRH:28`, client.ts는 `LF:244 LH:39`다.
- HT-06 PASS: MU-01~10이 모두 잡혔다. 위 C-M5-07처럼 M2·M3·M4 검토 결과를 인용한다.

## §E.3 Run-phase Audit-Ready Signal

- run_complete_at: 2026-11-10T10:22:17+09:00
- run_status: audit-ready (최종 검토 PASS, 2026-11-10)
- run_commits: M1+M2 `2ff4a65`, M3 `0adeeff`, M4 `2e779ad`, M5 `3d164d7`(M5 커밋 뒤에 채웠다)
- milestone_reviews: M1 PASS, M2 PASS, M3 PASS, M4 PASS(sync-auditor strict, `.moai/reports/sync-audit/SPEC-SECURITY-002-M1-review.md`~`-M4-review.md`). 네 번 모두 차단 결함은 0건이다.
- acceptance: AC-SEC-002-01~15 모두 PASS(§E.2 M5 표)
- hard_thresholds:
  - HT-01 PASS(`Test Suites: 28 passed, 28 total`, `Tests: 170 passed, 170 total`, `Snapshots: 1 passed, 1 total`)
  - HT-02 PASS(7·23)
  - HT-03 PASS(`2`, EditTreatmentModal.tsx만)
  - HT-04 PASS(오류 2, 경고 5)
  - HT-05 PASS(base.ts 미실행 줄 0, client.ts 다섯 줄 모두 1회 이상)
  - HT-06 PASS(MU-01~10 모두 잡힘)
- final_review: M5 최종 검토 PASS(sync-auditor strict, `.moai/reports/sync-audit/SPEC-SECURITY-002-M5-final-review.md`). 차단 결함 0건, 선택 결함 8건(F1~F8). 4개 차원 점수는 기능 100·보안 100·품질 95·일관성 98이고 가중 조화평균은 98.8이다. MU-01~10을 최종 코드에서 다시 돌려 10개 모두 잡혔다.
- post_commit_checks: C-M5-06 `git diff --name-only 80b5e8a 3d164d7 -- app components src hooks contexts __tests__ babel.config.js` → 12줄(운영 파일 7, 새 테스트 4, `__tests__/utils/consoleArgs.ts`), `git status --short -- …` → 출력 없음(최종 검토에서 다시 확인)
- sync_decisions(2026-11-10, 사용자): F3·F6·F7 문구는 sync 전에 manager-spec이 고친다. CHANGELOG.md는 만들지 않는다. sync 뒤에 푸시하고 PR #1 본문을 갱신한다. F8은 contract.md에 메모로 남겼다.

## §E.4 Sync-phase Audit-Ready Signal

_<pending sync-phase>_

## §F Phase 4 Mode Selection

- 입력: tier M · 범위 약 12개 파일(운영 코드 수정 7, 새 테스트 4, 테스트 전용 판정 도구 1) · 도메인 1개(클라이언트 로그 위생: API 서비스 계층과 인증 화면·스토어) · 언어 100% TypeScript/TSX · 병렬 이득 낮음(코딩 위주, 새 테스트 4개가 판정 도구를 공유)
- 하네스: thorough(2026-10-19 착수 승인에서 사용자 선택). Phase 10 계약 협상과 마일스톤별 sync-auditor(strict) 검토를 한다.
- 진행 방식: 자율(사용자 선택). `/moai goal`은 걸지 않는다. 백그라운드 서브에이전트를 기다리는 동안 턴 종료가 막혀 빈 턴이 반복될 수 있기 때문이다.
- Phase 10 평가 계약: `.moai/specs/SPEC-SECURITY-002/contract.md`(sync-auditor 1회차 초안 + 오케스트레이터 결정 D-C1~D-C5, 약 0.51M 토큰). 저장 위치는 run 워크플로 문서를 따랐다(에이전트 정의의 `.moai/state/evaluation/`은 gitignore 대상이라 SPEC과 함께 추적되지 않는다).
- 2026-11-09 재확인: 범위와 입력이 그대로라(파일 12개, 도메인 1개, 코딩 위주) serial을 유지한다. 실행 위치는 primary checkout의 현재 브랜치이고 worktree 격리는 쓰지 않는다(2026-10-19 L1 worktree 시도가 worktree 가드에 막혔다, §G).

| 모드 | 판정 | 근거 |
|------|------|------|
| direct | 선택 안 함 | 파일 12개, 동작이 바뀌는 변경 |
| serial | 선택 | 코딩 위주 TDD. manager-develop 하나가 M1→M5를 진행하고 마일스톤 사이에 sync-auditor가 검토한다 |
| fanout | 선택 안 함 | 조사가 아니라 구현 작업. RED 테스트들이 판정 도구를 공유해 FO-RUN-2의 독립 대상 조건을 채우지 못한다 |
| sweep | 선택 안 함 | 균일한 기계적 변환이 아니고 파일이 30개에 못 미친다 |
| agent-team | 선택 안 함 | 명시적 요청 없음 |

Decision: serial (scale envelope: Standard/Full Pipeline 경계, files: 12, domains: 1)

판단 근거: 변경은 base.ts의 로그 게이팅, client.ts catch 블록 한 곳, 인증 경로 8곳의 한 줄 수정으로 서로 순서가 정해진 코딩 작업이다. Anthropic의 코딩 작업 병렬화 주의(코딩은 조사보다 병렬로 나눌 몫이 적다)에 따라 단일 구현 에이전트가 맞다. 독립 검토는 하네스 thorough에 따라 마일스톤마다 새 문맥의 sync-auditor가 맡는다.

경계 사례: 파일 수 12개로 Full Pipeline 기준(10개 이상)을 조금 넘는다. 계획(manager-spec)은 plan 단계에서 끝났고 문서 동기화는 sync 단계 몫이라 어느 쪽 envelope로 읽어도 실제 구성은 manager-develop + sync-auditor로 같다. Phase 5·6(재분석, tasks.md)은 plan.md §F가 이미 마일스톤과 파일 분해를 담고 있고 tasks.md가 계획 산출물 해시 대상이라 만들지 않는다.

## §G Run-phase Plan Audit Gate

- audit_cache_hit: true
- cached_audit_at: 2026-10-18T02:52:06+09:00 (review-3, PASS 0.97, Tier M 기준 0.80)
- skip_basis: 최종 회차 PASS, 점수 기준 이상, 판정 이후 계획 산출물 변경 없음(review-3 작성 02:52:06가 spec.md 01:36 · acceptance.md 02:32 · plan.md 02:33보다 뒤이고, 이후 da308ad에 그대로 커밋됨)
- plan_artifact_sha256(원시 파일 기준이며 ComputeHash 값은 아니다): spec.md `d42953c4a9ab3e94`, plan.md `000b0af961bd259e`, acceptance.md `a5e502deff4ea29d`
- kickoff_approved_at: 2026-10-19T11:03:41+09:00 (Implementation Kickoff Approval: 시작 · thorough 전체 · 자율)
- 2026-10-19 착수 시도: L1 worktree `agent-afa58e37a777d3c13`에서 시작한 manager-develop이 공유 checkout에 `git -C`를 쓰려다 worktree 가드에 거부된 뒤(11:46) 결과 없이 중단됐다. 코드·테스트 변경은 없었다(2026-11-09 diff로 확인). worktree는 2026-11-09에 지웠다.

### 2026-11-09 재진입 (위 캐시 판정은 무효)

- audit_cache_hit: false. 비교 기준 갱신 커밋 `71b0455`로 plan 산출물 해시가 바뀌어 Phase 1을 다시 실행했다.
- audit_verdict: plan-auditor review-4 PASS 0.96(Tier M 기준 0.80). 보고서 `.moai/reports/plan-audit/SPEC-SECURITY-002-review-4.md`, 증거 `.moai/state/verify/SPEC-SECURITY-002/plan-audit-review-4/`(둘 다 gitignore 대상).
- plan_artifact_sha256(원시 파일 기준이며 ComputeHash 값은 아니다): spec.md `79a9cc9482a717d7`, plan.md `4ce63ed0f3a76741`, acceptance.md `fea860dfa63bdeb5`
- 착수 조건 D1(contract.md의 비교 기준과 해시가 옛 값): contract.md 결정 D-C6과 함께 반영했다.
- 남은 선택 결함(다음 plan 갱신이나 sync에서 처리):
  - D2: acceptance.md §6 수동 확인의 '짧은 비밀번호로 422'는 `a53f3b3` 이후 요청 전에 막혀 재현되지 않는다. 8자 이상 비밀번호에 서버가 거절할 입력(예: 없는 초대 코드)을 넣는 방식으로 바꾸기를 권고받았다.
  - D3: acceptance.md:4와 spec.md:24의 "두 커밋 모두 한 줄을 한 줄로 바꿨다"는 과장이다. EditTreatmentModal.tsx와 eas.json에는 줄 추가가 있다. 다만 인용한 줄 번호가 그대로라는 결론은 맞다.
  - D4: 착수 직전 `git diff --stat 80b5e8a HEAD -- . ':!.moai'`가 출력 없음인지 확인한다.
- kickoff_reapproved_at: 2026-11-09 (Implementation Kickoff Approval 재확인: 시작 · thorough 전체 · 자율)
