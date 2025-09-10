import { api } from '../../api';

// 인증 관련 타입
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

// 인증 API
export const authAPI = {
  // 로그인
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    // OAuth2 form 데이터 형식으로 변환
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    formData.append('grant_type', 'password');

    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data as LoginResponse;
  },

  // 로그아웃
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  // 내 정보 가져오기
  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data as User;
  },

  // 토큰 갱신
  refreshToken: async (refreshToken: string): Promise<{ access_token: string; refresh_token?: string }> => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data as { access_token: string; refresh_token?: string };
  }
};
