import { SelectedShop, ShopsResponse } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// 인증된 요청을 위한 헤더 생성
const getAuthHeaders = async () => {
  try {
    const authData = await AsyncStorage.getItem('auth-storage');
    if (authData) {
      const { accessToken } = JSON.parse(authData);
      return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    }
    return {};
  } catch {
    return {};
  }
};

export const shopService = {
  // 상점 목록 조회
  async getShops(page: number = 1, size: number = 50): Promise<ShopsResponse> {
    try {
      console.log('🏪 상점 목록 조회 시작', { page, size });
      const headers = await getAuthHeaders();
      const response = await axios.get<ShopsResponse>(`${API_BASE_URL}/shops`, { 
        headers,
        params: { page, size }
      });
      console.log('✅ 상점 목록 조회 성공:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 상점 목록 조회 에러:', error);
      throw error;
    }
  },

  // 선택된 상점 조회
  async getSelectedShop(): Promise<SelectedShop | null> {
    try {
      console.log('🏪 선택된 상점 조회 시작');
      const headers = await getAuthHeaders();
      const response = await axios.get<SelectedShop>(`${API_BASE_URL}/shops/selected`, { headers });
      console.log('✅ 선택된 상점 조회 성공:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 선택된 상점 조회 에러:', error);
      if (error.response?.status === 404) {
        return null; // 선택된 상점이 없음
      }
      throw error;
    }
  },

  // 상점 선택
  async selectShop(shopId: number): Promise<SelectedShop> {
    try {
      console.log('🏪 상점 선택 시작:', shopId);
      const headers = await getAuthHeaders();
      const response = await axios.post<SelectedShop>(`${API_BASE_URL}/shops/selected`, {
        shop_id: shopId
      }, { headers });
      console.log('✅ 상점 선택 성공:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 상점 선택 에러:', error);
      throw error;
    }
  },
};
