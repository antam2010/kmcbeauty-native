import { phonebookApiService, type Phonebook } from '@/src/api/services/phonebook';
import { shopApiService, type ShopUser } from '@/src/api/services/shop';
import { treatmentApiService } from '@/src/api/services/treatment';
import { treatmentMenuApiService, type TreatmentMenu, type TreatmentMenuDetail } from '@/src/api/services/treatmentMenu';
import type { TreatmentCreate, TreatmentItemCreate } from '@/src/types/treatment';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BookingFormProps {
  selectedDate?: string;
  reservedTimes?: string[]; // 이미 예약된 시간들
  onClose: () => void;
  onBookingComplete: () => void;
}

interface SelectedTreatmentItem {
  menuDetail: TreatmentMenuDetail;
  sessionNo: number;
}

export default function BookingForm({ 
  selectedDate, 
  reservedTimes = [],
  onClose, 
  onBookingComplete 
}: BookingFormProps) {
  // 상태 관리
  const [selectedCustomer, setSelectedCustomer] = useState<Phonebook | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Phonebook[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTreatments, setSelectedTreatments] = useState<SelectedTreatmentItem[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<ShopUser | null>(null);
  const [memo, setMemo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH' | 'UNPAID'>('CARD');
  
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);
  const [treatmentMenus, setTreatmentMenus] = useState<TreatmentMenu[]>([]);
  const [staffUsers, setStaffUsers] = useState<ShopUser[]>([]);
  const [isLoadingMenus, setIsLoadingMenus] = useState(true);
  
  const insets = useSafeAreaInsets();

  // 시간 슬롯 (30분 간격)
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30'
  ];

  // 시술 메뉴와 직원 목록 로드
  useEffect(() => {
    loadTreatmentMenus();
    loadStaffUsers();
  }, []);

  // 고객 검색
  useEffect(() => {
    const searchCustomers = async () => {
      try {
        const results = await phonebookApiService.search(customerSearch);
        setSearchResults(results);
      } catch (error) {
        console.error('고객 검색 실패:', error);
        setSearchResults([]);
      }
    };

    if (customerSearch.trim().length > 0) {
      searchCustomers();
    } else {
      setSearchResults([]);
    }
  }, [customerSearch]);

  const loadTreatmentMenus = async () => {
    try {
      setIsLoadingMenus(true);
      const menus = await treatmentMenuApiService.getAllWithDetails();
      setTreatmentMenus(menus);
    } catch (error) {
      console.error('시술 메뉴 로드 실패:', error);
      Alert.alert('오류', '시술 메뉴를 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingMenus(false);
    }
  };

  const loadStaffUsers = async () => {
    try {
      const users = await shopApiService.getCurrentShopUsers();
      setStaffUsers(users);
    } catch (error) {
      console.error('직원 목록 로드 실패:', error);
      // 직원 목록 로드는 실패해도 앱이 동작하도록 경고만 표시
      console.warn('직원 목록을 불러올 수 없습니다. 직원 선택 없이 진행됩니다.');
    }
  };

  const isTimeReserved = (time: string): boolean => {
    return reservedTimes.includes(time);
  };

  const addTreatment = (menuDetail: TreatmentMenuDetail) => {
    const newTreatment: SelectedTreatmentItem = {
      menuDetail,
      sessionNo: 1
    };
    setSelectedTreatments([...selectedTreatments, newTreatment]);
  };

  const removeTreatment = (index: number) => {
    const updated = selectedTreatments.filter((_, i) => i !== index);
    setSelectedTreatments(updated);
  };

  const updateSessionNo = (index: number, sessionNo: number) => {
    const updated = [...selectedTreatments];
    updated[index].sessionNo = Math.max(1, sessionNo);
    setSelectedTreatments(updated);
  };

  const getTotalPrice = () => {
    return selectedTreatments.reduce((total, item) => {
      return total + (item.menuDetail.base_price * item.sessionNo);
    }, 0);
  };

  const getTotalDuration = () => {
    return selectedTreatments.reduce((total, item) => {
      return total + (item.menuDetail.duration_min * item.sessionNo);
    }, 0);
  };

  const handleBooking = async () => {
    // 유효성 검사
    if (!selectedCustomer) {
      Alert.alert('알림', '고객을 선택해주세요.');
      return;
    }
    if (!selectedTime) {
      Alert.alert('알림', '시간을 선택해주세요.');
      return;
    }
    if (selectedTreatments.length === 0) {
      Alert.alert('알림', '시술을 선택해주세요.');
      return;
    }
    if (!selectedDate) {
      Alert.alert('알림', '날짜가 선택되지 않았습니다.');
      return;
    }

    try {
      setIsLoading(true);

      // ISO 형식의 예약 시간 생성
      const reservedDateTime = `${selectedDate}T${selectedTime}:00`;

      // 시술 항목들 준비
      const treatmentItems: TreatmentItemCreate[] = selectedTreatments.map(item => ({
        menu_detail_id: item.menuDetail.id,
        base_price: item.menuDetail.base_price,
        duration_min: item.menuDetail.duration_min,
        session_no: item.sessionNo
      }));

      // 시술 예약 생성
      const treatmentData: TreatmentCreate = {
        phonebook_id: selectedCustomer.id,
        reserved_at: reservedDateTime,
        memo: memo.trim() || null,
        status: 'RESERVED',
        payment_method: paymentMethod,
        staff_user_id: selectedStaff?.user_id || null,
        treatment_items: treatmentItems
      };

      await treatmentApiService.create(treatmentData);
      
      Alert.alert('완료', '예약이 성공적으로 완료되었습니다!', [
        { text: '확인', onPress: onBookingComplete }
      ]);

    } catch (error) {
      console.error('예약 생성 실패:', error);
      Alert.alert('오류', '예약 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingMenus) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>시술 메뉴를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={{
            paddingBottom: Platform.OS === 'ios' ? insets.bottom + 30 : 20
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>새 예약 만들기</Text>
            <View style={styles.placeholder} />
          </View>

          {/* 선택한 날짜 */}
          {selectedDate && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📅 선택한 날짜</Text>
              <View style={styles.dateCard}>
                <Text style={styles.dateText}>
                  {new Date(selectedDate).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </Text>
              </View>
            </View>
          )}

          {/* 고객 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 고객 선택</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="고객 이름 또는 전화번호 검색"
              value={customerSearch}
              onChangeText={setCustomerSearch}
              autoCapitalize="none"
            />
            
            {selectedCustomer && (
              <View style={styles.selectedCustomer}>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{selectedCustomer.name}</Text>
                  <Text style={styles.customerPhone}>{selectedCustomer.phone_number}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setSelectedCustomer(null)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            {!selectedCustomer && searchResults.length > 0 && (
              <View style={styles.searchResults}>
                {searchResults.slice(0, 5).map((customer) => (
                  <TouchableOpacity
                    key={customer.id}
                    style={styles.customerItem}
                    onPress={() => {
                      setSelectedCustomer(customer);
                      setCustomerSearch('');
                      setSearchResults([]);
                      Keyboard.dismiss();
                    }}
                  >
                    <Text style={styles.customerItemName}>{customer.name}</Text>
                    <Text style={styles.customerItemPhone}>{customer.phone_number}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* 시간 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏰ 시간 선택</Text>
            <View style={styles.timeGrid}>
              {timeSlots.map((time) => {
                const isReserved = isTimeReserved(time);
                return (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeSlot,
                      selectedTime === time && styles.selectedTimeSlot,
                      isReserved && styles.reservedTimeSlot
                    ]}
                    onPress={() => !isReserved && setSelectedTime(time)}
                    disabled={isReserved}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      selectedTime === time && styles.selectedTimeSlotText,
                      isReserved && styles.reservedTimeSlotText
                    ]}>
                      {time}
                    </Text>
                    {isReserved && (
                      <Text style={styles.reservedIndicator}>예약됨</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 시술 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💅 시술 선택</Text>
            <Text style={styles.sectionSubtitle}>
              💡 같은 시술을 여러 회차로 예약할 수 있습니다 (예: 두피마사지 2회차)
            </Text>
            {treatmentMenus.map((menu) => (
              <View key={menu.id} style={styles.menuGroup}>
                <Text style={styles.menuGroupTitle}>{menu.name}</Text>
                {menu.details.map((detail) => (
                  <TouchableOpacity
                    key={detail.id}
                    style={styles.treatmentOption}
                    onPress={() => addTreatment(detail)}
                  >
                    <View style={styles.treatmentInfo}>
                      <Text style={styles.treatmentName}>{detail.name}</Text>
                      <Text style={styles.treatmentDetails}>
                        {detail.base_price.toLocaleString()}원 • {detail.duration_min}분
                      </Text>
                    </View>
                    <Text style={styles.addButton}>+</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {/* 선택된 시술들 */}
          {selectedTreatments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✅ 선택된 시술 (회차별)</Text>
              {selectedTreatments.map((item, index) => (
                <View key={index} style={styles.selectedTreatment}>
                  <View style={styles.treatmentInfo}>
                    <Text style={styles.treatmentName}>{item.menuDetail.name}</Text>
                    <Text style={styles.treatmentDetails}>
                      {item.menuDetail.base_price.toLocaleString()}원 • {item.menuDetail.duration_min}분
                    </Text>
                  </View>
                  <View style={styles.sessionControls}>
                    <TouchableOpacity
                      style={styles.sessionButton}
                      onPress={() => updateSessionNo(index, item.sessionNo - 1)}
                    >
                      <Text style={styles.sessionButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.sessionNo}>{item.sessionNo}회차</Text>
                    <TouchableOpacity
                      style={styles.sessionButton}
                      onPress={() => updateSessionNo(index, item.sessionNo + 1)}
                    >
                      <Text style={styles.sessionButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeTreatment(index)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              <View style={styles.totalSummary}>
                <Text style={styles.totalText}>
                  총 {getTotalDuration()}분 • {getTotalPrice().toLocaleString()}원
                </Text>
              </View>
            </View>
          )}

          {/* 담당 직원 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👨‍💼 담당 직원 (선택사항)</Text>
            <View style={styles.staffSelection}>
              <TouchableOpacity
                style={[
                  styles.staffOption,
                  !selectedStaff && styles.selectedStaffOption
                ]}
                onPress={() => setSelectedStaff(null)}
              >
                <Text style={[
                  styles.staffOptionText,
                  !selectedStaff && styles.selectedStaffOptionText
                ]}>
                  직접 시술
                </Text>
              </TouchableOpacity>
              
              {staffUsers.map((staff) => (
                <TouchableOpacity
                  key={staff.user_id}
                  style={[
                    styles.staffOption,
                    selectedStaff?.user_id === staff.user_id && styles.selectedStaffOption
                  ]}
                  onPress={() => setSelectedStaff(staff)}
                >
                  <View style={styles.staffInfo}>
                    <Text style={[
                      styles.staffOptionText,
                      selectedStaff?.user_id === staff.user_id && styles.selectedStaffOptionText
                    ]}>
                      {staff.user.name}
                    </Text>
                    <Text style={[
                      styles.staffRole,
                      selectedStaff?.user_id === staff.user_id && styles.selectedStaffRole
                    ]}>
                      {staff.is_primary_owner === 1 ? '대표' : '직원'} • {staff.user.role}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 결제 방법 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💳 결제 방법</Text>
            <View style={styles.paymentMethods}>
              {[
                { key: 'CARD', label: '카드' },
                { key: 'CASH', label: '현금' },
                { key: 'UNPAID', label: '외상' }
              ].map((method) => (
                <TouchableOpacity
                  key={method.key}
                  style={[
                    styles.paymentMethod,
                    paymentMethod === method.key && styles.selectedPaymentMethod
                  ]}
                  onPress={() => setPaymentMethod(method.key as any)}
                >
                  <Text style={[
                    styles.paymentMethodText,
                    paymentMethod === method.key && styles.selectedPaymentMethodText
                  ]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 메모 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 메모 (선택)</Text>
            <TextInput
              style={styles.memoInput}
              placeholder="특별한 요청사항이나 메모를 입력하세요"
              value={memo}
              onChangeText={setMemo}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* 예약하기 버튼 */}
          <TouchableOpacity
            style={[styles.bookingButton, isLoading && styles.disabledButton]}
            onPress={handleBooking}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.bookingButtonText}>예약하기</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa" 
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: { 
    flex: 1 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6c757d',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  placeholder: {
    width: 40,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  dateCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dateText: {
    fontSize: 16,
    color: '#495057',
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  selectedCustomer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  searchResults: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    maxHeight: 200,
  },
  customerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  customerItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
  },
  customerItemPhone: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  reservedTimeSlot: {
    backgroundColor: '#f8f9fa',
    borderColor: '#dee2e6',
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#495057',
  },
  selectedTimeSlotText: {
    color: '#ffffff',
  },
  reservedTimeSlotText: {
    color: '#adb5bd',
  },
  reservedIndicator: {
    fontSize: 10,
    color: '#dc3545',
    marginTop: 2,
  },
  menuGroup: {
    marginBottom: 16,
  },
  menuGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
    paddingLeft: 8,
  },
  treatmentOption: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  treatmentInfo: {
    flex: 1,
  },
  treatmentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
  },
  treatmentDetails: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  addButton: {
    fontSize: 20,
    color: '#28a745',
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  selectedTreatment: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  sessionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  sessionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
  },
  sessionNo: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginHorizontal: 8,
    minWidth: 30,
    textAlign: 'center',
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  totalSummary: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    textAlign: 'center',
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentMethod: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  selectedPaymentMethod: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#495057',
  },
  selectedPaymentMethodText: {
    color: '#ffffff',
  },
  memoInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
  },
  bookingButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  disabledButton: {
    backgroundColor: '#adb5bd',
  },
  bookingButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  // 직원 선택 관련 스타일
  staffSelection: {
    gap: 8,
  },
  staffOption: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
  },
  selectedStaffOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
  },
  staffInfo: {
    flex: 1,
  },
  staffOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#495057',
  },
  selectedStaffOptionText: {
    color: '#1976d2',
  },
  staffRole: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 2,
  },
  selectedStaffRole: {
    color: '#1565c0',
  },
});
