// 일요일 주간 계산 버그의 회귀 방지 — 주는 월~일이고 일요일은 그 주의 마지막 날이다.
// 기존 계산(getDate() - getDay() + 1)은 일요일(getDay() === 0)에 다음 주 월요일을 잡았다. 그래서 일요일 하루 동안
// 주간 조회가 다음 주로 넘어갔고, 주간 데이터에서 걸러 내는 홈의 "오늘 예약" 목록이 비었다.
// 주간 조회는 실제 treatmentApiService.getWeeklyTreatments 를 쓰고 list 만 서버 흉내로 바꾼다.
// 시간대는 jest.config.js 가 Asia/Seoul 로 고정한다.
import { render, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { treatmentApiService } from '@/src/api/services/treatment';
import { toLocalDateString } from '@/src/utils/dateUtils';
import { makeQueryWrapper } from './utils/queryTestUtils';

const mockGetTodayDetailedSummary = jest.fn();

jest.mock('@/src/api/services/dashboard', () => ({
  dashboardApiService: {
    getTodayDetailedSummary: (...a: any[]) => mockGetTodayDetailedSummary(...a),
  },
}));
jest.mock('@/contexts/DashboardContext', () => ({
  useDashboard: () => ({ refreshTrigger: 0, triggerRefresh: jest.fn() }),
}));
jest.mock('@/src/stores/shopStore', () => ({
  useShopStore: (selector: any) =>
    selector({ selectedShop: { id: 1, name: '테스트샵' }, loading: false }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/components/navigation/ShopHeader', () => () => null);
jest.mock('@/components/dashboard/MonthlyDashboard', () => () => null);
jest.mock('@/components/modals/UnifiedTreatmentModal', () => () => null);

import HomeScreen from '@/app/(tabs)/index';
import { useDashboardLoad } from '@/hooks/useDashboardLoad';

// 2026-11-15(일) 14:00 KST.
const SUNDAY_1400_KST = new Date('2026-11-15T05:00:00Z');

// 같은 일요일 16:00 KST 예약 1건.
const SUNDAY_BOOKING = {
  id: 1,
  shop_id: 1,
  reserved_at: '2026-11-15T07:00:00Z',
  status: 'RESERVED',
  status_label: '예약됨',
  phonebook: { id: 1, shop_id: 1, name: '김일요', phone_number: '010-0000-0000' },
  treatment_items: [
    { id: 1, menu_detail_id: 1, session_no: 1, base_price: 30000, duration_min: 60, menu_detail: { id: 1, name: '젤네일' } },
  ],
};

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

// 서버 흉내: 요청한 start_date ~ end_date(KST 날짜, 종료일 포함) 안의 예약만 돌려준다.
function serveByRange(items: any[]) {
  return async (params?: any) => {
    const inRange = items.filter((t) => {
      const day = toLocalDateString(new Date(t.reserved_at));
      return day >= params.start_date && day <= params.end_date;
    });
    return { items: inRange, total: inRange.length, page: 1, size: 50, pages: 1 } as any;
  };
}

describe('일요일: 이번 주는 그 주 월요일 ~ 일요일', () => {
  beforeEach(() => {
    // Date 만 2026-11-15(일) 14:00 KST 로 고정한다. 타이머는 실제 그대로 둬서 react-query·waitFor 가 평소대로 동작한다.
    jest.useFakeTimers({
      now: SUNDAY_1400_KST,
      doNotFake: [
        'hrtime',
        'nextTick',
        'performance',
        'queueMicrotask',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'requestIdleCallback',
        'cancelIdleCallback',
        'setImmediate',
        'clearImmediate',
        'setInterval',
        'clearInterval',
        'setTimeout',
        'clearTimeout',
      ],
    });
    mockGetTodayDetailedSummary.mockReset().mockResolvedValue(SUMMARY);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('useDashboardLoad 의 주간 캐시 키는 그 주 월요일(2026-11-09)이다', async () => {
    const listSpy = jest.spyOn(treatmentApiService, 'list').mockImplementation(serveByRange([]));
    const { Wrapper, client } = makeQueryWrapper();
    renderHook(() => useDashboardLoad(), { wrapper: Wrapper });
    await waitFor(() => expect(listSpy).toHaveBeenCalledTimes(1));

    const weeklyKeys = client
      .getQueryCache()
      .findAll({ queryKey: ['treatments', 'weekly'] })
      .map((q) => q.queryKey);
    expect(weeklyKeys).toEqual([['treatments', 'weekly', 1, '2026-11-09']]);
  });

  it('홈 화면: 일요일 당일 예약이 "오늘 예약" 목록에 보인다', async () => {
    jest.spyOn(treatmentApiService, 'list').mockImplementation(serveByRange([SUNDAY_BOOKING]));
    const { Wrapper } = makeQueryWrapper();
    const { findByTestId } = render(<HomeScreen />, { wrapper: Wrapper });

    expect(await findByTestId('today-item-1')).toBeTruthy();
  });
});
