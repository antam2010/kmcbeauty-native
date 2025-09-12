import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking, Platform } from 'react-native';
import { phonebookApiService, type Phonebook } from '../api/services/phonebook';
import { formatPhoneNumber, isValidKoreanPhoneNumber, unformatPhoneNumber } from '../utils/phoneFormat';

// AsyncStorage 키 상수
const LAST_SYNC_TIME_KEY = 'contact_sync_last_time';

// 네이티브 모듈 사용 가능 여부 확인
const isNativeModuleAvailable = async (): Promise<boolean> => {
  try {
    const ContactsModule = await import('expo-contacts');
    const Contacts = (ContactsModule as any).default || ContactsModule;
    return !!(Contacts && typeof Contacts.requestPermissionsAsync === 'function');
  } catch (error) {
    console.warn('네이티브 모듈 확인 실패:', error);
    return false;
  }
};

// Expo Contacts 모듈 안전 가져오기
const getContactsModule = async () => {
  try {
    console.log('📱 Contacts 모듈 로딩 시작...');
    
    // 네이티브 모듈 사용 가능 여부 확인
    const isAvailable = await isNativeModuleAvailable();
    if (!isAvailable) {
      throw new Error('네이티브 모듈을 사용할 수 없습니다.');
    }
    
    const ContactsModule = await import('expo-contacts');
    console.log('📱 ContactsModule:', typeof ContactsModule);
    console.log('📱 ContactsModule 키들:', Object.keys(ContactsModule));
    
    const Contacts = (ContactsModule as any).default || ContactsModule;
    console.log('📱 Contacts 설정됨:', typeof Contacts);
    console.log('📱 Contacts 객체 키들:', Object.keys(Contacts || {}));
    
    // requestPermissionsAsync 함수 직접 확인
    if (Contacts && typeof Contacts.requestPermissionsAsync === 'function') {
      console.log('✅ requestPermissionsAsync 함수 발견');
      return Contacts;
    } else if (Contacts && (Contacts as any).default && typeof (Contacts as any).default.requestPermissionsAsync === 'function') {
      console.log('✅ default.requestPermissionsAsync 함수 발견');
      return (Contacts as any).default;
    } else {
      console.error('❌ requestPermissionsAsync 함수를 찾을 수 없음');
      throw new Error('expo-contacts 모듈의 requestPermissionsAsync 함수를 찾을 수 없습니다.');
    }
  } catch (error) {
    console.warn('Expo Contacts 모듈을 로드할 수 없습니다:', error);
    throw new Error('연락처 모듈을 사용할 수 없습니다. 새로운 development build가 필요합니다.');
  }
};

export interface ContactSyncResult {
  totalContacts: number;
  newContacts: number;
  updatedContacts: number; // 항상 0 (업데이트 로직 제거됨)
  errors: number;
  duplicates: number;
}

export interface DeviceContact {
  id: string;
  name: string;
  phoneNumber: string;
  formattedPhoneNumber: string;
  groupName?: string; // 그룹 정보 추가
}

class ContactSyncService {
  /**
   * 마지막 동기화 시점 저장
   */
  async saveLastSyncTime(): Promise<void> {
    try {
      const now = new Date().toISOString();
      await AsyncStorage.setItem(LAST_SYNC_TIME_KEY, now);
      console.log('📱 마지막 동기화 시점 저장:', now);
    } catch (error) {
      console.error('마지막 동기화 시점 저장 실패:', error);
    }
  }

  /**
   * 마지막 동기화 시점 조회
   */
  async getLastSyncTime(): Promise<Date | null> {
    try {
      const lastSyncTimeStr = await AsyncStorage.getItem(LAST_SYNC_TIME_KEY);
      if (!lastSyncTimeStr) {
        console.log('📱 마지막 동기화 시점 없음 (첫 동기화)');
        return null;
      }
      const lastSyncTime = new Date(lastSyncTimeStr);
      console.log('📱 마지막 동기화 시점:', lastSyncTime.toLocaleString());
      return lastSyncTime;
    } catch (error) {
      console.error('마지막 동기화 시점 조회 실패:', error);
      return null;
    }
  }

  /**
   * 마지막 동기화 시점 이후 연락처 조회
   */
  async getContactsSinceLastSync(): Promise<DeviceContact[]> {
    try {
      const Contacts = await getContactsModule();
      const lastSyncTime = await this.getLastSyncTime();
      
      console.log('📱 연락처 조회 시작...');
      
      // 필드 배열을 안전하게 구성 (null 값 완전 제거)
      const contactFields = [];
      
      if (Contacts.Fields?.Name) {
        contactFields.push(Contacts.Fields.Name);
      }
      
      if (Contacts.Fields?.PhoneNumbers) {
        contactFields.push(Contacts.Fields.PhoneNumbers);
      }
      
      // GroupMembership 필드는 선택적으로 추가 (지원되지 않을 수 있음)
      if (Contacts.Fields?.GroupMembership) {
        console.log('📱 GroupMembership 필드 지원됨');
        contactFields.push(Contacts.Fields.GroupMembership);
      } else {
        console.log('📱 GroupMembership 필드 지원되지 않음 - 기본 그룹 사용');
      }

      console.log('📱 사용할 필드들:', contactFields);

      // expo-contacts에서 수정 시간 필터링 옵션 확인
      const contactsData = await Contacts.getContactsAsync({
        fields: contactFields,
        sort: Contacts.SortTypes.LastName,
      });

      let filteredContacts = contactsData.data;

      // 마지막 동기화 시점이 있는 경우 그 이후 연락처만 필터링
      if (lastSyncTime) {
        console.log('📱 마지막 동기화 이후 연락처 필터링 중...');
        // 실제로는 expo-contacts에서 직접적인 수정 시간 필터링이 제한적이므로
        // 모든 연락처를 가져온 후 필터링하거나, 전체 동기화를 수행합니다.
        console.log('📱 전체 연락처를 가져와서 처리합니다.');
      }

      console.log(`📱 총 ${filteredContacts.length}개 연락처 발견`);

      // 플랫폼별 그룹 정보 처리
      let groupMap = new Map<string, string>();
      
      if (Platform.OS === 'ios') {
        // iOS에서만 그룹 정보 가져오기
        try {
          if (Contacts.getGroupsAsync) {
            const groupsData = await Contacts.getGroupsAsync();
            const groups = groupsData || [];
            console.log(`📱 iOS: 디바이스에서 ${groups.length}개의 그룹을 가져왔습니다.`);
            
            // 그룹 ID를 그룹명으로 매핑
            groups.forEach((group: any) => {
              if (group.id && group.name) {
                groupMap.set(group.id, group.name);
              }
            });
          }
        } catch (error) {
          console.warn('📱 iOS: 그룹 정보 가져오기 실패:', error);
        }
      } else {
        console.log('📱 Android: 그룹 정보를 사용하지 않습니다. 모든 연락처는 "연락처 동기화" 그룹으로 처리됩니다.');
      }

      const deviceContacts: DeviceContact[] = [];

      for (const contact of filteredContacts) {
        if (!contact.name || !contact.phoneNumbers || contact.phoneNumbers.length === 0) {
          continue;
        }

        // 플랫폼별 그룹 정보 처리
        let groupName = '연락처 동기화'; // 기본값
        
        if (Platform.OS === 'ios' && contact.groupMembership && contact.groupMembership.length > 0) {
          // iOS에서만 실제 그룹 정보 사용
          const firstGroupId = contact.groupMembership[0];
          const actualGroupName = groupMap.get(firstGroupId);
          if (actualGroupName) {
            groupName = actualGroupName;
            console.log(`📱 iOS: 연락처 ${contact.name}의 그룹: ${groupName}`);
          }
        }
        // Android는 항상 "연락처 동기화" 그룹 사용 (별도 처리 불필요)

        for (const phone of contact.phoneNumbers) {
          if (!phone.number) continue;

          const cleanNumber = unformatPhoneNumber(phone.number);
          if (!isValidKoreanPhoneNumber(cleanNumber)) continue;

          const formatted = formatPhoneNumber(cleanNumber);

          deviceContacts.push({
            id: contact.id || `${contact.name}-${cleanNumber}`,
            name: contact.name,
            phoneNumber: cleanNumber,
            formattedPhoneNumber: formatted,
            groupName: groupName
          });
        }
      }

      console.log(`📱 유효한 연락처 ${deviceContacts.length}개 처리 완료`);
      return deviceContacts;
    } catch (error) {
      console.error('연락처 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 연락처 권한 요청
   */
  async requestContactsPermission(): Promise<boolean> {
    try {
      console.log('📱 연락처 권한 요청 시작...');
      const Contacts = await getContactsModule();
      
      console.log('📱 Contacts 모듈 타입:', typeof Contacts);
      console.log('📱 Contacts 키들:', Contacts ? Object.keys(Contacts) : 'null');
      
      // 함수 존재 여부 확인
      if (!Contacts || typeof Contacts.requestPermissionsAsync !== 'function') {
        console.error('❌ requestPermissionsAsync 함수를 찾을 수 없습니다');
        console.error('Contacts:', Contacts);
        throw new Error('expo-contacts 모듈의 requestPermissionsAsync 함수를 찾을 수 없습니다.');
      }
      
      console.log('📱 권한 요청 중...');
      const { status } = await Contacts.requestPermissionsAsync();
      console.log('📱 권한 요청 결과:', status);
      
      if (status === 'granted') {
        console.log('✅ 연락처 권한 허용됨');
        return true;
      } else if (status === 'denied') {
        console.log('❌ 연락처 권한 거부됨 - 설정 화면 이동 안내');
        
        // 권한이 거부된 경우 설정 화면으로 이동할지 묻기
        return new Promise((resolve) => {
          Alert.alert(
            '연락처 권한 필요',
            '연락처 동기화를 위해 연락처 접근 권한이 필요합니다.\n설정에서 권한을 허용하시겠습니까?',
            [
              {
                text: '취소',
                onPress: () => resolve(false),
                style: 'cancel'
              },
              {
                text: '설정으로 이동',
                onPress: () => {
                  this.openAppSettings();
                  resolve(false);
                }
              }
            ]
          );
        });
      } else {
        console.log('❓ 연락처 권한 상태 불명:', status);
        Alert.alert(
          '권한 확인 필요',
          '연락처 권한 상태를 확인할 수 없습니다.\n설정에서 권한을 확인해주세요.',
          [
            {
              text: '취소',
              style: 'cancel'
            },
            {
              text: '설정으로 이동',
              onPress: () => this.openAppSettings()
            }
          ]
        );
        return false;
      }
    } catch (error) {
      console.error('연락처 권한 요청 실패:', error);
      Alert.alert(
        '모듈 오류',
        error instanceof Error ? error.message : '연락처 모듈을 사용할 수 없습니다.',
        [{ text: '확인' }]
      );
      return false;
    }
  }

  /**
   * 앱 설정 화면 열기
   */
  private openAppSettings(): void {
    try {
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else if (Platform.OS === 'android') {
        Linking.openURL('package:com.antam2010.kmcbeautynative');
      }
    } catch (error) {
      console.error('설정 화면 열기 실패:', error);
      Alert.alert(
        '설정 화면 열기 실패',
        '수동으로 설정 > 앱 > KMC Beauty > 권한에서 연락처 권한을 허용해주세요.',
        [{ text: '확인' }]
      );
    }
  }

  /**
   * 현재 연락처 권한 상태 확인
   */
  async checkContactsPermission(): Promise<'granted' | 'denied' | 'undetermined' | 'unavailable'> {
    try {
      const Contacts = await getContactsModule();
      
      if (!Contacts || typeof Contacts.getPermissionsAsync !== 'function') {
        return 'unavailable';
      }
      
      const { status } = await Contacts.getPermissionsAsync();
      return status;
    } catch (error) {
      console.warn('권한 상태 확인 실패:', error);
      return 'unavailable';
    }
  }

  /**
   * 디바이스 연락처 가져오기
   */
  async getDeviceContacts(): Promise<DeviceContact[]> {
    try {
      const Contacts = await getContactsModule();
      
      // 필드 배열을 안전하게 구성 (null 값 완전 제거)
      const contactFields = [];
      
      if (Contacts.Fields?.Name) {
        contactFields.push(Contacts.Fields.Name);
      }
      
      if (Contacts.Fields?.PhoneNumbers) {
        contactFields.push(Contacts.Fields.PhoneNumbers);
      }
      
      // GroupMembership 필드는 선택적으로 추가 (지원되지 않을 수 있음)
      if (Contacts.Fields?.GroupMembership) {
        console.log('📱 GroupMembership 필드 지원됨');
        contactFields.push(Contacts.Fields.GroupMembership);
      } else {
        console.log('📱 GroupMembership 필드 지원되지 않음 - 기본 그룹 사용');
      }

      console.log('📱 사용할 필드들:', contactFields);

      const { data: contacts } = await Contacts.getContactsAsync({
        fields: contactFields,
        sort: Contacts.SortTypes.FirstName,
      });

      console.log(`📱 디바이스에서 ${contacts.length}개의 연락처를 가져왔습니다.`);

      // 플랫폼별 그룹 정보 처리
      let groupMap = new Map<string, string>();
      
      if (Platform.OS === 'ios') {
        // iOS에서만 그룹 정보 가져오기
        try {
          if (Contacts.getGroupsAsync) {
            const groupsData = await Contacts.getGroupsAsync();
            const groups = groupsData || [];
            console.log(`📱 iOS: 디바이스에서 ${groups.length}개의 그룹을 가져왔습니다.`);
            
            // 그룹 ID를 그룹명으로 매핑
            groups.forEach((group: any) => {
              if (group.id && group.name) {
                groupMap.set(group.id, group.name);
              }
            });
          }
        } catch (error) {
          console.warn('📱 iOS: 그룹 정보 가져오기 실패:', error);
        }
      } else {
        console.log('📱 Android: 그룹 정보를 사용하지 않습니다. 모든 연락처는 "연락처 동기화" 그룹으로 처리됩니다.');
      }

      const validContacts: DeviceContact[] = [];

      for (const contact of contacts) {
        // 이름과 전화번호가 있는 연락처만 처리
        if (!contact.name || !contact.phoneNumbers || contact.phoneNumbers.length === 0) {
          continue;
        }

        // 플랫폼별 그룹 정보 처리
        let groupName = '연락처 동기화'; // 기본값
        
        if (Platform.OS === 'ios' && contact.groupMembership && contact.groupMembership.length > 0) {
          // iOS에서만 실제 그룹 정보 사용
          const firstGroupId = contact.groupMembership[0];
          const actualGroupName = groupMap.get(firstGroupId);
          if (actualGroupName) {
            groupName = actualGroupName;
            console.log(`📱 iOS: 연락처 ${contact.name}의 그룹: ${groupName}`);
          }
        }
        // Android는 항상 "연락처 동기화" 그룹 사용 (별도 처리 불필요)

        // 모든 전화번호 처리
        for (const phoneData of contact.phoneNumbers) {
          if (!phoneData?.number) {
            continue;
          }

          // 전화번호 정제 및 유효성 검사
          const cleanedPhone = this.cleanPhoneNumber(phoneData.number);
          if (!isValidKoreanPhoneNumber(cleanedPhone)) {
            continue;
          }

          validContacts.push({
            id: contact.id || `${contact.name}-${cleanedPhone}`,
            name: contact.name,
            phoneNumber: cleanedPhone,
            formattedPhoneNumber: formatPhoneNumber(cleanedPhone),
            groupName: groupName
          });
        }
      }

      console.log(`✅ 유효한 연락처 ${validContacts.length}개 추출 완료`);
      return validContacts;

    } catch (error) {
      console.error('디바이스 연락처 가져오기 실패:', error);
      throw new Error('연락처를 가져올 수 없습니다.');
    }
  }

  /**
   * 전화번호 정제 (특수문자, 공백 제거)
   */
  private cleanPhoneNumber(phoneNumber: string): string {
    // 숫자만 남기고 모든 특수문자, 공백 제거
    let cleaned = phoneNumber.replace(/[^\d]/g, '');
    
    // 국가코드 처리
    if (cleaned.startsWith('82')) {
      // +82 10... -> 010...
      cleaned = '0' + cleaned.substring(2);
    } else if (cleaned.startsWith('+82')) {
      // +8210... -> 010...
      cleaned = '0' + cleaned.substring(3);
    }

    return cleaned;
  }

  /**
   * 서버의 기존 연락처와 비교하여 동기화
   */
  async syncContactsWithServer(deviceContacts: DeviceContact[], groupName?: string): Promise<ContactSyncResult> {
    const result: ContactSyncResult = {
      totalContacts: deviceContacts.length,
      newContacts: 0,
      updatedContacts: 0,
      errors: 0,
      duplicates: 0
    };

    // 기본 그룹명은 새 연락처에만 사용
    // const defaultGroupName = groupName || '연락처 동기화'; // 제거됨

    try {
      // 서버에서 기존 연락처 가져오기 (전체)
      console.log('🔄 서버 연락처 목록 조회 중...');
      const existingContacts = await this.getAllServerContacts();
      const existingPhoneMap = new Map<string, Phonebook>();
      
      // 전화번호를 키로 하는 맵 생성
      existingContacts.forEach(contact => {
        const cleanPhone = unformatPhoneNumber(contact.phone_number);
        existingPhoneMap.set(cleanPhone, contact);
      });

      console.log(`📋 서버에 ${existingContacts.length}개의 기존 연락처가 있습니다.`);

      // 디바이스 연락처를 하나씩 처리
      for (const deviceContact of deviceContacts) {
        try {
          const existingContact = existingPhoneMap.get(deviceContact.phoneNumber);

          if (existingContact) {
            // 기존 연락처가 있는 경우 - 무시 (업데이트하지 않음)
            console.log(`⏭️ 기존 연락처 무시: ${deviceContact.name} (${deviceContact.formattedPhoneNumber})`);
            result.duplicates++;
          } else {
            // 새로운 연락처 추가 - 항상 "연락처 동기화" 그룹으로 저장
            const newContactGroupName = '연락처 동기화';
            console.log(`➕ 새 연락처 추가: ${deviceContact.name} (${deviceContact.formattedPhoneNumber})`);
            console.log(`🏷️ 그룹: ${newContactGroupName}`);
            
            await phonebookApiService.create({
              name: deviceContact.name,
              phone_number: deviceContact.phoneNumber,
              group_name: newContactGroupName
            });
            
            result.newContacts++;
          }

          // API 호출 과부하 방지를 위한 지연
          await this.delay(100);

        } catch (error) {
          console.error(`연락처 처리 실패 (${deviceContact.name}):`, error);
          result.errors++;
        }
      }

      console.log('✅ 연락처 동기화 완료:', result);
      
      // 성공적으로 동기화가 완료되면 마지막 동기화 시점 저장
      await this.saveLastSyncTime();
      
      return result;

    } catch (error) {
      console.error('연락처 동기화 실패:', error);
      throw new Error('연락처 동기화 중 오류가 발생했습니다.');
    }
  }

  /**
   * 서버의 모든 연락처 가져오기
   */
  private async getAllServerContacts(): Promise<Phonebook[]> {
    try {
      console.log('📋 서버 전체 연락처 조회 시작...');
      const allContacts = await phonebookApiService.getAllContacts();
      console.log(`✅ 서버 연락처 ${allContacts.length}개 조회 완료`);
      return allContacts;
    } catch (error) {
      console.error('새로운 getAllContacts 실패, fallback 사용:', error);
      
      // Fallback: 기존 방식으로 조회
      console.log('📋 Fallback: 페이지별 조회 방식 사용...');
      const allContacts: Phonebook[] = [];
      let page = 1;
      const size = 1000; // 크기 증가

      try {
        while (true) {
          const response = await phonebookApiService.list({ page, size });
          
          if (response.items.length === 0) {
            break;
          }
          
          allContacts.push(...response.items);
          console.log(`📄 페이지 ${page}: ${response.items.length}개 조회, 총 ${allContacts.length}개`);
          
          // 더 이상 데이터가 없으면 종료
          if (response.items.length < size) {
            break;
          }
          
          page++;
        }

        console.log(`✅ Fallback으로 총 ${allContacts.length}개 조회 완료`);
        return allContacts;
      } catch (fallbackError) {
        console.error('Fallback도 실패:', fallbackError);
        throw new Error('서버 연락처를 가져올 수 없습니다.');
      }
    }
  }

  /**
   * 지연 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 전체 동기화 프로세스 실행
   */
  async performFullSync(groupName?: string): Promise<ContactSyncResult> {
    console.log(`🚀 연락처 동기화 시작... (그룹: ${groupName || '전체'})`);

    try {
      // 0. 먼저 현재 권한 상태 확인
      const currentPermission = await this.checkContactsPermission();
      console.log('📋 현재 권한 상태:', currentPermission);
      
      if (currentPermission === 'unavailable') {
        throw new Error('연락처 모듈을 사용할 수 없습니다. 새로운 development build가 필요합니다.');
      }

      // 1. 권한 확인/요청
      const hasPermission = await this.requestContactsPermission();
      if (!hasPermission) {
        throw new Error('연락처 접근 권한이 필요합니다.');
      }

      // 2. 디바이스 연락처 가져오기
      const deviceContacts = await this.getDeviceContacts();
      
      if (deviceContacts.length === 0) {
        Alert.alert('알림', '동기화할 연락처가 없습니다.');
        return {
          totalContacts: 0,
          newContacts: 0,
          updatedContacts: 0,
          errors: 0,
          duplicates: 0
        };
      }

      // 3. 서버와 동기화 (그룹명 전달)
      return await this.syncContactsWithServer(deviceContacts, groupName);
    } catch (error) {
      console.error('연락처 동기화 실패:', error);
      
      // 네이티브 모듈 관련 오류인 경우 특별한 처리
      if (error instanceof Error && error.message.includes('새로운 development build가 필요합니다')) {
        Alert.alert(
          'Development Build 필요',
          'expo-contacts 네이티브 모듈을 사용하려면 새로운 development build가 필요합니다.\n\n해결 방법:\n1. EAS Build를 사용하여 새로운 development build 생성\n2. 또는 production build 사용',
          [{ text: '확인' }]
        );
      } else if (error instanceof Error && error.message.includes('권한')) {
        // 권한 관련 오류는 이미 위에서 처리됨
        console.log('권한 관련 오류 - 사용자에게 이미 안내됨');
      } else {
        Alert.alert(
          '동기화 실패',
          error instanceof Error ? error.message : '연락처 동기화 중 오류가 발생했습니다.',
          [{ text: '확인' }]
        );
      }
      
      throw error;
    }
  }

  /**
   * 디바이스 연락처 그룹 정보 가져오기
   */
  async getDeviceGroups(): Promise<{ group_name: string, count: number }[]> {
    try {
      const Contacts = await getContactsModule();

      // 필드 배열을 안전하게 구성 (null 값 완전 제거)
      const contactFields = [];
      
      if (Contacts.Fields?.Name) {
        contactFields.push(Contacts.Fields.Name);
      }
      
      if (Contacts.Fields?.PhoneNumbers) {
        contactFields.push(Contacts.Fields.PhoneNumbers);
      }
      
      // GroupMembership 필드는 선택적으로 추가 (지원되지 않을 수 있음)
      if (Contacts.Fields?.GroupMembership) {
        console.log('📱 GroupMembership 필드 지원됨');
        contactFields.push(Contacts.Fields.GroupMembership);
      } else {
        console.log('📱 GroupMembership 필드 지원되지 않음 - 기본 그룹 사용');
      }

      console.log('📱 사용할 필드들:', contactFields);

      // 연락처 데이터 가져오기
      const contactsData = await Contacts.getContactsAsync({
        fields: contactFields,
        sort: Contacts.SortTypes.FirstName,
      });

      const contacts = contactsData.data;
      console.log(`📱 디바이스에서 ${contacts.length}개 연락처 발견`);

      // 플랫폼별 그룹 정보 처리
      let groupMap = new Map<string, string>();
      
      if (Platform.OS === 'ios') {
        // iOS에서만 그룹 정보 가져오기
        try {
          if (Contacts.getGroupsAsync) {
            const groupsData = await Contacts.getGroupsAsync();
            const groups = groupsData || [];
            console.log(`📱 iOS: ${groups.length}개 그룹 발견`);
            
            groups.forEach((group: any) => {
              if (group.id && group.name) {
                groupMap.set(group.id, group.name);
              }
            });
          }
        } catch (error) {
          console.warn('📱 iOS: 그룹 정보 가져오기 실패:', error);
        }
      } else {
        console.log('📱 Android: 모든 연락처는 "연락처 동기화" 그룹으로 처리됩니다.');
      }

      // 그룹별 연락처 수 계산
      const groupCountMap = new Map<string, number>();

      for (const contact of contacts) {
        // 이름과 전화번호가 있는 연락처만 계산
        if (!contact.name || !contact.phoneNumbers || contact.phoneNumbers.length === 0) {
          continue;
        }

        // 유효한 한국 전화번호가 있는지 확인
        const hasValidPhone = contact.phoneNumbers.some((phone: any) => {
          if (!phone?.number) return false;
          const cleanedPhone = this.cleanPhoneNumber(phone.number);
          return isValidKoreanPhoneNumber(cleanedPhone);
        });

        if (!hasValidPhone) {
          continue;
        }

        // 플랫폼별 그룹 정보 처리
        if (Platform.OS === 'ios' && contact.groupMembership && contact.groupMembership.length > 0) {
          // iOS에서만 실제 그룹 정보 사용
          const groupId = contact.groupMembership[0];
          const groupName = groupMap.get(groupId);
          if (groupName) {
            groupCountMap.set(groupName, (groupCountMap.get(groupName) || 0) + 1);
          } else {
            // 그룹이 매핑되지 않은 경우 기본 그룹 사용
            const defaultGroup = '연락처 동기화';
            groupCountMap.set(defaultGroup, (groupCountMap.get(defaultGroup) || 0) + 1);
          }
        } else {
          // Android 또는 그룹이 없는 연락처는 "연락처 동기화" 그룹으로 분류
          const defaultGroup = '연락처 동기화';
          groupCountMap.set(defaultGroup, (groupCountMap.get(defaultGroup) || 0) + 1);
        }
      }

      // 결과 배열 생성
      const result = Array.from(groupCountMap.entries()).map(([groupName, count]) => ({
        group_name: groupName,
        count: count
      }));

      console.log(`📱 디바이스 그룹 통계:`, result);
      return result;

    } catch (error) {
      console.error('디바이스 그룹 정보 가져오기 실패:', error);
      return [];
    }
  }
}

export const contactSyncService = new ContactSyncService();
