// 새로운 중앙집중식 API 서비스 사용
import { dashboardApiService } from '../../api/services/dashboard';

export interface DashboardParams {
  target_date?: string; // YYYY-MM-DD
  force_refresh?: boolean;
}

// 기존 API와의 호환성을 위한 래퍼
export const dashboardAPI = {
  getSummary: dashboardApiService.getSummary.bind(dashboardApiService),
  getTodaySummary: dashboardApiService.getTodaySummary.bind(dashboardApiService),
  getDateSummary: dashboardApiService.getDateSummary.bind(dashboardApiService),
  getDetailedSummary: dashboardApiService.getDetailedSummary.bind(dashboardApiService),
  getTodayDetailedSummary: dashboardApiService.getTodayDetailedSummary.bind(dashboardApiService),
  getDateDetailedSummary: dashboardApiService.getDateDetailedSummary.bind(dashboardApiService),
};

// 타입들은 중앙에서 import
export type { DashboardResponse, DashboardSummaryResponse } from '../../types/dashboard';
