import LoginScreen from '@/app/login';
import { useAuthStore } from '@/src/stores/authStore';
import { Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

const AuthNavigator: React.FC = React.memo(() => {
  // REQ-PERF-003-08: 다중 필드 셀렉터 구독(useShallow).
  const { isAuthenticated, isLoading } = useAuthStore(
    useShallow((s) => ({ isAuthenticated: s.isAuthenticated, isLoading: s.isLoading })),
  );

  console.log('🔐 AuthNavigator - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  // 로딩 중일 때 로딩 화면 표시
  if (isLoading) {
    console.log('⏳ AuthNavigator - 로딩 중');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!isAuthenticated) {
    console.log('🚫 AuthNavigator - 인증되지 않음, 로그인 화면 표시');
    return <LoginScreen />;
  }

  console.log('✅ AuthNavigator - 인증됨, 메인 앱 표시');
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
