import { ThemedView } from '@/components/ThemedView';
import InviteSignupForm from '@/components/forms/InviteSignupForm';
import LoginForm from '@/components/forms/LoginForm';
import { inviteApiService } from '@/src/api/services/invite';
import { useAuthStore } from '@/src/stores/authStore';
import { useShopStore } from '@/src/stores/shopStore';
import { LoginCredentials } from '@/src/types';
import { Colors } from '@/src/ui/theme';
import { Redirect } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

export default React.memo(function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  // REQ-PERF-003-08: 필드 셀렉터 구독(다중 필드는 useShallow).
  const { login, isAuthenticated, isLoading: authLoading } = useAuthStore(
    useShallow((s) => ({ login: s.login, isAuthenticated: s.isAuthenticated, isLoading: s.isLoading })),
  );
  const loadSelectedShop = useShopStore((s) => s.loadSelectedShop);

  // 인증 상태 로딩 중
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
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
      console.log('🔴 LoginScreen: Zustand login 호출 직전');
      await login(credentials.email, credentials.password);
      console.log('🔴 LoginScreen: Zustand login 완료');
      
      // 로그인 성공 후 상점 정보 로드
      await loadSelectedShop();
      console.log('✅ 로그인 성공');
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

  const handleSignup = async (credentials: {
    inviteCode: string;
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    phone: string;
  }) => {
    try {
      setLoading(true);
      console.log('🔴 LoginScreen: 초대 코드 회원가입 시작:', credentials.inviteCode);
      
      // 초대 코드로 회원가입
      await inviteApiService.signupWithInviteCode({
        invite_code: credentials.inviteCode,
        email: credentials.email,
        password: credentials.password,
        name: credentials.name,
        phone_number: credentials.phone
      });

      Alert.alert(
        '회원가입 완료',
        '회원가입이 완료되었습니다. 로그인해주세요.',
        [{ 
          text: '확인', 
          onPress: () => setMode('login')
        }]
      );
    } catch (error: any) {
      console.error('🔴 LoginScreen: 회원가입 에러:', error);
      throw error; // InviteSignupForm에서 처리하도록 다시 throw
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {mode === 'login' ? (
        <LoginForm 
          onLogin={handleLogin} 
          loading={loading}
          onSwitchToSignup={() => setMode('signup')}
        />
      ) : (
        <InviteSignupForm
          onSignup={handleSignup}
          onBackToLogin={() => setMode('login')}
          loading={loading}
        />
      )}
    </ThemedView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
  },
});
