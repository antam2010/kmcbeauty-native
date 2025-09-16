import { BaseApiService } from './base';

export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
  status: 'active' | 'inactive';
  phone_number?: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  name: string;
  email: string;
  username: string;
  password: string;
  role: string;
  phone_number?: string;
}

export interface UserUpdate {
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
  async getShopUsers(shopId: number): Promise<User[]> {
    console.log('🔍 API 요청: GET /shops/' + shopId + '/users');
    const response = await this.get<User[]>(`/${shopId}/users`);
    console.log('✅ API 응답: GET /shops/' + shopId + '/users - ' + response.length + '명');
    return response;
  }

  /**
   * 사용자 생성
   */
  async createUser(shopId: number, userData: UserCreate): Promise<User> {
    console.log('🔍 API 요청: POST /shops/' + shopId + '/users', userData);
    const response = await this.post<User>(`/${shopId}/users`, userData);
    console.log('✅ 사용자 생성 완료:', response.name);
    return response;
  }

  /**
   * 사용자 수정
   */
  async updateUser(shopId: number, userId: number, userData: UserUpdate): Promise<User> {
    console.log('🔍 API 요청: PUT /shops/' + shopId + '/users/' + userId, userData);
    const response = await this.put<User>(`/${shopId}/users/${userId}`, userData);
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
