// SPEC-BOOKING-001 REQ-BOOKING-001-01 (F-8): 예약 생성 payload 조립 로직.
// handleBooking 내부 클로저에서 순수 함수로 추출하여 특성/단위 테스트를 가능케 한다.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SelectedTreatmentItem } from '@/components/forms/SelectedTreatmentItem';
import type { ShopUser } from '@/src/api/services/shop';
import type { TreatmentCreate, TreatmentItemCreate } from '@/src/types';

// SPEC-BOOKING-001 REQ-BOOKING-001-05 (F-11a): 최근 사용 직원 저장 키.
export const LAST_STAFF_USER_ID_KEY = '@booking/last_staff_user_id';

// 예약 성공 시에만 호출한다. 담당 직원 미선택(null)이면 키를 갱신하지 않는다(미저장 대안 없음).
export async function persistLastStaff(selectedStaff: ShopUser | null): Promise<void> {
  if (!selectedStaff) return;
  try {
    await AsyncStorage.setItem(LAST_STAFF_USER_ID_KEY, String(selectedStaff.user_id));
  } catch {
    // 저장 실패는 예약 성공 흐름을 차단하지 않는다(스마트 기본값은 부가 기능).
  }
}

// 저장된 최근 직원 user_id 가 현재 로드된 직원 목록에 존재할 때만 해당 직원을 반환한다.
// 목록에 없으면 null(복원하지 않고 "담당 직원 없음" 유지) — REQ-05 Unwanted 불변식.
export function resolveRestoredStaff(
  storedId: number | null,
  staffUsers: ShopUser[],
): ShopUser | null {
  if (storedId == null) return null;
  return staffUsers.find((s) => s.user_id === storedId) ?? null;
}

// 저장된 최근 직원 user_id 를 읽는다. 없거나 파싱 불가면 null.
export async function loadLastStaffUserId(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_STAFF_USER_ID_KEY);
    if (raw == null) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// @MX:ANCHOR: [AUTO] 예약 생성 payload 계약 — staff_user_id/payment_method 유실 금지(F-8 버그 지점).
// @MX:REASON: 화면 선택값(담당 직원·결제 방법)이 전송 payload에 반드시 반영되어야 하는 데이터 무결성 경계.
export interface BookingPayloadState {
  phonebookId: number;
  currentDate: string; // YYYY-MM-DD
  selectedTime: string; // HH:mm
  memo: string;
  selectedTreatments: SelectedTreatmentItem[];
  selectedStaff: ShopUser | null;
  paymentMethod: 'CARD' | 'CASH' | 'UNPAID';
}

export function buildTreatmentPayload(state: BookingPayloadState): TreatmentCreate {
  const treatmentItems: TreatmentItemCreate[] = state.selectedTreatments.map((item) => ({
    menu_detail_id: item.menuDetail.id,
    session_no: item.sessionNo,
    base_price: item.menuDetail.base_price,
    duration_min: item.customDuration,
  }));

  const payload: TreatmentCreate = {
    phonebook_id: state.phonebookId,
    reserved_at: `${state.currentDate}T${state.selectedTime}:00`,
    memo: state.memo.trim() || undefined,
    status: 'RESERVED',
    treatment_items: treatmentItems,
    // F-8 수정: 화면에서 선택한 결제 방법을 항상 payload에 포함(기본값 CARD 포함).
    payment_method: state.paymentMethod,
  };

  // D2 결정: 담당 직원 미선택 시 staff_user_id 를 payload에 아예 포함하지 않는다(생략).
  if (state.selectedStaff) {
    payload.staff_user_id = state.selectedStaff.user_id;
  }

  return payload;
}
