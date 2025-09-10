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
  async getAllWithDetails(): Promise<TreatmentMenu[]> {
    let allMenus: TreatmentMenu[] = [];
    let currentPage = 1;
    const pageSize = 50;

    try {
      while (true) {
        const response = await this.list({
          page: currentPage,
          size: pageSize
        });

        // 각 메뉴의 상세 정보도 함께 로드
        const menusWithDetails = await Promise.all(
          response.items.map(async (menu) => {
            try {
              const details = await this.getDetails(menu.id);
              return { ...menu, details };
            } catch (error) {
              console.error(`메뉴 ${menu.id}의 상세 정보 로드 실패:`, error);
              return { ...menu, details: [] };
            }
          })
        );

        allMenus = [...allMenus, ...menusWithDetails];

        if (currentPage >= response.pages || response.items.length < pageSize) {
          break;
        }

        currentPage++;
      }
    } catch (error) {
      console.error('시술 메뉴 로딩 중 오류:', error);
      return [];
    }

    return allMenus;
  }
}

export const treatmentMenuApiService = new TreatmentMenuApiService();
