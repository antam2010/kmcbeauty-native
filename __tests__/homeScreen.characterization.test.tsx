// SPEC-HOME-001 PRESERVE 특성 테스트 (research.md §8 CT-1~5).
// 재구성 전 현재 홈의 데이터 흐름·불변식을 고정하고, 재구성 후에도 그대로 통과해야 한다.
// 여기서 검증하는 것은 시각 스냅샷이 아니라 "재구성 후에도 살아남아야 하는" 데이터/동작 계약이다:
//   CT-1 useDashboardLoad 소비(오늘 요약+주간 각 1회, 추가 호출 0)
//   CT-2 pull-to-refresh → force_refresh refetch (SPEC-DATA-001 AC-03)
//   CT-3 weeklyError 인라인 안내 (SPEC-UX-001 REQ-UX-007)
//   CT-4 월간 모달 닫힘 동안 MonthlyDashboard 미마운트 (REQ-PERF-003-02)
//   CT-5 !dashboardData 시 "다시 시도" 재시도 버튼 (SPEC-UX-001 REQ-UX-006)
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { makeQueryWrapper } from './utils/queryTestUtils';

const mockGetTodayDetailedSummary = jest.fn();
const mockGetMonthlyDetailedSummary = jest.fn();
const mockGetWeeklyTreatments = jest.fn();
const mockPush = jest.fn();

const mockShopState: { selectedShop: { id: number; name: string } | null } = {
  selectedShop: { id: 1, name: '테스트샵' },
};

jest.mock('@/src/api/services/dashboard', () => ({
  dashboardApiService: {
    getTodayDetailedSummary: (...a: any[]) => mockGetTodayDetailedSummary(...a),
    getMonthlyDetailedSummary: (...a: any[]) => mockGetMonthlyDetailedSummary(...a),
  },
}));
jest.mock('@/src/api/services/treatment', () => ({
  treatmentApiService: { getWeeklyTreatments: (...a: any[]) => mockGetWeeklyTreatments(...a) },
}));
jest.mock('@/contexts/DashboardContext', () => ({
  useDashboard: () => ({ refreshTrigger: 0, triggerRefresh: jest.fn() }),
}));
jest.mock('@/src/stores/shopStore', () => ({
  useShopStore: (selector: any) => selector(mockShopState),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/components/navigation/ShopHeader', () => () => null);
jest.mock('@/components/dashboard/MonthlyDashboard', () => {
  const { Text } = require('react-native');
  return () => <Text testID="monthly-dashboard-mock">MonthlyDashboardMock</Text>;
});

import HomeScreen from '@/app/(tabs)/index';

const TODAY_SUMMARY = {
  summary: {
    target_date: {
      actual_sales: 150000,
      expected_sales: 200000,
      completed: 3,
      total_reservations: 5,
      cancelled: 1,
      no_show: 0,
    },
    month: { actual_sales: 3000000 },
  },
  sales: { target_date: [] },
  customer_insights: [],
};

function setup() {
  mockGetTodayDetailedSummary.mockReset();
  mockGetMonthlyDetailedSummary.mockReset();
  mockGetWeeklyTreatments.mockReset();
  mockPush.mockReset();
  mockShopState.selectedShop = { id: 1, name: '테스트샵' };
  mockGetTodayDetailedSummary.mockResolvedValue(TODAY_SUMMARY);
  mockGetWeeklyTreatments.mockResolvedValue([]);
  mockGetMonthlyDetailedSummary.mockResolvedValue(TODAY_SUMMARY);
}

function renderHome() {
  const { Wrapper } = makeQueryWrapper();
  return render(<HomeScreen />, { wrapper: Wrapper });
}

describe('SPEC-HOME-001 PRESERVE 특성 테스트 (CT-1~5)', () => {
  beforeEach(setup);

  it('CT-1: 오늘 요약·주간 시술을 각 1회 조회하고 추가 서비스 호출은 없다', async () => {
    renderHome();
    await waitFor(() => expect(mockGetTodayDetailedSummary).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockGetWeeklyTreatments).toHaveBeenCalledTimes(1));
    await act(async () => { await Promise.resolve(); });
    // 마운트 조회 외 추가 호출 0 (월간 API 포함)
    expect(mockGetTodayDetailedSummary).toHaveBeenCalledTimes(1);
    expect(mockGetWeeklyTreatments).toHaveBeenCalledTimes(1);
    expect(mockGetMonthlyDetailedSummary).not.toHaveBeenCalled();
  });

  it('CT-2: 새로고침(force_refresh)은 오늘 요약을 force_refresh=true 로 refetch 한다', async () => {
    // 새로고침 배선 불변식: 헤더 새로고침(onHeaderRefresh)·pull-to-refresh(onRefresh) 모두 useDashboardLoad 를 통해
    // force_refresh=true 로 재조회한다(SPEC-DATA-001 AC-03). 헤더 버튼은 old/new 홈에 모두 존재해 안정적으로 검증 가능하다.
    const { getByLabelText } = renderHome();
    // 데이터 resolve 후 헤더(새로고침 버튼)가 렌더될 때까지 대기.
    await waitFor(() => expect(getByLabelText('새로고침')).toBeTruthy());
    expect(mockGetTodayDetailedSummary).toHaveBeenCalledTimes(1);
    expect(mockGetTodayDetailedSummary).toHaveBeenLastCalledWith(false);

    await act(async () => { fireEvent.press(getByLabelText('새로고침')); });

    await waitFor(() => expect(mockGetTodayDetailedSummary).toHaveBeenCalledTimes(2));
    expect(mockGetTodayDetailedSummary).toHaveBeenLastCalledWith(true);
  });

  it('CT-3: 주간 시술 로드(비인증) 실패 시 인라인 안내를 노출한다', async () => {
    mockGetWeeklyTreatments.mockRejectedValue(new Error('network error'));
    const { queryByText } = renderHome();
    await waitFor(() =>
      expect(queryByText('주간 예약 정보를 불러오지 못했습니다')).not.toBeNull(),
    );
  });

  it('CT-4: 월간 모달이 닫힌 동안 MonthlyDashboard 를 마운트하지 않는다(월별 API 0회)', async () => {
    const { queryByTestId } = renderHome();
    await waitFor(() => expect(mockGetTodayDetailedSummary).toHaveBeenCalledTimes(1));
    expect(queryByTestId('monthly-dashboard-mock')).toBeNull();
    expect(mockGetMonthlyDetailedSummary).not.toHaveBeenCalled();
  });

  it('CT-5: dashboardData 가 없으면 "다시 시도" 재시도 버튼을 노출한다', async () => {
    mockGetTodayDetailedSummary.mockRejectedValue(new Error('network error'));
    const { queryByLabelText } = renderHome();
    await waitFor(() => expect(queryByLabelText('다시 시도')).not.toBeNull());
  });
});
