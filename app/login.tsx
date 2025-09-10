import { ThemedView } from '@/components/ThemedView';
import LoginForm from '@/components/forms/LoginForm';
import { useAuthStore } from '@/stores/authContext';
import { LoginCredentials } from '@/types';
import React, { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

export default React.memo(function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      console.log('🔴 LoginScreen.handleLogin 호출됨 - 시작:', credentials.email);
      setLoading(true);
      console.log('🔴 LoginScreen: AuthContext.login 호출 직전');
      await login(credentials);
      console.log('🔴 LoginScreen: AuthContext.login 완료');
      // 로그인 성공 시 자동으로 홈 화면으로 이동 (AuthContext에서 처리)
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
});
