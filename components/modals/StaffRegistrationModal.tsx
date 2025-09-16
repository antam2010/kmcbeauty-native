import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { StaffUserCreate, userApiService } from '@/src/api/services/staff';
import { useShop } from '@/stores/shopStore';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity
} from 'react-native';

interface StaffRegistrationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StaffRegistrationModal({
  visible,
  onClose,
  onSuccess
}: StaffRegistrationModalProps) {
  const [formData, setFormData] = useState<StaffUserCreate>({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'MANAGER',
    phone_number: ''
  });
  const [loading, setLoading] = useState(false);
  const { selectedShop } = useShop();

  const roles = [
    { value: 'ADMIN', label: '관리자' },
    { value: 'MANAGER', label: '매니저' },
    { value: 'STAFF', label: '직원' }
  ];

  const handleSubmit = async () => {
    if (!selectedShop?.id) {
      Alert.alert('오류', '선택된 상점이 없습니다.');
      return;
    }

    // 필수 필드 검증
    if (!formData.name.trim()) {
      Alert.alert('오류', '이름을 입력해주세요.');
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert('오류', '이메일을 입력해주세요.');
      return;
    }
    if (!formData.username.trim()) {
      Alert.alert('오류', '사용자명을 입력해주세요.');
      return;
    }
    if (!formData.password.trim()) {
      Alert.alert('오류', '비밀번호를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      await userApiService.createUser(selectedShop.id, formData);
      
      Alert.alert('완료', '직원이 성공적으로 등록되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            onSuccess();
            onClose();
            // 폼 초기화
            setFormData({
              name: '',
              email: '',
              username: '',
              password: '',
              role: 'MANAGER',
              phone_number: ''
            });
          }
        }
      ]);
    } catch (error) {
      console.error('직원 등록 중 오류:', error);
      Alert.alert('오류', '직원 등록 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <ThemedView style={styles.container}>
        {/* 헤더 */}
        <ThemedView style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>직원 등록</ThemedText>
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            disabled={loading}
          >
            <ThemedText style={[styles.saveButtonText, loading && styles.saveButtonTextDisabled]}>
              {loading ? '등록 중...' : '등록'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* 이름 */}
          <ThemedView style={styles.fieldContainer}>
            <ThemedText style={styles.label}>이름 *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="이름을 입력하세요"
              autoCapitalize="words"
            />
          </ThemedView>

          {/* 이메일 */}
          <ThemedView style={styles.fieldContainer}>
            <ThemedText style={styles.label}>이메일 *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="이메일을 입력하세요"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </ThemedView>

          {/* 사용자명 */}
          <ThemedView style={styles.fieldContainer}>
            <ThemedText style={styles.label}>사용자명 *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.username}
              onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
              placeholder="사용자명을 입력하세요"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </ThemedView>

          {/* 비밀번호 */}
          <ThemedView style={styles.fieldContainer}>
            <ThemedText style={styles.label}>비밀번호 *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
              placeholder="비밀번호를 입력하세요"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </ThemedView>

          {/* 역할 */}
          <ThemedView style={styles.fieldContainer}>
            <ThemedText style={styles.label}>역할</ThemedText>
            <ThemedView style={styles.roleContainer}>
              {roles.map((role) => (
                <TouchableOpacity
                  key={role.value}
                  style={[
                    styles.roleButton,
                    formData.role === role.value && styles.roleButtonActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, role: role.value }))}
                >
                  <ThemedText style={[
                    styles.roleButtonText,
                    formData.role === role.value && styles.roleButtonTextActive
                  ]}>
                    {role.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ThemedView>
          </ThemedView>

          {/* 전화번호 */}
          <ThemedView style={styles.fieldContainer}>
            <ThemedText style={styles.label}>전화번호</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.phone_number}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone_number: text }))}
              placeholder="전화번호를 입력하세요"
              keyboardType="phone-pad"
            />
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#999',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
});
