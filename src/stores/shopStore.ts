import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { shopApiService, type Shop } from '../api/services/shop';

interface ShopState {
  // 상태
  selectedShop: Shop | null;
  loading: boolean;
  error: string | null;
  
  // 액션
  setSelectedShop: (shop: Shop | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadSelectedShop: () => Promise<void>;
  selectShop: (shopId: number) => Promise<void>;
  refreshShop: () => Promise<void>;
  clearSelectedShop: () => void;
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      selectedShop: null,
      loading: false,
      error: null,

      // 상태 설정 액션
      setSelectedShop: (selectedShop) => {
        set({ selectedShop, error: null });
      },

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      // 선택된 상점 정보 로드
      loadSelectedShop: async () => {
        const { setLoading, setSelectedShop, setError } = get();
        
        try {
          setLoading(true);
          setError(null);
          
          console.log('🔄 상점 정보 서버 조회 시작');
          const shop = await shopApiService.getSelected();
          
          setSelectedShop(shop);
          console.log('✅ 상점 정보 조회 성공:', shop?.name);
        } catch (error: any) {
          console.log('⚠️ 선택된 상점이 없음:', error.message);
          setSelectedShop(null);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      },

      // 상점 선택
      selectShop: async (shopId: number) => {
        const { setLoading, setError, loadSelectedShop } = get();
        
        try {
          setLoading(true);
          setError(null);
          
          await shopApiService.select(shopId);
          
          // 선택 후 최신 정보 로드
          await loadSelectedShop();
          
          console.log('✅ 상점 선택 완료');
        } catch (error: any) {
          console.error('상점 선택 실패:', error);
          setError(error.message);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      // 상점 정보 새로고침
      refreshShop: async () => {
        const { loadSelectedShop } = get();
        await loadSelectedShop();
      },

      // 선택된 상점 정보 정리
      clearSelectedShop: () => {
        console.log('🏪 상점 정보 정리 시작');
        set({
          selectedShop: null,
          loading: false,
          error: null,
        });
        console.log('✅ 상점 정보 정리 완료');
      },
    }),
    {
      name: 'shop-storage', // AsyncStorage 키
      storage: createJSONStorage(() => AsyncStorage),
      // 상점 정보만 저장
      partialize: (state) => ({
        selectedShop: state.selectedShop,
      }),
    }
  )
);
