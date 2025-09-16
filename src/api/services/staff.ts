import { BaseApiService } from './base';

// API 응답의 실제 구조에 맞춘 타입 정의
export interface ShopUserResponse {
  shop_id: number;
  user_id: number;
  is_primary_owner: number;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    role_name: string | null;
    created_at: string;
    updated_at: string;
    phone_number?: string;
  };
}

// 컴포넌트에서 사용할 평탄화된 사용자 정보
export interface StaffUser {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
  status: 'active' | 'inactive';
  phone_number?: string;
  created_at: string;
  updated_at: string;
  shop_id: number;
  is_primary_owner: boolean;
}

export interface StaffUserCreate {
  name: string;
  email: string;
  username: string;
  password: string;
  role: string;
  phone_number?: string;
}

export interface StaffUserUpdate {
  name?: string;
  email?: string;
  username?: string;
  role?: string;
  phone_number?: string;
  status?: 'active' | 'inactive';
}

export class UserApiService extends BaseApiService {
  protected readonly basePath = '/shops';

  /**
   * 상점의 사용자 목록 조회
   */
  async getShopUsers(shopId: number): Promise<StaffUser[]> {
    console.log('🔍 API 요청: GET /shops/' + shopId + '/users');
    const response = await this.get<ShopUserResponse[]>(`/${shopId}/users`);
    
    // API 응답을 컴포넌트에서 사용할 형태로 변환
    const staffUsers: StaffUser[] = response.map(item => ({
      id: item.user.id,
      name: item.user.name,
      email: item.user.email,
      username: item.user.email, // API에 username이 없으므로 email 사용
      role: item.user.role,
      status: 'active' as const, // API에 status가 없으므로 기본값 사용
      phone_number: item.user.phone_number,
      created_at: item.user.created_at,
      updated_at: item.user.updated_at,
      shop_id: item.shop_id,
      is_primary_owner: item.is_primary_owner === 1
    }));
    
    console.log('✅ API 응답: GET /shops/' + shopId + '/users - ' + staffUsers.length + '명');
    console.log('📋 직원 목록:', staffUsers);
    
    return staffUsers;
  }

  /**
   * 사용자 생성
   */
  async createUser(shopId: number, userData: StaffUserCreate): Promise<StaffUser> {
    console.log('🔍 API 요청: POST /shops/' + shopId + '/users', userData);
    const response = await this.post<StaffUser>(`/${shopId}/users`, userData);
    console.log('✅ 사용자 생성 완료:', response.name);
    return response;
  }

  /**
   * 사용자 수정 (상태 변경은 개발 중)
   */
  async updateUser(shopId: number, userId: number, userData: StaffUserUpdate): Promise<StaffUser> {
    console.log('🔍 API 요청: PUT /shops/' + shopId + '/users/' + userId, userData);
    
    // 상태 변경 요청인 경우 개발 중 메시지 표시
    if (userData.status) {
      throw new Error('직원 상태 변경 기능은 현재 개발 중입니다. 곧 제공될 예정입니다.');
    }
    
    const response = await this.put<StaffUser>(`/${shopId}/users/${userId}`, userData);
    console.log('✅ 사용자 수정 완료:', response.name);
    return response;
  }

  /**
   * 사용자 삭제
   */
  async deleteUser(shopId: number, userId: number): Promise<void> {
    console.log('🔍 API 요청: DELETE /shops/' + shopId + '/users/' + userId);
    await this.delete(`/${shopId}/users/${userId}`);
    console.log('✅ 사용자 삭제 완료');
  }
}

export const userApiService = new UserApiService();
