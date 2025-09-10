import { apiClient } from '../../../services/api';
import {
  Treatment,
  TreatmentListParams,
  TreatmentResponse
} from '../../types/treatment';

// 시술 예약 API
export const treatmentAPI = {
  // 시술 예약 목록 조회 (달력용)
  list: async (params?: TreatmentListParams): Promise<TreatmentResponse> => {
    const searchParams = new URLSearchParams();
    
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.sort_by) searchParams.append('sort_by', params.sort_by);
    if (params?.sort_order) searchParams.append('sort_order', params.sort_order);
    if (params?.staff_user_id) searchParams.append('staff_user_id', params.staff_user_id.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.size) searchParams.append('size', params.size.toString());

    const queryString = searchParams.toString();
    const url = `/treatments${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get(url);
    return response.data as TreatmentResponse;
  },

  // 월별 시술 예약 조회 (달력 월뷰용) - 페이징으로 모든 데이터 가져오기
  getMonthlyTreatments: async (year: number, month: number): Promise<Treatment[]> => {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // 월 마지막 날
    
    let allTreatments: Treatment[] = [];
    let currentPage = 1;
    const pageSize = 50; // 적절한 페이지 크기
    
    try {
      while (true) {
        const response = await treatmentAPI.list({
          start_date: startDate,
          end_date: endDate,
          page: currentPage,
          size: pageSize,
          sort_by: 'reserved_at',
          sort_order: 'asc'
        });
        
        allTreatments = [...allTreatments, ...response.items];
        
        // 마지막 페이지인지 확인
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
  },

  // 특정 날짜의 시술 예약 조회
  getDailyTreatments: async (date: string): Promise<Treatment[]> => {
    const response = await treatmentAPI.list({
      start_date: date,
      end_date: date,
      size: 100,
      sort_by: 'reserved_at',
      sort_order: 'asc'
    });
    
    return response.items;
  }
};
