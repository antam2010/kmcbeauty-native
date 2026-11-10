// SPEC-DATA-001 REQ-DATA-001-01 (F-12): 앱 전역 단일 QueryClient 와 기본값.
// - staleTime = 60_000ms (정확값): 동일 query key 재마운트 시 staleTime 내 재요청 0회(중복제거).
// - gcTime: react-query v5 기본값(5분)을 명시적으로 고정(유한값 보장).
// - retry: 1.
// 오프라인 persistence(persist-client/AsyncStorage persister)는 도입하지 않는다(인메모리 캐시만, REQ-01 shall not).
import { QueryClient } from '@tanstack/react-query';

// @MX:ANCHOR: [AUTO] 앱 전역 서버-상태 캐시 기본값. 모든 화면 query 가 이 값을 상속한다.
// @MX:REASON: staleTime/gcTime/retry 는 SPEC-DATA-001 AC-01 의 이진 판정 대상(정확값)이며,
//   변경 시 화면 전역 캐싱/중복제거 동작이 바뀐다.
// @MX:SPEC: SPEC-DATA-001 (REQ-DATA-001-01)
export const DEFAULT_STALE_TIME = 60_000; // 60초 (정확값)
export const DEFAULT_GC_TIME = 5 * 60_000; // 5분 (react-query 기본값 고정 — 유한)
export const DEFAULT_RETRY = 1;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME,
        gcTime: DEFAULT_GC_TIME,
        retry: DEFAULT_RETRY,
      },
    },
  });
}

// 앱 런타임 단일 인스턴스(Provider 주입용).
export const queryClient = createQueryClient();
