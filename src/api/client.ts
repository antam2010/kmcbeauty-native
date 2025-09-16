import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';

// 타입 정의
interface AuthTokenResponse {
  access_token: string;
  refresh_token?: string;
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
    console.log('🔄 리프레시 토큰으로 액세스 토큰 갱신 시도');
    
    // 리프레시 토큰은 HttpOnly 쿠키로 관리되므로 별도 파라미터 없이 호출
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
      withCredentials: true, // 쿠키 포함하여 요청
    });

    const responseData = response.data as AuthTokenResponse;
    const { access_token } = responseData;
    
    // 새로운 액세스 토큰 저장
    const authData = await AsyncStorage.getItem('auth-storage');
    const existingData = authData ? JSON.parse(authData) : {};
    
    const updatedAuthData = {
      ...existingData,
      accessToken: access_token,
      // 리프레시 토큰은 서버가 쿠키로 관리하므로 저장하지 않음
    };
    
    await AsyncStorage.setItem('auth-storage', JSON.stringify(updatedAuthData));
    console.log('✅ 액세스 토큰 갱신 성공');
    
    return access_token;
  } catch (error: any) {
    console.error('❌ 리프레시 토큰 갱신 실패:', error);
    
    // 상세한 에러 로깅
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
    } else if (error.request) {
      console.error('요청 실패:', error.request);
    } else {
      console.error('에러 메시지:', error.message);
    }
    
    return null;
  }
};

// 완전한 로그아웃 처리
const performLogout = async () => {
  try {
    console.log('🚪 강제 로그아웃 처리 시작');
    
    // 모든 사용자 관련 데이터 삭제 (아이디 기억하기 제외)
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToRemove = allKeys.filter(key => 
      key !== 'remembered-email' && // 아이디 기억하기는 유지
      !key.startsWith('system-') // 시스템 설정은 유지
    );
    
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('🚪 사용자 데이터 완전 정리 완료:', keysToRemove);
    }
    
    // 글로벌 플래그 리셋
    isRefreshing = false;
    failedQueue = [];
    
    // 로그인 화면으로 이동 (중복 방지)
    if (!isNavigatingToLogin) {
      isNavigatingToLogin = true;
      console.log('🔄 로그인 화면으로 리다이렉트');
      
      // 현재 라우트를 완전히 교체
      router.replace('/login');
      
      // 리셋 타이머
      setTimeout(() => {
        isNavigatingToLogin = false;
      }, 3000); // 3초로 증가
    }
  } catch (error) {
    console.error('로그아웃 처리 실패:', error);
    
    // 실패해도 로그인 화면으로 이동
    if (!isNavigatingToLogin) {
      isNavigatingToLogin = true;
      router.replace('/login');
      setTimeout(() => {
        isNavigatingToLogin = false;
      }, 3000);
    }
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
      // 새로운 토큰 저장 방식에서 토큰 가져오기
      const accessToken = await AsyncStorage.getItem('auth_token');
      if (accessToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      // 상점 정보도 헤더에 추가 (새로운 저장 방식)
      const shopData = await AsyncStorage.getItem('selected_shop');
      if (shopData) {
        const shop = JSON.parse(shopData);
        if (shop.id) {
          config.headers = config.headers || {};
          config.headers['X-Shop-ID'] = shop.id.toString();
        }
      }
    } catch (error) {
      console.error('토큰/상점 정보 로드 실패:', error);
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
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          } else {
            return Promise.reject(new Error('토큰 갱신 실패'));
          }
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
          console.log('🚪 리프레시 토큰 만료 - 강제 로그아웃 실행');
          throw new Error('리프레시 토큰 만료');
        }
      } catch (refreshError: any) {
        console.log('❌ 토큰 갱신 실패 - 로그아웃 처리');
        console.error('갱신 에러 상세:', refreshError);
        
        processQueue(refreshError, null);
        
        // 강제 로그아웃 처리
        await performLogout();
        
        // 원래 에러를 반환하여 호출하는 쪽에서 적절히 처리할 수 있도록 함
        return Promise.reject(new Error('인증이 만료되었습니다. 다시 로그인해주세요.'));
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

