// SPEC-DATA-001 REQ-DATA-001-04 (F-12c): 시술 메뉴 공유 query.
// 예약 폼(메뉴 로드)과 메뉴 관리 화면이 동일 데이터(모든 메뉴 + 상세)를 공유 key
// `['treatmentMenus', shopId]` 로 캐싱한다. queryFn 은 도메인 서비스 getAllWithDetails 를 사용한다.
import { queryKeys } from '@/src/api/queryKeys';
import { treatmentMenuApiService, type TreatmentMenu } from '@/src/api/services/treatmentMenu';
import { useQuery } from '@tanstack/react-query';

// 메뉴는 shop 헤더(X-Shop-ID)로 스코프되며, 기존 소비자(예약 폼)는 상점 선택 여부와 무관하게
// 마운트 시 무조건 로드했으므로 기본 enabled=true 를 유지한다(behavior 보존).
export function useTreatmentMenusQuery(shopId: number | undefined) {
  return useQuery<TreatmentMenu[]>({
    queryKey: queryKeys.treatmentMenus(shopId),
    queryFn: () => treatmentMenuApiService.getAllWithDetails(),
  });
}
