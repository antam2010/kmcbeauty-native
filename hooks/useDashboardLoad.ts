// SPEC-PERF-003 REQ-PERF-003-01: 홈 대시보드 로드 로직을 테스트 가능한 훅으로 분리한다.
// - 마운트 시 중복 요청 제거: 단일 effect 로 수렴(기존 이중 effect 제거).
// - 병렬화: 오늘 요약 + 주간 시술을 Promise.all 로 동시 발행.
// - 불변식 보존: 인증 오류 상위 전파, 주간 실패 weeklyError 인라인 안내(SPEC-UX-001 REQ-UX-007),
//   상점 미선택 시 로드 스킵. (research.md §3 회귀 가드)
// REQ-PERF-003-08: 스토어 접근을 전체 구조분해에서 필드 셀렉터 구독으로 전환.
import { useDashboard } from '@/contexts/DashboardContext';
import { dashboardApiService } from '@/src/api/services/dashboard';
import { treatmentApiService } from '@/src/api/services/treatment';
import { useShopStore } from '@/src/stores/shopStore';
import type { Treatment } from '@/src/types';
import { useCallback, useEffect, useState } from 'react';
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

export function useDashboardLoad() {
  const [dashboardData, setDashboardData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weeklyTreatments, setWeeklyTreatments] = useState<Treatment[]>([]);
  // SPEC-UX-001 REQ-UX-007: 주간 시술 로드 실패를 무음 처리하지 않고 인라인으로 안내
  const [weeklyError, setWeeklyError] = useState(false);

  // REQ-PERF-003-08: 필드 셀렉터 구독(전체 구조분해 대신)
  const selectedShop = useShopStore((s) => s.selectedShop);
  const shopLoading = useShopStore((s) => s.loading);
  const { refreshTrigger } = useDashboard();

  const loadWeeklyTreatments = useCallback(async () => {
    try {
      const weeklyData = await treatmentApiService.getWeeklyTreatments();
      setWeeklyTreatments(weeklyData);
      setWeeklyError(false);
    } catch (error: any) {
      console.error('주간 시술 데이터 로딩 실패:', error);
      // 인증 관련 에러는 상위로 전파 (인터셉터가 처리하도록)
      if (isAuthError(error)) {
        throw error;
      }
      // SPEC-UX-001 REQ-UX-007: 그 외 에러는 무음 처리하지 않고 인라인 안내 상태를 설정한다.
      setWeeklyError(true);
    }
  }, []);

  const loadDashboardData = useCallback(
    async (forceRefresh: boolean = false) => {
      // 상점이 선택되지 않았으면 로딩하지 않음
      if (!selectedShop) {
        console.log('🏪 상점이 선택되지 않아 대시보드 데이터를 로딩하지 않습니다.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        // REQ-PERF-003-01: 상호 독립적인 두 요청을 병렬(Promise.all) 발행.
        // 주간 실패는 loadWeeklyTreatments 내부에서 격리되므로(인증 오류만 재throw),
        // 오늘 요약 성공이 주간 실패로 유실되지 않는다.
        const [data] = await Promise.all([
          dashboardApiService.getTodayDetailedSummary(forceRefresh),
          loadWeeklyTreatments(),
        ]);
        setDashboardData(data);
      } catch (error: any) {
        console.error('대시보드 데이터 로딩 실패:', error);
        // 인증 관련 에러는 상위로 전파 (API 인터셉터가 자동으로 로그인 페이지 이동 처리)
        if (isAuthError(error)) {
          console.log('🔐 인증 에러 감지 - 인터셉터가 로그인 페이지로 이동 처리');
        } else {
          Alert.alert('오류', '대시보드 데이터를 불러올 수 없습니다.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loadWeeklyTreatments, selectedShop],
  );

  // REQ-PERF-003-01: 마운트/상점 변경 트리거를 단일 effect 로 수렴(기존 이중 effect 제거).
  useEffect(() => {
    if (!shopLoading) {
      loadDashboardData();
    }
  }, [shopLoading, selectedShop, loadDashboardData]);

  // Dashboard refresh trigger 감지
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadDashboardData();
    }
  }, [refreshTrigger, loadDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData(true); // 새로고침 시 force_refresh=true
  }, [loadDashboardData]);

  const onHeaderRefresh = useCallback(() => {
    loadDashboardData(true); // 헤더 새로고침 버튼 클릭 시 force_refresh=true
  }, [loadDashboardData]);

  // 막다른 오류 화면 재시도(SPEC-UX-001 REQ-UX-006): 로딩 표시 후 강제 새로고침
  const retryDashboard = useCallback(() => {
    setLoading(true);
    loadDashboardData(true);
  }, [loadDashboardData]);

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
