# Project Interview

## Round 1: Ownership and Purpose
Question: 이 프로젝트는 누가 유지보수하며, 앞으로의 주된 목표는 무엇인가요?
Answer: 리팩토링/마이그레이션 진행 중 — 현재 브랜치(feature/refactor-hardening-2026-07)처럼 구조적 변경이 진행 중이며, 문서는 목표 상태를 반영해야 합니다. (예: 삼중 API 클라이언트 → 단일 client.ts 통합, 도메인별 서비스 계층 구조화, src/services/ 레거시 계층 통합 진행 중)

## Round 2: Constraints and Non-Goals
Question: 알려진 제약사항, 기술 부채, 또는 의도적으로 하지 않는 것이 있나요?
Answer: 중대한 제약 없음 — 제약사항 주석 없이 코드베이스를 있는 그대로 문서화합니다.

## Round 3: Documentation Priority
Question: 문서에서 가장 정확하게 담아야 할 중요 측면은 무엇인가요?
Answer: 아키텍처와 모듈 경계 — 시스템 구조와 모듈 간 상호작용을 우선적으로 문서화합니다.

## Additional Context (user note)
- 사용자는 .claude/(MoAI 도구 정의)와 .moai/(프로젝트 산출물) 디렉터리 분리를 확인함. MoAI-ADK 스캐폴딩 디렉터리는 앱 문서화 대상에서 제외.
