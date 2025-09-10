import LoginScreen from '@/app/login';
import { useAuthStore } from '@/stores/authContext';
import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const AuthNavigator: React.FC = React.memo(() => {
  const { isAuthenticated, loading, clearAuth } = useAuthStore();

  // 401 에러나 인증 상태 불일치 감지 시 정리
  useEffect(() => {
    const checkAuthStatus = async () => {
      // 로딩이 끝났는데 인증되지 않은 상태라면 인증 정보 완전 삭제
      if (!loading && !isAuthenticated) {
        try {
          await clearAuth();
        } catch (error) {
          console.error('Auth cleanup error:', error);
        }
      }
    };

    checkAuthStatus();
  }, [loading, isAuthenticated, clearAuth]);

  // 로딩 중일 때 로딩 화면 표시
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
      <Stack.Screen name="shop-selection" />
    </Stack>
  );
});

AuthNavigator.displayName = 'AuthNavigator';

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});

export default AuthNavigator;
