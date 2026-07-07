// SPEC-PERF-003 (PRESERVE→IMPROVE 검증): useDashboardLoad 훅 특성 테스트.
// AC-01: 단일 마운트 사이클에서 getTodayDetailedSummary 정확히 1회.
// AC-02: 오늘 요약 + 주간 시술을 병렬(Promise.all) 발행.
import { act, renderHook, waitFor } from '@testing-library/react-native';

const mockGetTodayDetailedSummary = jest.fn();
const mockGetWeeklyTreatments = jest.fn();

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
jest.mock('@/src/stores/shopStore', () => {
  const state = { selectedShop: { id: 1, name: '테스트샵' }, loading: false };
  return { useShopStore: (selector: any) => selector(state) };
});

import { useDashboardLoad } from '@/hooks/useDashboardLoad';

describe('useDashboardLoad (REQ-PERF-003-01)', () => {
  beforeEach(() => {
    mockGetTodayDetailedSummary.mockReset();
    mockGetWeeklyTreatments.mockReset();
    mockGetTodayDetailedSummary.mockResolvedValue({ summary: {}, sales: {}, customer_insights: [] });
    mockGetWeeklyTreatments.mockResolvedValue([]);
  });

  it('AC-01: 단일 마운트 사이클에서 getTodayDetailedSummary 를 정확히 1회 호출한다', async () => {
    renderHook(() => useDashboardLoad());
    await waitFor(() => expect(mockGetTodayDetailedSummary).toHaveBeenCalledTimes(1));
    // 추가 사이클 없이 안정화되었는지 확인
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

    renderHook(() => useDashboardLoad());

    // 오늘 요약이 아직 pending 인 상태에서 주간 시술이 이미 호출되어 있어야 병렬(Promise.all) 발행이다.
    await waitFor(() => expect(mockGetWeeklyTreatments).toHaveBeenCalledTimes(1));
    expect(mockGetTodayDetailedSummary).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveToday({ summary: {}, sales: {}, customer_insights: [] });
      await Promise.resolve();
    });
  });

  it('불변식: 주간 실패(비인증)는 오늘 요약을 유실시키지 않는다', async () => {
    mockGetWeeklyTreatments.mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => useDashboardLoad());
    await waitFor(() => expect(result.current.weeklyError).toBe(true));
    // 오늘 요약은 정상 반영
    expect(result.current.dashboardData).not.toBeNull();
  });
});
