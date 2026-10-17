# Project Interview

> 갱신: 2026-10-16 · MoAI-ADK 3.1.2 `/moai project` (기존 문서 갱신 모드 — 8개 문서 전체 재작성)
> 이전 인터뷰(2026-07-06)는 git `aead9b8`에 남아 있다.

## Stage A Round 1: Ownership, Purpose, and Goal
Question: 이 프로젝트는 지금 어떤 단계인가요? 문서를 어떤 기준으로 쓸지가 정해져요.
Answer: 계속 개발 중인 제품 — 지금 코드 상태와 앞으로의 로드맵을 기준으로 문서를 쓴다. 남은 리팩토링 후속 작업(공통 UI 컴포넌트 확산 등)은 로드맵에 적는다.
Domain: beauty-salon-booking-mobile (auto-populated from codebase analysis)
Goal: 뷰티샵 운영(예약·시술·고객·직원·매출)을 관리하는 모바일 앱을 계속 개발하고, 문서는 현재 코드와 로드맵 기준으로 유지한다.

## Stage A Round 2: Constraints and Non-Goals
Question: 문서에 '지켜야 할 제약'으로 적을 항목은 무엇인가요? (여러 개 선택 가능)
Answer: 보안·개인정보 보호, 시니어 친화 화면, 목록 렌더링 성능
Constraints:
- 보안·개인정보 보호: 액세스 토큰은 SecureStore에 저장하고, 로그에 토큰·비밀번호 등 민감 정보를 남기지 않는다 (SPEC-SECURITY-001)
- 시니어 친화 화면: 고대비·큰 글씨 등 가독성 규칙을 지킨다 (SPEC-UX-001)
- 목록 렌더링 성능: 예약 목록·달력의 렌더링 최적화 규칙을 지킨다 (SPEC-PERF-001, SPEC-PERF-003)

## Stage A Round 3: Scope, Boundaries, and Documentation Priority
Question: 문서에서 가장 정확하게 담아야 할 부분은 무엇인가요? / 문서가 다룰 범위는 어디까지인가요? (포함·제외 경계)
Answer: 구조와 모듈 경계 / 앱 코드 중심
Documentation priority: 구조와 모듈 경계 — 화면 → 훅 → 서비스 → 클라이언트 계층과 모듈 사이 의존 방향을 가장 정확하게 기록하고, 경계를 넘는 사례도 함께 기록한다.
Scope: 포함 — app/, components/, hooks/, contexts/, src/, __tests__/, scripts/, 빌드 설정(EAS 프로필·npm 스크립트). 제외 — .claude/·.moai/(MoAI 도구), node_modules/, 백엔드 내부 구현(백엔드는 연동 대상으로만 기술).

## Stage B Round 4: Verification, Surfaces, and Sharing
Verification: npm test, npm run lint, npx tsc --noEmit (타입 검사는 npm 스크립트 없이 명령으로 실행)
UI surface: has-ui
External systems: KMC Beauty 백엔드 REST API (EXPO_PUBLIC_API_BASE_URL), 기기 연락처 (expo-contacts)
Team sharing: solo
