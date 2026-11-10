// REQ-PERF-003-02: 홈 월간 현황 모달 — 조건부 마운트를 유지하면서 닫힘 애니메이션을 보존한다.
// 닫은 직후에는 RN Modal 이 visible=false 로 마운트된 채 남아 네이티브 닫힘 애니메이션을 재생할 수 있고,
// 지연(MODAL_CLOSE_UNMOUNT_DELAY_MS)이 지나면 하위 트리까지 내려간다. 닫힌 동안 월별 API 는 호출되지 않는다.
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Modal } from 'react-native';
import { MODAL_CLOSE_UNMOUNT_DELAY_MS } from '@/hooks/useDelayedUnmount';
import { makeQueryWrapper } from './utils/queryTestUtils';

const mockGetTodayDetailedSummary = jest.fn();
const mockGetMonthlyDetailedSummary = jest.fn();
const mockGetWeeklyTreatments = jest.fn();

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
  useShopStore: (selector: any) => selector({ selectedShop: { id: 1, name: '테스트샵' } }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/components/navigation/ShopHeader', () => () => null);
// 화면의 RN Modal 이 월간 현황 모달 하나만 남도록 통합 상세 모달은 비운다.
jest.mock('@/components/modals/UnifiedTreatmentModal', () => () => null);
// 실제 MonthlyDashboard 처럼 마운트될 때 월별 API 를 호출하는 대역(MonthlyDashboard.tsx 55행 useEffect).
jest.mock('@/components/dashboard/MonthlyDashboard', () => {
  const { useEffect } = require('react');
  const { Text } = require('react-native');
  const { dashboardApiService } = require('@/src/api/services/dashboard');
  return function MonthlyDashboardFetchOnMount() {
    useEffect(() => {
      dashboardApiService.getMonthlyDetailedSummary(2026, 11);
    }, []);
    return <Text testID="monthly-dashboard-mock">MonthlyDashboardMock</Text>;
  };
});

import HomeScreen from '@/app/(tabs)/index';

const SUMMARY = {
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

async function renderHome() {
  const { Wrapper } = makeQueryWrapper();
  const utils = render(<HomeScreen />, { wrapper: Wrapper });
  await waitFor(() => utils.getByText('오늘의 현황'));
  await act(async () => {
    await Promise.resolve();
  });
  return utils;
}

describe('REQ-PERF-003-02: 홈 월간 현황 모달 닫힘 애니메이션', () => {
  beforeEach(() => {
    mockGetTodayDetailedSummary.mockReset().mockResolvedValue(SUMMARY);
    mockGetWeeklyTreatments.mockReset().mockResolvedValue([]);
    mockGetMonthlyDetailedSummary.mockReset().mockResolvedValue(SUMMARY);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('닫은 직후 visible=false 로 마운트를 유지하고, 지연이 지나면 내리며, 닫힌 동안 월별 API 를 부르지 않는다', async () => {
    const utils = await renderHome();
    const monthlyModals = () => utils.UNSAFE_queryAllByType(Modal);

    // 열기 전: 마운트되지 않고 월별 API 도 0회(CT-4 와 같은 불변식).
    expect(monthlyModals()).toHaveLength(0);
    expect(mockGetMonthlyDetailedSummary).not.toHaveBeenCalled();

    jest.useFakeTimers();
    fireEvent.press(utils.getByTestId('view-details-button'));
    expect(monthlyModals()).toHaveLength(1);
    expect(monthlyModals()[0].props.visible).toBe(true);
    expect(mockGetMonthlyDetailedSummary).toHaveBeenCalledTimes(1);

    fireEvent.press(utils.getByLabelText('닫기'));
    // 닫은 직후: Modal 이 visible=false 로 남아 네이티브 닫힘 애니메이션 구간을 확보한다.
    expect(monthlyModals()).toHaveLength(1);
    expect(monthlyModals()[0].props.visible).toBe(false);

    act(() => {
      jest.advanceTimersByTime(MODAL_CLOSE_UNMOUNT_DELAY_MS - 1);
    });
    expect(monthlyModals()).toHaveLength(1);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    // 지연이 지나면 MonthlyDashboard 까지 내려간다.
    expect(monthlyModals()).toHaveLength(0);
    expect(utils.queryByTestId('monthly-dashboard-mock')).toBeNull();
    // 닫힌 동안(애니메이션 구간 포함) 월별 API 추가 호출이 없다.
    expect(mockGetMonthlyDetailedSummary).toHaveBeenCalledTimes(1);
  });
});
