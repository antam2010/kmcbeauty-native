// SPEC-BOOKING-001 REQ-BOOKING-001-01 (F-8): payload 조립 단위 테스트.
// 재현 우선(CLAUDE.md Rule 4): 담당 직원·결제 방법이 payload에 포함되어야 한다.
import { buildTreatmentPayload, type BookingPayloadState } from '@/src/utils/bookingPayload';

const baseTreatment = {
  menuDetail: {
    id: 11,
    menu_id: 1,
    name: '젤네일',
    duration_min: 60,
    base_price: 30000,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
  },
  sessionNo: 1,
  customPrice: 30000,
  customDuration: 60,
};

const staff = {
  shop_id: 1,
  user_id: 5,
  is_primary_owner: 0,
  user: { id: 5, name: '홍길동', email: 'a@b.c', role: 'STAFF' },
} as unknown as BookingPayloadState['selectedStaff'];

function makeState(overrides: Partial<BookingPayloadState> = {}): BookingPayloadState {
  return {
    phonebookId: 42,
    currentDate: '2026-07-07',
    selectedTime: '14:00',
    memo: '',
    selectedTreatments: [baseTreatment],
    selectedStaff: staff,
    paymentMethod: 'CASH',
    ...overrides,
  };
}

describe('buildTreatmentPayload (REQ-BOOKING-001-01)', () => {
  it('AC-01: 직원·결제 선택 시 payload에 staff_user_id·payment_method 를 포함한다', () => {
    const payload = buildTreatmentPayload(makeState());
    expect(payload).toEqual(
      expect.objectContaining({ staff_user_id: 5, payment_method: 'CASH' }),
    );
  });

  it('AC-02: "담당 직원 없음" 선택 시 staff_user_id 를 포함하지 않는다(undefined)', () => {
    const payload = buildTreatmentPayload(makeState({ selectedStaff: null }));
    expect(payload.staff_user_id).toBeUndefined();
    expect('staff_user_id' in payload).toBe(false);
    // 결제 방법은 담당 직원 없음이어도 항상 포함
    expect(payload.payment_method).toBe('CASH');
  });

  it('기존 필수 필드(phonebook_id·reserved_at·status·treatment_items)를 보존한다', () => {
    const payload = buildTreatmentPayload(makeState({ paymentMethod: 'CARD' }));
    expect(payload.phonebook_id).toBe(42);
    expect(payload.reserved_at).toBe('2026-07-07T14:00:00');
    expect(payload.status).toBe('RESERVED');
    expect(payload.treatment_items).toEqual([
      { menu_detail_id: 11, session_no: 1, base_price: 30000, duration_min: 60 },
    ]);
    expect(payload.payment_method).toBe('CARD');
  });
});
