---
applyTo: "**/*.{ts,tsx}"
---

# 🎨 Code Style Rules

- TypeScript strict mode 준수
- async/await 사용, `then()` 금지
- 컴포넌트는 Dumb, 로직은 hooks/store로 분리
- 사이드이펙트는 전용 hooks로 이동
- 모듈/파일은 단일 책임 원칙(SRP)

## 네이밍 규칙

| 요소 | 규칙 예 |
|---|---|
Hooks | `useXxx`, `useSignIn`, `useBookings` |
Zustand | `useXxxStore`, `useBookingSheet` |
React Query | `useXxxQuery`, `useXxxMutation` |
API 함수 | `fetchXxx`, `createXxx`, `updateXxx` |
Schema | `XxxSchema` (`z.object`) |
Query Keys | `qk.xxx.list(params)` |

## Import Alias

```ts
import { Button } from "@/src/shared/ui/elements";
import { qk } from "@/src/shared/api/queryKeys";
```

## 금지 패턴

- 컴포넌트 내부에서 axios 직접 호출 ❌
- `useEffect(() => axios...)` 형태의 데이터 패칭 ❌ (React Query 사용)
- 전역 이벤트 버스 남발 ❌
