import type { LoginCredentials, LoginResponse, User } from '../../types/auth';
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

  // 토큰 갱신
  async refreshToken(): Promise<{ access_token: string; refresh_token?: string }> {
    return this.post<{ access_token: string; refresh_token?: string }>('/refresh');
  }

  // 로그아웃
  async logout(): Promise<void> {
    return this.post<void>('/logout');
  }

  // 현재 사용자 정보 조회
  async getMe(): Promise<User> {
    return this.get<User>('/me');
  }
}

export const authApiService = new AuthApiService();
