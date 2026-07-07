import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { authApiService } from '../api/services/auth';
import type { User } from '../types/auth';

// @MX:ANCHOR: [AUTO] Zustand persist용 하이브리드 저장 어댑터. 민감정보(accessToken)는
//   expo-secure-store(OS 암호화 저장소), 비민감 UI 상태(user 등)는 AsyncStorage로 분리한다.
// @MX:REASON: fan_in>=1이며 SPEC-SECURITY-001 REQ-SEC-005의 핵심 계약(평문 저장 금지)을 보증하는
//   유일한 저장 경계. 이 계약이 깨지면 액세스 토큰이 평문 AsyncStorage에 재노출된다.
// @MX:SPEC: SPEC-SECURITY-001 (REQ-SEC-005, AC-005-1)
//
// SecureStore는 항목당 ~2KB 크기 제한이 있으므로 토큰(들)만 저장한다.
// SecureStore 키는 영숫자/./-/_만 허용하므로 persist 키의 '-'는 유지되나 안전한 상수를 사용한다.
const SECURE_ACCESS_TOKEN_KEY = 'auth_access_token';

// persist가 저장하는 JSON 문자열에서 accessToken만 분리하여 SecureStore로, 나머지는 AsyncStorage로 보낸다.
const secureHybridStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const nonSensitive = await AsyncStorage.getItem(name);
      let secureToken: string | null = null;
      try {
        secureToken = await SecureStore.getItemAsync(SECURE_ACCESS_TOKEN_KEY);
      } catch (secureError) {
        // SecureStore 읽기 실패 시 안전하게 미인증 상태로 폴백 (크래시 없음)
        console.warn('SecureStore 토큰 읽기 실패 - 미인증 상태로 폴백');
        secureToken = null;
      }

      if (!nonSensitive) {
        // 비민감 상태가 없으면 복원할 것이 없음
        return null;
      }

      // AsyncStorage에는 accessToken이 저장되지 않으므로 SecureStore 값으로 병합해 돌려준다.
      const parsed = JSON.parse(nonSensitive);
      const merged = {
        ...parsed,
        state: {
          ...parsed.state,
          accessToken: secureToken,
        },
      };
      return JSON.stringify(merged);
    } catch (error) {
      console.warn('인증 상태 복원 실패 - 미인증 상태로 폴백');
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const parsed = JSON.parse(value);
      const accessToken: string | null = parsed?.state?.accessToken ?? null;

      // 민감정보(accessToken)는 AsyncStorage 페이로드에서 제거하고 SecureStore로만 저장한다.
      const sanitized = {
        ...parsed,
        state: {
          ...parsed.state,
          accessToken: null,
        },
      };
      await AsyncStorage.setItem(name, JSON.stringify(sanitized));

      try {
        if (accessToken) {
          await SecureStore.setItemAsync(SECURE_ACCESS_TOKEN_KEY, accessToken);
        } else {
          // 토큰이 없으면(로그아웃/clearAuth) SecureStore에서도 제거한다.
          await SecureStore.deleteItemAsync(SECURE_ACCESS_TOKEN_KEY);
        }
      } catch (secureError) {
        console.warn('SecureStore 토큰 저장 실패');
      }
    } catch (error) {
      console.warn('인증 상태 저장 실패');
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      // 무시
    }
    try {
      await SecureStore.deleteItemAsync(SECURE_ACCESS_TOKEN_KEY);
    } catch {
      // 무시
    }
  },
};

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
          
          // Zustand 스토어에 토큰 저장 (persist가 자동으로 AsyncStorage에 저장)
          setAccessToken(loginResponse.access_token);
          console.log('✅ 토큰 Zustand persist에 저장 완료');

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
          // Zustand persist가 자동으로 AsyncStorage 정리
          clearAuth();
          setLoading(false);
          console.log('✅ 로그아웃 완료 (Zustand persist가 자동 정리)');
        }
      },

      // 사용자 정보 로드 (앱 시작시)
      loadUser: async () => {
        const { setLoading, setUser, setError, accessToken } = get();
        
        try {
          setLoading(true);
          setError(null);

          // Zustand persist에서 토큰 확인
          if (!accessToken) {
            if (__DEV__) console.log('저장된 토큰이 없습니다.');
            return;
          }

          // 사용자 정보 조회
          const user = await authApiService.getMe();
          setUser(user);

          if (__DEV__) console.log('✅ 사용자 정보 로드 성공');
        } catch (error: any) {
          console.error('❌ 사용자 정보 로드 실패:', error);
          // 토큰이 유효하지 않으면 Zustand에서 정리
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
      name: 'auth-storage', // 비민감 상태용 AsyncStorage 키 (accessToken은 SecureStore로 분리됨)
      // 하이브리드 저장소: accessToken은 expo-secure-store(암호화), 나머지는 AsyncStorage.
      // SPEC-SECURITY-001 REQ-SEC-005: 평문 AsyncStorage에 액세스 토큰을 저장하지 않는다.
      storage: createJSONStorage(() => secureHybridStorage),
      // accessToken은 partialize에 포함되지만 저장 어댑터가 SecureStore로 라우팅한다.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
      }),
    }
  )
);
