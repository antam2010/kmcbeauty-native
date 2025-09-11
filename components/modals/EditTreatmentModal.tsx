import { useDashboard } from '@/contexts/DashboardContext';
import { treatmentAPI } from '@/src/features/booking/api';
import type { Treatment, TreatmentUpdate } from '@/src/types/treatment';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface EditTreatmentModalProps {
  visible: boolean;
  treatment: Treatment;
  onClose: () => void;
  onUpdateSuccess?: () => void;
}

export default function EditTreatmentModal({
  visible,
  treatment,
  onClose,
  onUpdateSuccess
}: EditTreatmentModalProps) {
  const insets = useSafeAreaInsets();
  const { triggerRefresh } = useDashboard();
  const [loading, setLoading] = useState(false);
  
  // 모달 상태 디버깅
  React.useEffect(() => {
    console.log('EditTreatmentModal visible 상태 변경:', visible);
    console.log('EditTreatmentModal treatment:', treatment?.id, treatment?.phonebook?.name);
  }, [visible, treatment]);

  // 편집 가능한 상태들
  const [memo, setMemo] = useState(treatment.memo || '');
  const [status, setStatus] = useState<Treatment['status']>(treatment.status);
  const [paymentMethod, setPaymentMethod] = useState<Treatment['payment_method']>(treatment.payment_method);
  const [reservedDate, setReservedDate] = useState(
    new Date(treatment.reserved_at).toISOString().split('T')[0]
  );
  const [reservedTime, setReservedTime] = useState(
    new Date(treatment.reserved_at).toTimeString().slice(0, 5)
  );

  const statusOptions: { value: Treatment['status']; label: string; color: string }[] = [
    { value: 'RESERVED', label: '예약', color: '#007bff' },
    { value: 'VISITED', label: '방문', color: '#28a745' },
    { value: 'COMPLETED', label: '완료', color: '#6f42c1' },
    { value: 'CANCELLED', label: '취소', color: '#dc3545' },
    { value: 'NO_SHOW', label: '노쇼', color: '#fd7e14' },
  ];

  const paymentOptions: { value: Treatment['payment_method']; label: string }[] = [
    { value: 'CARD', label: '카드' },
    { value: 'CASH', label: '현금' },
    { value: 'UNPAID', label: '외상' },
  ];

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // 날짜와 시간 결합
      const reservedAt = new Date(`${reservedDate}T${reservedTime}:00`).toISOString();
      
      const updateData: TreatmentUpdate = {
        phonebook_id: treatment.phonebook_id,
        reserved_at: reservedAt,
        memo: memo || null,
        status,
        payment_method: paymentMethod,
        staff_user_id: treatment.staff_user_id,
        treatment_items: treatment.treatment_items.map(item => ({
          id: item.id,
          menu_detail_id: item.menu_detail_id,
          base_price: item.base_price,
          duration_min: item.duration_min,
          session_no: item.session_no,
        }))
      };

      await treatmentAPI.update(treatment.id, updateData);
      
      // 대시보드 새로고침 트리거
      triggerRefresh();
      
      Alert.alert('성공', '예약이 수정되었습니다.');
      onUpdateSuccess?.();
      onClose();
    } catch (error) {
      console.error('예약 수정 실패:', error);
      Alert.alert('오류', '예약 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => {
        console.log('EditTreatmentModal onRequestClose 호출됨');
        onClose();
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              console.log('수정 모달 닫기 버튼 클릭됨');
              onClose();
            }}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>예약 수정</Text>
            <Text style={styles.headerSubtitle}>
              {treatment.phonebook.name}님의 예약
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={() => {
              console.log('저장 버튼 클릭됨, loading:', loading);
              if (!loading) {
                handleSave();
              }
            }}
            disabled={loading}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.saveButtonText}>
              {loading ? '저장 중...' : '저장'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* 고객 정보 (읽기 전용) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 고객 정보</Text>
            <View style={styles.infoCard}>
              <Text style={styles.customerName}>{treatment.phonebook.name}</Text>
              <Text style={styles.customerPhone}>{treatment.phonebook.phone_number}</Text>
            </View>
          </View>

          {/* 예약 날짜/시간 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 예약 날짜/시간</Text>
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.inputLabel}>날짜</Text>
                <TextInput
                  style={styles.input}
                  value={reservedDate}
                  onChangeText={setReservedDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={styles.timeInputContainer}>
                <Text style={styles.inputLabel}>시간</Text>
                <TextInput
                  style={styles.input}
                  value={reservedTime}
                  onChangeText={setReservedTime}
                  placeholder="HH:MM"
                />
              </View>
            </View>
          </View>

          {/* 예약 상태 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 예약 상태</Text>
            <View style={styles.optionGrid}>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    status === option.value && { backgroundColor: option.color }
                  ]}
                  onPress={() => {
                    console.log('상태 옵션 클릭됨:', option.value);
                    setStatus(option.value);
                  }}
                  activeOpacity={0.6}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  <Text style={[
                    styles.optionText,
                    status === option.value && styles.optionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 결제 방법 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💳 결제 방법</Text>
            <View style={styles.optionGrid}>
              {paymentOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    paymentMethod === option.value && styles.optionButtonSelected
                  ]}
                  onPress={() => {
                    console.log('결제방법 옵션 클릭됨:', option.value);
                    setPaymentMethod(option.value);
                  }}
                  activeOpacity={0.6}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  <Text style={[
                    styles.optionText,
                    paymentMethod === option.value && styles.optionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 시술 항목 (읽기 전용) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💄 시술 항목</Text>
            {treatment.treatment_items.map((item, index) => (
              <View key={index} style={styles.treatmentCard}>
                <View style={styles.treatmentCardHeader}>
                  <Text style={styles.treatmentName}>
                    {item.menu_detail?.name || '시술명 정보 없음'}
                  </Text>
                  <Text style={styles.sessionBadge}>{item.session_no}회차</Text>
                </View>
                <View style={styles.treatmentDetails}>
                  <Text style={styles.treatmentDetail}>
                    💰 {item.base_price.toLocaleString()}원
                  </Text>
                  <Text style={styles.treatmentDetail}>
                    ⏱️ {item.duration_min}분
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* 메모 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 메모</Text>
            <TextInput
              style={styles.memoInput}
              value={memo}
              onChangeText={setMemo}
              placeholder="메모를 입력하세요..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6c757d',
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  saveButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
    minHeight: 44,
  },
  saveButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 16,
    color: '#6c757d',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputContainer: {
    flex: 2,
  },
  timeInputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
    fontSize: 16,
    color: '#212529',
    minHeight: 48,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 25,
    backgroundColor: '#e9ecef',
    borderWidth: 1,
    borderColor: '#dee2e6',
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  optionText: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '600',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
  treatmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  treatmentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  treatmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
  },
  sessionBadge: {
    fontSize: 12,
    color: '#495057',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '500',
  },
  treatmentDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  treatmentDetail: {
    fontSize: 14,
    color: '#6c757d',
  },
  memoInput: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
    fontSize: 16,
    color: '#212529',
    minHeight: 120,
    textAlignVertical: 'top',
  },
});
