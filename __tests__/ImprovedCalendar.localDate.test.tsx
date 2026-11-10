// UTC 날짜를 로컬(KST) 날짜로 쓰던 버그의 회귀 방지 — 예약 탭 달력.
// 예약 배지가 붙은 KST 날짜 셀을 누르면 그 날짜의 예약 목록이 열려야 한다
// (셀 날짜 · 예약 건수 집계 키 · 목록 필터가 모두 같은 KST 날짜 기준). 시간대는 jest.config.js 가 Asia/Seoul 로 고정한다.
import { fireEvent, render } from '@testing-library/react-native';
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

// 2026-11-10(화) 07:30 KST 예약 — UTC 날짜로는 아직 11-09.
const TREATMENT = { id: 1, reserved_at: '2026-11-09T22:30:00Z' };

describe('ImprovedCalendar: KST 날짜 셀과 예약 목록', () => {
  beforeEach(() => {
    // Date 만 2026-11-10 07:30 KST 로 고정한다. 타이머는 실제 그대로 둬서 react-query·findBy 가 평소대로 동작한다.
    jest.useFakeTimers({
      now: new Date('2026-11-09T22:30:00Z'),
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
    mockGetMonthly.mockReset().mockResolvedValue([TREATMENT]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('예약 배지가 붙은 11월 10일 셀을 누르면 2026-11-10 의 예약 목록을 연다', async () => {
    const onDateSelect = jest.fn();
    const onShowTreatmentsList = jest.fn();
    const { Wrapper } = makeQueryWrapper();
    const { findByText, getAllByText } = render(
      <ImprovedCalendar onDateSelect={onDateSelect} onShowTreatmentsList={onShowTreatmentsList} />,
      { wrapper: Wrapper },
    );

    await findByText('📋'); // 월간 예약 로드 → 예약 배지 렌더 대기
    expect(mockGetMonthly).toHaveBeenCalledWith(2026, 11);

    // 2026년 11월 그리드에서 "10" 은 11월 10일 셀이 먼저, 다음 달(12월 10일, 비활성) 셀이 뒤에 온다.
    fireEvent.press(getAllByText('10')[0]);

    expect(onShowTreatmentsList).toHaveBeenCalledWith([TREATMENT], '2026-11-10');
    expect(onDateSelect).not.toHaveBeenCalled();
  });
});
