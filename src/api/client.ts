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

// 토큰 가져오기 함수 (Zustand persist 우선)
const getAccessToken = async (): Promise<string | null> => {
  // 1. Zustand 스토어에서 토큰 확인 (persist로 저장된 토큰)
  try {
    const { useAuthStore } = await import('../stores/authStore');
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      console.log('🔑 Zustand 스토어 토큰 사용');
      return accessToken;
    }
  } catch (error) {
    console.error('🔑 Zustand 스토어 토큰 조회 실패:', error);
  }

  // 2. 호환성을 위한 수동 저장된 auth-storage 확인 (레거시)
  try {
    const authData = await AsyncStorage.getItem('auth-storage');
    if (authData) {
      const parsedData = JSON.parse(authData);
      const { accessToken } = parsedData;
      if (accessToken) {
        console.log('🔑 AsyncStorage(레거시) 토큰 사용');
        return accessToken;
      }
    }
  } catch (error) {
    console.error('🔑 AsyncStorage 토큰 조회 실패:', error);
  }
  
  console.warn('⚠️ 사용 가능한 토큰이 없음');
  return null;
};

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
    
    if (!access_token) {
      console.error('❌ 서버에서 새로운 액세스 토큰을 반환하지 않음');
      return null;
    }
    
    // 새로운 액세스 토큰 저장 (Zustand persist가 자동으로 AsyncStorage 처리)
    try {
      const { useAuthStore } = await import('../stores/authStore');
      useAuthStore.getState().setAccessToken(access_token);
      console.log('✅ 액세스 토큰 갱신 성공 (Zustand persist)');
    } catch (storeError) {
      console.error('⚠️ 토큰 저장 중 에러:', storeError);
      // 저장 실패해도 토큰은 반환
    }
    
    return access_token;
  } catch (error: any) {
    console.error('❌ 리프레시 토큰 갱신 실패:', error);
    
    // 상세한 에러 로깅과 분류
    if (error.response) {
      const status = error.response.status;
      console.error('응답 상태:', status);
      console.error('응답 데이터:', error.response.data);
      
      // 401/403 에러는 리프레시 토큰이 만료되었거나 유효하지 않음을 의미
      if (status === 401 || status === 403) {
        console.log('🚪 리프레시 토큰 만료 또는 유효하지 않음 - 완전 로그아웃 필요');
      } else {
        console.log('🔄 일시적인 서버 에러 가능성 - 네트워크 확인 필요');
      }
    } else if (error.request) {
      console.error('네트워크 요청 실패:', error.request);
      console.log('🌐 네트워크 연결 상태를 확인해주세요');
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
    
    // Zustand 스토어 정리 (동적 import로 순환 참조 방지)
    try {
      const { useAuthStore } = await import('../stores/authStore');
      const { useShopStore } = await import('../stores/shopStore');
      
      // 상태 정리
      useAuthStore.getState().clearAuth();
      useShopStore.getState().clearSelectedShop();
      console.log('✅ Zustand 스토어 정리 완료');
    } catch (storeError) {
      console.error('⚠️ 스토어 정리 중 에러:', storeError);
    }
    
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
      console.log('🔄 로그인 화면으로 리다이렉트 시작');
      
      try {
        // 현재 라우트를 완전히 교체
        router.replace('/login');
        console.log('✅ 로그인 페이지로 리다이렉트 완료');
      } catch (routerError) {
        console.error('❌ 라우터 에러:', routerError);
        // 대안으로 push 시도
        try {
          router.push('/login');
          console.log('✅ 로그인 페이지로 push 완료');
        } catch (pushError) {
          console.error('❌ push도 실패:', pushError);
        }
      }
      
      // 리셋 타이머
      setTimeout(() => {
        isNavigatingToLogin = false;
        console.log('🔄 네비게이션 플래그 리셋');
      }, 3000); // 3초로 증가
    } else {
      console.log('⚠️ 이미 로그인 페이지로 이동 중입니다.');
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
      // 토큰 가져오기 (임시 토큰 또는 AsyncStorage)
      const accessToken = await getAccessToken();
      let hasToken = false;
      
      if (accessToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${accessToken}`;
        hasToken = true;
        
        // 토큰 상세 로깅 (민감한 정보는 마스킹)
        if (__DEV__) {
          console.log('🔑 토큰 정보:', {
            hasToken: true,
            tokenLength: accessToken.length,
            tokenPrefix: accessToken.substring(0, 10) + '...',
            tokenSuffix: '...' + accessToken.substring(accessToken.length - 10),
            source: 'zustand'
          });
        }
      } else {
        console.warn('⚠️ 사용 가능한 토큰이 없음');
      }

      // 상점 정보도 헤더에 추가
      let hasShopId = false;
      const shopData = await AsyncStorage.getItem('selectedShop');
      if (shopData) {
        const shop = JSON.parse(shopData);
        if (shop.id) {
          config.headers = config.headers || {};
          config.headers['X-Shop-ID'] = shop.id.toString();
          hasShopId = true;
        }
      }
      
      // 상세한 요청 로깅 (개발 환경에서만)
      if (__DEV__) {
        console.log(`🚀 API 요청 상세:`, {
          method: config.method?.toUpperCase(),
          url: config.url,
          fullUrl: `${config.baseURL}${config.url}`,
          hasAuthToken: hasToken,
          hasShopId: hasShopId,
          headers: {
            Authorization: config.headers?.Authorization ? `Bearer ${config.headers.Authorization.substring(7, 17)}...` : 'NONE',
            'X-Shop-ID': config.headers?.['X-Shop-ID'] || 'NONE',
            'Content-Type': config.headers?.['Content-Type'] || 'default'
          }
        });
      }
      
    } catch (error) {
      console.error('💥 토큰/상점 정보 로드 실패:', error);
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
    
    // 에러 상세 로깅 (개발 환경에서만)
    if (__DEV__) {
      console.log(`❌ API 에러 상세:`, {
        method: originalRequest?.method?.toUpperCase(),
        url: originalRequest?.url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        errorCode: error.response?.data?.detail?.code,
        errorDetail: error.response?.data?.detail?.detail,
        errorHint: error.response?.data?.detail?.hint,
        requestHeaders: {
          Authorization: originalRequest?.headers?.Authorization ? 
            `Bearer ${originalRequest.headers.Authorization.substring(7, 17)}...` : 'NONE',
          'X-Shop-ID': originalRequest?.headers?.['X-Shop-ID'] || 'NONE'
        }
      });
    }
    
    // 🏪 SHOP_NOT_SELECTED 에러 처리 - 최우선 처리 (401/403보다 먼저)
    // 로그인은 성공했지만 상점이 선택되지 않은 상태
    if (error.response?.data?.detail?.code === 'SHOP_NOT_SELECTED') {
      console.log('🏪 상점이 선택되지 않음 - 상점 선택 화면으로 이동');
      console.log('🏪 에러 상세:', error.response.data);
      console.log('🏪 HTTP 상태:', error.response?.status); // 401이어도 SHOP_NOT_SELECTED가 우선
      
      if (!isNavigatingToShopSelection) {
        isNavigatingToShopSelection = true;
        
        try {
          // 상점 선택 화면으로 이동
          router.replace('/shop-selection');
          console.log('✅ 상점 선택 화면으로 이동 완료');
        } catch (routerError) {
          console.error('❌ 상점 선택 화면 이동 실패:', routerError);
          // 대안으로 push 시도
          try {
            router.push('/shop-selection');
            console.log('✅ 상점 선택 화면으로 push 완료');
          } catch (pushError) {
            console.error('❌ push도 실패:', pushError);
          }
        }
        
        // 플래그 리셋
        setTimeout(() => {
          isNavigatingToShopSelection = false;
          console.log('🔄 상점 선택 네비게이션 플래그 리셋');
        }, 2000);
      } else {
        console.log('⚠️ 이미 상점 선택 화면으로 이동 중입니다.');
      }
      
      // SHOP_NOT_SELECTED 에러의 경우 명확한 에러 메시지로 reject
      return Promise.reject(new Error('상점이 선택되지 않았습니다. 상점을 선택해주세요.'));
    }
    
    // 403 Forbidden 에러 처리 - 무조건 로그인 페이지로 이동
    if (error.response?.status === 403) {
      console.log('🚫 403 에러 발생 - 권한 없음, 강제 로그아웃 처리');
      try {
        await performLogout();
      } catch (logoutError) {
        console.error('로그아웃 처리 중 에러:', logoutError);
      }
      return Promise.reject(new Error('권한이 없습니다. 다시 로그인해주세요.'));
    }
    
    // 401 Unauthorized 에러 처리 - 리프레시 토큰으로 갱신 시도
    // 단, SHOP_NOT_SELECTED 에러가 아닌 경우에만 처리
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
        // Zustand 스토어에서 토큰 확인
        const { useAuthStore } = await import('../stores/authStore');
        const currentToken = useAuthStore.getState().accessToken;
        if (!currentToken) {
          console.log('🚪 저장된 토큰이 없음 - 로그아웃 처리');
          throw new Error('토큰 없음');
        }

        const newAccessToken = await refreshAccessToken();
        
        if (newAccessToken) {
          // 갱신 성공 - 대기 중인 요청들 처리
          console.log('✅ 토큰 갱신 성공 - 원래 요청 재시도');
          processQueue(null, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } else {
          // 리프레시 토큰도 만료되거나 없음 - 완전 로그아웃
          console.log('🚪 리프레시 토큰 만료/없음 - 강제 로그아웃 실행');
          throw new Error('리프레시 토큰 만료');
        }
      } catch (refreshError: any) {
        console.log('❌ 토큰 갱신 실패 - 로그아웃 처리');
        console.error('갱신 에러 상세:', refreshError.message);
        
        // 실패한 모든 요청 큐 처리
        processQueue(refreshError, null);
        
        // 강제 로그아웃 처리 (에러 처리 포함)
        try {
          await performLogout();
        } catch (logoutError) {
          console.error('로그아웃 처리 중 에러:', logoutError);
        }
        
        // 명확한 에러 메시지로 반환
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

// 개발 환경에서 에러 처리 로직 테스트를 위한 디버깅 유틸리티
export const authDebugUtils = {
  // 401 에러 시뮬레이션 (토큰 갱신 테스트)
  async test401Error() {
    try {
      console.log('🧪 401 에러 시뮬레이션 시작');
      // 잘못된 토큰으로 요청하여 401 에러 유발
      const response = await axios.get(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: 'Bearer invalid_token' }
      });
      console.log('❌ 401 에러가 발생하지 않음:', response.status);
    } catch (error: any) {
      console.log('✅ 401 에러 처리 완료:', error.message);
    }
  },

  // 403 에러 시뮬레이션
  async test403Error() {
    try {
      console.log('🧪 403 에러 시뮬레이션 시작');
      // 권한이 없는 엔드포인트 호출로 403 에러 유발 (실제로는 존재하지 않을 수 있음)
      const response = await apiClient.get('/admin/forbidden');
      console.log('❌ 403 에러가 발생하지 않음:', response.status);
    } catch (error: any) {
      console.log('✅ 403 에러 처리 완료:', error.message);
    }
  },

  // 현재 토큰 상태 확인
  async checkTokenStatus() {
    try {
      console.log('🔍 AsyncStorage 전체 토큰 상태 확인 시작');
      
      // 모든 키 확인
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('📦 AsyncStorage 모든 키:', allKeys);
      
      // auth-storage 확인
      const authData = await AsyncStorage.getItem('auth-storage');
      if (authData) {
        const parsedAuthData = JSON.parse(authData);
        console.log('🔑 auth-storage 내용:', {
          keys: Object.keys(parsedAuthData),
          hasAccessToken: !!parsedAuthData.accessToken,
          hasRefreshToken: !!parsedAuthData.refreshToken,
          tokenLength: parsedAuthData.accessToken?.length || 0,
          tokenPrefix: parsedAuthData.accessToken?.substring(0, 20) + '...' || 'NONE',
          tokenSuffix: parsedAuthData.accessToken ? '...' + parsedAuthData.accessToken.substring(parsedAuthData.accessToken.length - 10) : 'NONE'
        });
      } else {
        console.log('🔑 auth-storage가 null 또는 존재하지 않음');
      }
      
      // shop-storage 확인
      const shopData = await AsyncStorage.getItem('shop-storage');
      if (shopData) {
        const parsedShopData = JSON.parse(shopData);
        console.log('🏪 shop-storage 내용:', parsedShopData);
      } else {
        console.log('🏪 shop-storage가 null 또는 존재하지 않음');
      }
      
      // selectedShop 확인 (별도 키)
      const selectedShopData = await AsyncStorage.getItem('selectedShop');
      if (selectedShopData) {
        const parsedSelectedShop = JSON.parse(selectedShopData);
        console.log('🏪 selectedShop 내용:', parsedSelectedShop);
      } else {
        console.log('🏪 selectedShop이 null 또는 존재하지 않음');
      }
      
    } catch (error) {
      console.error('🔑 토큰 상태 확인 실패:', error);
    }
  },

  // 리프레시 토큰 테스트
  async testRefreshToken() {
    try {
      console.log('🔄 리프레시 토큰 테스트 시작');
      const newToken = await refreshAccessToken();
      if (newToken) {
        console.log('✅ 리프레시 토큰 갱신 성공');
      } else {
        console.log('❌ 리프레시 토큰 갱신 실패');
      }
    } catch (error) {
      console.error('❌ 리프레시 토큰 테스트 에러:', error);
    }
  },

  // 대시보드 API 테스트 (인증 에러 확인)
  async testDashboardAPI() {
    try {
      console.log('📊 대시보드 API 테스트 시작');
      const response = await apiClient.get('/summary/dashboard', {
        params: {
          target_date: new Date().toISOString().split('T')[0],
          force_refresh: false
        }
      });
      console.log('✅ 대시보드 API 성공:', response.status);
    } catch (error: any) {
      console.log('❌ 대시보드 API 에러:', error.message);
      console.log('🔍 에러 상세:', error.response?.status, error.response?.data);
    }
  },

  // shops/selected API 테스트 (토큰 확인용)
  async testShopsSelectedAPI() {
    try {
      console.log('🏪 shops/selected API 테스트 시작');
      
      // 먼저 토큰 상태 확인
      await this.checkTokenStatus();
      
      // API 호출
      const response = await apiClient.get('/shops/selected');
      console.log('✅ shops/selected API 성공:', response.status, response.data);
    } catch (error: any) {
      console.log('❌ shops/selected API 에러:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        errorCode: error.response?.data?.detail?.code,
        errorDetail: error.response?.data?.detail?.detail,
        errorHint: error.response?.data?.detail?.hint
      });
    }
  },

  // 로그아웃 처리 테스트
  async testLogout() {
    try {
      console.log('🚪 로그아웃 테스트 시작');
      await performLogout();
      console.log('✅ 로그아웃 처리 완료');
    } catch (error) {
      console.error('❌ 로그아웃 테스트 에러:', error);
    }
  }
};

// 개발 환경에서 글로벌 접근 가능하도록 설정
if (__DEV__) {
  (global as any).authDebug = authDebugUtils;
  console.log('🛠️ authDebug 유틸리티 등록됨 (global.authDebug로 접근 가능)');
}

export default apiClient;
export { API_BASE_URL };

