import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';

// API 기본 설정
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://kmcbeauty.codeidea.io';

console.log('📍 API_BASE_URL 설정됨:', API_BASE_URL);

// 네비게이션 중복 방지를 위한 플래그
let isNavigatingToLogin = false;

// API 인스턴스 생성
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 로그아웃 헬퍼 함수
const handleLogout = async () => {
  if (isNavigatingToLogin) return;
  
  try {
    isNavigatingToLogin = true;
    console.log('🔴 인증 실패 - 로그아웃 처리');
    
    // AsyncStorage 완전 정리
    await AsyncStorage.multiRemove([
      'auth-token',
      'refresh-token', 
      'auth-storage',
      'selectedShop',
      'userInfo'
    ]);
    
    console.log('✅ 저장된 데이터 정리 완료');
    
    // 로그인 화면으로 이동
    router.replace('/login');
  } catch (error) {
    console.error('로그아웃 처리 중 오류:', error);
  } finally {
    // 일정 시간 후 플래그 리셋
    setTimeout(() => {
      isNavigatingToLogin = false;
    }, 1000);
  }
};

// 요청 인터셉터
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth-token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('토큰 로드 실패:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 인증 오류 처리
    if (error.response?.status === 401 || error.response?.status === 403) {
      await handleLogout();
    }
    
    return Promise.reject(error);
  }
);

// 인증 API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    
    // 토큰 저장
    if (response.data.access_token) {
      await AsyncStorage.setItem('auth-token', response.data.access_token);
    }
    
    return response.data;
  },
  
  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.log('서버 로그아웃 실패 (무시):', error);
    }
    
    await handleLogout();
  },
  
  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  }
};

// 샵 API
export const shopAPI = {
  getMyShops: async () => {
    const response = await api.get('/api/shops/my');
    return response.data;
  },
  
  selectShop: async (shopId: number) => {
    const response = await api.post('/api/shops/select', { shop_id: shopId });
    
    // 선택된 샵 정보 저장
    if (response.data.shop) {
      await AsyncStorage.setItem('selectedShop', JSON.stringify(response.data.shop));
    }
    
    return response.data;
  }
};

// 예약 API  
export const bookingAPI = {
  getBookings: async () => {
    const response = await api.get('/api/bookings');
    return response.data;
  },
  
  createBooking: async (bookingData: any) => {
    const response = await api.post('/api/bookings', bookingData);
    return response.data;
  }
};

// 대시보드 API
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
  }
};

export default api;
