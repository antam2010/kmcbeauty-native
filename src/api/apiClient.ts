import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';

// 환경 변수에서 API 기본 URL 가져오기
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

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

  async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('auth-token', token);
    } catch (error) {
      console.error('토큰 저장 실패:', error);
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

// 요청 인터셉터
apiClient.interceptors.request.use(
  async (config: any) => {
    try {
      const token = await tokenManager.getStoredToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('토큰 로딩 실패:', error);
    }
    
    console.log(`🌐 API 요청: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('요청 인터셉터 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API 응답: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    // 인증 오류 처리 (401, 403)
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('🔴 인증 오류 감지, 로그아웃 처리');
      
      await tokenManager.removeTokens();
      tokenManager.redirectToLogin();
      
      return Promise.reject(error);
    }

    // 공통 에러 로깅
    if (!error.response) {
      // 네트워크 오류
      console.error('🌐 네트워크 오류:', error.message);
      error.message = '네트워크 연결을 확인해주세요';
    } else {
      // HTTP 에러 상세 로깅
      const errorInfo = {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        params: error.config?.params,
        requestData: error.config?.data,
        responseData: error.response.data,
        headers: error.response.headers
      };

      console.error(`🔴 API 오류 [${errorInfo.status}]:`, errorInfo);

      // 422 유효성 검사 오류 상세 출력
      if (error.response.status === 422) {
        console.error('🔍 422 Validation Error Details:', {
          message: error.response.data?.message,
          detail: error.response.data?.detail,
          errors: error.response.data?.errors,
          requestUrl: `${error.config?.method?.toUpperCase()} ${error.config?.url}`,
          requestParams: error.config?.params,
          requestBody: error.config?.data
        });
      }
    }

    return Promise.reject(error);
  }
);

// 로그아웃 처리 유틸리티
export const handleLogout = async () => {
  try {
    console.log('🚪 로그아웃 처리 시작');
    
    // 서버에 로그아웃 알림 (선택적)
    try {
      await apiClient.post('/auth/logout');
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
