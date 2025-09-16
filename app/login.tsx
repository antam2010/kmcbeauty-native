import { ThemedView } from '@/components/ThemedView';
import LoginForm from '@/components/forms/LoginForm';
import { LoginCredentials } from '@/src/features/auth/api';
import { useAuth } from '@/stores/authContext';
import { Redirect } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

export default React.memo(function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  // 인증 상태 로딩 중
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // 이미 인증된 경우 메인 화면으로 리다이렉트
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      console.log('🔴 LoginScreen.handleLogin 호출됨 - 시작:', credentials.email);
      setLoading(true);
      console.log('🔴 LoginScreen: AuthContext.login 호출 직전');
      await login(credentials);
      console.log('🔴 LoginScreen: AuthContext.login 완료');
      // 로그인 성공 시 AuthContext에서 자동으로 네비게이션 처리
    } catch (error) {
      console.error('🔴 LoginScreen: 로그인 에러:', error);
      Alert.alert(
        '로그인 실패',
        '이메일 또는 비밀번호가 올바르지 않습니다.',
        [{ text: '확인' }]
      );
    } finally {
      console.log('🔴 LoginScreen: setLoading(false)');
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <LoginForm onLogin={handleLogin} loading={loading} />
    </ThemedView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});
