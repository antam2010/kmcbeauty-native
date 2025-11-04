---
applyTo: "**"
---

# 📱 React Native (Expo) Architecture Guide

이 프로젝트는 다음 기술과 원칙을 사용합니다:

- Expo (Managed)
- TypeScript
- Expo Router v3
- React Query for server state
- Zustand for client UI state
- zod for typed API validation
- Modular Domain-Driven folder structure
- AI 협업 최적화 지향

## 프로젝트 철학

- UI는 단순하게, 비즈니스 로직은 hook/store/service로 분리
- 도메인 폴더마다 screens/api/store/hooks/types/components 구성
- shared는 cross-domain 모듈만 위치
- 모든 서버 액세스는 React Query 사용
- 모든 데이터 스키마는 zod 검증
- 경로 별칭 `@/...` 준수 (tsconfig + babel module-resolver)

AI는 이 가이드를 준수해 코드/설명을 생성해야 합니다.
