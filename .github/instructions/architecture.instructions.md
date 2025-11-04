---
applyTo: "**"
---

# 🏛 Architecture Rules

## 상태 관리 전략

| 종류 | 선택 |
|---|---|
서버 상태 | React Query |
UI/로컬 상태 | Zustand |
Form 상태 | react-hook-form |

## API 규칙

- 모든 API 요청은 `src/shared/api/client.ts`의 axios 인스턴스 사용
- 모든 응답/요청을 zod로 검증하여 타입 안정성 보장
- Query/Mutation은 반드시 queryKeys 사용

## 토큰/보안

- 보관: SecureStore/MMKV
- 갱신: axios interceptor에서 refresh 토큰 처리 (동시 갱신 보호)

## 성능/품질

- lazy import, memoization, virtualization(FlashList) 우선
- 에러 로깅(Sentry/Crashlytics) 및 사용자 피드백(Toast) 표준화
- 환경/플래그는 `shared/config`에서 관리 (zod로 env 검증)
