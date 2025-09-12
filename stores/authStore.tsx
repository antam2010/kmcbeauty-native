import type { User } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: User | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => Promise<void>;
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

  const login = async (token: string, user: User) => {
    const newState = {
      isAuthenticated: true,
      accessToken: token,
      user,
      loading: false,
    };
    setAuthState(newState);
    await saveAuthToStorage(newState);
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
