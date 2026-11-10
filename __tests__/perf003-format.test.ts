// SPEC-PERF-003 (PRESERVE): render 경로에서 제거되는 로케일 포맷/파생 함수의 특성 테스트.
// 캐시된 Intl 포맷터·파생 함수의 출력이 기존 toLocale* 호출과 문자 단위로 동일함을 고정한다(AC-13).
import type { Treatment } from '@/src/types';
import { toBookingRow } from '@/src/utils/bookingFormat';
import { buildBookingCountMap, generateCalendarDates } from '@/src/utils/calendarUtils';
import {
  formatKoreanFullDate,
  formatKoreanMonthDayWeekday,
  formatKoreanShortDate,
  formatKoreanYearMonth,
  formatKrwNumber,
  formatTimeHm,
} from '@/src/utils/intlFormat';
import { formatKoreanDate } from '@/src/utils/dateUtils';

describe('SPEC-PERF-003 intlFormat: 기존 toLocale* 와 문자 단위 동일 (REQ-07)', () => {
  const d = new Date('2025-09-17T14:05:00');
  const d2 = new Date('2025-09-17T09:03:00');

  it('formatKrwNumber === amount.toLocaleString() (정수)', () => {
    for (const n of [0, 500, 1234, 1234567, 90000]) {
      expect(formatKrwNumber(n)).toBe(n.toLocaleString());
    }
  });

  it('formatTimeHm === toLocaleTimeString(ko-KR, 2-digit/24h)', () => {
    const opts = { hour: '2-digit', minute: '2-digit', hour12: false } as const;
    expect(formatTimeHm(d)).toBe(d.toLocaleTimeString('ko-KR', opts));
    expect(formatTimeHm(d2)).toBe(d2.toLocaleTimeString('ko-KR', opts));
    // 문자열 입력도 동일 결과
    expect(formatTimeHm('2025-09-17T14:05:00')).toBe(d.toLocaleTimeString('ko-KR', opts));
  });

  it('formatKoreanShortDate === toLocaleDateString(ko-KR)', () => {
    expect(formatKoreanShortDate(d)).toBe(d.toLocaleDateString('ko-KR'));
  });

  it('formatKoreanYearMonth === toLocaleDateString(ko-KR, year/month long)', () => {
    expect(formatKoreanYearMonth(d)).toBe(
      d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' }),
    );
  });

  it('formatKoreanMonthDayWeekday === toLocaleDateString(ko-KR, month/day/weekday)', () => {
    expect(formatKoreanMonthDayWeekday(d)).toBe(
      d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }),
    );
  });

  it('formatKoreanFullDate === toLocaleDateString(ko-KR, full)', () => {
    expect(formatKoreanFullDate(d)).toBe(
      d.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      }),
    );
  });
});

describe('SPEC-PERF-003 toBookingRow: 예약 행 파생 (REQ-03)', () => {
  const booking = {
    id: 1,
    reserved_at: '2025-09-17T14:05:00',
    treatment_items: [
      { base_price: 30000 },
      { base_price: 20000 },
    ],
  } as unknown as Treatment;

  it('date/time/totalText 를 기존 render 로직과 동일하게 파생한다', () => {
    const row = toBookingRow(booking);
    // 기존: formatKoreanDate(reserved_at)
    expect(row.date).toBe(formatKoreanDate('2025-09-17T14:05:00'));
    // 기존: new Date(...).toLocaleTimeString('ko-KR', {hour,minute,hour12:false})
    expect(row.time).toBe(
      new Date('2025-09-17T14:05:00').toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    );
    // 기존: treatment_items.reduce(base_price).toLocaleString()
    expect(row.totalText).toBe((50000).toLocaleString());
    expect(row.booking).toBe(booking);
  });

  it('treatment_items 없으면 합계 0', () => {
    const empty = { id: 2, reserved_at: '2025-09-17T09:03:00' } as unknown as Treatment;
    expect(toBookingRow(empty).totalText).toBe((0).toLocaleString());
  });
});

describe('SPEC-PERF-003 calendarUtils: 날짜→건수 Map + 달력 생성 (REQ-06)', () => {
  const treatments = [
    { reserved_at: '2025-09-17T14:05:00' },
    { reserved_at: '2025-09-17T09:03:00' },
    { reserved_at: '2025-09-18T10:00:00' },
  ] as unknown as Treatment[];

  it('buildBookingCountMap 은 날짜별 건수를 누적한다', () => {
    const map = buildBookingCountMap(treatments);
    expect(map.get('2025-09-17')).toBe(2);
    expect(map.get('2025-09-18')).toBe(1);
    expect(map.get('2025-09-19')).toBeUndefined();
  });

  it('generateCalendarDates 는 42셀을 만들고 현재 달 건수를 Map 에서 조회한다', () => {
    const map = buildBookingCountMap(treatments);
    const dates = generateCalendarDates(new Date(2025, 8, 1), '2025-09-18', map);
    expect(dates).toHaveLength(42);

    const d17 = dates.find((c) => c.date === '2025-09-17' && c.isCurrentMonth);
    expect(d17?.bookingCount).toBe(2);
    expect(d17?.hasBookings).toBe(true);

    const d18 = dates.find((c) => c.date === '2025-09-18' && c.isCurrentMonth);
    expect(d18?.bookingCount).toBe(1);
    expect(d18?.isSelected).toBe(true);

    // 예약 없는 현재 달 날짜는 건수 0
    const d20 = dates.find((c) => c.date === '2025-09-20' && c.isCurrentMonth);
    expect(d20?.bookingCount).toBe(0);
    expect(d20?.hasBookings).toBe(false);
  });
});
