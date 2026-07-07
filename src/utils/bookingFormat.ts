// SPEC-PERF-003 REQ-PERF-003-03: 예약 행 표시 문자열을 목록 수신 시점에 1회 파생한다.
// 행 render 경로에서 new Date(...).toLocaleTimeString / toLocaleString 을 제거하기 위해
// 날짜/시간/합계 문자열을 사전 계산한 BookingRow 로 변환한다.
import type { Treatment } from '@/src/types';
import { formatKoreanDate } from '@/src/utils/dateUtils';
import { formatKrwNumber, formatTimeHm } from '@/src/utils/intlFormat';

export interface BookingRow {
  booking: Treatment;
  date: string;
  time: string;
  totalText: string;
}

// 기존 BookingListItem.formatDateTime + totalPrice.toLocaleString() 과 문자 단위로 동일한 결과를 만든다.
export function toBookingRow(booking: Treatment): BookingRow {
  const totalPrice = booking.treatment_items?.reduce((sum, ti) => sum + ti.base_price, 0) || 0;
  return {
    booking,
    date: formatKoreanDate(booking.reserved_at),
    time: formatTimeHm(booking.reserved_at),
    totalText: formatKrwNumber(totalPrice),
  };
}

// SPEC-BOOKING-001 REQ-BOOKING-001-06 (F-11b): 현재 시각 이후 첫 가용 시간 슬롯 계산(순수 함수).
// now 의 시각(HH:mm)보다 뒤이면서 예약되지 않은 첫 슬롯을 반환한다. 없으면 null.
// 시각적 유도 전용 — selectedTime 을 설정하지 않으므로 선택을 강제하지 않는다.
export function findFirstAvailableSlotAfter(
  now: Date,
  slots: string[],
  reservedSlots: string[],
): string | null {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (const slot of slots) {
    const [h, m] = slot.split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) continue;
    const slotMinutes = h * 60 + m;
    if (slotMinutes > nowMinutes && !reservedSlots.includes(slot)) {
      return slot;
    }
  }
  return null;
}
