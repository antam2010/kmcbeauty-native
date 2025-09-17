import { phonebookApiService, type Phonebook } from '@/src/api/services/phonebook';
import { Button, TextInput as CustomTextInput } from '@/src/ui/atoms';

import { extractNameAndPhone, formatPhoneNumber, handlePhoneInputChange, isValidKoreanPhoneNumber, unformatPhoneNumber } from '@/src/utils/phoneFormat';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { customerRegistrationModalStyles } from './CustomerRegistrationModal.styles';

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
  const insets = useSafeAreaInsets();

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
            '알림', 
            `이미 등록된 전화번호입니다.\n고객명: ${existingCustomers[0].name}`,
            [
              { text: '취소', style: 'cancel' },
              { 
                text: '선택하기', 
                onPress: () => {
                  onCustomerRegistered(existingCustomers[0]);
                  handleClose();
                }
              }
            ]
          );
          return;
        }
      } catch (error) {
        console.warn('전화번호 중복 체크 실패:', error);
      }

      // 신원미상으로 새 고객 등록
      const newCustomer = await phonebookApiService.create({
        name: '신원미상',
        phone_number: unformattedPhone,
        group_name: selectedGroup || ''
      });

      Alert.alert('완료', '고객이 성공적으로 등록되었습니다!', [
        {
          text: '확인',
          onPress: () => {
            onCustomerRegistered(newCustomer);
            handleClose();
          }
        }
      ]);

    } catch (error) {
      console.error('고객 등록 실패:', error);
      Alert.alert('오류', '고객 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const unformattedPhone = unformatPhoneNumber(phone);

    // 유효성 검사
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
            '알림', 
            `이미 등록된 전화번호입니다.\n고객명: ${existingCustomers[0].name}`,
            [
              { text: '취소', style: 'cancel' },
              { 
                text: '선택하기', 
                onPress: () => {
                  onCustomerRegistered(existingCustomers[0]);
                  handleClose();
                }
              }
            ]
          );
          return;
        }
      } catch (error) {
        // 검색 실패는 무시하고 계속 진행
        console.warn('전화번호 중복 체크 실패:', error);
      }

      // 새 고객 등록
      const newCustomer = await phonebookApiService.create({
        name: trimmedName,
        phone_number: unformattedPhone,
        group_name: selectedGroup || ''
      });

      Alert.alert('완료', '고객이 성공적으로 등록되었습니다!', [
        {
          text: '확인',
          onPress: () => {
            onCustomerRegistered(newCustomer);
            handleClose();
          }
        }
      ]);

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={customerRegistrationModalStyles.overlay}>
            <View style={[customerRegistrationModalStyles.container, { paddingBottom: insets.bottom + 20, maxHeight: '90%' }]}>
              {/* 헤더 */}
              <View style={customerRegistrationModalStyles.header}>
                <TouchableOpacity onPress={handleClose}>
                  <Text style={customerRegistrationModalStyles.closeButton}>✕</Text>
                </TouchableOpacity>
                <Text style={customerRegistrationModalStyles.title}>새 고객 등록</Text>
                <View style={{ width: 24 }} />
              </View>

              {/* 스크롤 가능한 폼 */}
              <ScrollView 
                style={customerRegistrationModalStyles.scrollForm}
                contentContainerStyle={customerRegistrationModalStyles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* 고객 이름 */}
                <View style={customerRegistrationModalStyles.inputGroup}>
                  <Text style={customerRegistrationModalStyles.label}>👤 고객 이름</Text>
                  <CustomTextInput
                    style={customerRegistrationModalStyles.input}
                    placeholder="고객 이름을 입력하세요"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => {
                      // 다음 입력 필드로 포커스 이동 (전화번호 입력)
                    }}
                  />
                </View>

                {/* 전화번호 */}
                <View style={customerRegistrationModalStyles.inputGroup}>
                  <Text style={customerRegistrationModalStyles.label}>📞 전화번호</Text>
                  <CustomTextInput
                    style={[
                      customerRegistrationModalStyles.input,
                      isValidKoreanPhoneNumber(unformatPhoneNumber(phone)) && customerRegistrationModalStyles.validInput
                    ]}
                    placeholder="010-1234-5678"
                    value={phone}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                    maxLength={13} // 010-1234-5678 형식 최대 길이
                  />
                  {phone.length > 0 && (
                    <Text style={[
                      customerRegistrationModalStyles.validationText,
                      isValidKoreanPhoneNumber(unformatPhoneNumber(phone)) 
                        ? customerRegistrationModalStyles.validText 
                        : customerRegistrationModalStyles.invalidText
                    ]}>
                      {isValidKoreanPhoneNumber(unformatPhoneNumber(phone)) 
                        ? '✓ 올바른 전화번호입니다' 
                        : '⚠ 올바른 전화번호를 입력해주세요'}
                    </Text>
                  )}
                </View>

                {/* 그룹 선택 */}
                <View style={customerRegistrationModalStyles.inputGroup}>
                  <Text style={customerRegistrationModalStyles.label}>👥 그룹 선택 (선택사항)</Text>
                  {isLoadingGroups ? (
                    <View style={customerRegistrationModalStyles.loadingContainer}>
                      <ActivityIndicator size="small" color="#667eea" />
                      <Text style={customerRegistrationModalStyles.loadingText}>그룹 목록 로딩...</Text>
                    </View>
                  ) : (
                    <View style={customerRegistrationModalStyles.groupContainer}>
                      {/* 그룹 없음 옵션 */}
                      <TouchableOpacity
                        style={[
                          customerRegistrationModalStyles.groupOption,
                          selectedGroup === '' && customerRegistrationModalStyles.selectedGroupOption
                        ]}
                        onPress={() => setSelectedGroup('')}
                      >
                        <Text style={[
                          customerRegistrationModalStyles.groupOptionText,
                          selectedGroup === '' && customerRegistrationModalStyles.selectedGroupOptionText
                        ]}>
                          그룹 없음
                        </Text>
                      </TouchableOpacity>
                      
                      {/* 기존 그룹들 */}
                      {availableGroups.map((groupName) => (
                        <TouchableOpacity
                          key={groupName}
                          style={[
                            customerRegistrationModalStyles.groupOption,
                            selectedGroup === groupName && customerRegistrationModalStyles.selectedGroupOption
                          ]}
                          onPress={() => setSelectedGroup(groupName)}
                        >
                          <Text style={[
                            customerRegistrationModalStyles.groupOptionText,
                            selectedGroup === groupName && customerRegistrationModalStyles.selectedGroupOptionText
                          ]}>
                            {groupName}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* 등록 버튼들 */}
                <View style={customerRegistrationModalStyles.buttonGroup}>
                  {quickMode ? (
                    /* 빠른 등록 모드: 하나의 버튼만 표시 */
                    <Button
                      title="✅ 신원미상으로 등록하기"
                      onPress={handleQuickRegister}
                      disabled={!isValidKoreanPhoneNumber(unformatPhoneNumber(phone)) || isLoading}
                      loading={isLoading}
                      variant="primary"
                      size="large"
                      style={customerRegistrationModalStyles.quickRegisterButton}
                    />
                  ) : (
                    /* 일반 모드: 두 옵션 모두 표시 */
                    <>
                      {/* 빠른 등록 버튼 (전화번호만 필요) */}
                      <Button
                        title="⚡ 빠른 등록 (신원미상)"
                        onPress={handleQuickRegister}
                        disabled={!isValidKoreanPhoneNumber(unformatPhoneNumber(phone)) || isLoading}
                        loading={isLoading}
                        variant="secondary"
                        size="large"
                        style={customerRegistrationModalStyles.quickRegisterButton}
                      />

                      {/* 일반 등록 버튼 (이름 + 전화번호) */}
                      <Button
                        title="✅ 정확한 정보로 등록하기"
                        onPress={handleRegister}
                        disabled={!isFormValid || isLoading}
                        loading={isLoading}
                        variant="primary"
                        size="large"
                        style={customerRegistrationModalStyles.registerButton}
                      />
                    </>
                  )}
                </View>

                {/* 안내 메시지 */}
                <Text style={customerRegistrationModalStyles.helpText}>
                  {quickMode 
                    ? "💡 빠른 등록으로 즉시 예약이 가능합니다. 나중에 이름을 수정할 수 있습니다."
                    : "💡 빠른 등록: 즉시 예약 가능, 나중에 이름 수정 가능\n정확한 등록: 완전한 고객 정보로 등록"
                  }
                </Text>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
