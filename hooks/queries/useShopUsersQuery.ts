// SPEC-DATA-001 REQ-DATA-001-04 (F-12d): 직원 목록 공유 query.
// 예약 폼과 직원 관리 화면이 동일 종단 엔드포인트(GET /shops/{shopId}/users)를 사용하므로
// 하나의 공유 query key 계열 `['shopUsers', shopId]` 로 단일 캐시 항목을 공유한다(research.md §6 D5).
// - queryFn: throw 페처(shopApiService.getUsers — `[]` 폴백 없음)로 react-query 오류 상태를 정상 노출한다.
// - 원본 캐시는 원시 `ShopUserResponse[]` 로 유지하고, 뷰모델 변환(StaffUser[])은 `select` 로 적용한다.
import { shopApiService, type ShopUserResponse } from '@/src/api/services/shop';
import type { StaffUser } from '@/src/api/services/staff';
import { queryKeys } from '@/src/api/queryKeys';
import { useQuery } from '@tanstack/react-query';

// 원시 응답 → StaffUser[] 뷰모델 변환(직원 관리 화면용). staff.ts getShopUsers 의 변환과 동일.
export function selectStaffUsers(response: ShopUserResponse[]): StaffUser[] {
  return response.map((item) => ({
    id: item.user.id,
    name: item.user.name,
    email: item.user.email,
    role: item.user.role,
    role_name: item.user.role_name,
    created_at: item.user.created_at,
    updated_at: item.user.updated_at,
    shop_id: item.shop_id,
    is_primary_owner: item.is_primary_owner === 1,
    // 클라이언트 전용 기본값 (백엔드 미반환)
    status: 'active' as const,
  }));
}

// 예약 폼: 원시 ShopUserResponse[] 소비(staff.user_id / staff.user.name / is_primary_owner === 1).
export function useShopUsersQuery(shopId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.shopUsers(shopId),
    queryFn: () => shopApiService.getUsers(shopId as number),
    enabled: !!shopId,
  });
}

// 직원 관리 화면: 동일 캐시 항목을 공유하되 select 로 StaffUser[] 뷰모델을 획득.
export function useStaffUsersQuery(shopId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.shopUsers(shopId),
    queryFn: () => shopApiService.getUsers(shopId as number),
    enabled: !!shopId,
    select: selectStaffUsers,
  });
}
