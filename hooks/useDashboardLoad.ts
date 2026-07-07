// SPEC-PERF-003 REQ-PERF-003-01: 홈 대시보드 로드 로직을 테스트 가능한 훅으로 분리한다.
// - 마운트 시 중복 요청 제거, 병렬화(오늘 요약 + 주간 시술).
// - 불변식 보존: 인증 오류 상위 전파(인터셉터 처리), 주간 실패 weeklyError 인라인 안내(SPEC-UX-001 REQ-UX-007),
//   상점 미선택 시 로드 스킵.
// SPEC-DATA-001 REQ-DATA-001-02 (F-12a): 두 읽기 경로를 react-query 로 캐싱한다.
// - 동일 query key 재마운트 시 staleTime(60s) 내 재요청 0회(중복제거).
// - pull-to-refresh/헤더 새로고침 → force_refresh 로 정확히 1회 refetch.
// - 두 query 는 병렬 발행(react-query 가 마운트 시 동시 dispatch)되며, 주간 실패는 오늘 요약을 유실시키지 않는다.
import { useDashboard } from '@/contexts/DashboardContext';
import { queryKeys } from '@/src/api/queryKeys';
import { dashboardApiService } from '@/src/api/services/dashboard';
import { treatmentApiService } from '@/src/api/services/treatment';
import { useShopStore } from '@/src/stores/shopStore';
import type { Treatment } from '@/src/types';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

// 임시 타입 정의 (기존 index.tsx 정의 이전)
export interface DashboardSummaryResponse {
  target_date: string;
  summary: any;
  sales: any;
  customer_insights: any[];
  staff_summary: any;
}

const isAuthError = (error: any): boolean =>
  !!error?.message?.includes('인증이 만료') || !!error?.message?.includes('권한이 없습니다');

// 주간 범위(월요일 기준) 키 문자열. 서비스는 자체적으로 오늘 기준 주를 계산하므로 캐시 식별용으로만 사용.
function currentWeekKey(): string {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  return monday.toISOString().split('T')[0];
}

export function useDashboardLoad() {
  const [refreshing, setRefreshing] = useState(false);

  // REQ-PERF-003-08: 필드 셀렉터 구독(전체 구조분해 대신)
  const shopId = useShopStore((s) => s.selectedShop?.id);
  const { refreshTrigger } = useDashboard();

  // 캐시 식별 키(마운트 시점 고정). '오늘'/주간 범위는 세션 내 안정적이면 충분하다.
  const [todayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [weekRange] = useState(() => currentWeekKey());

  // pull-to-refresh 시 오늘 요약을 force_refresh 로 1회 조회하기 위한 플래그.
  // 플래그의 수명(set→reset)은 각 수동 새로고침 호출부가 소유한다:
  //   refresh() 가 refetch 직전에 true 로 올리고, refetch 완료 후 false 로 되돌린다.
  //   queryFn 은 읽기만 하므로(read-only) refetch 도중 리셋되는 read-then-reset 경합이 없다.
  const forceRefreshRef = useRef(false);

  // 오늘 요약 query — 상점 미선택 시 비활성(요청 스킵).
  const todayQuery = useQuery<DashboardSummaryResponse>({
    queryKey: queryKeys.dashboardToday(shopId, todayDate),
    queryFn: async () => {
      // 읽기 전용: 플래그 리셋은 호출부(onRefresh/onHeaderRefresh/retryDashboard)가 담당.
      const force = forceRefreshRef.current;
      return dashboardApiService.getTodayDetailedSummary(force);
    },
    enabled: !!shopId,
  });

  // 주간 시술 query — 실패가 오늘 요약과 독립적으로 격리된다(별도 query).
  const weeklyQuery = useQuery<Treatment[]>({
    queryKey: queryKeys.treatmentsWeekly(shopId, weekRange),
    queryFn: () => treatmentApiService.getWeeklyTreatments(),
    enabled: !!shopId,
  });

  const dashboardData = todayQuery.data ?? null;
  const weeklyTreatments = weeklyQuery.data ?? [];
  // SPEC-UX-001 REQ-UX-007: 인증 오류는 인터셉터가 처리(상위 전파 의미론) — weeklyError 안내를 띄우지 않는다.
  //   그 외 오류만 인라인 안내로 노출한다.
  const weeklyError = weeklyQuery.isError && !isAuthError(weeklyQuery.error);
  // 상점 미선택(비활성) 시 로딩 스킵 → isLoading=false.
  const loading = todayQuery.isLoading;

  // 오늘 요약 비인증 오류는 기존과 동일하게 Alert 로 안내(인증 오류는 인터셉터가 처리).
  useEffect(() => {
    if (todayQuery.isError && !isAuthError(todayQuery.error)) {
      console.error('대시보드 데이터 로딩 실패:', todayQuery.error);
      Alert.alert('오류', '대시보드 데이터를 불러올 수 없습니다.');
    }
  }, [todayQuery.isError, todayQuery.errorUpdatedAt, todayQuery.error]);

  // Dashboard refresh trigger 감지 — 관련 query refetch.
  useEffect(() => {
    if (refreshTrigger > 0) {
      todayQuery.refetch();
      weeklyQuery.refetch();
    }
    // refetch 함수는 안정적이며, refreshTrigger 변화에만 반응해야 한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // 주간만 재조회(인라인 재시도 버튼용).
  const loadWeeklyTreatments = useCallback(() => weeklyQuery.refetch(), [weeklyQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    forceRefreshRef.current = true; // 새로고침 시 force_refresh=true
    try {
      await Promise.all([todayQuery.refetch(), weeklyQuery.refetch()]);
    } finally {
      forceRefreshRef.current = false; // refetch 완료 후 원자적으로 리셋
      setRefreshing(false);
    }
  }, [todayQuery, weeklyQuery]);

  const onHeaderRefresh = useCallback(() => {
    forceRefreshRef.current = true; // 헤더 새로고침 버튼 클릭 시 force_refresh=true
    Promise.all([todayQuery.refetch(), weeklyQuery.refetch()]).finally(() => {
      forceRefreshRef.current = false; // refetch 완료 후 리셋
    });
  }, [todayQuery, weeklyQuery]);

  // 막다른 오류 화면 재시도(SPEC-UX-001 REQ-UX-006): 강제 새로고침
  const retryDashboard = useCallback(() => {
    forceRefreshRef.current = true;
    Promise.all([todayQuery.refetch(), weeklyQuery.refetch()]).finally(() => {
      forceRefreshRef.current = false; // refetch 완료 후 리셋
    });
  }, [todayQuery, weeklyQuery]);

  return {
    dashboardData,
    loading,
    refreshing,
    weeklyTreatments,
    weeklyError,
    loadWeeklyTreatments,
    onRefresh,
    onHeaderRefresh,
    retryDashboard,
  };
}
