import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';

// 타입 정의
interface AuthTokenResponse {
  access_token: string;
  refresh_token?: string;
}

interface AuthData {
  accessToken: string;
  refreshToken: string;
  isAuthenticated: boolean;
  user?: any;
}

// 환경 변수에서 API URL 가져오기
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL이 설정되지 않았습니다.');
}

console.log('📍 API 클라이언트 초기화:', API_BASE_URL);

// 네비게이션 중복 방지 플래그
let isNavigatingToLogin = false;
let isNavigatingToShopSelection = false;
let isRefreshing = false;
let failedQueue: { resolve: Function; reject: Function }[] = [];

// 실패한 요청들을 큐에서 처리
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// 리프레시 토큰으로 액세스 토큰 갱신
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const authData = await AsyncStorage.getItem('auth-storage');
    if (!authData) {
      throw new Error('인증 정보가 없습니다');
    }

    const { refreshToken } = JSON.parse(authData);
    if (!refreshToken) {
      throw new Error('리프레시 토큰이 없습니다');
    }

    console.log('🔄 리프레시 토큰으로 액세스 토큰 갱신 시도');
    
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken
    });

    const responseData = response.data as AuthTokenResponse;
    const { access_token, refresh_token: newRefreshToken } = responseData;
    
    // 새로운 토큰들을 저장
    const updatedAuthData = {
      ...JSON.parse(authData),
      accessToken: access_token,
      refreshToken: newRefreshToken || refreshToken
    };
    
    await AsyncStorage.setItem('auth-storage', JSON.stringify(updatedAuthData));
    console.log('✅ 액세스 토큰 갱신 성공');
    
    return access_token;
  } catch (error) {
    console.error('❌ 리프레시 토큰 갱신 실패:', error);
    return null;
  }
};

// 완전한 로그아웃 처리
const performLogout = async () => {
  try {
    // 모든 인증 관련 데이터 삭제
    await AsyncStorage.multiRemove(['auth-storage', 'auth-token', 'refresh-token']);
    console.log('🚪 완전 로그아웃 처리 완료');
    
    // 로그인 화면으로 이동
    if (!isNavigatingToLogin) {
      isNavigatingToLogin = true;
      router.replace('/login');
      setTimeout(() => {
        isNavigatingToLogin = false;
      }, 2000);
    }
  } catch (error) {
    console.error('로그아웃 처리 실패:', error);
  }
};

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15초 타임아웃
});

// 요청 인터셉터 - 모든 요청에 Authorization 헤더 추가
apiClient.interceptors.request.use(
  async (config: any) => {
    try {
      const authData = await AsyncStorage.getItem('auth-storage');
      if (authData) {
        const { accessToken } = JSON.parse(authData);
        if (accessToken) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      }
    } catch (error) {
      console.error('토큰 로드 실패:', error);
    }
    
    // 요청 로깅 (개발 환경에서만)
    if (__DEV__) {
      console.log(`🚀 API 요청: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error: any) => Promise.reject(error)
);

// 응답 인터셉터 - 에러 처리 및 토큰 갱신
apiClient.interceptors.response.use(
  (response: any) => {
    // 응답 로깅 (개발 환경에서만)
    if (__DEV__) {
      console.log(`✅ API 응답: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  async (error: any) => {
    const originalRequest = error.config;
    
    // SHOP_NOT_SELECTED 에러 처리
    if (error.response?.data?.detail?.code === 'SHOP_NOT_SELECTED') {
      console.log('🏪 상점이 선택되지 않음 - 상점 선택 화면으로 이동');
      
      if (!isNavigatingToShopSelection) {
        isNavigatingToShopSelection = true;
        router.push('/shop-selection');
        setTimeout(() => {
          isNavigatingToShopSelection = false;
        }, 1000);
      }
      return Promise.reject(error);
    }
    
    // 401 Unauthorized 에러 처리
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔐 401 에러 발생 - 토큰 갱신 시도');
      
      if (isRefreshing) {
        // 이미 갱신 중이면 큐에 대기
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();
        
        if (newAccessToken) {
          // 갱신 성공 - 대기 중인 요청들 처리
          processQueue(null, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } else {
          // 리프레시 토큰도 만료됨 - 완전 로그아웃
          throw new Error('리프레시 토큰 만료');
        }
      } catch (refreshError) {
        console.log('❌ 토큰 갱신 실패 - 로그아웃 처리');
        processQueue(refreshError, null);
        await performLogout();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    
    // 기타 에러 로깅
    if (__DEV__) {
      console.error(`❌ API 에러: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status}`, error.response?.data);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
export { API_BASE_URL };

