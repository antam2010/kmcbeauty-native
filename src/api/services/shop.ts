import { BaseApiService } from './base';

// 샵 관련 타입 정의
export interface Shop {
  id: number;
  name: string;
  address: string;
  address_detail: string | null;
  phone: string | null;
  business_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShopUser {
  shop_id: number;
  user_id: number;
  is_primary_owner: number; // 1=대표, 0=아님
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export interface ShopResponse {
  items: Shop[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ShopCreate {
  name: string;
  address: string;
  address_detail?: string;
  phone?: string;
  business_number?: string;
}

export interface ShopUpdate {
  name: string;
  address: string;
  address_detail?: string;
  phone?: string;
  business_number?: string;
}

export interface ShopSelect {
  shop_id: number;
}

class ShopApiService extends BaseApiService {
  protected readonly basePath = '/shops';

  // 내 샵 목록 조회
  async list(params?: { page?: number; size?: number }): Promise<ShopResponse> {
    const queryString = this.buildQueryString(params || {});
    return this.get<ShopResponse>(queryString);
  }

  // 선택한 샵 조회
  async getSelected(): Promise<Shop> {
    return this.get<Shop>('/selected');
  }

  // 샵 선택
  async select(shopId: number): Promise<void> {
    return this.post<void>('/selected', { shop_id: shopId });
  }

  // 샵 생성
  async create(shopData: ShopCreate): Promise<Shop> {
    return this.post<Shop>('', shopData);
  }

  // 샵 수정
  async update(shopId: number, shopData: ShopUpdate): Promise<Shop> {
    return this.put<Shop>(`/${shopId}`, shopData);
  }

  // 특정 샵의 유저 목록 조회 (직원 목록)
  async getUsers(shopId: number): Promise<ShopUser[]> {
    return this.get<ShopUser[]>(`/${shopId}/users`);
  }

  // 현재 선택된 샵의 유저 목록 조회
  async getCurrentShopUsers(): Promise<ShopUser[]> {
    try {
      const selectedShop = await this.getSelected();
      return this.getUsers(selectedShop.id);
    } catch (error) {
      console.error('현재 샵 유저 목록 조회 실패:', error);
      return [];
    }
  }
}

export const shopApiService = new ShopApiService();
