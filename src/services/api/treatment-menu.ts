import apiClient from '@/src/api/client';
import {
    Page,
    TreatmentMenuCreate,
    TreatmentMenuDetail,
    TreatmentMenuDetailCreate,
    TreatmentMenuResponse
} from '@/src/types/treatment-menu';

export const treatmentMenuAPI = {
  // 시술 메뉴 목록 조회
  getMenus: async (params?: {
    search?: string;
    page?: number;
    size?: number;
  }): Promise<Page<TreatmentMenuResponse>> => {
    const response = await apiClient.get('/treatment-menus', { params });
    return response.data as Page<TreatmentMenuResponse>;
  },

  // 시술 메뉴 생성
  createMenu: async (data: TreatmentMenuCreate): Promise<TreatmentMenuResponse> => {
    const response = await apiClient.post('/treatment-menus', data);
    return response.data as TreatmentMenuResponse;
  },

  // 시술 메뉴 수정
  updateMenu: async (menuId: number, data: TreatmentMenuCreate): Promise<TreatmentMenuResponse> => {
    const response = await apiClient.put(`/treatment-menus/${menuId}`, data);
    return response.data as TreatmentMenuResponse;
  },

  // 시술 메뉴 삭제
  deleteMenu: async (menuId: number): Promise<void> => {
    await apiClient.delete(`/treatment-menus/${menuId}`);
  },

  // 시술 메뉴 복구
  restoreMenu: async (menuId: number): Promise<void> => {
    await apiClient.post(`/treatment-menus/${menuId}/restore`);
  },

  // 시술 메뉴 상세 조회
  getMenuDetails: async (menuId: number): Promise<TreatmentMenuDetail[]> => {
    const response = await apiClient.get(`/treatment-menus/${menuId}/details`);
    return response.data as TreatmentMenuDetail[];
  },

  // 시술 메뉴 상세 생성
  createMenuDetail: async (menuId: number, data: TreatmentMenuDetailCreate): Promise<TreatmentMenuDetail> => {
    const response = await apiClient.post(`/treatment-menus/${menuId}/details`, data);
    return response.data as TreatmentMenuDetail;
  },

  // 시술 메뉴 상세 수정
  updateMenuDetail: async (
    menuId: number, 
    detailId: number, 
    data: TreatmentMenuDetailCreate
  ): Promise<TreatmentMenuDetail> => {
    const response = await apiClient.put(`/treatment-menus/${menuId}/details/${detailId}`, data);
    return response.data as TreatmentMenuDetail;
  },

  // 시술 메뉴 상세 삭제
  deleteMenuDetail: async (menuId: number, detailId: number): Promise<void> => {
    await apiClient.delete(`/treatment-menus/${menuId}/details/${detailId}`);
  },
};
