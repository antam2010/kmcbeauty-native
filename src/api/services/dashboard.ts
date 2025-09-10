import type { DashboardResponse, DashboardSummaryResponse } from '../../types/dashboard';
import { BaseApiService } from './base';

export interface DashboardParams {
  target_date?: string; // YYYY-MM-DD
  force_refresh?: boolean;
}

class DashboardApiService extends BaseApiService {
  protected readonly basePath = '/summary';

  // 대시보드 요약 정보 조회
  async getSummary(params?: DashboardParams): Promise<DashboardResponse> {
    const queryString = this.buildQueryString(params || {});
    return this.get<DashboardResponse>(`/dashboard${queryString}`);
  }

  // 오늘 대시보드 정보 조회
  async getTodaySummary(): Promise<DashboardResponse> {
    const today = new Date().toISOString().split('T')[0];
    return this.getSummary({ target_date: today });
  }

  // 특정 날짜 대시보드 정보 조회
  async getDateSummary(date: string): Promise<DashboardResponse> {
    return this.getSummary({ target_date: date });
  }

  // 새로운 상세 대시보드 요약 정보 조회
  async getDetailedSummary(params?: DashboardParams): Promise<DashboardSummaryResponse> {
    const queryString = this.buildQueryString(params || {});
    return this.get<DashboardSummaryResponse>(`/dashboard${queryString}`);
  }

  // 오늘 상세 대시보드 정보 조회
  async getTodayDetailedSummary(): Promise<DashboardSummaryResponse> {
    const today = new Date().toISOString().split('T')[0];
    return this.getDetailedSummary({ target_date: today });
  }

  // 특정 날짜 상세 대시보드 정보 조회
  async getDateDetailedSummary(date: string): Promise<DashboardSummaryResponse> {
    return this.getDetailedSummary({ target_date: date });
  }
}

export const dashboardApiService = new DashboardApiService();
