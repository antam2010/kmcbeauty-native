import axios from 'axios';

// API 기본 설정
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

console.log('📍 API_BASE_URL 설정됨 (api.ts):', API_BASE_URL);

// Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10초 타임아웃
});

// 요청 인터셉터 (인증 토큰 추가 등)
apiClient.interceptors.request.use(
  (config) => {
    // AsyncStorage에서 인증 토큰 가져오기 (비동기 처리를 위해 별도 함수에서 처리)
    return addAuthToken(config);
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 인증 토큰 추가 함수
async function addAuthToken(config: any) {
  try {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    const authData = await AsyncStorage.getItem('auth-storage');
    if (authData) {
      const { accessToken } = JSON.parse(authData);
      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
  } catch (error) {
    console.log('토큰 로드 실패:', error);
  }
  return config;
}

// 응답 인터셉터 (에러 처리 등)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // SHOP_NOT_SELECTED 에러 처리
    if (error.response?.data?.detail?.code === 'SHOP_NOT_SELECTED') {
      console.log('🏪 상점이 선택되지 않음 - 상점 선택 화면으로 이동');
      // 동적 import를 사용하여 순환 참조 방지
      import('expo-router').then(({ router }) => {
        router.push('/shop-selection');
      });
      return Promise.reject(error);
    }
    
    // 인증 에러 처리
    if (error.response?.status === 401) {
      console.log('🔐 인증 에러 - 로그인 화면으로 이동');
      // 인증 정보 제거
      import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
        AsyncStorage.removeItem('auth-storage');
      });
      // 로그인 화면으로 이동
      import('expo-router').then(({ router }) => {
        router.replace('/login');
      });
    }
    return Promise.reject(error);
  }
);

export default apiClient;
