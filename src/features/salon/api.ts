import { api } from '../../api';

// 샵 관련 타입
export interface Shop {
  id: number;
  name: string;
  address: string;
  phone: string;
  description?: string;
  opening_hours: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface SelectShopResponse {
  shop: Shop;
  message: string;
}

// 샵 API
export const shopAPI = {
  // 내 샵 목록 가져오기
  getMyShops: async (): Promise<Shop[]> => {
    const response = await api.get('/api/shops/my');
    return response.data as Shop[];
  },

  // 샵 선택
  selectShop: async (shopId: number): Promise<SelectShopResponse> => {
    const response = await api.post('/api/shops/select', { shop_id: shopId });
    return response.data as SelectShopResponse;
  },

  // 샵 상세 정보
  getShopDetail: async (shopId: number): Promise<Shop> => {
    const response = await api.get(`/api/shops/${shopId}`);
    return response.data as Shop;
  }
};
