import { BaseApiService } from './base';

// 백엔드 정본: app/api/shop.py GET /{shop_id}/users -> list[ShopUserUserResponse]
// ShopUserUserResponse = { shop_id, user_id, is_primary_owner, user: UserResponse }
// UserResponse = { id, name, email, role, role_name, created_at, updated_at }
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
  };
}

// 컴포넌트에서 사용할 평탄화된 뷰모델.
// @MX:NOTE: [AUTO] status 는 백엔드가 반환하지 않는 클라이언트 전용 뷰모델 필드다.
// 백엔드 UserResponse 실제 필드는 {id,name,email,role,role_name,created_at,updated_at} 뿐이며
// status 는 UI 표시용 클라이언트 상태로만 유지한다(계약 필드 아님, 상태 변경 엔드포인트 미존재).
export interface StaffUser {
  id: number;
  name: string;
  email: string;
  role: string;
  role_name: string | null;
  created_at: string;
  updated_at: string;
  shop_id: number;
  is_primary_owner: boolean;
  // 클라이언트 전용 UI 상태 (백엔드 미반환)
  status: 'active' | 'inactive';
}

// 직원 "추가" = 기존 사용자(이메일)를 상점에 연결(association)한다.
// 백엔드 정본: POST /shops/{shop_id}/users body { email, is_primary_owner? } -> 201 ShopUserUserResponse
// SECURITY-001: 클라이언트가 role/password 를 공급하지 않는다. 신규 계정 생성은 초대(ShopInvite) 플로우로만.
export interface StaffUserCreate {
  email: string;
  is_primary_owner?: boolean;
}

// 직원 수정 = 주 소유자(primary owner) 지정 여부만 변경한다.
// 백엔드 정본: PUT /shops/{shop_id}/users/{user_id} body { is_primary_owner } -> 200 ShopUserUserResponse
export interface StaffUserUpdate {
  is_primary_owner: boolean;
}

export class UserApiService extends BaseApiService {
  protected readonly basePath = '/shops';

  /**
   * 상점의 사용자 목록 조회
   */
  async getShopUsers(shopId: number): Promise<StaffUser[]> {
    console.log('🔍 API 요청: GET /shops/' + shopId + '/users');
    const response = await this.get<ShopUserResponse[]>(`/${shopId}/users`);
    
    // API 응답을 컴포넌트에서 사용할 뷰모델로 변환
    const staffUsers: StaffUser[] = response.map(item => ({
      id: item.user.id,
      name: item.user.name,
      email: item.user.email,
      role: item.user.role,
      role_name: item.user.role_name,
      created_at: item.user.created_at,
      updated_at: item.user.updated_at,
      shop_id: item.shop_id,
      is_primary_owner: item.is_primary_owner === 1,
      // 클라이언트 전용 기본값 (백엔드 미반환)
      status: 'active' as const,
    }));
    
    console.log('✅ API 응답: GET /shops/' + shopId + '/users - ' + staffUsers.length + '명');
    
    return staffUsers;
  }

  /**
   * 직원 추가 = 기존 사용자를 상점에 연결(association)
   * 백엔드 정본: POST /shops/{shop_id}/users body { email, is_primary_owner? } -> 201 ShopUserUserResponse
   */
  async createUser(shopId: number, userData: StaffUserCreate): Promise<ShopUserResponse> {
    console.log('🔍 API 요청: POST /shops/' + shopId + '/users', userData);
    const response = await this.post<ShopUserResponse>(`/${shopId}/users`, userData);
    console.log('✅ 직원 연결 완료:', response.user.email);
    return response;
  }

  /**
   * 직원 수정 = 주 소유자 지정 여부 변경
   * 백엔드 정본: PUT /shops/{shop_id}/users/{user_id} body { is_primary_owner } -> 200 ShopUserUserResponse
   */
  async updateUser(shopId: number, userId: number, userData: StaffUserUpdate): Promise<ShopUserResponse> {
    console.log('🔍 API 요청: PUT /shops/' + shopId + '/users/' + userId, userData);
    const response = await this.put<ShopUserResponse>(`/${shopId}/users/${userId}`, userData);
    console.log('✅ 직원 수정 완료:', response.user.email);
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
