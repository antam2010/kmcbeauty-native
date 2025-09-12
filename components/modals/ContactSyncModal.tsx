import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { contactSyncService, type ContactSyncResult } from '../../src/services/contactSync';

interface ContactSyncModalProps {
  visible: boolean;
  onClose: () => void;
  onSyncComplete?: (result: ContactSyncResult) => void;
}

export default function ContactSyncModal({
  visible,
  onClose,
  onSyncComplete
}: ContactSyncModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSync = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔄 연락처 동기화 시작...');
      const result = await contactSyncService.performFullSync();
      
      onSyncComplete?.(result);
      
      // 결과 표시
      const message = `동기화 완료!\n\n` +
        `📱 총 연락처: ${result.totalContacts}개\n` +
        `➕ 새로 추가: ${result.newContacts}개\n` +
        `🔄 업데이트: ${result.updatedContacts}개\n` +
        `🔁 중복: ${result.duplicates}개\n` +
        `❌ 오류: ${result.errors}개`;
      
      Alert.alert('동기화 완료', message, [
        { text: '확인', onPress: onClose }
      ]);
      
    } catch (error) {
      console.error('연락처 동기화 실패:', error);
      
      let errorMessage = '알 수 없는 오류가 발생했습니다.';
      
      if (error instanceof Error) {
        if (error.message.includes('ExpoContacts')) {
          errorMessage = 'Expo Contacts 모듈이 설치되지 않았습니다.\n앱을 다시 빌드해주세요.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('동기화 실패', errorMessage, [{ text: '확인' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isLoading) {
      Alert.alert(
        '동기화 진행 중',
        '동기화가 진행 중입니다. 잠시만 기다려주세요.',
        [{ text: '확인' }]
      );
      return;
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { paddingTop: insets.top + 20 }]}>
          {/* 헤더 */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialIcons name="contacts" size={24} color="#007AFF" />
              <Text style={styles.title}>연락처 동기화</Text>
            </View>
            {!isLoading && (
              <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {/* 내용 */}
          <View style={styles.content}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>연락처를 동기화하는 중...</Text>
                <Text style={styles.loadingSubText}>
                  디바이스의 연락처를 서버와 동기화하고 있습니다.
                </Text>
              </View>
            ) : (
              <View style={styles.infoContainer}>
                <View style={styles.infoBox}>
                  <MaterialIcons name="info" size={20} color="#007AFF" />
                  <Text style={styles.infoText}>
                    디바이스의 연락처를 고객 목록과 동기화합니다.
                  </Text>
                </View>

                <View style={styles.featureList}>
                  <View style={styles.featureItem}>
                    <MaterialIcons name="person-add" size={16} color="#4CAF50" />
                    <Text style={styles.featureText}>새로운 연락처 자동 추가</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <MaterialIcons name="update" size={16} color="#FF9800" />
                    <Text style={styles.featureText}>기존 연락처 정보 업데이트</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <MaterialIcons name="security" size={16} color="#9C27B0" />
                    <Text style={styles.featureText}>개인정보 보호 및 안전한 동기화</Text>
                  </View>
                </View>

                <View style={styles.warningBox}>
                  <MaterialIcons name="warning" size={16} color="#FF5722" />
                  <Text style={styles.warningText}>
                    연락처 접근 권한이 필요합니다. 최초 1회만 허용하시면 됩니다.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* 버튼 */}
          {!isLoading && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.syncButton}
                onPress={handleSync}
                activeOpacity={0.7}
              >
                <MaterialIcons name="sync" size={20} color="#ffffff" />
                <Text style={styles.syncButtonText}>동기화 시작</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '60%',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  loadingSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoContainer: {
    gap: 24,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF20',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF572220',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#e65100',
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  syncButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  syncButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
