import { apiClient } from '../../../services/api';
import { DashboardResponse } from '../../types/dashboard';

export interface DashboardParams {
  target_date?: string; // YYYY-MM-DD
  force_refresh?: boolean;
}

// 대시보드 API
export const dashboardAPI = {
  // 대시보드 요약 정보 조회
  getSummary: async (params?: DashboardParams): Promise<DashboardResponse> => {
    const searchParams = new URLSearchParams();
    
    if (params?.target_date) {
      searchParams.append('target_date', params.target_date);
    }
    if (params?.force_refresh) {
      searchParams.append('force_refresh', params.force_refresh.toString());
    }

    const queryString = searchParams.toString();
    const url = `/summary/dashboard${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get(url);
    return response.data as DashboardResponse;
  },

  // 오늘 대시보드 정보 조회
  getTodaySummary: async (): Promise<DashboardResponse> => {
    const today = new Date().toISOString().split('T')[0];
    return dashboardAPI.getSummary({ target_date: today });
  },

  // 특정 날짜 대시보드 정보 조회
  getDateSummary: async (date: string): Promise<DashboardResponse> => {
    return dashboardAPI.getSummary({ target_date: date });
  }
};
