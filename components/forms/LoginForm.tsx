import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { LoginCredentials } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity
} from 'react-native';

interface LoginFormProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  loading?: boolean;
}

export default function LoginForm({ onLogin, loading = false }: LoginFormProps) {
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
        <ThemedView style={styles.formContainer}>
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
              <TextInput
                style={styles.textInput}
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
                <TextInput
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
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <ThemedText style={styles.loginButtonText}>
                {loading ? '로그인 중...' : '로그인'}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleDemoLogin}
              disabled={loading}
            >
              <ThemedText style={styles.demoButtonText}>
                데모 계정으로 로그인
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {/* 하단 링크 */}
          <ThemedView style={styles.linkSection}>
            <TouchableOpacity>
              <ThemedText style={styles.linkText}>비밀번호를 잊으셨나요?</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    }),
    elevation: 5,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    marginBottom: 8,
    color: '#007AFF',
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 60,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 12,
    bottom: 12,
    justifyContent: 'center',
  },
  passwordToggleText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonSection: {
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  demoButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  demoButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkSection: {
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
  checkboxContainer: {
    marginTop: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxBoxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxCheck: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#666',
  },
});
