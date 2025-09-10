import type { Treatment, TreatmentListParams, TreatmentResponse } from '../../types/treatment';
import { BaseApiService } from './base';

class TreatmentApiService extends BaseApiService {
  protected readonly basePath = '/treatments';

  // 시술 예약 목록 조회
  async list(params?: TreatmentListParams): Promise<TreatmentResponse> {
    const queryString = this.buildQueryString(params || {});
    return this.get<TreatmentResponse>(queryString);
  }

  // 특정 시술 예약 조회
  async getById(id: number): Promise<Treatment> {
    return this.get<Treatment>(`/${id}`);
  }

  // 시술 예약 생성
  async create(data: Partial<Treatment>): Promise<Treatment> {
    return this.post<Treatment>('', data);
  }

  // 시술 예약 수정
  async update(id: number, data: Partial<Treatment>): Promise<Treatment> {
    return this.put<Treatment>(`/${id}`, data);
  }

  // 시술 예약 삭제
  async remove(id: number): Promise<void> {
    return this.delete<void>(`/${id}`);
  }

  // 월별 시술 예약 조회 (페이징 처리)
  async getMonthlyTreatments(year: number, month: number): Promise<Treatment[]> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    let allTreatments: Treatment[] = [];
    let currentPage = 1;
    const pageSize = 50;
    
    try {
      while (true) {
        const response = await this.list({
          start_date: startDate,
          end_date: endDate,
          page: currentPage,
          size: pageSize,
          sort_by: 'reserved_at',
          sort_order: 'asc'
        });
        
        allTreatments = [...allTreatments, ...response.items];
        
        if (currentPage >= response.pages || response.items.length < pageSize) {
          break;
        }
        
        currentPage++;
      }
    } catch (error) {
      console.error('월별 트리트먼트 로딩 중 오류:', error);
      return [];
    }
    
    return allTreatments;
  }

  // 특정 날짜의 시술 예약 조회
  async getDailyTreatments(date: string): Promise<Treatment[]> {
    const response = await this.list({
      start_date: date,
      end_date: date,
      size: 100,
      sort_by: 'reserved_at',
      sort_order: 'asc'
    });
    
    return response.items;
  }

  // 주간 시술 예약 조회 (이번 주 전체)
  async getWeeklyTreatments(date?: string): Promise<Treatment[]> {
    const targetDate = date ? new Date(date) : new Date();
    
    // 해당 주의 월요일 구하기
    const dayOfWeek = targetDate.getDay();
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(targetDate.getDate() - dayOfWeek + 1); // 월요일
    
    // 해당 주의 일요일 구하기
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // 일요일
    
    const startDate = startOfWeek.toISOString().split('T')[0];
    const endDate = endOfWeek.toISOString().split('T')[0];
    
    let allTreatments: Treatment[] = [];
    let currentPage = 1;
    const pageSize = 50;
    
    try {
      while (true) {
        const response = await this.list({
          start_date: startDate,
          end_date: endDate,
          page: currentPage,
          size: pageSize,
          sort_by: 'reserved_at',
          sort_order: 'asc'
        });
        
        allTreatments = [...allTreatments, ...response.items];
        
        if (currentPage >= response.pages || response.items.length < pageSize) {
          break;
        }
        
        currentPage++;
      }
    } catch (error) {
      console.error('주간 트리트먼트 로딩 중 오류:', error);
      return [];
    }
    
    return allTreatments;
  }
}

export const treatmentApiService = new TreatmentApiService();
