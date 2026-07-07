// SPEC-PERF-003 (PRESERVE→IMPROVE 검증) + SPEC-DATA-001 (react-query 캐싱): useDashboardLoad 특성 테스트.
// 보존: 단일 마운트 1회 조회(AC-01), 병렬 발행(AC-02), 주간 실패 격리(AC-04).
// 신규: 동일 key 2회 마운트 → fetch 1회(AC-02 dedup), pull-to-refresh → force_refresh 1회(AC-03),
//        인증 오류 시 weeklyError 미노출·상점 미선택 시 스킵(AC-04).
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { makeQueryWrapper } from './utils/queryTestUtils';

const mockGetTodayDetailedSummary = jest.fn();
const mockGetWeeklyTreatments = jest.fn();

// 상점 상태를 테스트별로 가변 제어.
const mockShopState: { selectedShop: { id: number; name: string } | null; loading: boolean } = {
  selectedShop: { id: 1, name: '테스트샵' },
  loading: false,
};

jest.mock('@/src/api/services/dashboard', () => ({
  dashboardApiService: {
    getTodayDetailedSummary: (...args: any[]) => mockGetTodayDetailedSummary(...args),
  },
}));
jest.mock('@/src/api/services/treatment', () => ({
  treatmentApiService: {
    getWeeklyTreatments: (...args: any[]) => mockGetWeeklyTreatments(...args),
  },
}));
jest.mock('@/contexts/DashboardContext', () => ({
  useDashboard: () => ({ refreshTrigger: 0, triggerRefresh: jest.fn() }),
}));
jest.mock('@/src/stores/shopStore', () => ({
  useShopStore: (selector: any) => selector(mockShopState),
}));

import { useDashboardLoad } from '@/hooks/useDashboardLoad';

describe('useDashboardLoad (REQ-PERF-003-01 / SPEC-DATA-001 REQ-02)', () => {
  beforeEach(() => {
    mockGetTodayDetailedSummary.mockReset();
    mockGetWeeklyTreatments.mockReset();
    mockGetTodayDetailedSummary.mockResolvedValue({ summary: {}, sales: {}, customer_insights: [] });
    mockGetWeeklyTreatments.mockResolvedValue([]);
    mockShopState.selectedShop = { id: 1, name: '테스트샵' };
    mockShopState.loading = false;
  });

  it('AC-01: 단일 마운트 사이클에서 getTodayDetailedSummary 를 정확히 1회 호출한다', async () => {
    const { Wrapper } = makeQueryWrapper();
    renderHook(() => useDashboardLoad(), { wrapper: Wrapper });
    await waitFor(() => expect(mockGetTodayDetailedSummary).toHaveBeenCalledTimes(1));
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockGetTodayDetailedSummary).toHaveBeenCalledTimes(1);
  });

  it('AC-02: 오늘 요약과 주간 시술을 병렬로 발행한다(주간이 오늘 resolve 이전에 이미 호출됨)', async () => {
    let resolveToday: (v: any) => void = () => {};
    mockGetTodayDetailedSummary.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveToday = resolve;
        }),
    );

    const { Wrapper } = makeQueryWrapper();
    renderHook(() => useDashboardLoad(), { wrapper: Wrapper });

    await waitFor(() => expect(mockGetWeeklyTreatments).toHaveBeenCalledTimes(1));
    expect(mockGetTodayDetailedSummary).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveToday({ summary: {}, sales: {}, customer_insights: [] });
      await Promise.resolve();
    });
  });

  it('AC-02(dedup): 동일 query key 로 2회 마운트해도 staleTime 내 fetch 는 1회다', async () => {
    // 동일 QueryClient 공유 → 같은 key 재마운트 시 중복제거.
    const { Wrapper } = makeQueryWrapper();
    const first = renderHook(() => useDashboardLoad(), { wrapper: Wrapper });
    await waitFor(() => expect(mockGetTodayDetailedSummary).toHaveBeenCalledTimes(1));
    first.unmount();

    renderHook(() => useDashboardLoad(), { wrapper: Wrapper });
    await act(async () => {
      await Promise.resolve();
    });
    // 두 번째 마운트는 캐시(fresh)를 사용 → 추가 fetch 없음.
    expect(mockGetTodayDetailedSummary).toHaveBeenCalledTimes(1);
    expect(mockGetWeeklyTreatments).toHaveBeenCalledTimes(1);
  });

  it('AC-03: pull-to-refresh 는 오늘 요약을 force_refresh=true 로 정확히 1회 refetch 한다', async () => {
    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useDashboardLoad(), { wrapper: Wrapper });
    await waitFor(() => expect(mockGetTodayDetailedSummary).toHaveBeenCalledTimes(1));
    // 마운트 조회는 force_refresh=false.
    expect(mockGetTodayDetailedSummary).toHaveBeenLastCalledWith(false);

    await act(async () => {
      await result.current.onRefresh();
    });

    expect(mockGetTodayDetailedSummary).toHaveBeenCalledTimes(2);
    // 새로고침 조회는 force_refresh=true.
    expect(mockGetTodayDetailedSummary).toHaveBeenLastCalledWith(true);
  });

  it('AC-04: 주간 실패(비인증)는 오늘 요약을 유실시키지 않고 weeklyError 를 노출한다', async () => {
    mockGetWeeklyTreatments.mockRejectedValue(new Error('network error'));
    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useDashboardLoad(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.weeklyError).toBe(true));
    expect(result.current.dashboardData).not.toBeNull();
  });

  it('AC-04: 인증 오류(주간)는 weeklyError 를 노출하지 않는다(인터셉터 상위 전파 의미론 보존)', async () => {
    mockGetWeeklyTreatments.mockRejectedValue(new Error('인증이 만료되었습니다. 다시 로그인해주세요.'));
    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useDashboardLoad(), { wrapper: Wrapper });
    await waitFor(() => expect(mockGetWeeklyTreatments).toHaveBeenCalledTimes(1));
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.weeklyError).toBe(false);
  });

  it('AC-04: 상점 미선택 시 대시보드 query 를 비활성화(요청 스킵)한다', async () => {
    mockShopState.selectedShop = null;
    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useDashboardLoad(), { wrapper: Wrapper });
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockGetTodayDetailedSummary).not.toHaveBeenCalled();
    expect(mockGetWeeklyTreatments).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });
});
