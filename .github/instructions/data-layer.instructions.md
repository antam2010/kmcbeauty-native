---
applyTo: "**"
---

# 🌐 Data Layer Rules

## 파일 구성 (필수)

```text
src/shared/api/client.ts        # axios instance + interceptors
src/shared/api/queryClient.ts   # React Query client & default options
src/shared/api/queryKeys.ts     # query key builders
```

## React Query 규칙

- 데이터 패칭/캐시는 React Query만 사용 (useEffect+axios 금지)
- Mutation 성공 시 관련 Query invalidate
- 네트워크 상태/포커스 변화 반영 (onlineManager, focusManager)

## zod 스키마

- 모든 API 응답과 주요 요청 페이로드는 zod 스키마로 validate
- `export type`으로 `z.infer<>` 타입 제공

### 예시

```ts
// src/domains/booking/api/index.ts
import { api } from "@/src/shared/api/client";
import { z } from "zod";

export const BookingItem = z.object({
  id: z.string(),
  userId: z.string(),
  staffId: z.string().nullable(),
  startAt: z.string(),
  endAt: z.string(),
  status: z.enum(["pending", "confirmed", "cancelled"]),
});
export type BookingItem = z.infer<typeof BookingItem>;

export async function fetchBookings(params: { date?: string }) {
  const { data } = await api.get("/bookings", { params });
  return z.array(BookingItem).parse(data);
}
```
