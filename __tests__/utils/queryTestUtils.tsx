// SPEC-DATA-001: 특성/AC 테스트용 QueryClientProvider 래퍼.
// 결정성 확보를 위해 매 테스트 새 QueryClient(재시도 off, gcTime 0)로 래핑한다(research.md §7).
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 결정성: 재시도 금지, 즉시 GC.
        retry: false,
        gcTime: 0,
        // 실제 앱 기본값과 동일한 중복제거 창(staleTime)을 유지해 dedup 특성을 검증한다.
        staleTime: 60_000,
      },
    },
  });
}

// renderHook / render 의 wrapper 로 사용.
export function makeQueryWrapper(client: QueryClient = createTestQueryClient()) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper, client };
}
