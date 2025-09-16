import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Clipboard,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { inviteService, type InviteCodeData } from '../../src/api/services/invite';

interface InviteCodeGeneratorModalProps {
  visible: boolean;
  onClose: () => void;
  shopId: number;
}

const EXPIRES_OPTIONS = [
  { label: '1시간', value: 3600 },
  { label: '6시간', value: 21600 },
  { label: '12시간', value: 43200 },
  { label: '1일', value: 86400 },
  { label: '3일', value: 259200 },
  { label: '7일', value: 604800 },
  { label: '30일', value: 2592000 }
];

export default function InviteCodeGeneratorModal({
  visible,
  onClose,
  shopId
}: InviteCodeGeneratorModalProps) {
  const [selectedExpireIn, setSelectedExpireIn] = useState(2592000); // 30일 기본값
  const [loading, setLoading] = useState(false);
  const [currentInviteCode, setCurrentInviteCode] = useState<InviteCodeData | null>(null);
  const [checkingCurrentCode, setCheckingCurrentCode] = useState(false);

  // 현재 초대 코드 확인
  const checkCurrentInviteCode = useCallback(async () => {
    if (!shopId || shopId === 0) return;
    
    try {
      setCheckingCurrentCode(true);
      const inviteCode = await inviteService.getCurrentInviteCode(shopId);
      setCurrentInviteCode(inviteCode);
    } catch (error: any) {
      console.log('현재 초대 코드 없음 또는 조회 실패:', error);
      setCurrentInviteCode(null);
    } finally {
      setCheckingCurrentCode(false);
    }
  }, [shopId]);

  // 모달이 열릴 때마다 현재 코드 확인
  useEffect(() => {
    if (visible && shopId && shopId !== 0) {
      checkCurrentInviteCode();
    }
  }, [visible, shopId, checkCurrentInviteCode]);

  const handleGenerateCode = async () => {
    if (!shopId || shopId === 0) {
      Alert.alert('오류', '상점을 먼저 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      // 새 초대 코드 생성 시도
      const newInviteCode = await inviteService.generateInviteCode(shopId, {
        expire_in: selectedExpireIn
      });
      
      setCurrentInviteCode(newInviteCode);
      Alert.alert('성공', '초대 코드가 생성되었습니다!');
      
    } catch (error: any) {
      console.error('초대 코드 생성 중 오류:', error);
      
      // 409 충돌 에러 처리
      if (error.response?.status === 409) {
        const errorCode = error.response?.data?.detail?.code;
        
        if (errorCode === 'SHOP_INVITE_CONFLICT') {
          Alert.alert(
            '기존 초대 코드 존재',
            '이미 활성화된 초대 코드가 있습니다. 기존 코드를 삭제하고 새로 생성하시겠습니까?',
            [
              { text: '취소', style: 'cancel' },
              {
                text: '새로 생성',
                style: 'destructive',
                onPress: async () => {
                  try {
                    // 기존 코드 삭제 후 새로 생성
                    await inviteService.deleteCurrentInviteCode(shopId);
                    const newInviteCode = await inviteService.generateInviteCode(shopId, {
                      expire_in: selectedExpireIn
                    });
                    setCurrentInviteCode(newInviteCode);
                    Alert.alert('성공', '새로운 초대 코드가 생성되었습니다!');
                  } catch (deleteError) {
                    console.error('기존 코드 삭제 후 생성 실패:', deleteError);
                    Alert.alert('오류', '초대 코드 생성에 실패했습니다.');
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert('오류', '초대 코드 생성에 실패했습니다.');
        }
      } else {
        Alert.alert('오류', '초대 코드 생성에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCode = async () => {
    if (!shopId || shopId === 0 || !currentInviteCode) return;

    Alert.alert(
      '초대 코드 삭제',
      '현재 초대 코드를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await inviteService.deleteCurrentInviteCode(shopId);
              setCurrentInviteCode(null);
              Alert.alert('성공', '초대 코드가 삭제되었습니다.');
            } catch (error) {
              console.error('초대 코드 삭제 실패:', error);
              Alert.alert('오류', '초대 코드 삭제에 실패했습니다.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCopyCode = async () => {
    if (currentInviteCode?.invite_code) {
      await Clipboard.setString(currentInviteCode.invite_code);
      Alert.alert('복사 완료', '초대 코드가 클립보드에 복사되었습니다.');
    }
  };

  const formatExpiredAt = (expiredAt: string) => {
    const date = new Date(expiredAt);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>직원 초대 코드</Text>

          {!shopId || shopId === 0 ? (
            // 상점이 선택되지 않은 경우
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>상점을 먼저 선택해주세요.</Text>
              <Text style={styles.errorSubText}>
                초대 코드를 생성하려면 관리할 상점을 선택해야 합니다.
              </Text>
            </View>
          ) : checkingCurrentCode ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>현재 코드 확인 중...</Text>
            </View>
          ) : currentInviteCode ? (
            // 기존 코드가 있는 경우
            <View style={styles.currentCodeContainer}>
              <Text style={styles.currentCodeLabel}>현재 활성 초대 코드</Text>
              
              <View style={styles.codeDisplayContainer}>
                <Text style={styles.inviteCode}>{currentInviteCode.invite_code}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopyCode}
                >
                  <Text style={styles.copyButtonText}>복사</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.expiredAtText}>
                만료일: {formatExpiredAt(currentInviteCode.expired_at)}
              </Text>

              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDeleteCode}
                  disabled={loading}
                >
                  <Text style={styles.deleteButtonText}>
                    {loading ? '삭제 중...' : '코드 삭제'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // 새 코드 생성 영역
            <View style={styles.generateContainer}>
              <Text style={styles.sectionTitle}>유효 기간 선택</Text>
              
              <View style={styles.expireOptionsContainer}>
                {EXPIRES_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.expireOption,
                      selectedExpireIn === option.value && styles.selectedExpireOption
                    ]}
                    onPress={() => setSelectedExpireIn(option.value)}
                  >
                    <Text
                      style={[
                        styles.expireOptionText,
                        selectedExpireIn === option.value && styles.selectedExpireOptionText
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.generateButton, loading && styles.disabledButton]}
                onPress={handleGenerateCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.generateButtonText}>초대 코드 생성</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
  },
  currentCodeContainer: {
    marginBottom: 20,
  },
  currentCodeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  codeDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  inviteCode: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    fontFamily: 'monospace',
  },
  copyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  expiredAtText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  deleteButton: {
    backgroundColor: '#DC3545',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  generateContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  expireOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  expireOption: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    margin: 4,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  selectedExpireOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  expireOptionText: {
    fontSize: 14,
    color: '#495057',
  },
  selectedExpireOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 20,
  },
});
