import { ThemedView } from '@/components/ThemedView';
import LoginForm from '@/components/forms/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { LoginCredentials } from '@/types';
import React, { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      await login(credentials);
      // 로그인 성공 시 자동으로 홈 화면으로 이동 (AuthContext에서 처리)
    } catch (error) {
      Alert.alert(
        '로그인 실패',
        '이메일 또는 비밀번호가 올바르지 않습니다.',
        [{ text: '확인' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <LoginForm onLogin={handleLogin} loading={loading} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});
