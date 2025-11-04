---
applyTo: "**/*.tsx"
---

# 📂 Folder Structure Rules

```text
apps/mobile/
  app/                      # Expo Router only (UI 라우팅 전용, 로직 금지)
  src/
    domains/                # Feature modules (DDD-lite)
    shared/                 # Cross-domain infra, ui, utils
    tests/                  # jest + detox
```

## 도메인 구조

```text
src/domains/booking/
  screens/                  # 페이지/라우트 컴포넌트 (dumb)
  hooks/                    # 비즈니스 로직 훅
  api/                      # 서버 통신 + zod 검증
  store/                    # zustand (UI/local state)
  components/               # 도메인 전용 UI 컴포넌트
  types/                    # zod 타입/공용 타입
```

## 규칙

- 새 기능은 반드시 `src/domains/<feature>/` 하위에 생성
- `app/`(router)는 화면 파일만 위치 — 데이터/비즈니스 로직 금지
- `shared/`는 도메인 간 공유 가능한 로직만
- import 순환 금지
- 파일 생성/이동 시 테스트/경로 alias 업데이트 포함

**AI는 파일 생성/수정 제안 시 위 경로 기준을 반드시 따를 것.**
