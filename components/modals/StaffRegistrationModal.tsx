import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import InviteCodeGeneratorModal from '@/components/modals/InviteCodeGeneratorModal';
import { StaffUserCreate, userApiService } from '@/src/api/services/staff';
import { useShopStore } from '@/src/stores/shopStore';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity
} from 'react-native';

interface StaffRegistrationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// 직원 "추가" = 이미 계정이 있는 사용자를 이메일로 상점에 연결한다(association).
// 계정이 아직 없는 신규 직원은 초대(ShopInvite) 코드 플로우로 가입시킨다(하단 안내 참조).
// SECURITY-001: 이 화면은 role/password 를 수집하지 않는다.
export default function StaffRegistrationModal({
  visible,
  onClose,
  onSuccess
}: StaffRegistrationModalProps) {
  const [formData, setFormData] = useState<StaffUserCreate>({
    email: '',
    is_primary_owner: false
  });
  const [loading, setLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  // REQ-PERF-003-08: 필드 셀렉터 구독.
  const selectedShop = useShopStore((s) => s.selectedShop);

  const resetForm = () => {
    setFormData({ email: '', is_primary_owner: false });
  };

  const handleSubmit = async () => {
    if (!selectedShop?.id) {
      Alert.alert('오류', '선택된 상점이 없습니다.');
      return;
    }

    // 이메일 필수 검증 (연결 대상 식별자)
    if (!formData.email.trim()) {
      Alert.alert('오류', '연결할 사용자의 이메일을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      await userApiService.createUser(selectedShop.id, {
        email: formData.email.trim(),
        is_primary_owner: formData.is_primary_owner
      });

      Alert.alert('완료', '사용자가 직원으로 연결되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            onSuccess();
            onClose();
            resetForm();
          }
        }
      ]);
    } catch (error) {
      console.error('직원 연결 중 오류:', error);
      Alert.alert(
        '오류',
        '직원 연결 중 문제가 발생했습니다. 입력한 이메일의 계정이 존재하는지 확인해주세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleOpenInvite = () => {
    setShowInviteModal(true);
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
          <ThemedText type="title" style={styles.title}>직원 추가</ThemedText>
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            disabled={loading}
          >
            <ThemedText style={[styles.saveButtonText, loading && styles.saveButtonTextDisabled]}>
              {loading ? '연결 중...' : '연결'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* 안내: 기존 계정 연결 */}
          <ThemedView style={styles.infoBox}>
            <ThemedText style={styles.infoText}>
              이미 계정이 있는 사용자를 이메일로 이 상점의 직원으로 연결합니다.
            </ThemedText>
          </ThemedView>

          {/* 이메일 (연결 대상) */}
          <ThemedView style={styles.fieldContainer}>
            <ThemedText style={styles.label}>사용자 이메일 *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="연결할 사용자의 이메일을 입력하세요"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </ThemedView>

          {/* 주 소유자 지정 토글 */}
          <ThemedView style={styles.switchRow}>
            <ThemedView style={styles.switchLabelContainer}>
              <ThemedText style={styles.label}>주 소유자로 지정</ThemedText>
              <ThemedText style={styles.helperText}>
                이 사용자에게 상점의 주 소유자 권한을 부여합니다.
              </ThemedText>
            </ThemedView>
            <Switch
              value={formData.is_primary_owner}
              onValueChange={(value) =>
                setFormData(prev => ({ ...prev, is_primary_owner: value }))
              }
              trackColor={{ false: '#d1d5db', true: '#007AFF' }}
            />
          </ThemedView>

          {/* 안내: 계정이 없는 신규 직원은 초대 플로우로 */}
          <ThemedView style={styles.inviteNoticeBox}>
            <MaterialIcons name="info-outline" size={20} color="#856404" />
            <ThemedView style={styles.inviteNoticeContent}>
              <ThemedText style={styles.inviteNoticeTitle}>
                아직 계정이 없는 직원인가요?
              </ThemedText>
              <ThemedText style={styles.inviteNoticeText}>
                계정이 없는 신규 직원은 초대 코드를 발급해 가입하도록 안내하세요.
              </ThemedText>
              <TouchableOpacity
                style={styles.inviteButton}
                onPress={handleOpenInvite}
              >
                <MaterialIcons name="mail-outline" size={18} color="#fff" />
                <ThemedText style={styles.inviteButtonText}>초대 코드 발급</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ScrollView>
      </ThemedView>

      {/* 신규 직원 초대 코드 생성 모달 */}
      <InviteCodeGeneratorModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        shopId={selectedShop?.id || 0}
      />
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
    color: '#6b7280',
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
  infoBox: {
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  infoText: {
    fontSize: 14,
    color: '#3730a3',
    lineHeight: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  helperText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
  },
  inviteNoticeBox: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  inviteNoticeContent: {
    flex: 1,
    marginLeft: 10,
  },
  inviteNoticeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  inviteNoticeText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
    marginBottom: 12,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
