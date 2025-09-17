import { LoginCredentials } from '@/src/types';
import apiClient from '../../api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

console.log('📍 API_BASE_URL 설정됨:', API_BASE_URL);

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
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

export const authService = {
  // 로그인
  async login(credentials: LoginCredentials): Promise<{ token: LoginResponse; user: User }> {
    try {
      console.log('🚀 authService.login 호출됨 - 시작:', credentials.email);
      console.log('🚀 API_BASE_URL:', API_BASE_URL);
      
      // URL-encoded 형태로 데이터 준비
      const params = new URLSearchParams();
      params.append('username', credentials.email);
      params.append('password', credentials.password);
      params.append('grant_type', 'password');

      console.log('📤 로그인 요청 준비 완료:', {
        url: `${API_BASE_URL}/auth/login`,
        data: params.toString(),
        email: credentials.email
      });

      console.log('🌐 apiClient.post 호출 직전');
      const loginResponse = await apiClient.post<LoginResponse>(
        '/auth/login',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      console.log('✅ 로그인 성공:', loginResponse.data);
      const token = loginResponse.data;

      // 토큰으로 사용자 정보 조회
      console.log('📤 사용자 정보 요청');
      const userResponse = await apiClient.get<User>('/users/me', {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      });

      console.log('✅ 사용자 정보 조회 성공:', userResponse.data);

      return {
        token,
        user: userResponse.data,
      };
    } catch (error: any) {
      console.error('❌ 로그인 에러:', error);
      
      if (error.response) {
        console.error('❌ 응답 에러:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        
        // SHOP_NOT_SELECTED 에러 처리
        if (error.response?.data?.detail?.code === 'SHOP_NOT_SELECTED') {
          console.log('🏪 상점이 선택되지 않음 - 상점 선택 화면으로 이동');
          import('expo-router').then(({ router }) => {
            router.push('/shop-selection');
          });
        }
        
        const message = error.response?.data?.detail?.message || 
                       error.response?.data?.message ||
                       `로그인에 실패했습니다. (${error.response.status})`;
        throw new Error(message);
      } else if (error.request) {
        console.error('❌ 네트워크 에러:', error.request);
        throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      } else {
        console.error('❌ 알 수 없는 에러:', error.message);
        throw new Error('알 수 없는 오류가 발생했습니다.');
      }
    }
  },

  // 토큰 갱신
  async refreshToken(): Promise<LoginResponse> {
    try {
      const response = await axios.post<LoginResponse>(
        `${API_BASE_URL}/auth/refresh`,
        {},
        {
          withCredentials: true, // 쿠키의 refresh_token 사용
        }
      );
      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error('토큰 갱신에 실패했습니다.');
    }
  },

  // 로그아웃
  async logout(): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        {
          withCredentials: true,
        }
      );
    } catch (error) {
      console.error('Logout error:', error);
      // 로그아웃 실패해도 로컬 상태는 정리
    }
  },

  // 사용자 정보 조회
  async getCurrentUser(token: string): Promise<User> {
    try {
      const response = await axios.get<User>(`${API_BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw new Error('사용자 정보를 가져올 수 없습니다.');
    }
  },
};
