// SPEC-DATA-001 AC-01: QueryClient 전역 기본값 검증.
// staleTime === 60000, 유한 gcTime, retry === 1.
import { createQueryClient, DEFAULT_GC_TIME, DEFAULT_STALE_TIME, DEFAULT_RETRY } from '@/src/api/queryClient';

describe('SPEC-DATA-001 AC-01: QueryClient 기본값', () => {
  it('staleTime === 60000, retry === 1, 유한 gcTime 을 기본값으로 설정한다', () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions().queries;

    expect(defaults?.staleTime).toBe(60000);
    expect(DEFAULT_STALE_TIME).toBe(60000);
    expect(defaults?.retry).toBe(1);
    expect(DEFAULT_RETRY).toBe(1);
    // gcTime 은 유한(Number.isFinite)이어야 한다.
    expect(typeof defaults?.gcTime).toBe('number');
    expect(Number.isFinite(defaults?.gcTime as number)).toBe(true);
    expect(DEFAULT_GC_TIME).toBe(5 * 60_000);
  });
});
