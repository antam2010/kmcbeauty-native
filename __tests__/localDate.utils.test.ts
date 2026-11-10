// UTC 날짜를 로컬(KST) 날짜로 쓰던 버그의 회귀 방지 — 유틸 계층(dateUtils / calendarUtils).
// toISOString().split('T')[0] 은 UTC 날짜라서 한국(UTC+9)에서는 00:00~08:59 사이에(그리고 new Date(y, m, d)
// 같은 로컬 자정 Date 는 항상) 하루 전 날짜가 된다. 시간대는 jest.config.js 가 Asia/Seoul 로 고정한다.
import type { Treatment } from '@/src/types';
import { buildBookingCountMap, generateCalendarDates } from '@/src/utils/calendarUtils';
import { toLocalDateString } from '@/src/utils/dateUtils';

// 2026-11-10(화) 07:30 KST — UTC 로는 아직 2026-11-09 22:30.
const KST_2026_11_10_0730 = new Date('2026-11-09T22:30:00Z');

const pad = (n: number) => String(n).padStart(2, '0');

afterEach(() => {
  jest.useRealTimers();
});

describe('테스트 시간대 고정', () => {
  it('jest.config.js 의 TZ 고정으로 Asia/Seoul(UTC+9)에서 실행된다', () => {
    expect(new Date(2026, 10, 10).getTimezoneOffset()).toBe(-540);
  });
});

describe('toLocalDateString: 기기 로컬(KST) 기준 YYYY-MM-DD', () => {
  it.each([
    ['00:30', 0, 30],
    ['08:59', 8, 59],
    ['09:00', 9, 0],
    ['23:59', 23, 59],
  ])('로컬 2026-11-10 %s → 2026-11-10', (_label, hour, minute) => {
    expect(toLocalDateString(new Date(2026, 10, 10, hour, minute))).toBe('2026-11-10');
  });

  it('로컬 자정 Date(new Date(y, m, d))는 그 날짜를 그대로 돌려준다', () => {
    expect(toLocalDateString(new Date(2026, 10, 1))).toBe('2026-11-01');
    expect(toLocalDateString(new Date(2026, 10, 30))).toBe('2026-11-30');
    expect(toLocalDateString(new Date(2026, 1, 28))).toBe('2026-02-28');
    expect(toLocalDateString(new Date(2027, 0, 1))).toBe('2027-01-01');
  });

  it('API 의 UTC 시각(2026-11-09T22:30:00Z)은 KST 날짜 2026-11-10 이 된다', () => {
    expect(toLocalDateString(new Date('2026-11-09T22:30:00Z'))).toBe('2026-11-10');
  });

  it('인자를 생략하면 현재 시각의 로컬 날짜를 돌려준다', () => {
    jest.useFakeTimers({ now: KST_2026_11_10_0730 });
    expect(toLocalDateString()).toBe('2026-11-10');
  });
});

describe('calendarUtils: 달력 셀·예약 집계는 KST 날짜를 쓴다', () => {
  it('2026년 11월: 현재 달 셀은 2026-11-01~30 / dayOfMonth 1~30 이고 1일은 자기 요일 인덱스(일=0)에 놓인다', () => {
    const dates = generateCalendarDates(new Date(2026, 10, 1), undefined, new Map());
    expect(dates).toHaveLength(42);

    const current = dates.filter((c) => c.isCurrentMonth);
    expect(current.map((c) => c.date)).toEqual(
      Array.from({ length: 30 }, (_, i) => `2026-11-${pad(i + 1)}`),
    );
    expect(current.map((c) => c.dayOfMonth)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));

    // 2026-11-01 은 일요일(0) → 첫 셀
    expect(new Date(2026, 10, 1).getDay()).toBe(0);
    expect(dates.findIndex((c) => c.date === '2026-11-01')).toBe(0);
  });

  it('앞뒤 달 셀도 로컬 날짜·일자: 2026년 12월은 11-29, 11-30 으로 시작하고 12-31 다음 셀은 2027-01-01', () => {
    const dates = generateCalendarDates(new Date(2026, 11, 1), undefined, new Map());

    // 2026-12-01 은 화요일(2) → 앞 달 셀 2칸
    expect(dates.slice(0, 3).map((c) => [c.date, c.dayOfMonth, c.isCurrentMonth])).toEqual([
      ['2026-11-29', 29, false],
      ['2026-11-30', 30, false],
      ['2026-12-01', 1, true],
    ]);
    const lastDayIndex = dates.findIndex((c) => c.date === '2026-12-31');
    expect(dates[lastDayIndex + 1]).toMatchObject({
      date: '2027-01-01',
      dayOfMonth: 1,
      isCurrentMonth: false,
    });
  });

  it('isToday: 2026-11-10 07:30 KST 에는 2026-11-10 셀만 오늘이다', () => {
    jest.useFakeTimers({ now: KST_2026_11_10_0730 });
    const dates = generateCalendarDates(new Date(2026, 10, 1), undefined, new Map());
    expect(dates.filter((c) => c.isToday).map((c) => c.date)).toEqual(['2026-11-10']);
  });

  it('buildBookingCountMap: 2026-11-09T22:30:00Z(11-10 07:30 KST) 예약은 2026-11-10 에 집계된다', () => {
    const map = buildBookingCountMap([
      { reserved_at: '2026-11-09T22:30:00Z' },
    ] as unknown as Treatment[]);
    expect(map.get('2026-11-10')).toBe(1);
    expect(map.has('2026-11-09')).toBe(false);
  });
});
