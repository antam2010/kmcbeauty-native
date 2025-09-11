import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// API 기본 설정
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

console.log('📍 API_BASE_URL 설정됨 (api.ts):', API_BASE_URL);

// 네비게이션 중복 방지를 위한 플래그
let isNavigatingToShopSelection = false;
let isNavigatingToLogin = false;

// 토큰 갱신 관련 변수들
let isRefreshing = false;
let failedQueue: {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}[] = [];

// 대기 중인 요청들을 처리하는 함수
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

// 리프레시 토큰으로 액세스 토큰 갱신 (쿠키 사용)
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const authData = await AsyncStorage.getItem('auth-storage');
    if (!authData) {
      throw new Error('No auth data found');
    }

    console.log('🔄 리프레시 토큰으로 액세스 토큰 갱신 시도 (쿠키 사용)');
    
    // 리프레시 토큰은 쿠키로 전송되므로 body에 포함하지 않음
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
      withCredentials: true, // 쿠키 포함하여 요청
    });

    const { access_token } = response.data as {
      access_token: string;
    };
    
    // 액세스 토큰만 로컬 스토리지에 저장 (리프레시 토큰은 쿠키에서 관리)
    const updatedAuthData = {
      ...JSON.parse(authData),
      accessToken: access_token,
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
  withCredentials: true, // 쿠키 포함하여 요청
});

// 요청 인터셉터 - 자동으로 토큰 추가
apiClient.interceptors.request.use(
  (config) => {
    // 로그인 요청은 토큰 없이 처리
    if (config.url?.includes('/auth/login')) {
      return Promise.resolve(config);
    }
    
    // 다른 요청들은 토큰 추가
    return addAuthHeader(config);
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
    // 상점 선택 완료 시 메인으로 이동 (POST /shops/selected 성공 응답)
    if ((response.status === 200 || response.status === 201 || response.status === 204) && 
        response.config?.method?.toUpperCase() === 'POST' &&
        (response.config?.url?.includes('/shops/selected') || 
         response.config?.url?.includes('/shop'))) {
      console.log(`✅ 상점 선택 완료 (POST ${response.config.url}, ${response.status}) - 메인 화면으로 이동`);
      
      // 웹과 모바일 환경 모두 지원
      try {
        if (typeof window !== 'undefined') {
          // 웹 환경
          setTimeout(() => {
            import('expo-router').then(({ router }) => {
              router.replace('/(tabs)');
            }).catch(() => {
              // 웹에서 expo-router 실패 시 대체 방법
              window.location.href = '/(tabs)';
            });
          }, 100);
        } else {
          // 모바일 환경
          import('expo-router').then(({ router }) => {
            router.replace('/(tabs)');
          });
        }
      } catch (error) {
        console.error('네비게이션 실패:', error);
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // SHOP_NOT_SELECTED 에러 처리
    if (error.response?.data?.detail?.code === 'SHOP_NOT_SELECTED') {
      console.log('🏪 상점이 선택되지 않음 - 상점 선택 화면으로 이동');
      if (!isNavigatingToShopSelection) {
        isNavigatingToShopSelection = true;
        
        try {
          if (typeof window !== 'undefined') {
            // 웹 환경
            setTimeout(() => {
              import('expo-router').then(({ router }) => {
                router.push('/shop-selection');
              }).catch(() => {
                window.location.href = '/shop-selection';
              });
            }, 100);
          } else {
            // 모바일 환경
            const { router } = await import('expo-router');
            router.push('/shop-selection');
          }
        } catch (navError) {
          console.error('상점 선택 화면 이동 실패:', navError);
        }
        
        setTimeout(() => {
          isNavigatingToShopSelection = false;
        }, 1000);
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
          
          // 인증 정보 완전 삭제 (리프레시 토큰은 쿠키에서 관리되므로 제외)
          await AsyncStorage.multiRemove(['auth-storage', 'auth-token']);
          
          // 서버에 로그아웃 요청을 보내 쿠키 삭제 처리 (선택사항)
          try {
            await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
              withCredentials: true,
            });
          } catch (logoutError) {
            console.log('로그아웃 요청 실패 (무시):', logoutError);
          }
          
          // 로그인 화면으로 이동 (웹/모바일 환경 모두 지원)
          try {
            if (typeof window !== 'undefined') {
              // 웹 환경
              setTimeout(() => {
                import('expo-router').then(({ router }) => {
                  router.replace('/login');
                }).catch(() => {
                  window.location.href = '/login';
                });
              }, 100);
            } else {
              // 모바일 환경
              const { router } = await import('expo-router');
              router.replace('/login');
            }
          } catch (navError) {
            console.error('로그인 화면 이동 실패:', navError);
          }
          
          setTimeout(() => {
            isNavigatingToLogin = false;
          }, 2000);
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
