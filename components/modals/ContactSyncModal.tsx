import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
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
  const [permissionStatus, setPermissionStatus] = useState<'checking' | 'granted' | 'denied' | 'undetermined' | 'unavailable'>('checking');
  const [contactsCount, setContactsCount] = useState<number>(0);
  const [previewContacts, setPreviewContacts] = useState<{name: string, phone: string, group?: string, action: 'new' | 'update'}[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [groupList, setGroupList] = useState<{group_name: string, count: number}[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('전체');
  const insets = useSafeAreaInsets();

  // 모달이 열릴 때 권한 상태 확인
  useEffect(() => {
    if (visible) {
      checkPermissionStatus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const checkPermissionStatus = async () => {
    try {
      setPermissionStatus('checking');
      const status = await contactSyncService.checkContactsPermission();
      setPermissionStatus(status);
      
      // 마지막 동기화 시점 로드
      const lastSync = await contactSyncService.getLastSyncTime();
      setLastSyncTime(lastSync);
      
      // 그룹 리스트 로드
      await loadGroupList();
      
      // 권한이 허용된 경우 연락처 미리보기 로드
      if (status === 'granted') {
        loadContactsPreview();
      }
    } catch (error) {
      console.error('권한 상태 확인 실패:', error);
      setPermissionStatus('unavailable');
    }
  };

  const loadGroupList = async () => {
    try {
      console.log('📋 그룹 리스트 로드 중...');
      
      // 1. 서버 그룹 정보 가져오기
      const { phonebookApiService } = await import('../../src/api/services/phonebook');
      const serverGroups = await phonebookApiService.getGroups(false);
      
      // 2. 디바이스 그룹 정보 가져오기
      let deviceGroups: { group_name: string, count: number }[] = [];
      try {
        const { contactSyncService } = await import('../../src/services/contactSync');
        const deviceGroupData = await contactSyncService.getDeviceGroups();
        deviceGroups = deviceGroupData;
        console.log(`📱 디바이스 그룹 ${deviceGroups.length}개 발견`);
      } catch (error) {
        console.warn('디바이스 그룹 정보 가져오기 실패:', error);
      }
      
      // 3. 서버 그룹과 디바이스 그룹 통합
      const allGroupsMap = new Map<string, number>();
      
      // 서버 그룹 추가
      serverGroups.forEach(group => {
        allGroupsMap.set(group.group_name, group.count);
      });
      
      // 디바이스 그룹 추가 (중복되지 않는 것만)
      deviceGroups.forEach(group => {
        if (!allGroupsMap.has(group.group_name)) {
          allGroupsMap.set(group.group_name, 0); // 서버에는 없는 디바이스 그룹
        }
      });
      
      // 4. 통합된 그룹 리스트 생성
      const combinedGroups = Array.from(allGroupsMap.entries()).map(([groupName, count]) => ({
        group_name: groupName,
        count: count
      }));
      
      // "전체" 옵션을 맨 앞에 추가
      const groupOptions = [
        { group_name: '전체', count: 0 },
        ...combinedGroups
      ];
      
      setGroupList(groupOptions);
      console.log(`📋 통합 그룹 ${combinedGroups.length}개 로드 완료 (서버: ${serverGroups.length}, 디바이스: ${deviceGroups.length})`);
    } catch (error) {
      console.error('그룹 리스트 로드 실패:', error);
      setGroupList([{ group_name: '전체', count: 0 }]);
    }
  };

  const loadContactsPreview = async () => {
    try {
      console.log('📱 동기화 필요 연락처 확인 중...');
      
      // 마지막 동기화 시점 확인
      const lastSync = await contactSyncService.getLastSyncTime();
      console.log('📅 마지막 동기화 시점:', lastSync ? lastSync.toLocaleString() : '없음');
      
      // 디바이스 연락처 가져오기
      const deviceContacts = await contactSyncService.getDeviceContacts();
      
      if (deviceContacts.length === 0) {
        setContactsCount(0);
        setPreviewContacts([]);
        return;
      }

      console.log(`📱 디바이스 연락처 ${deviceContacts.length}개 발견`);

      // 마지막 동기화가 없으면 (첫 동기화) 모든 연락처를 신규로 표시
      if (!lastSync) {
        console.log('🆕 첫 동기화: 모든 연락처를 신규로 처리');
        setContactsCount(deviceContacts.length);
        
        const preview = deviceContacts
          .slice(0, 5)
          .map(contact => ({
            name: contact.name,
            phone: contact.formattedPhoneNumber,
            group: contact.groupName,
            action: 'new' as const
          }));
        
        setPreviewContacts(preview);
        return;
      }

      // 서버의 기존 연락처 가져오기 (선택된 그룹에 따라)
      const { phonebookApiService } = await import('../../src/api/services/phonebook');
      const { unformatPhoneNumber } = await import('../../src/utils/phoneFormat');
      
      let existingContacts;
      if (selectedGroup === '전체') {
        console.log('📋 서버 전체 연락처 조회 중...');
        existingContacts = await phonebookApiService.getAllContacts();
      } else {
        console.log(`📋 서버 "${selectedGroup}" 그룹 연락처 조회 중...`);
        existingContacts = await phonebookApiService.getContactsByGroup(selectedGroup);
      }
      
      // 전화번호로 매핑 (중복 확인용)
      const existingPhoneMap = new Map();
      existingContacts.forEach(contact => {
        const cleanPhone = unformatPhoneNumber(contact.phone_number);
        existingPhoneMap.set(cleanPhone, contact);
      });

      console.log(`📋 서버 "${selectedGroup}" 연락처 ${existingContacts.length}개 확인`);

      // 실제로 동기화가 필요한 연락처만 필터링
      const syncNeededContacts = [];
      
      for (const deviceContact of deviceContacts) {
        const existingContact = existingPhoneMap.get(deviceContact.phoneNumber);
        
        if (!existingContact) {
          // 새로운 연락처
          syncNeededContacts.push({
            ...deviceContact,
            action: 'new' as const
          });
        } else {
          // 기존 연락처가 있는 경우 - 이름 또는 그룹이 변경되었는지 확인
          const nameChanged = existingContact.name !== deviceContact.name && 
                             existingContact.name !== '신원미상';
          
          // 선택된 그룹으로 업데이트가 필요한지 확인
          const targetGroupName = selectedGroup === '전체' ? '연락처 동기화' : selectedGroup;
          const groupChanged = existingContact.group_name !== targetGroupName;
          
          if (nameChanged || groupChanged) {
            syncNeededContacts.push({
              ...deviceContact,
              action: 'update' as const
            });
          }
        }
      }

      setContactsCount(syncNeededContacts.length);
      
      if (syncNeededContacts.length === 0) {
        console.log('✅ 동기화가 필요한 연락처가 없습니다.');
        setPreviewContacts([]);
        return;
      }
      
      // 상위 5개만 미리보기로 표시
      const preview = syncNeededContacts
        .slice(0, 5)
        .map(contact => ({
          name: contact.name,
          phone: contact.formattedPhoneNumber,
          group: contact.groupName,
          action: contact.action
        }));
      
      setPreviewContacts(preview);
      console.log(`📱 동기화 필요 연락처 ${syncNeededContacts.length}개 중 ${preview.length}개 미리보기 표시`);
      
    } catch (error) {
      console.error('동기화 필요 연락처 확인 실패:', error);
      
      // 에러 발생 시 모든 연락처를 new로 표시 (fallback)
      try {
        const contacts = await contactSyncService.getDeviceContacts();
        setContactsCount(contacts.length);
        
        const preview = contacts
          .slice(0, 5)
          .map(contact => ({
            name: contact.name,
            phone: contact.formattedPhoneNumber,
            group: contact.groupName,
            action: 'new' as const
          }));
        
        setPreviewContacts(preview);
        console.log('📱 Fallback: 모든 연락처를 신규로 표시');
      } catch (fallbackError) {
        console.error('Fallback도 실패:', fallbackError);
        setContactsCount(0);
        setPreviewContacts([]);
      }
    }
  };

  const getPermissionStatusText = () => {
    switch (permissionStatus) {
      case 'checking':
        return '권한 상태 확인 중...';
      case 'granted':
        return '✅ 연락처 권한 허용됨';
      case 'denied':
        return '❌ 연락처 권한 거부됨';
      case 'unavailable':
        return '⚠️ 연락처 모듈 사용 불가';
      default:
        return '❓ 권한 상태 불명';
    }
  };

  const getPermissionStatusColor = () => {
    switch (permissionStatus) {
      case 'granted':
        return '#4CAF50';
      case 'denied':
        return '#F44336';
      case 'unavailable':
        return '#FF9800';
      default:
        return '#757575';
    }
  };

  const handleSync = async () => {
    try {
      setIsLoading(true);
      
      const groupName = selectedGroup === 'all' ? undefined : selectedGroup;
      console.log(`🔄 연락처 동기화 시작... (그룹: ${groupName || '전체'})`);
      
      const result = await contactSyncService.performFullSync(groupName);
      
      // 동기화 완료 후 마지막 동기화 시점 업데이트
      const newSyncTime = await contactSyncService.getLastSyncTime();
      setLastSyncTime(newSyncTime);
      
      onSyncComplete?.(result);
      
      // 결과 표시
      const groupInfo = groupName ? `(${groupName} 그룹)` : '(전체)';
      const message = `동기화 완료! ${groupInfo}\n\n` +
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
              <ScrollView 
                style={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.scrollContentContainer}
              >
                <View style={styles.infoContainer}>
                  {/* 권한 상태 표시 */}
                  <View style={[styles.permissionStatus, { borderColor: getPermissionStatusColor() }]}>
                    <Text style={[styles.permissionText, { color: getPermissionStatusColor() }]}>
                      {getPermissionStatusText()}
                    </Text>
                  </View>

                  {/* 마지막 동기화 시점 표시 */}
                  {lastSyncTime && (
                    <View style={styles.lastSyncBox}>
                      <View style={styles.lastSyncHeader}>
                        <MaterialIcons name="schedule" size={16} color="#666" />
                        <Text style={styles.lastSyncTitle}>마지막 동기화</Text>
                      </View>
                      <Text style={styles.lastSyncTime}>
                        {lastSyncTime.toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                  )}

                  {/* 그룹 선택 */}
                  {groupList.length > 1 && (
                    <View style={styles.groupSelectBox}>
                      <View style={styles.groupSelectHeader}>
                        <MaterialIcons name="folder" size={16} color="#666" />
                        <Text style={styles.groupSelectTitle}>동기화 그룹 선택</Text>
                      </View>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.groupScrollView}
                      >
                        {groupList.map((group, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.groupOption,
                              selectedGroup === group.group_name && styles.groupOptionSelected
                            ]}
                            onPress={() => {
                              setSelectedGroup(group.group_name);
                              // 그룹 변경 시 미리보기 새로고침
                              if (permissionStatus === 'granted') {
                                loadContactsPreview();
                              }
                            }}
                          >
                            <Text style={[
                              styles.groupOptionText,
                              selectedGroup === group.group_name && styles.groupOptionTextSelected
                            ]}>
                              {group.group_name}
                              {group.count > 0 && ` (${group.count})`}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

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

                  {/* 연락처 미리보기 (권한 허용 시) */}
                  {permissionStatus === 'granted' && (
                    contactsCount > 0 ? (
                      <View style={styles.previewBox}>
                        <View style={styles.previewHeader}>
                          <MaterialIcons name="preview" size={16} color="#007AFF" />
                          <Text style={styles.previewTitle}>
                            📱 동기화 대상 연락처 ({contactsCount}개)
                          </Text>
                        </View>
                        
                        {previewContacts.length > 0 && (
                          <View style={styles.previewList}>
                            <Text style={styles.previewSubtitle}>동기화 예상 목록 (상위 {previewContacts.length}개)</Text>
                            {previewContacts.map((contact, index) => (
                              <View key={index} style={styles.previewItem}>
                                <View style={styles.previewItemHeader}>
                                  <Text style={styles.previewItemName}>{contact.name}</Text>
                                  <Text style={[
                                    styles.previewItemAction,
                                    { color: contact.action === 'new' ? '#4CAF50' : '#FF9800' }
                                  ]}>
                                    {contact.action === 'new' ? '신규' : '업데이트'}
                                  </Text>
                                </View>
                                <Text style={styles.previewItemPhone}>{contact.phone}</Text>
                                {contact.group && (
                                  <Text style={styles.previewItemGroup}>🏷️ {contact.group}</Text>
                                )}
                              </View>
                            ))}
                            {contactsCount > previewContacts.length && (
                              <Text style={styles.previewMore}>
                                외 {contactsCount - previewContacts.length}개 더...
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={styles.noSyncBox}>
                        <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                        <Text style={styles.noSyncTitle}>동기화가 완료되었습니다</Text>
                        <Text style={styles.noSyncText}>
                          모든 연락처가 이미 서버와 동기화되어 있습니다.
                        </Text>
                      </View>
                    )
                  )}

                  {permissionStatus === 'denied' ? (
                    <View style={styles.warningBox}>
                      <MaterialIcons name="error" size={16} color="#F44336" />
                      <Text style={styles.warningText}>
                        연락처 권한이 거부되었습니다. 동기화를 진행하면 설정 화면으로 이동합니다.
                      </Text>
                    </View>
                  ) : permissionStatus === 'unavailable' ? (
                    <View style={styles.warningBox}>
                      <MaterialIcons name="warning" size={16} color="#FF9800" />
                      <Text style={styles.warningText}>
                        연락처 모듈을 사용할 수 없습니다. 새로운 development build가 필요합니다.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.warningBox}>
                      <MaterialIcons name="warning" size={16} color="#FF5722" />
                      <Text style={styles.warningText}>
                        연락처 접근 권한이 필요합니다. 최초 1회만 허용하시면 됩니다.
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
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
    maxHeight: '75%',
    minHeight: '45%',
    display: 'flex',
    flexDirection: 'column',
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    minHeight: 200,
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
    gap: 18,
    paddingBottom: 20,
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
  permissionStatus: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  permissionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  featureList: {
    gap: 12,
    paddingVertical: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  featureText: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF572220',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#e65100',
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#ffffff',
    flexShrink: 0,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
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
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  syncButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  previewBox: {
    backgroundColor: '#f8fffe',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF20',
    padding: 16,
    marginTop: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  previewList: {
    gap: 8,
  },
  previewSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  previewItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  previewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  previewItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
  },
  previewItemAction: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  previewItemPhone: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  previewItemGroup: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
    fontStyle: 'italic',
  },
  previewMore: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  lastSyncBox: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e8f0',
    padding: 12,
    marginTop: 8,
  },
  lastSyncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  lastSyncTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  lastSyncTime: {
    fontSize: 14,
    color: '#333',
    marginLeft: 22,
  },
  noSyncBox: {
    backgroundColor: '#f0f8f0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF5020',
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  noSyncTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    textAlign: 'center',
  },
  noSyncText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  groupSelectBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e8f0',
    padding: 12,
  },
  groupSelectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  groupSelectTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  groupScrollView: {
    flexDirection: 'row',
  },
  groupOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  groupOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  groupOptionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  groupOptionTextSelected: {
    color: '#ffffff',
  },
});
