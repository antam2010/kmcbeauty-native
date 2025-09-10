import { api } from '../../api';
import { DashboardStats } from '../../types/models';

// 대시보드 API
export const dashboardAPI = {
  // 대시보드 통계 가져오기
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/api/dashboard/stats');
    return response.data as DashboardStats;
  },

  // 오늘의 예약 목록
  getTodayBookings: async () => {
    const response = await api.get('/api/dashboard/today-bookings');
    return response.data;
  },

  // 월별 수익 통계
  getMonthlyRevenue: async (year: number, month: number) => {
    const response = await api.get(`/api/dashboard/revenue/${year}/${month}`);
    return response.data;
  }
};
