// SPEC-DATA-001 REQ-DATA-001-03 (F-12b) AC-06: 달력 월별 읽기 경로 캐싱.
// 동일 월 재방문 시 재요청 0회 + onTreatmentsLoad 부모 콜백 계약 유지.
import { render, waitFor, act } from '@testing-library/react-native';
import React from 'react';
import { makeQueryWrapper } from './utils/queryTestUtils';

const mockGetMonthly = jest.fn();
jest.mock('@/src/api/services/treatment', () => ({
  treatmentApiService: { getMonthlyTreatments: (...a: any[]) => mockGetMonthly(...a) },
}));
jest.mock('@/src/stores/shopStore', () => ({
  useShopStore: (selector: any) => selector({ selectedShop: { id: 1, name: 's' }, loading: false }),
}));

import { ImprovedCalendar } from '@/components/calendar/ImprovedCalendar';

const TREATMENTS = [{ id: 1, reserved_at: '2026-07-07T10:00:00' }];

describe('SPEC-DATA-001 AC-06: 달력 월별 캐싱', () => {
  beforeEach(() => {
    mockGetMonthly.mockReset().mockResolvedValue(TREATMENTS);
  });

  it('마운트 시 onTreatmentsLoad 콜백을 로드 결과로 호출한다(부모 계약 보존)', async () => {
    const onTreatmentsLoad = jest.fn();
    const { Wrapper } = makeQueryWrapper();
    render(
      <ImprovedCalendar onDateSelect={() => {}} onTreatmentsLoad={onTreatmentsLoad} />,
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(onTreatmentsLoad).toHaveBeenCalledWith(TREATMENTS));
    expect(mockGetMonthly).toHaveBeenCalledTimes(1);
  });

  it('동일 월 재마운트 시 staleTime 내 재요청 0회(공유 캐시)', async () => {
    const { Wrapper } = makeQueryWrapper();
    const first = render(<ImprovedCalendar onDateSelect={() => {}} />, { wrapper: Wrapper });
    await waitFor(() => expect(mockGetMonthly).toHaveBeenCalledTimes(1));
    first.unmount();

    render(<ImprovedCalendar onDateSelect={() => {}} />, { wrapper: Wrapper });
    await act(async () => { await Promise.resolve(); });
    // 동일 월 key → 캐시 사용, 추가 fetch 없음.
    expect(mockGetMonthly).toHaveBeenCalledTimes(1);
  });
});
