import { shopApiService, type Shop } from '@/src/api/services/shop';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface ShopContextType {
  selectedShop: Shop | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadSelectedShop: () => Promise<void>;
  selectShop: (shopId: number) => Promise<void>;
  refreshShop: () => Promise<void>;
  clearSelectedShop: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const SHOP_STORAGE_KEY = 'selectedShop';

// 간단한 이벤트 에미터
class ShopEventEmitter {
  private listeners: { [event: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  off(event: string, listener: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== listener);
  }

  emit(event: string, data?: any) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(listener => listener(data));
  }
}

export const shopEventEmitter = new ShopEventEmitter();

export function ShopProvider({ children }: { children: ReactNode }) {
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 로컬 스토리지에서 상점 정보 로드
  const loadFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(SHOP_STORAGE_KEY);
      if (stored) {
        const shop = JSON.parse(stored);
        setSelectedShop(shop);
      }
    } catch (error) {
      console.error('상점 정보 로드 실패:', error);
    }
  };

  // 로컬 스토리지에 상점 정보 저장
  const saveToStorage = async (shop: Shop | null) => {
    try {
      if (shop) {
        await AsyncStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(shop));
      } else {
        await AsyncStorage.removeItem(SHOP_STORAGE_KEY);
      }
    } catch (error) {
      console.error('상점 정보 저장 실패:', error);
    }
  };

  const loadSelectedShop = async () => {
    if (loading) return; // 이미 로딩 중이면 중복 호출 방지
    
    setLoading(true);
    setError(null);
    try {
      const shop = await shopApiService.getSelected();
      setSelectedShop(shop);
      await saveToStorage(shop);
    } catch (error: any) {
      console.log('선택된 상점이 없음:', error);
      setSelectedShop(null);
      await saveToStorage(null);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectShop = async (shopId: number) => {
    setLoading(true);
    setError(null);
    try {
      await shopApiService.select(shopId);
      // 선택 후 최신 정보 로드
      await loadSelectedShop();
      // 이벤트 발생 (최신 상점 정보와 함께)
      shopEventEmitter.emit('shopChanged', selectedShop);
    } catch (error: any) {
      console.error('상점 선택 실패:', error);
      setError(error.message);
      setLoading(false);
      throw error;
    }
  };

  const refreshShop = async () => {
    await loadSelectedShop();
  };

  const clearSelectedShop = () => {
    console.log('🏪 상점 정보 정리 시작');
    setSelectedShop(null);
    saveToStorage(null);
    setError(null);
    console.log('✅ 상점 정보 정리 완료');
  };

  // 초기 로드
  useEffect(() => {
    // 로컬스토리지에서만 읽어오고, 서버 검증은 하지 않음
    loadFromStorage();
  }, []);

  // 로그아웃 시 상점 정보 정리 이벤트 감지
  useEffect(() => {
    const handleClearShop = () => {
      console.log('🏪 로그아웃으로 인한 상점 정보 정리');
      clearSelectedShop();
    };

    shopEventEmitter.on('clearShop', handleClearShop);

    return () => {
      shopEventEmitter.off('clearShop', handleClearShop);
    };
  }, []);

  const value: ShopContextType = {
    selectedShop,
    loading,
    error,
    loadSelectedShop,
    selectShop,
    refreshShop,
    clearSelectedShop,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}
