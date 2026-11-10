// SPEC-DATA-001 REQ-DATA-001-04 (F-12d) AC-07: 직원 목록 공유 query key + select 뷰모델 + throw 페처 오류 상태.
import { renderHook, waitFor } from '@testing-library/react-native';
import { makeQueryWrapper } from './utils/queryTestUtils';

const mockGetUsers = jest.fn();
jest.mock('@/src/api/services/shop', () => ({
  shopApiService: { getUsers: (...a: any[]) => mockGetUsers(...a) },
}));

import { queryKeys } from '@/src/api/queryKeys';
import {
  selectStaffUsers,
  useShopUsersQuery,
  useStaffUsersQuery,
} from '@/hooks/queries/useShopUsersQuery';

const RAW = [
  {
    shop_id: 1,
    user_id: 7,
    is_primary_owner: 1,
    user: {
      id: 7,
      name: '김직원',
      email: 'a@b.c',
      role: 'OWNER',
      role_name: '대표',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  },
];

describe('SPEC-DATA-001 AC-07: 직원 공유 query', () => {
  beforeEach(() => {
    mockGetUsers.mockReset();
    mockGetUsers.mockResolvedValue(RAW);
  });

  it('예약 폼·직원 관리가 동일 query key `[shopUsers, shopId]` 로 단일 캐시를 공유(fetch 1회)한다', async () => {
    const { Wrapper } = makeQueryWrapper();
    // 두 훅이 같은 shopId 로 같은 캐시를 공유.
    const bookingForm = renderHook(() => useShopUsersQuery(1), { wrapper: Wrapper });
    await waitFor(() => expect(bookingForm.result.current.isSuccess).toBe(true));

    const staffMgmt = renderHook(() => useStaffUsersQuery(1), { wrapper: Wrapper });
    await waitFor(() => expect(staffMgmt.result.current.isSuccess).toBe(true));

    // 공유 캐시 → getUsers 는 1회만 호출.
    expect(mockGetUsers).toHaveBeenCalledTimes(1);
    // query key 동일성 확인.
    expect(queryKeys.shopUsers(1)).toEqual(['shopUsers', 1]);
    // 예약 폼: 원시 ShopUserResponse[] 소비.
    expect(bookingForm.result.current.data).toEqual(RAW);
    // 직원 관리: select 로 StaffUser[] 뷰모델 획득.
    expect(staffMgmt.result.current.data).toEqual(selectStaffUsers(RAW));
    expect(staffMgmt.result.current.data?.[0]).toMatchObject({
      id: 7,
      name: '김직원',
      is_primary_owner: true,
      status: 'active',
    });
  });

  it('throw 페처(getUsers) 실패 시 react-query 오류 상태를 노출한다(무음 [] 폴백 없음)', async () => {
    mockGetUsers.mockRejectedValue(new Error('boom'));
    const { Wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useShopUsersQuery(1), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
