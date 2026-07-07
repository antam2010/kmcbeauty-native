import type { Treatment, TreatmentCreate, TreatmentListParams, TreatmentResponse, TreatmentSimpleResponse, TreatmentUpdate } from '../../types';
import { BaseApiService } from './base';

// SPEC-DATA-001 REQ-DATA-001-07 (F-14): 월간/주간 동시 페이지네이션 팬아웃 상한.
// @MX:NOTE: [AUTO] 월 ~50건/page × 20 = ~1000건 상한 — 단일 뷰 실사용 범위를 넉넉히 포괄한다.
//   초과 시 MAX_PAGES 까지만 조회하고 console.warn 으로 절단 사실을 남긴다(dev-gated).
const MAX_PAGES = 20;

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
  async create(data: TreatmentCreate): Promise<TreatmentSimpleResponse> {
    return this.post<TreatmentSimpleResponse>('', data);
  }

  // 시술 예약 수정
  async update(id: number, data: TreatmentUpdate): Promise<TreatmentSimpleResponse> {
    return this.put<TreatmentSimpleResponse>(`/${id}`, data);
  }

  // 시술 예약 삭제
  async remove(id: number): Promise<void> {
    return this.delete<void>(`/${id}`);
  }

  // 월별 시술 예약 조회 (페이징 처리)
  // @MX:NOTE: [AUTO] 순차 페이지 루프 제거(REQ-PERF-002). 첫 페이지로 총 페이지 수를 파악한 뒤 2..N 을 Promise.all 로 동시 수집한다. 각 페이지는 reserved_at asc 로 정렬되고 페이지 순서가 보존되므로 전체 정렬은 기존 순차 방식과 동일.
  async getMonthlyTreatments(year: number, month: number): Promise<Treatment[]> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const pageSize = 50;
    const listParams = {
      start_date: startDate,
      end_date: endDate,
      size: pageSize,
      sort_by: 'reserved_at' as const,
      sort_order: 'asc' as const,
    };

    try {
      // 1) 첫 페이지 조회로 총 페이지 수 파악
      const firstPage = await this.list({ ...listParams, page: 1 });
      const rawPages = firstPage.pages || 1;
      // SPEC-DATA-001 REQ-DATA-001-07: 동시 요청 페이지 수를 MAX_PAGES 로 상한.
      const totalPages = Math.min(rawPages, MAX_PAGES);
      if (rawPages > MAX_PAGES && __DEV__) {
        console.warn(`⚠️ 월별 트리트먼트 페이지 상한 초과: ${rawPages}p → ${MAX_PAGES}p 로 제한(팬아웃 방어)`);
      }

      // 2) 나머지 페이지(2..N)를 동시 요청 (인위적 지연 없음). 일부 페이지 실패가 전체를 폐기하지 않도록 allSettled 사용(AC-002-2)
      const restResults = await Promise.allSettled(
        Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) =>
          this.list({ ...listParams, page: i + 2 })
        )
      );

      // 3) 성공한 페이지만 입력 순서대로 병합 (정렬 결정적). 실패 페이지는 건너뜀
      const restItems = restResults
        .filter((r): r is PromiseFulfilledResult<TreatmentResponse> => r.status === 'fulfilled')
        .reduce<Treatment[]>((acc, r) => acc.concat(r.value.items), []);

      const failedPages = restResults.filter((r) => r.status === 'rejected').length;
      if (failedPages > 0) {
        console.warn(`⚠️ 월별 트리트먼트 일부 페이지 조회 실패: ${failedPages}개 페이지 누락(성공분만 반환)`);
      }

      return [...firstPage.items, ...restItems];
    } catch (error) {
      console.error('월별 트리트먼트 로딩 중 오류:', error);
      return [];
    }
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

    const pageSize = 50;
    const listParams = {
      start_date: startDate,
      end_date: endDate,
      size: pageSize,
      sort_by: 'reserved_at' as const,
      sort_order: 'asc' as const,
    };

    try {
      // 1) 첫 페이지 조회로 총 페이지 수 파악
      const firstPage = await this.list({ ...listParams, page: 1 });
      const rawPages = firstPage.pages || 1;
      // SPEC-DATA-001 REQ-DATA-001-07: 동시 요청 페이지 수를 MAX_PAGES 로 상한.
      const totalPages = Math.min(rawPages, MAX_PAGES);
      if (rawPages > MAX_PAGES && __DEV__) {
        console.warn(`⚠️ 주간 트리트먼트 페이지 상한 초과: ${rawPages}p → ${MAX_PAGES}p 로 제한(팬아웃 방어)`);
      }

      // 2) 나머지 페이지(2..N)를 동시 요청 (인위적 지연 없음). 일부 페이지 실패가 전체를 폐기하지 않도록 allSettled 사용(AC-002-2)
      const restResults = await Promise.allSettled(
        Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) =>
          this.list({ ...listParams, page: i + 2 })
        )
      );

      // 3) 성공한 페이지만 입력 순서대로 병합 (정렬 결정적). 실패 페이지는 건너뜀
      const restItems = restResults
        .filter((r): r is PromiseFulfilledResult<TreatmentResponse> => r.status === 'fulfilled')
        .reduce<Treatment[]>((acc, r) => acc.concat(r.value.items), []);

      const failedPages = restResults.filter((r) => r.status === 'rejected').length;
      if (failedPages > 0) {
        console.warn(`⚠️ 주간 트리트먼트 일부 페이지 조회 실패: ${failedPages}개 페이지 누락(성공분만 반환)`);
      }

      return [...firstPage.items, ...restItems];
    } catch (error) {
      console.error('주간 트리트먼트 로딩 중 오류:', error);
      return [];
    }
  }
}

export const treatmentApiService = new TreatmentApiService();
