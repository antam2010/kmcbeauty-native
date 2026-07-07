// SPEC-BOOKING-001 REQ-BOOKING-001-05 (F-11a, AC-10/AC-11): 최근 사용 직원 저장/복원.
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LAST_STAFF_USER_ID_KEY,
  loadLastStaffUserId,
  persistLastStaff,
  resolveRestoredStaff,
} from '@/src/utils/bookingPayload';
import type { ShopUser } from '@/src/api/services/shop';

function makeStaff(userId: number): ShopUser {
  return {
    shop_id: 1,
    user_id: userId,
    is_primary_owner: 0,
    user: { id: userId, name: `직원${userId}`, email: `s${userId}@x.co`, role: 'STAFF' },
  } as unknown as ShopUser;
}

const staffList = [makeStaff(3), makeStaff(5), makeStaff(9)];

describe('최근 사용 직원 저장/복원 (REQ-BOOKING-001-05)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('AC-10: 예약 성공 시 선택한 직원 user_id 를 저장하고, 목록에 존재하면 복원한다', async () => {
    await persistLastStaff(makeStaff(5));
    expect(await AsyncStorage.getItem(LAST_STAFF_USER_ID_KEY)).toBe('5');

    const storedId = await loadLastStaffUserId();
    expect(storedId).toBe(5);
    const restored = resolveRestoredStaff(storedId, staffList);
    expect(restored?.user_id).toBe(5);
  });

  it('REQ-05: "담당 직원 없음"(null)이면 키를 저장/갱신하지 않는다', async () => {
    await AsyncStorage.setItem(LAST_STAFF_USER_ID_KEY, '5'); // 기존 값
    await persistLastStaff(null);
    // 미저장 대안: 기존 값이 그대로 유지되며 null 로 덮어쓰지 않는다.
    expect(await AsyncStorage.getItem(LAST_STAFF_USER_ID_KEY)).toBe('5');
  });

  it('AC-11: 저장된 최근 직원이 현재 목록에 없으면 미복원(null 유지)', async () => {
    await persistLastStaff(makeStaff(77)); // 목록에 없는 id
    const storedId = await loadLastStaffUserId();
    expect(storedId).toBe(77);
    expect(resolveRestoredStaff(storedId, staffList)).toBeNull();
  });

  it('REQ-05: 저장된 적이 없으면 복원 대상 없음(null)', async () => {
    const storedId = await loadLastStaffUserId();
    expect(storedId).toBeNull();
    expect(resolveRestoredStaff(storedId, staffList)).toBeNull();
  });
});
