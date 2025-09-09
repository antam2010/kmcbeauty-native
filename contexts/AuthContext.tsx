import { authService } from '@/services/api/auth';
import { AuthState, LoginCredentials, User } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useReducer } from 'react';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isAuthenticated: false };
    case 'LOGIN_SUCCESS':
      return {
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
      };
    case 'LOGIN_FAILURE':
      return { ...state, isAuthenticated: false, user: null, token: null };
    case 'LOGOUT':
      return { ...state, isAuthenticated: false, user: null, token: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        // 토큰이 있으면 사용자 정보 조회
        try {
          const user = await authService.getCurrentUser();
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
        } catch (error) {
          // 토큰이 유효하지 않은 경우
          await AsyncStorage.removeItem('authToken');
          dispatch({ type: 'LOGIN_FAILURE' });
        }
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      dispatch({ type: 'LOGIN_FAILURE' });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      // 실제 API 호출 대신 목업 로그인 처리
      if (credentials.email === 'admin@kmcbeauty.com' && credentials.password === 'demo123') {
        const mockUser: User = {
          id: '1',
          name: '김관리자',
          email: 'admin@kmcbeauty.com',
          phone: '010-1234-5678',
          role: 'admin',
          joinDate: '2024-01-15',
        };
        const token = 'mock-jwt-token';
        
        await AsyncStorage.setItem('authToken', token);
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: mockUser, token } });
      } else {
        throw new Error('Invalid credentials');
      }
      
      // 실제 API 사용 시:
      // const response = await authService.login(credentials);
      // await AsyncStorage.setItem('authToken', response.token);
      // dispatch({ type: 'LOGIN_SUCCESS', payload: response });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      // await authService.logout(); // 실제 API 호출 시
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout failed:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
