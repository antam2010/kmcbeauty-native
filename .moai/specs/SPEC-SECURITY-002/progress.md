# SPEC-SECURITY-002 진행 기록

## §E.1 Plan-phase Audit-Ready Signal

- plan_complete_at: 2026-10-18T12:30:22+09:00
- plan_status: audit-ready
- plan_audit: 감사 3회(review-1 FAIL 0.79 → review-2 PASS 0.92 → review-3 PASS 0.97), sync-auditor 교차 검증 AGREE(독립 점수 0.94). 보고서는 `.moai/reports/plan-audit/`에 있으며 gitignore 대상이라 로컬에만 있다.
- 남은 선택 결함: review-3의 N5, 교차 검증의 F1~F7. 모두 개발 빌드 로그 판정을 보강하는 항목이다. plan 산출물 해시를 지키려고 고치지 않았고, sync 단계에서 코드로 확인한다.
- 사용자 결정: plan.md §A.2의 D-1~D-4(개발 빌드 전용 게이팅, 인증 경로까지, Tier M, 감사 thorough).
- 2026-11-09 비교 기준 갱신(spec.md v0.1.3, 사용자 결정): plan 뒤 들어온 `a53f3b3`(비밀번호 최소 길이 4자→8자)과 `80b5e8a`(입력란 안내 문구 '(8자 이상)')는 이 SPEC 밖의 변경이다. `5731c73`과 비교하면 AC-SEC-002-09 명령 6이 `12`를 출력해 기대값 `0`을 맞출 수 없었다. 코드·테스트 비교 기준을 모두 `80b5e8a`로 옮겼다(AC-SEC-002-09 명령 6과 복사본 확인, AC-SEC-002-12의 `git diff`, AC-SEC-002-13의 `git diff` 세 줄과 client.ts 변경 범위 검사). AC-SEC-002-08의 입력란 문구를 '(8자 이상)'으로 고쳤다. "지금 값"은 `80b5e8a`에서 다시 쟀고 명령 6만 달라졌다(`5731c73` 기준 `12`, `80b5e8a` 기준 `0`). 줄 번호는 그대로다. plan 산출물 해시가 바뀌었으므로 plan 재감사가 필요하다.

## §E.2 Run-phase Evidence

_<pending run-phase>_

## §E.3 Run-phase Audit-Ready Signal

_<pending run-phase>_

## §E.4 Sync-phase Audit-Ready Signal

_<pending sync-phase>_

## §F Phase 4 Mode Selection

- 입력: tier M · 범위 약 12개 파일(운영 코드 수정 7, 새 테스트 4, 테스트 전용 판정 도구 1) · 도메인 1개(클라이언트 로그 위생: API 서비스 계층과 인증 화면·스토어) · 언어 100% TypeScript/TSX · 병렬 이득 낮음(코딩 위주, 새 테스트 4개가 판정 도구를 공유)
- 하네스: thorough(2026-10-19 착수 승인에서 사용자 선택). Phase 10 계약 협상과 마일스톤별 sync-auditor(strict) 검토를 한다.
- 진행 방식: 자율(사용자 선택). `/moai goal`은 걸지 않는다. 백그라운드 서브에이전트를 기다리는 동안 턴 종료가 막혀 빈 턴이 반복될 수 있기 때문이다.
- Phase 10 평가 계약: `.moai/specs/SPEC-SECURITY-002/contract.md`(sync-auditor 1회차 초안 + 오케스트레이터 결정 D-C1~D-C5, 약 0.51M 토큰). 저장 위치는 run 워크플로 문서를 따랐다(에이전트 정의의 `.moai/state/evaluation/`은 gitignore 대상이라 SPEC과 함께 추적되지 않는다).

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
