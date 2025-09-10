import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';

// API 기본 설정
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://kmcbeauty.codeidea.io';

console.log('📍 API_BASE_URL 설정됨 (api.ts):', API_BASE_URL);

// 네비게이션 중복 방지를 위한 플래그
let isNavigatingToShopSelection = false;
let isNavigatingToLogin = false;
    const authData = await AsyncStorage.getItem('auth-storage');
    if (!authData) {
      throw new Error('No auth data found');
    }

    const { refreshToken } = JSON.parse(authData);
    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    console.log('🔄 리프레시 토큰으로 액세스 토큰 갱신 시도');
    
    const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
      refresh_token: refreshToken
    });

    const { access_token, refresh_token: newRefreshToken } = response.data as {
      access_token: string;
      refresh_token?: string;
    };
    
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

// Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10초 타임아웃
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 인증 토큰을 헤더에 추가하는 헬퍼 함수
export const addAuthHeader = async (config: any) => {
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
  return config;
};

// 인증 토큰 추가 함수 제거 (인터셉터에서 직접 처리)

// 응답 인터셉터 (에러 처리 등)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // SHOP_NOT_SELECTED 에러 처리
    if (error.response?.data?.detail?.code === 'SHOP_NOT_SELECTED') {
      console.log('🏪 상점이 선택되지 않음 - 상점 선택 화면으로 이동');
      if (!isNavigatingToShopSelection) {
        isNavigatingToShopSelection = true;
        import('expo-router').then(({ router }) => {
          router.push('/shop-selection');
          setTimeout(() => {
            isNavigatingToShopSelection = false;
          }, 1000);
        });
      }
      return Promise.reject(error);
    }
    
    // 401 에러 처리 - 리프레시 토큰으로 갱신 시도
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔐 401 에러 발생 - 리프레시 토큰으로 갱신 시도');
      
      if (isRefreshing) {
        // 이미 갱신 중이면 큐에 대기
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
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
          // 리프레시 토큰도 만료됨 - 완전 로그아웃 처리
          throw new Error('Refresh token expired');
        }
      } catch (refreshError) {
        console.log('❌ 리프레시 토큰 갱신 실패 - 완전 로그아웃 처리');
        processQueue(refreshError, null);
        
        if (!isNavigatingToLogin) {
          isNavigatingToLogin = true;
          
          // 인증 정보 완전 삭제
          await AsyncStorage.multiRemove(['auth-storage', 'auth-token', 'refresh-token']);
          
          // 동적 import로 AuthContext에 접근하여 로그아웃 처리
          try {
            const { useAuthStore } = await import('@/stores/authContext');
            // AuthContext의 logout 함수 호출 (React Context 외부에서는 직접 호출 불가)
            // 대신 AsyncStorage 삭제 후 로그인 화면으로 이동
          } catch (contextError) {
            console.error('AuthContext 접근 실패:', contextError);
          }
          
          // 로그인 화면으로 이동
          import('expo-router').then(({ router }) => {
            router.replace('/login');
            setTimeout(() => {
              isNavigatingToLogin = false;
            }, 2000);
          });
        }
        
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
