import { tokenManager } from '@/src/api';
import { authAPI, LoginCredentials, User } from '@/src/features/auth/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: User | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => Promise<void>;
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

  // 앱 시작시 저장된 인증 정보 로드
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔍 저장된 인증 정보 확인 중...');
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
      
      // 토큰 저장
      await tokenManager.saveToken(response.access_token);
      
      console.log('🟡 로그인 성공, 상태 업데이트 중');
      
      const newState = {
        isAuthenticated: true,
        accessToken: response.access_token,
        user: response.user,
        loading: false,
      };
      
      setAuthState(newState);
      await saveAuthToStorage(newState);
      
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
      
      // AsyncStorage에서 완전 삭제
      await tokenManager.removeTokens();
      
      // 로그인 화면으로 이동
      router.replace('/login');
      
      console.log('✅ 로그아웃 완료');
    } catch (error) {
      console.error('로그아웃 처리 중 오류:', error);
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

  const contextValue: AuthContextType = useMemo(() => ({
    ...authState,
    login,
    logout,
    setUser,
    setLoading,
    clearAuth,
  }), [authState, login, logout, setUser, setLoading, clearAuth]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
