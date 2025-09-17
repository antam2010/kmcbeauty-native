import { phonebookApiService, type Phonebook } from '@/src/api/services/phonebook';
import { BaseButton } from '@/src/ui/atoms/BaseButton';
import { BaseInput } from '@/src/ui/atoms/BaseInput';
import { BaseModal } from '@/src/ui/molecules/BaseModal';
import { BorderRadius, Colors, Spacing, Typography } from '@/src/ui/theme';

import { extractNameAndPhone, formatPhoneNumber, handlePhoneInputChange, isValidKoreanPhoneNumber, unformatPhoneNumber } from '@/src/utils/phoneFormat';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface CustomerRegistrationModalProps {
  visible: boolean;
  onClose: () => void;
  onCustomerRegistered: (customer: Phonebook) => void;
  initialPhone?: string;
  initialName?: string;
  quickMode?: boolean; // 빠른 등록 모드 (신원미상 + 전화번호만)
}

export default function CustomerRegistrationModal({
  visible,
  onClose,
  onCustomerRegistered,
  initialPhone = '',
  initialName = '',
  quickMode = false
}: CustomerRegistrationModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  // 모달이 열릴 때 초기값 설정
  React.useEffect(() => {
    if (visible) {
      loadGroups(); // 그룹 목록 로드
      
      if (quickMode) {
        // 빠른 등록 모드: 신원미상 + 전화번호
        setName('신원미상');
        setPhone(formatPhoneNumber(initialPhone));
        setSelectedGroup(''); // 기본 그룹 없음
      } else {
        // 일반 모드: 입력값에서 이름과 전화번호 분리
        const { name: extractedName, phone: extractedPhone } = extractNameAndPhone(initialPhone || '');
        setName(initialName || extractedName || '');
        setPhone(formatPhoneNumber(extractedPhone || initialPhone));
        setSelectedGroup(''); // 기본 그룹 없음
      }
    }
  }, [visible, initialPhone, initialName, quickMode]);

  // 그룹 목록 로드
  const loadGroups = async () => {
    try {
      setIsLoadingGroups(true);
      const groups = await phonebookApiService.getGroups();
      const groupNames = groups.map(group => group.group_name).filter(Boolean);
      setAvailableGroups(groupNames);
    } catch (error) {
      console.warn('그룹 목록 로드 실패:', error);
      setAvailableGroups([]);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const handlePhoneChange = (newPhone: string) => {
    const { formattedValue } = handlePhoneInputChange(phone, newPhone);
    setPhone(formattedValue);
  };

  const handleQuickRegister = async () => {
    const unformattedPhone = unformatPhoneNumber(phone);

    if (!isValidKoreanPhoneNumber(unformattedPhone)) {
      Alert.alert('알림', '올바른 전화번호를 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);

      // 전화번호 중복 체크
      try {
        const existingCustomers = await phonebookApiService.search(unformattedPhone);
        if (existingCustomers.length > 0) {
          Alert.alert(
            '중복된 전화번호',
            `이미 등록된 전화번호입니다.\n고객명: ${existingCustomers[0].name}`,
            [{ text: '확인' }]
          );
          return;
        }
      } catch (error) {
        console.warn('중복 체크 실패:', error);
      }

      // 신원미상으로 등록
      const newCustomer = await phonebookApiService.create({
        name: '신원미상',
        phone_number: unformattedPhone,
        group_name: selectedGroup || undefined,
        memo: '빠른 등록으로 생성된 고객'
      });

      Alert.alert(
        '등록 완료',
        '신원미상 고객으로 등록되었습니다.\n나중에 정확한 이름으로 수정할 수 있습니다.',
        [
          {
            text: '확인',
            onPress: () => {
              onCustomerRegistered(newCustomer);
              handleClose();
            }
          }
        ]
      );

    } catch (error) {
      console.error('빠른 등록 실패:', error);
      Alert.alert('오류', '고객 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const unformattedPhone = unformatPhoneNumber(phone);

    if (!trimmedName) {
      Alert.alert('알림', '고객 이름을 입력해주세요.');
      return;
    }

    if (!isValidKoreanPhoneNumber(unformattedPhone)) {
      Alert.alert('알림', '올바른 전화번호를 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);

      // 전화번호 중복 체크
      try {
        const existingCustomers = await phonebookApiService.search(unformattedPhone);
        if (existingCustomers.length > 0) {
          Alert.alert(
            '중복된 전화번호',
            `이미 등록된 전화번호입니다.\n고객명: ${existingCustomers[0].name}`,
            [{ text: '확인' }]
          );
          return;
        }
      } catch (error) {
        console.warn('중복 체크 실패:', error);
      }

      // 정확한 정보로 등록
      const newCustomer = await phonebookApiService.create({
        name: trimmedName,
        phone_number: unformattedPhone,
        group_name: selectedGroup || undefined,
        memo: ''
      });

      Alert.alert(
        '등록 완료',
        `${trimmedName} 고객이 성공적으로 등록되었습니다.`,
        [
          {
            text: '확인',
            onPress: () => {
              onCustomerRegistered(newCustomer);
              handleClose();
            }
          }
        ]
      );

    } catch (error) {
      console.error('고객 등록 실패:', error);
      Alert.alert('오류', '고객 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setPhone('');
    setSelectedGroup('');
    onClose();
  };

  const isFormValid = name.trim().length > 0 && isValidKoreanPhoneNumber(unformatPhoneNumber(phone));

  const renderContent = () => (
    <ScrollView 
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* 고객 이름 */}
      <BaseInput
        label="👤 고객 이름"
        placeholder="고객 이름을 입력하세요"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoCorrect={false}
        editable={!quickMode}
      />

      {/* 전화번호 */}
      <BaseInput
        label="📞 전화번호"
        placeholder="010-1234-5678"
        value={phone}
        onChangeText={handlePhoneChange}
        keyboardType="phone-pad"
        autoCorrect={false}
        maxLength={13}
        hasSuccess={isValidKoreanPhoneNumber(unformatPhoneNumber(phone)) && phone.length > 0}
        hasError={phone.length > 0 && !isValidKoreanPhoneNumber(unformatPhoneNumber(phone))}
        success={isValidKoreanPhoneNumber(unformatPhoneNumber(phone)) && phone.length > 0 ? "✓ 올바른 전화번호입니다" : undefined}
        error={phone.length > 0 && !isValidKoreanPhoneNumber(unformatPhoneNumber(phone)) ? "⚠ 올바른 전화번호를 입력해주세요" : undefined}
      />

      {/* 그룹 선택 */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>👥 그룹 선택 (선택사항)</Text>
        {isLoadingGroups ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>그룹 목록 로딩...</Text>
          </View>
        ) : (
          <View style={styles.groupContainer}>
            {/* 그룹 없음 옵션 */}
            <TouchableOpacity
              style={[
                styles.groupOption,
                selectedGroup === '' && styles.selectedGroupOption
              ]}
              onPress={() => setSelectedGroup('')}
            >
              <Text style={[
                styles.groupOptionText,
                selectedGroup === '' && styles.selectedGroupOptionText
              ]}>
                그룹 없음
              </Text>
            </TouchableOpacity>
            
            {/* 기존 그룹들 */}
            {availableGroups.map((groupName) => (
              <TouchableOpacity
                key={groupName}
                style={[
                  styles.groupOption,
                  selectedGroup === groupName && styles.selectedGroupOption
                ]}
                onPress={() => setSelectedGroup(groupName)}
              >
                <Text style={[
                  styles.groupOptionText,
                  selectedGroup === groupName && styles.selectedGroupOptionText
                ]}>
                  {groupName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* 등록 버튼들 */}
      <View style={styles.buttonGroup}>
        {quickMode ? (
          /* 빠른 등록 모드: 하나의 버튼만 표시 */
          <BaseButton
            title="✅ 신원미상으로 등록하기"
            onPress={handleQuickRegister}
            disabled={!isValidKoreanPhoneNumber(unformatPhoneNumber(phone)) || isLoading}
            loading={isLoading}
            variant="primary"
            size="lg"
          />
        ) : (
          /* 일반 모드: 두 옵션 모두 표시 */
          <>
            {/* 빠른 등록 버튼 (전화번호만 필요) */}
            <BaseButton
              title="⚡ 빠른 등록 (신원미상)"
              onPress={handleQuickRegister}
              disabled={!isValidKoreanPhoneNumber(unformatPhoneNumber(phone)) || isLoading}
              loading={isLoading}
              variant="secondary"
              size="lg"
            />

            {/* 일반 등록 버튼 (이름 + 전화번호) */}
            <BaseButton
              title="✅ 정확한 정보로 등록하기"
              onPress={handleRegister}
              disabled={!isFormValid || isLoading}
              loading={isLoading}
              variant="primary"
              size="lg"
            />
          </>
        )}
      </View>

      {/* 안내 메시지 */}
      <Text style={styles.helpText}>
        {quickMode 
          ? "💡 빠른 등록으로 즉시 예약이 가능합니다. 나중에 이름을 수정할 수 있습니다."
          : "💡 빠른 등록: 즉시 예약 가능, 나중에 이름 수정 가능\n정확한 등록: 완전한 고객 정보로 등록"
        }
      </Text>
    </ScrollView>
  );

  return (
    <BaseModal
      visible={visible}
      onClose={handleClose}
      title="새 고객 등록"
      transparent
      closeButtonPosition="left"
    >
      {renderContent()}
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    padding: Spacing.lg,
  },

  inputGroup: {
    marginBottom: Spacing.lg,
  },

  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },

  loadingText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },

  groupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },

  groupOption: {
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.gray[100],
  },

  selectedGroupOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },

  groupOptionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
  },

  selectedGroupOptionText: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold,
  },

  buttonGroup: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },

  helpText: {
    marginTop: Spacing.lg,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
