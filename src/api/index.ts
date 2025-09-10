import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';

// 환경 변수에서 API 기본 URL 가져오기  
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://kmcbeauty.codeidea.io';

console.log('📍 API Base URL:', API_BASE_URL);

// API 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 토큰 관리 유틸리티
export const tokenManager = {
  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth-token');
    } catch (error) {
      console.error('토큰 가져오기 실패:', error);
      return null;
    }
  },

  async getStoredRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('refresh-token');
    } catch (error) {
      console.error('리프레시 토큰 가져오기 실패:', error);
      return null;
    }
  },

  async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('auth-token', token);
    } catch (error) {
      console.error('토큰 저장 실패:', error);
    }
  },

  async saveRefreshToken(refreshToken: string): Promise<void> {
    try {
      await AsyncStorage.setItem('refresh-token', refreshToken);
    } catch (error) {
      console.error('리프레시 토큰 저장 실패:', error);
    }
  },

  async saveTokens(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      await this.saveToken(accessToken);
      if (refreshToken) {
        await this.saveRefreshToken(refreshToken);
      }
    } catch (error) {
      console.error('토큰들 저장 실패:', error);
    }
  },

  async removeTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['auth-token', 'refresh-token', 'auth-storage']);
      console.log('✅ 모든 토큰 삭제 완료');
    } catch (error) {
      console.error('토큰 삭제 실패:', error);
    }
  },

  redirectToLogin() {
    try {
      console.log('🔄 로그인 화면으로 리디렉션');
      router.replace('/login');
    } catch (error) {
      console.error('라우터 리디렉션 실패:', error);
    }
  }
};

// 토큰 재발급 응답 타입
interface RefreshTokenResponse {
  access_token: string;
  refresh_token?: string;
}

// 토큰 재발급 함수
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    console.log('🔄 액세스 토큰 재발급 시도');
    const response = await apiClient.post('/auth/refresh');
    
    const { access_token, refresh_token: newRefreshToken } = response.data as RefreshTokenResponse;
    
    // 새 토큰들 저장
    await tokenManager.saveTokens(access_token, newRefreshToken);
    
    console.log('✅ 액세스 토큰 재발급 성공');
    return access_token;
  } catch (error) {
    console.error('❌ 토큰 재발급 실패:', error);
    return null;
  }
};

// 토큰을 요청에 추가하는 헬퍼 함수
const addTokenToRequest = async (config: any) => {
  const token = await tokenManager.getStoredToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// 401 재시도 큐 관리
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
  config: any;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      resolve(config);
    }
  });
  
  failedQueue = [];
};

// 응답 인터셉터 설정
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API 응답: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 에러 처리 - 토큰 재발급 시도
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 이미 재발급 중이면 큐에 추가
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        }).then((config: any) => {
          return apiClient(config);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        
        if (newToken) {
          // 재발급 성공 - 큐의 모든 요청에 새 토큰 적용
          processQueue(null, newToken);
          
          // 원래 요청에 새 토큰 적용하여 재시도
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } else {
          // 재발급 실패 - 로그아웃 처리
          processQueue(error, null);
          await tokenManager.removeTokens();
          tokenManager.redirectToLogin();
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // 재발급 중 오류 - 로그아웃 처리
        processQueue(refreshError, null);
        await tokenManager.removeTokens();
        tokenManager.redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 403 에러 처리 (권한 없음)
    if (error.response?.status === 403) {
      console.log('🔴 권한 없음 오류 감지');
      await tokenManager.removeTokens();
      tokenManager.redirectToLogin();
      return Promise.reject(error);
    }

    // 네트워크 오류 처리
    if (!error.response) {
      console.error('🌐 네트워크 오류:', error.message);
      error.message = '네트워크 연결을 확인해주세요';
    } else {
      // 서버 오류 로깅
      console.error('🔴 API 오류:', {
        status: error.response.status,
        message: error.response.data?.message || error.message,
        url: error.config?.url,
        data: error.response.data,
      });
    }

    return Promise.reject(error);
  }
);

// API 호출 래퍼 - 토큰을 자동으로 추가
const apiCall = async (config: any) => {
  const configWithToken = await addTokenToRequest(config);
  console.log(`🌐 API 요청: ${configWithToken.method?.toUpperCase()} ${configWithToken.url}`);
  return apiClient(configWithToken);
};

// 편의 메서드들
export const api = {
  get: (url: string, config = {}) => apiCall({ ...config, method: 'GET', url }),
  post: (url: string, data?: any, config = {}) => apiCall({ ...config, method: 'POST', url, data }),
  put: (url: string, data?: any, config = {}) => apiCall({ ...config, method: 'PUT', url, data }),
  patch: (url: string, data?: any, config = {}) => apiCall({ ...config, method: 'PATCH', url, data }),
  delete: (url: string, config = {}) => apiCall({ ...config, method: 'DELETE', url }),
};

// 로그아웃 처리 유틸리티
export const handleLogout = async () => {
  try {
    console.log('🚪 로그아웃 처리 시작');
    
    // 서버에 로그아웃 알림 (선택적)
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.log('서버 로그아웃 알림 실패 (무시):', error);
    }
    
    // 로컬 토큰 삭제
    await tokenManager.removeTokens();
    
    // 로그인 화면으로 이동
    tokenManager.redirectToLogin();
    
    console.log('✅ 로그아웃 완료');
  } catch (error) {
    console.error('로그아웃 처리 중 오류:', error);
  }
};

export default apiClient;
