import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// 통합 타입 시스템에서 가져오기
import { authAPI, LoginCredentials } from '@/src/features/auth/api';
import type { AuthState, User } from '@/src/types';
import { shopEventEmitter } from './shopStore';

// 간단한 토큰 관리자
const tokenManager = {
  async saveTokens(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      // auth-storage에 액세스 토큰 저장 (기존 방식 유지)
      const authData = await AsyncStorage.getItem('auth-storage');
      const existingData = authData ? JSON.parse(authData) : {};
      
      const updatedData = {
        ...existingData,
        accessToken,
        // 리프레시 토큰은 쿠키로 관리하므로 저장하지 않음
      };
      
      await AsyncStorage.setItem('auth-storage', JSON.stringify(updatedData));
      console.log('✅ 토큰 저장 완료');
    } catch (error) {
      console.error('토큰 저장 실패:', error);
    }
  },

  async removeTokens(): Promise<void> {
    try {
      // 인증 관련 모든 데이터 삭제
      const keysToRemove = [
        'auth-storage',
        'auth-token',
        'refresh-token',
        'selectedShop', // 상점 정보도 삭제
        'user-preferences' // 사용자 설정도 삭제 (필요시)
      ];
      
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('✅ 모든 인증 관련 데이터 삭제 완료');
    } catch (error) {
      console.error('토큰 삭제 실패:', error);
    }
  },

  async clearAllUserData(): Promise<void> {
    try {
      // 사용자 관련 모든 데이터 삭제 (아이디 기억하기 제외)
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter(key => 
        key !== 'remembered-email' && // 아이디 기억하기는 유지
        !key.startsWith('system-') // 시스템 설정은 유지
      );
      
      // 확실하게 selectedShop도 포함
      if (!keysToRemove.includes('selectedShop')) {
        keysToRemove.push('selectedShop');
      }
      
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        console.log('✅ 사용자 데이터 정리 완료:', keysToRemove);
      }
    } catch (error) {
      console.error('사용자 데이터 정리 실패:', error);
    }
  }
};

// 로컬 AuthState 대신 통합 타입 사용 (src/types/auth.ts)
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => Promise<void>;
  refreshUserData: () => Promise<void>; // 사용자 데이터 새로고침
  clearCachedData: () => Promise<void>; // 캐시된 데이터만 정리
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    accessToken: null,
    user: null,
    loading: true,
  });

  const [isProviderReady, setIsProviderReady] = useState(false);

  // 앱 시작시 저장된 인증 정보 로드
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔍 저장된 인증 정보 확인 중...');
        
        // 약간의 지연을 통해 Android에서 초기화 순서 문제 해결
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const storedData = await AsyncStorage.getItem('auth-storage');
        
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          console.log('✅ 저장된 인증 정보 발견');
          
          setAuthState({
            isAuthenticated: parsedData.isAuthenticated || false,
            accessToken: parsedData.accessToken || null,
            user: parsedData.user || null,
            loading: false,
          });
        } else {
          console.log('📝 저장된 인증 정보 없음');
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('❌ 인증 정보 로드 실패:', error);
        setAuthState(prev => ({ ...prev, loading: false }));
      } finally {
        setIsProviderReady(true);
      }
    };

    initializeAuth();
  }, []);

  const saveAuthToStorage = async (data: Partial<AuthState>) => {
    try {
      const dataToSave = {
        isAuthenticated: data.isAuthenticated,
        accessToken: data.accessToken,
        user: data.user,
      };
      await AsyncStorage.setItem('auth-storage', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('인증 정보 저장 실패:', error);
    }
  };

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      console.log('🟡 로그인 시작:', credentials.email);
      setAuthState(prev => ({ ...prev, loading: true }));
      
      // 실제 API 호출
      const response = await authAPI.login(credentials);
      
      // 액세스 토큰과 리프레시 토큰 저장
      await tokenManager.saveTokens(response.access_token, response.refresh_token);
      
      console.log('🟡 로그인 성공, 상태 업데이트 중');
      
      const newState = {
        isAuthenticated: true,
        accessToken: response.access_token,
        user: response.user,
        loading: false,
      };
      
      setAuthState(newState);
      await saveAuthToStorage(newState);
      
      // 로그인 성공 후 상점 로딩 트리거
      setTimeout(() => {
        shopEventEmitter.emit('loginSuccess');
      }, 100);
      
      console.log('✅ 로그인 완료');
      
    } catch (error: any) {
      console.error('❌ 로그인 실패:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('🚪 로그아웃 시작');
      
      // 서버에 로그아웃 알림
      try {
        await authAPI.logout();
      } catch (error) {
        console.log('서버 로그아웃 알림 실패 (무시):', error);
      }
      
      const newState = {
        isAuthenticated: false,
        accessToken: null,
        user: null,
        loading: false,
      };
      
      setAuthState(newState);
      
      // 모든 사용자 관련 데이터 삭제 (아이디 기억하기 제외)
      await tokenManager.clearAllUserData();
      
      // 상점 정보 정리 이벤트 발생
      shopEventEmitter.emit('clearShop');
      
      console.log('✅ 로그아웃 완료');
      
      // 확실한 로그인 화면 이동
      setTimeout(() => {
        router.replace('/login');
      }, 100);
      
    } catch (error) {
      console.error('로그아웃 처리 중 오류:', error);
      
      // 에러가 발생해도 로그인 화면으로 이동
      setTimeout(() => {
        router.replace('/login');
      }, 100);
    }
  }, []);

  const setUser = useCallback((user: User) => {
    setAuthState(prev => {
      const newState = { ...prev, user };
      saveAuthToStorage(newState).catch(error => {
        console.error('사용자 정보 저장 실패:', error);
      });
      return newState;
    });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setAuthState(prev => ({ ...prev, loading }));
  }, []);

  const clearAuth = useCallback(async () => {
    await logout();
  }, [logout]);

  // 캐시된 데이터만 정리 (인증 정보는 유지)
  const clearCachedData = useCallback(async () => {
    try {
      console.log('🧹 캐시된 데이터 정리 시작');
      
      const allKeys = await AsyncStorage.getAllKeys();
      const cachedDataKeys = allKeys.filter(key => 
        key.startsWith('cache-') || // 캐시 데이터
        key.startsWith('temp-') || // 임시 데이터
        key.includes('dashboard') || // 대시보드 캐시
        key.includes('phonebook') || // 전화번호부 캐시
        (key !== 'auth-storage' && 
         key !== 'remembered-email' && 
         key !== 'selectedShop' &&
         !key.startsWith('system-'))
      );
      
      if (cachedDataKeys.length > 0) {
        await AsyncStorage.multiRemove(cachedDataKeys);
        console.log('✅ 캐시된 데이터 정리 완료:', cachedDataKeys);
      }
    } catch (error) {
      console.error('캐시된 데이터 정리 실패:', error);
    }
  }, []);

  // 사용자 데이터 새로고침 (프로필 업데이트 후 사용)
  const refreshUserData = useCallback(async () => {
    try {
      if (!authState.isAuthenticated) return;
      
      console.log('🔄 사용자 데이터 새로고침 시작');
      // 여기서 서버에서 최신 사용자 정보를 가져올 수 있습니다
      // const updatedUser = await authAPI.getCurrentUser();
      // setUser(updatedUser);
      
      // 캐시된 데이터 정리
      await clearCachedData();
      
      console.log('✅ 사용자 데이터 새로고침 완료');
    } catch (error) {
      console.error('사용자 데이터 새로고침 실패:', error);
    }
  }, [authState.isAuthenticated, clearCachedData]);

  const contextValue: AuthContextType = useMemo(() => ({
    ...authState,
    login,
    logout,
    setUser,
    setLoading,
    clearAuth,
    refreshUserData,
    clearCachedData,
  }), [authState, login, logout, setUser, setLoading, clearAuth, refreshUserData, clearCachedData]);

  // Provider가 준비되지 않았으면 로딩 화면 표시
  if (!isProviderReady) {
    return (
      <AuthContext.Provider value={{
        isAuthenticated: false,
        accessToken: null,
        user: null,
        loading: true,
        login,
        logout,
        setUser,
        setLoading,
        clearAuth,
        refreshUserData,
        clearCachedData,
      }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('❌ useAuth hook called outside of AuthProvider');
    console.error('📍 Make sure AuthProvider wraps your component tree');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 기존 호환성을 위한 alias
export const useAuthStore = useAuth;

// 타입 내보내기 (기존 호환성을 위해)
export type { LoginCredentials, User };

