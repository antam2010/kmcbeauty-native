import { authService } from '@/services/api/auth';
import { LoginCredentials } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'MASTER' | 'MANAGER';
  role_name: string;
  created_at: string;
  updated_at: string;
}

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
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedData = await AsyncStorage.getItem('auth-storage');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setAuthState({
          isAuthenticated: parsedData.isAuthenticated || false,
          accessToken: parsedData.accessToken || null,
          user: parsedData.user || null,
          loading: false,
        });
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  const saveAuthToStorage = async (data: Partial<AuthState>) => {
    try {
      const dataToSave = {
        isAuthenticated: data.isAuthenticated,
        accessToken: data.accessToken,
        user: data.user,
      };
      await AsyncStorage.setItem('auth-storage', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save auth to storage:', error);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      console.log('🟡 AuthContext.login 호출됨 - 시작:', credentials.email);
      console.log('🟡 AuthContext: setLoading(true) 호출');
      setLoading(true);
      
      console.log('🟡 AuthContext: authService.login 호출 직전');
      const { token, user } = await authService.login(credentials);
      console.log('🟡 AuthContext: authService.login 완료, 결과 받음');
      console.log('🟡 AuthContext: API 로그인 성공, Context에 저장 중');
      
      const newState = {
        isAuthenticated: true,
        accessToken: token.access_token,
        user,
        loading: false,
      };
      console.log('🟡 AuthContext: 새로운 상태 설정');
      setAuthState(newState);
      await saveAuthToStorage(newState);
      console.log('🟡 AuthContext: 로그인 완료');
    } catch (error: any) {
      console.error('🟡 AuthContext: 로그인 실패:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    const newState = {
      isAuthenticated: false,
      accessToken: null,
      user: null,
      loading: false,
    };
    setAuthState(newState);
    await saveAuthToStorage(newState);
  };

  const setUser = (user: User) => {
    setAuthState(prev => {
      const newState = { ...prev, user };
      saveAuthToStorage(newState);
      return newState;
    });
  };

  const setLoading = (loading: boolean) => {
    setAuthState(prev => ({ ...prev, loading }));
  };

  const clearAuth = async () => {
    await logout();
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    setUser,
    setLoading,
    clearAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthStore = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthStore must be used within an AuthProvider');
  }
  return context;
};
