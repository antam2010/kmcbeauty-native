// SPEC-PERF-003 REQ-PERF-003-06: 캘린더 파생 계산을 순수 함수로 분리한다.
// 매 렌더마다 O(days×treatments) 필터를 재실행하던 로직을 날짜→건수 Map 조회로 대체하고,
// 42셀 배열 생성을 메모이제이션 가능한 순수 함수로 추출한다.
import type { Treatment } from '@/src/types';
import { toLocalDateString } from '@/src/utils/dateUtils';

export interface CalendarDate {
  date: string;
  dayOfMonth: number;
  isToday: boolean;
  isSelected: boolean;
  hasBookings: boolean;
  bookingCount: number;
  isCurrentMonth: boolean;
}

// 날짜(yyyy-MM-dd) → 예약 건수 Map. treatments 를 1회 순회하여 O(1) 조회를 가능하게 한다.
export function buildBookingCountMap(treatments: Treatment[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const treatment of treatments) {
    const dateString = toLocalDateString(new Date(treatment.reserved_at));
    map.set(dateString, (map.get(dateString) ?? 0) + 1);
  }
  return map;
}

// 42셀(6주×7일) 달력 배열 생성. 기존 컴포넌트 내 generateCalendarDates 와 동일한 로직.
export function generateCalendarDates(
  currentMonth: Date,
  selectedDate: string | undefined,
  countMap: Map<string, number>,
): CalendarDate[] {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();

  const dates: CalendarDate[] = [];
  const today = toLocalDateString();

  // 이전 달 날짜들
  for (let i = startWeekday - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    const dateString = toLocalDateString(date);
    dates.push({
      date: dateString,
      // 셀 자신의 로컬 Date 에서 일(day)을 구한다. 'YYYY-MM-DD' 를 new Date() 로 다시 파싱하면 UTC 자정으로 해석된다.
      dayOfMonth: date.getDate(),
      isToday: false,
      isSelected: false,
      hasBookings: false,
      bookingCount: 0,
      isCurrentMonth: false,
    });
  }

  // 현재 달 날짜들
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    const dateString = toLocalDateString(date);
    const bookingCount = countMap.get(dateString) ?? 0;

    dates.push({
      date: dateString,
      dayOfMonth: date.getDate(),
      isToday: dateString === today,
      isSelected: dateString === selectedDate,
      hasBookings: bookingCount > 0,
      bookingCount,
      isCurrentMonth: true,
    });
  }

  // 다음 달 날짜들
  const remainingCells = 42 - dates.length; // 6주 × 7일
  for (let day = 1; day <= remainingCells; day++) {
    const date = new Date(year, month + 1, day);
    const dateString = toLocalDateString(date);
    dates.push({
      date: dateString,
      dayOfMonth: date.getDate(),
      isToday: false,
      isSelected: false,
      hasBookings: false,
      bookingCount: 0,
      isCurrentMonth: false,
    });
  }

  return dates;
}
