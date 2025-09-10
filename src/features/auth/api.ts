// 새로운 중앙집중식 API 서비스 사용
import { authApiService } from '../../api/services/auth';

// 타입들
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'MASTER' | 'MANAGER';
  role_name: string;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  user: User;
}

// 기존 API와의 호환성을 위한 래퍼
export const authAPI = {
  login: authApiService.login.bind(authApiService),
  refreshToken: authApiService.refreshToken.bind(authApiService),
  logout: authApiService.logout.bind(authApiService),
  getMe: authApiService.getMe.bind(authApiService),
};
