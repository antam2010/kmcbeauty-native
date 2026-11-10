// UTC 날짜를 로컬(KST) 날짜로 쓰던 버그의 회귀 방지 — 유틸 계층(dateUtils / calendarUtils).
// toISOString().split('T')[0] 은 UTC 날짜라서 한국(UTC+9)에서는 00:00~08:59 사이에(그리고 new Date(y, m, d)
// 같은 로컬 자정 Date 는 항상) 하루 전 날짜가 된다. 시간대는 jest.config.js 가 Asia/Seoul 로 고정한다.
import type { Treatment } from '@/src/types';
import { buildBookingCountMap, generateCalendarDates } from '@/src/utils/calendarUtils';
import { localDateTimeToUtcIso, toLocalDateString } from '@/src/utils/dateUtils';

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

// D1: 예약 생성이 오프셋 없는 로컬 일시를 보내 백엔드(UTC wall-clock 저장)에서 9시간 밀리던 버그의 회귀 방지.
describe('localDateTimeToUtcIso: 기기 로컬(KST) 날짜·시각 → UTC ISO 8601(Z)', () => {
  it.each([
    ['2026-07-07', '14:00', '2026-07-07T05:00:00.000Z'], // 오후
    ['2026-07-07', '08:30', '2026-07-06T23:30:00.000Z'], // UTC 날짜 경계(전날)
    ['2026-07-07', '09:00', '2026-07-07T00:00:00.000Z'], // UTC 자정
    ['2026-07-07', '00:00', '2026-07-06T15:00:00.000Z'], // 로컬 자정
    ['2026-07-07', '23:59', '2026-07-07T14:59:00.000Z'], // 로컬 하루의 끝
    ['2027-01-01', '00:00', '2026-12-31T15:00:00.000Z'], // 연 경계
    ['2028-02-29', '10:00', '2028-02-29T01:00:00.000Z'], // 윤일
  ])('로컬 %s %s → %s', (localDate, localTime, expected) => {
    expect(localDateTimeToUtcIso(localDate, localTime)).toBe(expected);
  });

  it('결과를 다시 Date 로 읽으면 고른 로컬 날짜·시각(2026-07-07 14:00)이 된다', () => {
    const back = new Date(localDateTimeToUtcIso('2026-07-07', '14:00'));
    expect([back.getFullYear(), back.getMonth() + 1, back.getDate(), back.getHours(), back.getMinutes()])
      .toEqual([2026, 7, 7, 14, 0]);
  });

  // 입력 계약: 날짜 'YYYY-MM-DD', 시각 'HH:mm'(24시간). 비었거나 형식이 다르거나 달력에 없는 값이면
  // RangeError 를 던진다 — Date 롤오버(2월 30일 → 3월 2일)나 'Invalid Date' 로 다른 시각을 보내지 않는다.
  it.each([
    ['빈 날짜', '', '14:00'],
    ['빈 시각', '2026-07-07', ''],
    ['구분자가 다른 날짜', '2026/07/07', '14:00'],
    ['자릿수가 모자란 시각', '2026-07-07', '9:00'],
    ['초까지 붙은 시각', '2026-07-07', '14:00:00'],
    ['달력에 없는 날짜(2월 30일)', '2026-02-30', '14:00'],
    ['윤년이 아닌 해의 2월 29일', '2026-02-29', '14:00'],
    ['없는 월(13월)', '2026-13-01', '14:00'],
    ['범위 밖 시(24:00)', '2026-07-07', '24:00'],
    ['범위 밖 분(14:60)', '2026-07-07', '14:60'],
  ])('%s → RangeError', (_label, localDate, localTime) => {
    expect(() => localDateTimeToUtcIso(localDate, localTime)).toThrow(RangeError);
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
