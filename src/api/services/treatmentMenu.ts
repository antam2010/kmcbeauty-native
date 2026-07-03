import { BaseApiService } from './base';

// 시술 메뉴 타입 정의
export interface TreatmentMenu {
  id: number;
  shop_id: number;
  name: string;
  created_at: string;
  updated_at: string;
  details: TreatmentMenuDetail[];
}

export interface TreatmentMenuDetail {
  id: number;
  menu_id: number;
  name: string;
  duration_min: number;
  base_price: number;
  created_at: string;
  updated_at: string;
}

export interface TreatmentMenuCreate {
  name: string;
}

export interface TreatmentMenuDetailCreate {
  name: string;
  duration_min: number;
  base_price: number;
}

export interface TreatmentMenuResponse {
  items: TreatmentMenu[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

class TreatmentMenuApiService extends BaseApiService {
  protected readonly basePath = '/treatment-menus';

  // 시술 메뉴 목록 조회
  async list(params?: { search?: string; page?: number; size?: number }): Promise<TreatmentMenuResponse> {
    const queryString = this.buildQueryString(params || {});
    return this.get<TreatmentMenuResponse>(queryString);
  }

  // 시술 메뉴 생성
  async create(data: TreatmentMenuCreate): Promise<TreatmentMenu> {
    return this.post<TreatmentMenu>('', data);
  }

  // 시술 메뉴 수정
  async update(id: number, data: TreatmentMenuCreate): Promise<TreatmentMenu> {
    return this.put<TreatmentMenu>(`/${id}`, data);
  }

  // 시술 메뉴 삭제
  async remove(id: number): Promise<void> {
    return this.delete<void>(`/${id}`);
  }

  // 시술 메뉴 복구
  async restore(id: number): Promise<void> {
    return this.post<void>(`/${id}/restore`, {});
  }

  // 시술 메뉴 상세 조회
  async getDetails(menuId: number): Promise<TreatmentMenuDetail[]> {
    return this.get<TreatmentMenuDetail[]>(`/${menuId}/details`);
  }

  // 시술 메뉴 상세 생성
  async createDetail(menuId: number, data: TreatmentMenuDetailCreate): Promise<TreatmentMenuDetail> {
    return this.post<TreatmentMenuDetail>(`/${menuId}/details`, data);
  }

  // 시술 메뉴 상세 수정
  async updateDetail(menuId: number, detailId: number, data: TreatmentMenuDetailCreate): Promise<TreatmentMenuDetail> {
    return this.put<TreatmentMenuDetail>(`/${menuId}/details/${detailId}`, data);
  }

  // 시술 메뉴 상세 삭제
  async removeDetail(menuId: number, detailId: number): Promise<void> {
    return this.delete<void>(`/${menuId}/details/${detailId}`);
  }

  // 모든 시술 메뉴와 상세를 함께 가져오기
  // @MX:NOTE: [AUTO] 순차 페이지 루프 + 항목별 상세 재요청(1+N) 제거(REQ-PERF-002). 목록 응답이 이미 details 를 포함하므로(백엔드 joinedload) getDetails 재요청을 삭제하고, 첫 페이지로 총 페이지 수를 파악한 뒤 2..N 을 Promise.all 로 동시 수집한다. 결과 순서는 페이지 인덱스 순으로 결정적.
  async getAllWithDetails(): Promise<TreatmentMenu[]> {
    const pageSize = 50;

    try {
      // 1) 첫 페이지 조회로 총 페이지 수 파악 (목록 응답에 details 포함)
      const firstPage = await this.list({ page: 1, size: pageSize });
      const totalPages = firstPage.pages || 1;

      // 2) 나머지 페이지(2..N)를 동시 요청 (인위적 지연 없음). 일부 페이지 실패가 전체를 폐기하지 않도록 allSettled 사용(AC-002-2)
      const restResults = await Promise.allSettled(
        Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) =>
          this.list({ page: i + 2, size: pageSize })
        )
      );

      // 3) 성공한 페이지만 입력 순서대로 병합. 목록 응답의 details 를 그대로 사용(누락 시 빈 배열로 방어). 실패 페이지는 건너뜀
      const restItems = restResults
        .filter((r): r is PromiseFulfilledResult<TreatmentMenuResponse> => r.status === 'fulfilled')
        .reduce<TreatmentMenu[]>((acc, r) => acc.concat(r.value.items), []);
      const allMenus = [...firstPage.items, ...restItems].map((menu) => ({ ...menu, details: menu.details ?? [] }));

      const failedPages = restResults.filter((r) => r.status === 'rejected').length;
      if (failedPages > 0) {
        console.warn(`⚠️ 시술 메뉴 일부 페이지 조회 실패: ${failedPages}개 페이지 누락(성공분만 반환)`);
      }

      return allMenus;
    } catch (error) {
      console.error('시술 메뉴 로딩 중 오류:', error);
      return [];
    }
  }
}

export const treatmentMenuApiService = new TreatmentMenuApiService();
