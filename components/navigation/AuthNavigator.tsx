import LoginScreen from '@/app/login';
import { useAuth } from '@/stores/authContext';
import { Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const AuthNavigator: React.FC = React.memo(() => {
  const { isAuthenticated, loading } = useAuth();

  console.log('🔐 AuthNavigator - isAuthenticated:', isAuthenticated, 'loading:', loading);

  // 로딩 중일 때 로딩 화면 표시
  if (loading) {
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
