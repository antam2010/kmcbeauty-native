import { shopApiService, type ShopCreate } from '@/src/api/services/shop';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface ShopRegistrationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ShopRegistrationModal({
  visible,
  onClose,
  onSuccess,
}: ShopRegistrationModalProps) {
  const [formData, setFormData] = useState<ShopCreate>({
    name: '',
    address: '',
    address_detail: '',
    phone: '',
    business_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '상점 이름을 입력해주세요';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '상점 이름은 2글자 이상 입력해주세요';
    }

    if (!formData.address.trim()) {
      newErrors.address = '주소를 입력해주세요';
    } else if (formData.address.trim().length < 2) {
      newErrors.address = '주소는 2글자 이상 입력해주세요';
    }

    if (formData.phone && !/^[0-9-+() ]+$/.test(formData.phone)) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다';
    }

    if (formData.business_number && !/^[0-9-]+$/.test(formData.business_number)) {
      newErrors.business_number = '사업자등록번호는 숫자와 하이픈만 입력 가능합니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // 빈 문자열을 undefined로 변환하여 API 전송
      const cleanedData: ShopCreate = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        ...(formData.address_detail?.trim() && { address_detail: formData.address_detail.trim() }),
        ...(formData.phone?.trim() && { phone: formData.phone.trim() }),
        ...(formData.business_number?.trim() && { business_number: formData.business_number.trim() }),
      };

      await shopApiService.create(cleanedData);
      
      Alert.alert(
        '상점 등록 완료',
        '새로운 상점이 성공적으로 등록되었습니다.',
        [{ text: '확인', onPress: handleSuccess }]
      );
    } catch (error: any) {
      console.error('상점 등록 실패:', error);
      let errorMessage = '상점 등록에 실패했습니다.';
      
      if (error.response?.data?.detail?.message) {
        errorMessage = error.response.data.detail.message;
      } else if (error.response?.status === 403) {
        errorMessage = '상점 등록 권한이 없습니다.';
      } else if (error.response?.status === 409) {
        errorMessage = '이미 존재하는 상점입니다.';
      }
      
      Alert.alert('등록 실패', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    // 폼 초기화
    setFormData({
      name: '',
      address: '',
      address_detail: '',
      phone: '',
      business_number: '',
    });
    setErrors({});
    onSuccess();
    onClose();
  };

  const handleClose = () => {
    if (loading) return;
    
    setFormData({
      name: '',
      address: '',
      address_detail: '',
      phone: '',
      business_number: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>새 상점 등록</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.closeButtonText}>취소</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.formGroup}>
              <Text style={styles.label}>상점 이름 *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="상점 이름을 입력하세요"
                editable={!loading}
                maxLength={255}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>주소 *</Text>
              <TextInput
                style={[styles.input, errors.address && styles.inputError]}
                value={formData.address}
                onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                placeholder="주소를 입력하세요"
                editable={!loading}
                maxLength={255}
              />
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>상세주소</Text>
              <TextInput
                style={styles.input}
                value={formData.address_detail}
                onChangeText={(text) => setFormData(prev => ({ ...prev, address_detail: text }))}
                placeholder="상세주소를 입력하세요 (선택사항)"
                editable={!loading}
                maxLength={255}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>전화번호</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                placeholder="전화번호를 입력하세요 (선택사항)"
                keyboardType="phone-pad"
                editable={!loading}
                maxLength={20}
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>사업자등록번호</Text>
              <TextInput
                style={[styles.input, errors.business_number && styles.inputError]}
                value={formData.business_number}
                onChangeText={(text) => setFormData(prev => ({ ...prev, business_number: text }))}
                placeholder="사업자등록번호를 입력하세요 (선택사항)"
                keyboardType="numeric"
                editable={!loading}
                maxLength={20}
              />
              {errors.business_number && <Text style={styles.errorText}>{errors.business_number}</Text>}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>등록하기</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 4,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center' as const,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
};
