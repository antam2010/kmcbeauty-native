import { LoginCredentials, LoginResponse, User } from '@/types';
import { apiClient } from '../api';

export const authService = {
  // 로그인
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data as LoginResponse;
  },

  // 로그아웃
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  // 토큰 갱신
  refreshToken: async (refreshToken: string): Promise<{ token: string }> => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data as { token: string };
  },

  // 현재 사용자 정보 조회
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data as User;
  },

  // 비밀번호 변경
  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', {
      oldPassword,
      newPassword,
    });
  },

  // 비밀번호 재설정 요청
  requestPasswordReset: async (email: string): Promise<void> => {
    await apiClient.post('/auth/request-password-reset', { email });
  },
};
