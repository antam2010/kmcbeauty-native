// SPEC-BOOKING-001 REQ-BOOKING-001-06 (F-11b, AC-15): 첫 가용 슬롯 계산 순수 함수 단위 테스트.
import { findFirstAvailableSlotAfter } from '@/src/utils/bookingFormat';

const SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00'];

function at(h: number, m: number): Date {
  const d = new Date(2026, 6, 7, h, m, 0); // 2026-07-07 로컬
  return d;
}

describe('findFirstAvailableSlotAfter (REQ-BOOKING-001-06)', () => {
  it('현재 시각 이후의 첫 슬롯을 반환한다', () => {
    expect(findFirstAvailableSlotAfter(at(9, 15), SLOTS, [])).toBe('09:30');
  });

  it('현재 시각과 동일한 슬롯은 제외하고(strictly after) 다음 슬롯을 반환한다', () => {
    expect(findFirstAvailableSlotAfter(at(9, 30), SLOTS, [])).toBe('10:00');
  });

  it('예약된(reserved) 슬롯은 건너뛴다', () => {
    expect(findFirstAvailableSlotAfter(at(9, 15), SLOTS, ['09:30', '10:00'])).toBe('10:30');
  });

  it('남은 가용 슬롯이 없으면 null 을 반환한다(강조 없음)', () => {
    expect(findFirstAvailableSlotAfter(at(11, 30), SLOTS, [])).toBeNull();
  });

  it('모든 이후 슬롯이 예약되면 null 을 반환한다', () => {
    expect(findFirstAvailableSlotAfter(at(9, 15), SLOTS, ['09:30', '10:00', '10:30', '11:00'])).toBeNull();
  });
});
