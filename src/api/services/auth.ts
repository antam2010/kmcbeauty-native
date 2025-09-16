import type { LoginCredentials, LoginResponse, User } from '../../types';
import { BaseApiService } from './base';

class AuthApiService extends BaseApiService {
  protected readonly basePath = '/auth';

  // 로그인
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    // OAuth2 form 데이터 형식으로 변환
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    formData.append('grant_type', 'password');

    return this.post<LoginResponse>('/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  // 토큰 갱신 (쿠키 기반)
  async refreshToken(): Promise<{ access_token: string; refresh_token?: string }> {
    return this.post<{ access_token: string; refresh_token?: string }>('/refresh', {}, {
      withCredentials: true, // HttpOnly 쿠키 포함
    });
  }

  // 로그아웃
  async logout(): Promise<void> {
    return this.post<void>('/logout');
  }

  // 현재 사용자 정보 조회
  async getMe(): Promise<User> {
    // 실제 API는 /users/me 엔드포인트를 사용
    return this.client.get<User>('/users/me').then(response => response.data);
  }

  // 사용자 정보 수정 (비밀번호 변경 포함)
  async updateUser(data: { name?: string; email?: string; role?: string; password?: string }): Promise<User> {
    return this.client.put<User>('/users/me', data).then(response => response.data);
  }

  // 비밀번호 변경 (현재 비밀번호 불필요)
  async changePassword(newPassword: string): Promise<User> {
    // /users/me PUT API 사용 - 현재 사용자 정보 필요
    const currentUser = await this.getMe();
    return this.updateUser({
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      password: newPassword,
    });
  }
}

export const authApiService = new AuthApiService();
