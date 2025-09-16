// 401 에러 및 인증 디버깅 유틸리티
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authDebugUtils = {
  // 현재 인증 상태 확인
  async checkAuthState(): Promise<void> {
    try {
      console.log('🔍 === 인증 상태 디버깅 시작 ===');
      
      // 1. AsyncStorage에서 인증 정보 확인
      const authData = await AsyncStorage.getItem('auth-storage');
      if (authData) {
        const parsed = JSON.parse(authData);
        console.log('📱 로컬 인증 정보:', {
          isAuthenticated: parsed.isAuthenticated,
          hasAccessToken: !!parsed.accessToken,
          accessTokenLength: parsed.accessToken?.length || 0,
          user: parsed.user?.email || 'N/A'
        });
      } else {
        console.log('📱 로컬 인증 정보: 없음');
      }
      
      // 2. 상점 정보 확인
      const shopData = await AsyncStorage.getItem('selectedShop');
      if (shopData) {
        const parsed = JSON.parse(shopData);
        console.log('🏪 선택된 상점:', {
          id: parsed.id,
          name: parsed.name
        });
      } else {
        console.log('🏪 선택된 상점: 없음');
      }
      
      // 3. 모든 저장된 키 확인
      const allKeys = await AsyncStorage.getAllKeys();
      const authRelatedKeys = allKeys.filter(key => 
        key.includes('auth') || 
        key.includes('token') || 
        key.includes('shop') ||
        key.includes('user')
      );
      console.log('🔑 인증 관련 저장된 키들:', authRelatedKeys);
      
      console.log('🔍 === 인증 상태 디버깅 완료 ===');
    } catch (error) {
      console.error('❌ 인증 상태 확인 실패:', error);
    }
  },

  // 모든 인증 관련 데이터 삭제 (강제 초기화)
  async forceReset(): Promise<void> {
    try {
      console.log('🔥 강제 인증 리셋 시작');
      
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter(key => 
        key !== 'remembered-email' && // 아이디 기억하기는 유지
        !key.startsWith('system-') // 시스템 설정은 유지
      );
      
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        console.log('🔥 삭제된 키들:', keysToRemove);
      }
      
      console.log('✅ 강제 인증 리셋 완료');
    } catch (error) {
      console.error('❌ 강제 리셋 실패:', error);
    }
  },

  // API 요청 시뮬레이션 (401 에러 테스트용)
  async testAuthenticatedRequest(): Promise<void> {
    try {
      console.log('🧪 인증 요청 테스트 시작');
      
      const { authApiService } = await import('../api/services/auth');
      
      // /auth/me 엔드포인트 호출하여 현재 토큰 상태 확인
      const user = await authApiService.getMe();
      console.log('✅ 인증 요청 성공:', user.email);
      
    } catch (error: any) {
      console.error('❌ 인증 요청 실패:', {
        status: error.response?.status,
        message: error.message,
        detail: error.response?.data
      });
      
      if (error.response?.status === 401) {
        console.log('🔐 401 에러 발생 - 토큰 만료 확인됨');
      }
    }
  }
};

// 개발 환경에서만 글로벌 객체에 등록
if (__DEV__) {
  (global as any).authDebug = authDebugUtils;
  console.log('🛠️ authDebug 유틸리티 등록됨 (global.authDebug로 접근 가능)');
}
