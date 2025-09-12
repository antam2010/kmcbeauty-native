import type { DashboardResponse, DashboardSummaryResponse } from '../../types';
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
  async getTodayDetailedSummary(forceRefresh: boolean = false): Promise<DashboardSummaryResponse> {
    const today = new Date().toISOString().split('T')[0];
    return this.getDetailedSummary({ target_date: today, force_refresh: forceRefresh });
  }

  // 특정 날짜 상세 대시보드 정보 조회
  async getDateDetailedSummary(date: string): Promise<DashboardSummaryResponse> {
    return this.getDetailedSummary({ target_date: date });
  }

  // 월별 대시보드 정보 조회 (해당 월의 1일을 기준으로)
  async getMonthlyDetailedSummary(year: number, month: number): Promise<DashboardSummaryResponse> {
    // 월은 1-12, 날짜는 1일로 고정
    const targetDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    return this.getDetailedSummary({ target_date: targetDate });
  }

  // 연-월 문자열로 월별 대시보드 조회 (YYYY-MM 형식)
  async getMonthlyDetailedSummaryByString(yearMonth: string): Promise<DashboardSummaryResponse> {
    // YYYY-MM 형식을 YYYY-MM-01로 변환
    const targetDate = `${yearMonth}-01`;
    return this.getDetailedSummary({ target_date: targetDate });
  }
}

export const dashboardApiService = new DashboardApiService();
