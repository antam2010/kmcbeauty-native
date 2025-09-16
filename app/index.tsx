import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/stores/authContextNew';

// 개발 환경에서 디버깅 유틸리티 로드
if (__DEV__) {
  import('@/src/utils/authDebug');
}

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  // 개발 환경에서 인증 상태 로깅
  useEffect(() => {
    if (__DEV__) {
      console.log('🏠 Index 화면 - 인증 상태:', {
        isAuthenticated,
        isLoading,
        timestamp: new Date().toISOString()
      });
    }
  }, [isAuthenticated, isLoading]);

  // 인증 상태 로딩 중
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // 인증 상태에 따라 적절한 화면으로 리다이렉트
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/login" />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});
