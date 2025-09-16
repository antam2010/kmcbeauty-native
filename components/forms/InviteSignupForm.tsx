import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button, Card, TextInput as CustomTextInput } from '@/src/ui/atoms';
import { Colors, Spacing, Typography } from '@/src/ui/theme';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity
} from 'react-native';

interface InviteSignupCredentials {
  inviteCode: string;
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
}

interface InviteSignupFormProps {
  onSignup: (credentials: InviteSignupCredentials) => Promise<void>;
  onBackToLogin: () => void;
  loading?: boolean;
}

export default function InviteSignupForm({ 
  onSignup, 
  onBackToLogin, 
  loading = false 
}: InviteSignupFormProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formatPhoneNumber = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');
    
    // 010-0000-0000 형식으로 포맷팅
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setPhone(formatted);
  };

  const validateForm = () => {
    if (!inviteCode.trim()) {
      Alert.alert('알림', '초대 코드를 입력해주세요.');
      return false;
    }

    if (!name.trim()) {
      Alert.alert('알림', '이름을 입력해주세요.');
      return false;
    }

    if (!email.trim() || !isValidEmail(email)) {
      Alert.alert('알림', '올바른 이메일 형식을 입력해주세요.');
      return false;
    }

    if (!phone.trim() || !isValidPhone(phone)) {
      Alert.alert('알림', '올바른 전화번호를 입력해주세요.');
      return false;
    }

    if (password.length < 4) {
      Alert.alert('알림', '비밀번호는 4자 이상이어야 합니다.');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('알림', '비밀번호가 일치하지 않습니다.');
      return false;
    }

    return true;
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string) => {
    const phoneRegex = /^\d{3}-\d{4}-\d{4}$/;
    return phoneRegex.test(phone);
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onSignup({
        inviteCode: inviteCode.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        name: name.trim(),
        phone: phone.trim()
      });
    } catch (error: any) {
      console.error('회원가입 에러:', error);
      Alert.alert(
        '회원가입 실패',
        error.message || '회원가입 중 오류가 발생했습니다.',
        [{ text: '확인' }]
      );
    }
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
          {/* 헤더 섹션 */}
          <ThemedView style={styles.headerSection}>
            <ThemedText type="title" style={styles.title}>
              직원 회원가입
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              초대 코드를 사용하여 계정을 생성하세요
            </ThemedText>
          </ThemedView>

          {/* 입력 폼 */}
          <ThemedView style={styles.inputSection}>
            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>초대 코드 *</ThemedText>
              <CustomTextInput
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder="초대 코드를 입력하세요"
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!loading}
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>이름 *</ThemedText>
              <CustomTextInput
                value={name}
                onChangeText={setName}
                placeholder="이름을 입력하세요"
                autoCapitalize="words"
                editable={!loading}
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>이메일 *</ThemedText>
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
              <ThemedText style={styles.inputLabel}>전화번호 *</ThemedText>
              <CustomTextInput
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="010-0000-0000"
                keyboardType="phone-pad"
                maxLength={13}
                editable={!loading}
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>비밀번호 *</ThemedText>
              <ThemedView style={styles.passwordContainer}>
                <CustomTextInput
                  style={[styles.textInput, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="비밀번호를 입력하세요 (4자 이상)"
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

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>비밀번호 확인 *</ThemedText>
              <ThemedView style={styles.passwordContainer}>
                <CustomTextInput
                  style={[styles.textInput, styles.passwordInput]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="비밀번호를 다시 입력하세요"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <ThemedText style={styles.passwordToggleText}>
                    {showConfirmPassword ? '숨김' : '보기'}
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* 버튼 섹션 */}
          <ThemedView style={styles.buttonSection}>
            <Button
              title={loading ? '가입 중...' : '회원가입'}
              onPress={handleSignup}
              disabled={loading}
              variant="primary"
              size="large"
              style={styles.signupButton}
            />

            <Button
              title="로그인으로 돌아가기"
              onPress={onBackToLogin}
              disabled={loading}
              variant="outline"
              size="large"
              style={styles.backButton}
            />
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
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
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
  signupButton: {
    marginBottom: Spacing.sm,
  },
  backButton: {
    // 스타일은 Button 컴포넌트에서 관리
  },
});
