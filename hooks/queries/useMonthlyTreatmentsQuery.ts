// SPEC-DATA-001 REQ-DATA-001-03 (F-12b): 달력 월별 시술 읽기 경로 캐싱.
// query key `['treatments', 'monthly', shopId, month]` (month = 'YYYY-MM').
// 동일 월 재방문 시 staleTime 내 재요청 0회. onTreatmentsLoad 부모 콜백 계약을 보존한다(REQ-03, D9).
import { queryKeys } from '@/src/api/queryKeys';
import { treatmentApiService } from '@/src/api/services/treatment';
import type { Treatment } from '@/src/types';
import { useQuery } from '@tanstack/react-query';

export function monthKey(year: number, month: number): string {
  return `${year}-${month.toString().padStart(2, '0')}`;
}

export function useMonthlyTreatmentsQuery(
  shopId: number | undefined,
  year: number,
  month: number,
) {
  return useQuery<Treatment[]>({
    queryKey: queryKeys.treatmentsMonthly(shopId, monthKey(year, month)),
    queryFn: () => treatmentApiService.getMonthlyTreatments(year, month),
    enabled: !!shopId,
  });
}
