import { shopApiService, type Shop } from '@/src/api/services/shop';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

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
  const isLoadingRef = useRef(false); // 무한 호출 방지를 위한 ref

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

  const loadSelectedShop = useCallback(async () => {
    if (isLoadingRef.current) {
      console.log('🔄 이미 상점 로딩 중이므로 중복 호출 방지');
      return; // 이미 로딩 중이면 중복 호출 방지
    }
    
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 상점 정보 서버 조회 시작');
      const shop = await shopApiService.getSelected();
      console.log('✅ 상점 정보 조회 성공:', shop?.name);
      setSelectedShop(shop);
      await saveToStorage(shop);
    } catch (error: any) {
      console.log('⚠️ 선택된 상점이 없음:', error.message);
      setSelectedShop(null);
      await saveToStorage(null);
      setError(error.message);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []); // 무한 호출 방지

  const selectShop = useCallback(async (shopId: number) => {
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
  }, [loadSelectedShop, selectedShop]);

  const refreshShop = useCallback(async () => {
    await loadSelectedShop();
  }, [loadSelectedShop]);

  const clearSelectedShop = useCallback(() => {
    console.log('🏪 상점 정보 정리 시작');
    setSelectedShop(null);
    saveToStorage(null);
    setError(null);
    console.log('✅ 상점 정보 정리 완료');
  }, []);

  // 초기 로드
  useEffect(() => {
    let isInitialized = false;
    
    const initializeShop = async () => {
      if (isInitialized) return;
      isInitialized = true;
      
      console.log('🏪 ShopProvider 초기화 시작');
      
      // 먼저 로컬스토리지에서 로드
      await loadFromStorage();
      
      // 서버에서 현재 선택된 상점 확인은 로그인 성공 후에만 수행
      console.log('🏪 초기화 완료 - 로그인 성공 이벤트 대기 중');
    };
    
    initializeShop();
  }, []); // 한 번만 실행

  // 로그아웃 시 상점 정보 정리 이벤트 감지
  useEffect(() => {
    const handleClearShop = () => {
      console.log('🏪 로그아웃으로 인한 상점 정보 정리');
      clearSelectedShop();
    };

    const handleLoginSuccess = () => {
      console.log('🔑 로그인 성공 - 상점 정보 로딩');
      loadSelectedShop().catch(error => {
        console.log('로그인 후 상점 로딩 실패:', error);
      });
    };

    shopEventEmitter.on('clearShop', handleClearShop);
    shopEventEmitter.on('loginSuccess', handleLoginSuccess);

    return () => {
      shopEventEmitter.off('clearShop', handleClearShop);
      shopEventEmitter.off('loginSuccess', handleLoginSuccess);
    };
  }, [clearSelectedShop, loadSelectedShop]);

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
