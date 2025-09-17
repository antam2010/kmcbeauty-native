import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { authApiService } from '../api/services/auth';
import type { User } from '../types/auth';

interface AuthState {
  // 상태
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;

  // 액션
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAccessToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      accessToken: null,

      // 상태 설정 액션
      setUser: (user) => {
        set({ 
          user, 
          isAuthenticated: !!user,
          error: null
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      setAccessToken: (accessToken) => set({ accessToken }),

      // 로그인
      login: async (email: string, password: string) => {
        const { setLoading, setUser, setError, setAccessToken } = get();
        
        try {
          setLoading(true);
          setError(null);

          // API 로그인 호출
          const loginResponse = await authApiService.login({ email, password });
          
          // 즉시 사용 가능하도록 임시 토큰 설정
          const { setTemporaryToken } = await import('../api/client');
          setTemporaryToken(loginResponse.access_token);
          
          // Zustand 스토어에 토큰 저장 (persist로 AsyncStorage에 자동 저장됨)
          setAccessToken(loginResponse.access_token);
          
          // 토큰 저장 (AsyncStorage) - 백그라운드에서 진행 (호환성용)
          AsyncStorage.setItem('auth-storage', JSON.stringify({
            accessToken: loginResponse.access_token,
            tokenType: loginResponse.token_type,
          })).then(() => {
            console.log('✅ 토큰 AsyncStorage 저장 완료');
            // 즉시 임시 토큰 제거 (Zustand persist가 이미 작동 중)
            setTemporaryToken(null);
            console.log('🔑 임시 토큰 즉시 제거 (Zustand persist로 전환)');
          }).catch((error) => {
            console.error('❌ 토큰 AsyncStorage 저장 실패:', error);
            // 실패해도 즉시 임시 토큰 제거 (Zustand persist가 작동할 것)
            setTemporaryToken(null);
            console.log('🔑 임시 토큰 에러 후 즉시 제거 (Zustand persist로 전환)');
          });

          // 사용자 정보 조회
          const user = await authApiService.getMe();
          setUser(user);

          console.log('✅ 로그인 성공');
        } catch (error: any) {
          console.error('❌ 로그인 실패:', error);
          setError(error.message || '로그인에 실패했습니다.');
          throw error;
        } finally {
          setLoading(false);
        }
      },

      // 로그아웃
      logout: async () => {
        const { setLoading, clearAuth } = get();
        
        try {
          setLoading(true);
          
          // API 로그아웃 호출
          await authApiService.logout();
        } catch (error) {
          console.error('로그아웃 API 호출 실패:', error);
          // API 실패해도 로컬 정리는 진행
        } finally {
          // 로컬 데이터 정리
          await AsyncStorage.removeItem('auth-storage');
          clearAuth();
          setLoading(false);
          console.log('✅ 로그아웃 완료');
        }
      },

      // 사용자 정보 로드 (앱 시작시)
      loadUser: async () => {
        const { setLoading, setUser, setError } = get();
        
        try {
          setLoading(true);
          setError(null);

          // 저장된 토큰 확인
          const authData = await AsyncStorage.getItem('auth-storage');
          if (!authData) {
            console.log('저장된 인증 정보가 없습니다.');
            return;
          }

          // 사용자 정보 조회
          const user = await authApiService.getMe();
          setUser(user);

          console.log('✅ 사용자 정보 로드 성공');
        } catch (error: any) {
          console.error('❌ 사용자 정보 로드 실패:', error);
          // 토큰이 유효하지 않으면 정리
          await AsyncStorage.removeItem('auth-storage');
          setError(error.message || '인증이 만료되었습니다.');
        } finally {
          setLoading(false);
        }
      },

      // 인증 상태 완전 정리
      clearAuth: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          accessToken: null,
        });
      },
    }),
    {
      name: 'auth-storage', // AsyncStorage 키
      storage: createJSONStorage(() => AsyncStorage),
      // 필요한 인증 정보만 저장 (accessToken 포함)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
      }),
    }
  )
);
