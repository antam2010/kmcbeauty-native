import { authApiService } from '@/src/api/services/auth';
import type { Shop } from '@/src/api/services/shop';
import { userDataService, type UserData } from '@/src/services/storage/userDataService';
import type { LoginCredentials, LoginResponse } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: UserData | null;
  selectedShop: Shop | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateSelectedShop: (shop: Shop) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'auth_token';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // 토큰 저장
  const saveToken = async (token: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch (error) {
      console.error('토큰 저장 실패:', error);
    }
  };

  // 토큰 불러오기
  const getToken = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    } catch (error) {
      console.error('토큰 불러오기 실패:', error);
      return null;
    }
  };

  // 토큰 삭제
  const removeToken = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (error) {
      console.error('토큰 삭제 실패:', error);
    }
  };

  // 로그인
  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      
      // API 로그인 요청
      const response: LoginResponse = await authApiService.login(credentials);
      
      // 토큰 저장
      await saveToken(response.access_token);
      
      // 사용자 정보 가져오기 및 저장
      const userData = await userDataService.fetchAndSaveUserData();
      if (userData) {
        setUser(userData);
      }

      // 선택된 상점 정보 가져오기 및 저장 (있다면)
      try {
        const shopData = await userDataService.fetchAndSaveSelectedShop();
        if (shopData) {
          setSelectedShop(shopData);
        }
      } catch (error) {
        // 선택된 상점이 없을 수 있음 (최초 로그인시)
        console.log('선택된 상점 없음:', error);
      }

      console.log('✅ 로그인 성공');
    } catch (error) {
      console.error('로그인 실패:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 로그아웃
  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // API 로그아웃 요청
      try {
        await authApiService.logout();
      } catch (error) {
        // 로그아웃 API 실패해도 로컬 데이터는 정리
        console.error('API 로그아웃 실패:', error);
      }

      // 로컬 데이터 정리
      await Promise.all([
        removeToken(),
        userDataService.clearAllData(),
      ]);

      // 상태 초기화
      setUser(null);
      setSelectedShop(null);

      console.log('✅ 로그아웃 완료');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 사용자 정보 새로고침
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const userData = await userDataService.fetchAndSaveUserData();
      if (userData) {
        setUser(userData);
      }

      const shopData = await userDataService.fetchAndSaveSelectedShop();
      if (shopData) {
        setSelectedShop(shopData);
      }
    } catch (error) {
      console.error('사용자 정보 새로고침 실패:', error);
    }
  }, []);

  // 선택된 상점 업데이트
  const updateSelectedShop = useCallback((shop: Shop) => {
    setSelectedShop(shop);
    userDataService.saveSelectedShop(shop);
  }, []);

  // 앱 시작시 저장된 데이터 복원
  useEffect(() => {
    const restoreAuthData = async () => {
      try {
        setIsLoading(true);

        // 토큰 확인
        const token = await getToken();
        if (!token) {
          setIsLoading(false);
          return;
        }

        // 저장된 사용자 데이터 복원
        const { user: savedUser, shop: savedShop } = await userDataService.restoreData();
        
        if (savedUser) {
          setUser(savedUser);
        }
        
        if (savedShop) {
          setSelectedShop(savedShop);
        }

        // API에서 최신 정보 가져오기 (백그라운드에서)
        try {
          await refreshUser();
        } catch (error) {
          // 토큰이 만료되었을 수 있음
          console.error('사용자 정보 갱신 실패:', error);
          await logout();
        }
      } catch (error) {
        console.error('인증 데이터 복원 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreAuthData();
  }, [logout, refreshUser]);

  const value: AuthContextType = {
    user,
    selectedShop,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
    updateSelectedShop,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내에서 사용해야 합니다');
  }
  return context;
}