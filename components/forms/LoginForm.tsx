import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button, Card, TextInput as CustomTextInput } from '@/src/ui/atoms';
import { Colors, Spacing, Typography } from '@/src/ui/theme';
import { LoginCredentials } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity
} from 'react-native';

interface LoginFormProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  onSwitchToSignup?: () => void;
  loading?: boolean;
}

export default function LoginForm({ onLogin, onSwitchToSignup, loading = false }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);

  // 컴포넌트 마운트 시 저장된 이메일 로드
  useEffect(() => {
    loadSavedEmail();
  }, []);

  const loadSavedEmail = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('remembered-email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberEmail(true);
      }
    } catch (error) {
      console.error('저장된 이메일 로드 실패:', error);
    }
  };

  const saveEmailIfNeeded = async () => {
    try {
      if (rememberEmail && email.trim()) {
        await AsyncStorage.setItem('remembered-email', email.trim());
      } else {
        await AsyncStorage.removeItem('remembered-email');
      }
    } catch (error) {
      console.error('이메일 저장 실패:', error);
    }
  };

  const handleLogin = async () => {
    console.log('🔵 LoginForm: 로그인 버튼 클릭됨');
    
    if (!email.trim() || !password.trim()) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('알림', '올바른 이메일 형식을 입력해주세요.');
      return;
    }

    try {
      console.log('🔵 LoginForm: onLogin 호출 시작', { email: email.trim() });
      
      // 이메일 저장 (로그인 시도 전에)
      await saveEmailIfNeeded();
      
      await onLogin({ email: email.trim(), password });
      console.log('🔵 LoginForm: onLogin 완료');
    } catch (error: any) {
      console.error('🔴 LoginForm: 로그인 에러:', error);
      Alert.alert(
        '로그인 실패',
        error.message || '로그인 중 오류가 발생했습니다.',
        [{ text: '확인' }]
      );
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleDemoLogin = () => {
    Alert.alert(
      '데모 계정 안내',
      '테스트를 위한 데모 계정을 사용하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '데모 로그인', 
          onPress: () => {
            setEmail('antam2010@naver.com');
            setPassword('1111');
            console.log('🔵 데모 계정 설정됨');
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.formContainer}>
          {/* 로고 섹션 */}
          <ThemedView style={styles.logoSection}>
            <ThemedText style={styles.logo}>로고</ThemedText>
            <ThemedText type="title" style={styles.title}>
              KMC Beauty
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              뷰티 관리 시스템에 로그인하세요
            </ThemedText>
          </ThemedView>

          {/* 입력 폼 */}
          <ThemedView style={styles.inputSection}>
            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>이메일</ThemedText>
              <CustomTextInput
                value={email}
                onChangeText={setEmail}
                placeholder="이메일을 입력하세요"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>비밀번호</ThemedText>
              <ThemedView style={styles.passwordContainer}>
                <CustomTextInput
                  style={[styles.textInput, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="비밀번호를 입력하세요"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <ThemedText style={styles.passwordToggleText}>
                    {showPassword ? '숨김' : '보기'}
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>

            {/* 아이디 기억하기 체크박스 */}
            <ThemedView style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setRememberEmail(!rememberEmail)}
                disabled={loading}
              >
                <ThemedView style={[
                  styles.checkboxBox,
                  rememberEmail && styles.checkboxBoxChecked
                ]}>
                  {rememberEmail && (
                    <ThemedText style={styles.checkboxCheck}>✓</ThemedText>
                  )}
                </ThemedView>
                <ThemedText style={styles.checkboxLabel}>
                  아이디 기억하기
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>

          {/* 버튼 섹션 */}
          <ThemedView style={styles.buttonSection}>
            <Button
              title={loading ? '로그인 중...' : '로그인'}
              onPress={handleLogin}
              disabled={loading}
              variant="primary"
              size="large"
              style={styles.loginButton}
            />

            <Button
              title="데모 계정으로 로그인"
              onPress={handleDemoLogin}
              disabled={loading}
              variant="secondary"
              size="large"
              style={styles.demoButton}
            />
          </ThemedView>

          {/* 하단 링크 */}
          <ThemedView style={styles.linkSection}>
            <TouchableOpacity>
              <ThemedText style={styles.linkText}>비밀번호를 잊으셨나요?</ThemedText>
            </TouchableOpacity>
            
            {onSwitchToSignup && (
              <TouchableOpacity 
                style={styles.signupLinkContainer}
                onPress={onSwitchToSignup}
              >
                <ThemedText style={styles.signupLinkText}>
                  초대 코드가 있으신가요? 
                  <ThemedText style={styles.signupLinkHighlight}> 회원가입</ThemedText>
                </ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  formContainer: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.md,
    padding: Spacing.xl,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    }),
    elevation: 5,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  logo: {
    fontSize: Typography.fontSize['4xl'],
    marginBottom: Spacing.xs,
  },
  title: {
    marginBottom: Spacing.xs,
    color: Colors.primary,
  },
  subtitle: {
    color: Colors.gray[600],
    textAlign: 'center',
    fontSize: Typography.fontSize.base,
  },
  inputSection: {
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
    color: Colors.gray[900],
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: Spacing.xs,
    padding: Spacing.sm,
    fontSize: Typography.fontSize.base,
    backgroundColor: Colors.white,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 60,
  },
  passwordToggle: {
    position: 'absolute',
    right: Spacing.sm,
    top: Spacing.sm,
    bottom: Spacing.sm,
    justifyContent: 'center',
  },
  passwordToggleText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  buttonSection: {
    marginBottom: Spacing.md,
  },
  loginButton: {
    marginBottom: Spacing.sm,
  },
  demoButton: {
    // 스타일은 Button 컴포넌트에서 관리
  },
  linkSection: {
    alignItems: 'center',
  },
  linkText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
  },
  signupLinkContainer: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  signupLinkText: {
    color: Colors.gray[600],
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
  signupLinkHighlight: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  checkboxContainer: {
    marginTop: Spacing.md,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    borderRadius: Spacing.xs / 2,
    marginRight: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxBoxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxCheck: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  checkboxLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
});
