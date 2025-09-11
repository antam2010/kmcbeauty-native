import { phonebookApiService, type Phonebook } from '@/src/api/services/phonebook';
import { shopApiService, type ShopUser } from '@/src/api/services/shop';
import { treatmentApiService } from '@/src/api/services/treatment';
import { treatmentMenuApiService, type TreatmentMenu, type TreatmentMenuDetail } from '@/src/api/services/treatmentMenu';
import type { TreatmentCreate, TreatmentItemCreate } from '@/src/types/treatment';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bookingFormStyles } from './BookingForm.styles';

interface BookingFormProps {
  selectedDate?: string;
  reservedTimes?: string[]; // 이미 예약된 시간들
  onClose: () => void;
  onBookingComplete: () => void;
}

interface SelectedTreatmentItem {
  menuDetail: TreatmentMenuDetail;
  sessionNo: number;
  customPrice: number;  // 회차별 개별 가격
  customDuration: number;  // 회차별 개별 시간
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
  const [recentCustomers, setRecentCustomers] = useState<Phonebook[]>([]); // 최근 고객들
  const [showRecentCustomers, setShowRecentCustomers] = useState(false); // 최근 고객 표시 여부
  const [isSearching, setIsSearching] = useState(false); // 검색 중 상태
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
    loadRecentCustomers(); // 최근 고객 로드 추가
  }, []);

  // 최근 등록된 고객들 로드
  const loadRecentCustomers = async () => {
    try {
      // 최근 등록 순서대로 5명 가져오기
      const response = await phonebookApiService.list({ size: 5, page: 1 });
      // created_at 기준으로 내림차순 정렬 (최신순)
      const sortedCustomers = response.items.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRecentCustomers(sortedCustomers);
    } catch (error) {
      console.error('최근 고객 로드 실패:', error);
      setRecentCustomers([]);
    }
  };

  // 고객 검색
  useEffect(() => {
    const searchCustomers = async () => {
      if (!customerSearch.trim()) {
        setSearchResults([]);
        setShowRecentCustomers(true);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        console.log('🔍 고객 검색 시작:', customerSearch);
        
        const results = await phonebookApiService.search(customerSearch.trim());
        console.log('🔍 검색 결과:', results.length, '명');
        
        setSearchResults(results || []);
        setShowRecentCustomers(false);
      } catch (error) {
        console.error('🔍 고객 검색 실패:', error);
        setSearchResults([]);
        // 안드로이드에서 네트워크 오류 확인을 위한 상세 로깅
        if (error instanceof Error) {
          console.error('🔍 에러 상세:', error.message);
        }
      } finally {
        setIsSearching(false);
      }
    };

    // 디바운싱을 위한 타이머
    const timeoutId = setTimeout(() => {
      searchCustomers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [customerSearch]);

  // 디버깅용 로그
  useEffect(() => {
    console.log('🔍 UI 렌더링 상태:', {
      isSearching,
      searchResultsLength: searchResults.length,
      customerSearchLength: customerSearch.trim().length,
      showRecentCustomers,
      recentCustomersLength: recentCustomers.length,
      selectedCustomer: selectedCustomer?.name || 'none'
    });
  }, [isSearching, searchResults, customerSearch, showRecentCustomers, recentCustomers, selectedCustomer]);

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
      sessionNo: 1,
      customPrice: menuDetail.base_price,
      customDuration: menuDetail.duration_min
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

  const updateCustomPrice = (index: number, price: number) => {
    const updated = [...selectedTreatments];
    updated[index].customPrice = Math.max(0, price);
    setSelectedTreatments(updated);
  };

  const updateCustomDuration = (index: number, duration: number) => {
    const updated = [...selectedTreatments];
    updated[index].customDuration = Math.max(1, duration); // 최소 1분
    setSelectedTreatments(updated);
  };

  const handlePriceTextChange = (index: number, text: string) => {
    // 숫자만 허용하고 빈 문자열도 허용 (임시로)
    const numericText = text.replace(/[^0-9]/g, '');
    const price = numericText === '' ? 0 : parseInt(numericText);
    updateCustomPrice(index, price);
  };

  const handleDurationTextChange = (index: number, text: string) => {
    // 숫자만 허용하고 빈 문자열도 허용 (임시로)
    const numericText = text.replace(/[^0-9]/g, '');
    const duration = numericText === '' ? 1 : parseInt(numericText);
    updateCustomDuration(index, duration);
  };

  const getTotalPrice = () => {
    return selectedTreatments.reduce((total, item) => {
      return total + item.customPrice;
    }, 0);
  };

  const getTotalDuration = () => {
    return selectedTreatments.reduce((total, item) => {
      return total + item.customDuration;
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
        base_price: item.customPrice,
        duration_min: item.customDuration,
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
      <View style={[bookingFormStyles.container, bookingFormStyles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={bookingFormStyles.loadingText}>시술 메뉴를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[bookingFormStyles.container, { paddingTop: insets.top }]}>
          <ScrollView 
            style={bookingFormStyles.scrollView}
            contentContainerStyle={{
              paddingBottom: Platform.OS === 'ios' ? insets.bottom + 20 : 16
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
          {/* 헤더 */}
          <View style={bookingFormStyles.header}>
            <TouchableOpacity onPress={onClose} style={bookingFormStyles.closeButton}>
              <Text style={bookingFormStyles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={bookingFormStyles.headerTitle}>새 예약 만들기</Text>
            <View style={bookingFormStyles.placeholder} />
          </View>

          {/* 선택한 날짜 */}
          {selectedDate && (
            <View style={bookingFormStyles.section}>
              <Text style={bookingFormStyles.sectionTitle}>📅 선택한 날짜</Text>
              <View style={bookingFormStyles.dateCard}>
                <Text style={bookingFormStyles.dateText}>
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
          <View style={bookingFormStyles.section}>
            <Text style={bookingFormStyles.sectionTitle}>👤 고객 선택</Text>
            <TextInput
              style={bookingFormStyles.searchInput}
              placeholder="고객 이름 또는 전화번호 검색"
              value={customerSearch}
              onChangeText={setCustomerSearch}
              onFocus={() => {
                console.log('🎯 검색 입력 포커스');
                // 포커스 시 최근 고객 표시
                if (!customerSearch.trim() && !selectedCustomer) {
                  setShowRecentCustomers(true);
                }
              }}
              onBlur={() => {
                console.log('🎯 검색 입력 블러');
                // 포커스 해제 시 최근 고객 목록 숨김 (선택되지 않은 경우에만)
                setTimeout(() => {
                  if (!selectedCustomer && !customerSearch.trim()) {
                    setShowRecentCustomers(false);
                  }
                }, 150); // 약간의 지연으로 선택 이벤트와 겹치지 않도록
              }}
              autoCapitalize="none"
              autoCorrect={false}
              underlineColorAndroid="transparent"
              selectionColor="#667eea"
              placeholderTextColor="#999"
            />
            
            {selectedCustomer && (
              <View style={bookingFormStyles.selectedCustomer}>
                <View style={bookingFormStyles.customerInfo}>
                  <Text style={bookingFormStyles.customerName}>{selectedCustomer.name}</Text>
                  <Text style={bookingFormStyles.customerPhone}>{selectedCustomer.phone_number}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => {
                    setSelectedCustomer(null);
                    setShowRecentCustomers(false);
                  }}
                  style={bookingFormStyles.removeButton}
                >
                  <Text style={bookingFormStyles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 고객 검색 결과 표시 */}
            {!selectedCustomer && (
              <View>
                {/* 검색 중 표시 */}
                {isSearching && (
                  <View style={[bookingFormStyles.searchResults, { alignItems: 'center', padding: 20 }]}>
                    <ActivityIndicator size="small" color="#667eea" />
                    <Text style={{ marginTop: 8, color: '#666' }}>검색 중...</Text>
                  </View>
                )}

                {/* 검색 결과 (검색어가 있을 때) */}
                {!isSearching && searchResults.length > 0 && customerSearch.trim().length > 0 && (
                  <View style={bookingFormStyles.searchResults}>
                    <Text style={bookingFormStyles.searchResultsTitle}>검색 결과 ({searchResults.length}명)</Text>
                    <FlatList
                      data={searchResults.slice(0, 8)}
                      keyExtractor={(item) => item.id.toString()}
                      renderItem={({ item: customer }) => (
                        <TouchableOpacity
                          style={bookingFormStyles.customerItem}
                          onPress={() => {
                            console.log('고객 선택:', customer.name);
                            setSelectedCustomer(customer);
                            setCustomerSearch('');
                            setSearchResults([]);
                            setShowRecentCustomers(false);
                            Keyboard.dismiss();
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={bookingFormStyles.customerItemName}>{customer.name}</Text>
                          <Text style={bookingFormStyles.customerItemPhone}>{customer.phone_number}</Text>
                        </TouchableOpacity>
                      )}
                      scrollEnabled={false}
                      nestedScrollEnabled={true}
                    />
                  </View>
                )}

                {/* 검색 결과가 없을 때 */}
                {!isSearching && searchResults.length === 0 && customerSearch.trim().length > 0 && (
                  <View style={[bookingFormStyles.searchResults, { alignItems: 'center', padding: 20 }]}>
                    <Text style={{ color: '#666' }}>검색 결과가 없습니다.</Text>
                  </View>
                )}

                {/* 최근 등록된 고객들 (포커스 시 또는 검색어가 없을 때) */}
                {!isSearching && showRecentCustomers && recentCustomers.length > 0 && customerSearch.trim().length === 0 && (
                  <View style={bookingFormStyles.searchResults}>
                    <Text style={bookingFormStyles.searchResultsTitle}>💚 최근 등록된 고객 ({recentCustomers.length}명)</Text>
                    <FlatList
                      data={recentCustomers.slice(0, 8)}
                      keyExtractor={(item) => item.id.toString()}
                      renderItem={({ item: customer }) => (
                        <TouchableOpacity
                          style={bookingFormStyles.customerItem}
                          onPress={() => {
                            console.log('최근 고객 선택:', customer.name);
                            setSelectedCustomer(customer);
                            setCustomerSearch('');
                            setShowRecentCustomers(false);
                            Keyboard.dismiss();
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={bookingFormStyles.customerItemHeader}>
                            <Text style={bookingFormStyles.customerItemName}>{customer.name}</Text>
                            <Text style={bookingFormStyles.customerItemDate}>
                              {new Date(customer.created_at).toLocaleDateString('ko-KR', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </Text>
                          </View>
                          <Text style={bookingFormStyles.customerItemPhone}>{customer.phone_number}</Text>
                        </TouchableOpacity>
                      )}
                      scrollEnabled={false}
                      nestedScrollEnabled={true}
                    />
                  </View>
                )}
              </View>
            )}
          </View>

          {/* 시간 선택 */}
          <View style={bookingFormStyles.section}>
            <Text style={bookingFormStyles.sectionTitle}>⏰ 시간 선택</Text>
            <View style={bookingFormStyles.timeGrid}>
              {timeSlots.map((time) => {
                const isReserved = isTimeReserved(time);
                return (
                  <TouchableOpacity
                    key={time}
                    style={[
                      bookingFormStyles.timeSlot,
                      selectedTime === time && bookingFormStyles.selectedTimeSlot,
                      isReserved && bookingFormStyles.reservedTimeSlot
                    ]}
                    onPress={() => !isReserved && setSelectedTime(time)}
                    disabled={isReserved}
                  >
                    <Text style={[
                      bookingFormStyles.timeSlotText,
                      selectedTime === time && bookingFormStyles.selectedTimeSlotText,
                      isReserved && bookingFormStyles.reservedTimeSlotText
                    ]}>
                      {time}
                    </Text>
                    {isReserved && (
                      <Text style={bookingFormStyles.reservedIndicator}>예약됨</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 시술 선택 */}
          <View style={bookingFormStyles.section}>
            <Text style={bookingFormStyles.sectionTitle}>💅 시술 선택</Text>
            <Text style={bookingFormStyles.sectionSubtitle}>
              💡 같은 시술을 여러 회차로 예약할 수 있습니다 (예: 두피마사지 2회차)
            </Text>
            {treatmentMenus.map((menu) => (
              <View key={menu.id} style={bookingFormStyles.menuGroup}>
                <Text style={bookingFormStyles.menuGroupTitle}>{menu.name}</Text>
                {menu.details.map((detail) => (
                  <TouchableOpacity
                    key={detail.id}
                    style={bookingFormStyles.treatmentOption}
                    onPress={() => addTreatment(detail)}
                  >
                    <View style={bookingFormStyles.treatmentInfo}>
                      <Text style={bookingFormStyles.treatmentName}>{detail.name}</Text>
                      <Text style={bookingFormStyles.treatmentDetails}>
                        {detail.base_price.toLocaleString()}원 • {detail.duration_min}분
                      </Text>
                    </View>
                    <Text style={bookingFormStyles.addButton}>+</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {/* 선택된 시술들 */}
          {selectedTreatments.length > 0 && (
            <View style={bookingFormStyles.section}>
              <Text style={bookingFormStyles.sectionTitle}>✅ 선택된 시술 (회차별)</Text>
              <Text style={bookingFormStyles.sectionSubtitle}>
                💡 각 회차별로 가격과 시간을 개별 조정할 수 있습니다 (패키지 상품 등)
              </Text>
              {selectedTreatments.map((item, index) => (
                <View key={index} style={bookingFormStyles.selectedTreatment}>
                  <View style={bookingFormStyles.treatmentHeader}>
                    <View style={bookingFormStyles.treatmentBasicInfo}>
                      <Text style={bookingFormStyles.treatmentName}>{item.menuDetail.name}</Text>
                      <Text style={bookingFormStyles.treatmentBaseInfo}>
                        기본: {item.menuDetail.base_price.toLocaleString()}원 • {item.menuDetail.duration_min}분
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={bookingFormStyles.removeButton}
                      onPress={() => removeTreatment(index)}
                    >
                      <Text style={bookingFormStyles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={bookingFormStyles.sessionControls}>
                    <Text style={bookingFormStyles.sessionLabel}>회차:</Text>
                    <TouchableOpacity
                      style={bookingFormStyles.sessionButton}
                      onPress={() => updateSessionNo(index, item.sessionNo - 1)}
                    >
                      <Text style={bookingFormStyles.sessionButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={bookingFormStyles.sessionNo}>{item.sessionNo}회차</Text>
                    <TouchableOpacity
                      style={bookingFormStyles.sessionButton}
                      onPress={() => updateSessionNo(index, item.sessionNo + 1)}
                    >
                      <Text style={bookingFormStyles.sessionButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* 가격 및 시간 조정 */}
                  <View style={bookingFormStyles.customControls}>
                    <View style={bookingFormStyles.customControlRow}>
                      <View style={bookingFormStyles.customControlItem}>
                        <Text style={bookingFormStyles.customControlLabel}>실제 가격</Text>
                        <View style={bookingFormStyles.customInputGroup}>
                          <TextInput
                            style={bookingFormStyles.customInput}
                            value={item.customPrice.toString()}
                            onChangeText={(text) => handlePriceTextChange(index, text)}
                            keyboardType="numeric"
                            placeholder="0"
                            selectTextOnFocus={true}
                          />
                          <Text style={bookingFormStyles.customUnit}>원</Text>
                        </View>
                      </View>
                      
                      <View style={bookingFormStyles.customControlItem}>
                        <Text style={bookingFormStyles.customControlLabel}>실제 시간</Text>
                        <View style={bookingFormStyles.customInputGroup}>
                          <TextInput
                            style={bookingFormStyles.customInput}
                            value={item.customDuration.toString()}
                            onChangeText={(text) => handleDurationTextChange(index, text)}
                            keyboardType="numeric"
                            placeholder="1"
                            selectTextOnFocus={true}
                          />
                          <Text style={bookingFormStyles.customUnit}>분</Text>
                        </View>
                      </View>
                    </View>
                    
                    {/* 빠른 가격 설정 */}
                    <View style={bookingFormStyles.quickActionsRow}>
                      <TouchableOpacity
                        style={bookingFormStyles.quickButton}
                        onPress={() => updateCustomPrice(index, 0)}
                      >
                        <Text style={bookingFormStyles.quickButtonText}>무료</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={bookingFormStyles.quickButton}
                        onPress={() => updateCustomPrice(index, item.menuDetail.base_price)}
                      >
                        <Text style={bookingFormStyles.quickButtonText}>기본가</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={bookingFormStyles.quickButton}
                        onPress={() => updateCustomPrice(index, Math.round(item.menuDetail.base_price * 0.5))}
                      >
                        <Text style={bookingFormStyles.quickButtonText}>50%</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* 현재 회차 요약 */}
                  <View style={bookingFormStyles.itemSummary}>
                    <Text style={bookingFormStyles.itemSummaryText}>
                      {item.sessionNo}회차 • {item.customPrice.toLocaleString()}원 • {item.customDuration}분
                    </Text>
                  </View>
                </View>
              ))}
              
              <View style={bookingFormStyles.totalSummary}>
                <Text style={bookingFormStyles.totalText}>
                  총 {getTotalDuration()}분 • {getTotalPrice().toLocaleString()}원
                </Text>
              </View>
            </View>
          )}

          {/* 담당 직원 선택 */}
          <View style={bookingFormStyles.section}>
            <Text style={bookingFormStyles.sectionTitle}>👨‍💼 담당 직원 (선택사항)</Text>
            <View style={bookingFormStyles.staffSelection}>
              <TouchableOpacity
                style={[
                  bookingFormStyles.staffOption,
                  !selectedStaff && bookingFormStyles.selectedStaffOption
                ]}
                onPress={() => setSelectedStaff(null)}
              >
                <Text style={[
                  bookingFormStyles.staffOptionText,
                  !selectedStaff && bookingFormStyles.selectedStaffOptionText
                ]}>
                  직접 시술
                </Text>
              </TouchableOpacity>
              
              {staffUsers.map((staff) => (
                <TouchableOpacity
                  key={staff.user_id}
                  style={[
                    bookingFormStyles.staffOption,
                    selectedStaff?.user_id === staff.user_id && bookingFormStyles.selectedStaffOption
                  ]}
                  onPress={() => setSelectedStaff(staff)}
                >
                  <View style={bookingFormStyles.staffInfo}>
                    <Text style={[
                      bookingFormStyles.staffOptionText,
                      selectedStaff?.user_id === staff.user_id && bookingFormStyles.selectedStaffOptionText
                    ]}>
                      {staff.user.name}
                    </Text>
                    <Text style={[
                      bookingFormStyles.staffRole,
                      selectedStaff?.user_id === staff.user_id && bookingFormStyles.selectedStaffRole
                    ]}>
                      {staff.is_primary_owner === 1 ? '대표' : '직원'} • {staff.user.role}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 결제 방법 */}
          <View style={bookingFormStyles.section}>
            <Text style={bookingFormStyles.sectionTitle}>💳 결제 방법</Text>
            <View style={bookingFormStyles.paymentMethods}>
              {[
                { key: 'CARD', label: '카드' },
                { key: 'CASH', label: '현금' },
                { key: 'UNPAID', label: '외상' }
              ].map((method) => (
                <TouchableOpacity
                  key={method.key}
                  style={[
                    bookingFormStyles.paymentMethod,
                    paymentMethod === method.key && bookingFormStyles.selectedPaymentMethod
                  ]}
                  onPress={() => setPaymentMethod(method.key as any)}
                >
                  <Text style={[
                    bookingFormStyles.paymentMethodText,
                    paymentMethod === method.key && bookingFormStyles.selectedPaymentMethodText
                  ]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 메모 */}
          <View style={bookingFormStyles.section}>
            <Text style={bookingFormStyles.sectionTitle}>📝 메모 (선택)</Text>
            <TextInput
              style={bookingFormStyles.memoInput}
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
            style={[bookingFormStyles.bookingButton, isLoading && bookingFormStyles.disabledButton]}
            onPress={handleBooking}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={bookingFormStyles.bookingButtonText}>예약하기</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
