import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuthStore } from '@/src/stores/authStore';
import { useShopStore } from '@/src/stores/shopStore';

// 개발 환경에서 디버깅 유틸리티 로드
if (__DEV__) {
  import('@/src/utils/authDebug');
}

export default function Index() {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { selectedShop, loading: shopLoading, loadSelectedShop } = useShopStore();

  // 인증된 사용자의 경우 상점 정보 로드 (약간의 지연 후)
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      // 토큰이 AsyncStorage에 저장될 시간을 주기 위해 약간 지연
      const timer = setTimeout(() => {
        console.log('🔄 상점 정보 로드 시작 (인증 완료 후)');
        loadSelectedShop();
      }, 100); // 100ms 지연
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, authLoading, loadSelectedShop]);

  // 개발 환경에서 인증 상태 로깅
  useEffect(() => {
    if (__DEV__) {
      console.log('🏠 Index 화면 - 인증 상태:', {
        isAuthenticated,
        isLoading: authLoading,
        timestamp: new Date().toISOString()
      });
    }
  }, [isAuthenticated, authLoading]);

  // 로딩 상태 체크 (인증 또는 상점 정보 로딩 중)
  const isLoading = authLoading || (isAuthenticated && shopLoading);

  // 인증 상태 로딩 중
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // 인증되지 않은 경우 로그인 화면으로
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  // 인증되었지만 상점이 선택되지 않은 경우 상점 선택 화면으로
  if (isAuthenticated && !selectedShop) {
    return <Redirect href="/shop-selection" />;
  }

  // 인증되고 상점도 선택된 경우 메인 화면으로
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});
