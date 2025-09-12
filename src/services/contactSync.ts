import { Alert, Linking, Platform } from 'react-native';
import { phonebookApiService, type Phonebook } from '../api/services/phonebook';
import { formatPhoneNumber, isValidKoreanPhoneNumber, unformatPhoneNumber } from '../utils/phoneFormat';

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
  updatedContacts: number;
  errors: number;
  duplicates: number;
}

export interface DeviceContact {
  id: string;
  name: string;
  phoneNumber: string;
  formattedPhoneNumber: string;
}

class ContactSyncService {
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
      
      const { data: contacts } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        sort: Contacts.SortTypes.FirstName,
      });

      console.log(`📱 디바이스에서 ${contacts.length}개의 연락처를 가져왔습니다.`);

      const validContacts: DeviceContact[] = [];

      for (const contact of contacts) {
        // 이름과 전화번호가 있는 연락처만 처리
        if (!contact.name || !contact.phoneNumbers || contact.phoneNumbers.length === 0) {
          continue;
        }

        // 첫 번째 전화번호 사용
        const primaryPhone = contact.phoneNumbers[0];
        if (!primaryPhone?.number) {
          continue;
        }

        // 전화번호 정제 및 유효성 검사
        const cleanedPhone = this.cleanPhoneNumber(primaryPhone.number);
        if (!isValidKoreanPhoneNumber(cleanedPhone)) {
          continue;
        }

        validContacts.push({
          id: contact.id || '',
          name: contact.name,
          phoneNumber: cleanedPhone,
          formattedPhoneNumber: formatPhoneNumber(cleanedPhone)
        });
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
  async syncContactsWithServer(deviceContacts: DeviceContact[]): Promise<ContactSyncResult> {
    const result: ContactSyncResult = {
      totalContacts: deviceContacts.length,
      newContacts: 0,
      updatedContacts: 0,
      errors: 0,
      duplicates: 0
    };

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
            // 기존 연락처가 있는 경우 - 이름 업데이트 검토
            if (existingContact.name !== deviceContact.name && 
                existingContact.name !== '신원미상') {
              
              console.log(`🔄 연락처 업데이트: ${existingContact.name} -> ${deviceContact.name}`);
              
              await phonebookApiService.update(existingContact.id, {
                name: deviceContact.name,
                phone_number: deviceContact.phoneNumber
              });
              
              result.updatedContacts++;
            } else {
              result.duplicates++;
            }
          } else {
            // 새로운 연락처 추가
            console.log(`➕ 새 연락처 추가: ${deviceContact.name} (${deviceContact.formattedPhoneNumber})`);
            
            await phonebookApiService.create({
              name: deviceContact.name,
              phone_number: deviceContact.phoneNumber,
              group_name: '연락처 동기화' // 동기화된 연락처임을 표시
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
    const allContacts: Phonebook[] = [];
    let page = 1;
    const size = 100;

    try {
      while (true) {
        const response = await phonebookApiService.list({ page, size });
        
        if (response.items.length === 0) {
          break;
        }
        
        allContacts.push(...response.items);
        
        // 더 이상 데이터가 없으면 종료
        if (response.items.length < size) {
          break;
        }
        
        page++;
      }

      return allContacts;
    } catch (error) {
      console.error('서버 연락처 조회 실패:', error);
      throw error;
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
  async performFullSync(): Promise<ContactSyncResult> {
    console.log('🚀 연락처 동기화 시작...');

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

      // 3. 서버와 동기화
      return await this.syncContactsWithServer(deviceContacts);
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
}

export const contactSyncService = new ContactSyncService();
