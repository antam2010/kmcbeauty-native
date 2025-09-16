import ContactSyncModal from '@/components/modals/ContactSyncModal';
import CustomerRegistrationModal from '@/components/modals/CustomerRegistrationModal';
import { useDashboard } from '@/contexts/DashboardContext';
import { phonebookApiService, type Phonebook } from '@/src/api/services/phonebook';
import { shopApiService, type ShopUser } from '@/src/api/services/shop';
import { treatmentApiService } from '@/src/api/services/treatment';
import { treatmentMenuApiService, type TreatmentMenu, type TreatmentMenuDetail } from '@/src/api/services/treatmentMenu';
import type { Treatment, TreatmentItemCreate, TreatmentUpdate } from '@/src/types';
import { detectInputType, formatPhoneNumber } from '@/src/utils/phoneFormat';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type SelectedTreatmentItem } from '../forms/SelectedTreatmentItem';

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
  
  // 기본 상태들
  const [loading, setLoading] = useState(false);
  const [memo, setMemo] = useState('');
  const [status, setStatus] = useState<Treatment['status']>('RESERVED');
  const [paymentMethod, setPaymentMethod] = useState<Treatment['payment_method']>('CARD');
  const [selectedStaff, setSelectedStaff] = useState<ShopUser | null>(null);
  const [selectedTreatments, setSelectedTreatments] = useState<SelectedTreatmentItem[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  
  // 고객 선택 관련 상태
  const [selectedCustomer, setSelectedCustomer] = useState<Phonebook | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Phonebook[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showRecentCustomers, setShowRecentCustomers] = useState(false);
  const [recentCustomers, setRecentCustomers] = useState<Phonebook[]>([]);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showContactSyncModal, setShowContactSyncModal] = useState(false);
  
  // 드롭다운 상태들
  const [treatmentMenus, setTreatmentMenus] = useState<TreatmentMenu[]>([]);
  const [staffUsers, setStaffUsers] = useState<ShopUser[]>([]);

  
  // 시간 슬롯
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30'
  ];

  // 초기 데이터 로드
  useEffect(() => {
    if (visible && treatment) {
      initializeData();
      loadMenusAndStaff();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, treatment]);

  const initializeData = () => {
    setMemo(treatment.memo || '');
    setStatus(treatment.status);
    setPaymentMethod(treatment.payment_method);
    
    // 고객 정보 설정
    if (treatment.phonebook) {
      const customer: Phonebook = {
        id: treatment.phonebook.id,
        shop_id: treatment.shop_id,
        name: treatment.phonebook.name,
        phone_number: treatment.phonebook.phone_number,
        group_name: treatment.phonebook.group_name || null,
        memo: treatment.phonebook.memo || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setSelectedCustomer(customer);
      setCustomerSearch('');
    }
    
    // 날짜와 시간 설정
    const reservedDate = new Date(treatment.reserved_at);
    setSelectedDate(reservedDate.toISOString().split('T')[0]);
    setSelectedTime(reservedDate.toTimeString().slice(0, 5));
    
    // 담당자 설정
    if (treatment.staff_user) {
      setSelectedStaff({
        shop_id: treatment.shop_id,
        user_id: treatment.staff_user_id || 0,
        is_primary_owner: 0,
        user: {
          name: treatment.staff_user.name,
          email: treatment.staff_user.email,
          role: treatment.staff_user.role
        }
      });
    }
    
    // 시술 항목들 설정 - 현재 시술 아이템들을 기반으로 가상의 메뉴 디테일 생성
    const treatmentItems: SelectedTreatmentItem[] = treatment.treatment_items?.map(item => ({
      menuDetail: {
        id: item.menu_detail_id || 0,
        menu_id: item.menu_detail?.menu_id || 0,
        name: item.menu_detail?.name || '시술명 없음',
        duration_min: item.duration_min,
        base_price: item.base_price,
        created_at: item.created_at,
        updated_at: item.updated_at
      },
      sessionNo: item.session_no,
      customPrice: item.base_price,
      customDuration: item.duration_min
    })) || [];
    
    setSelectedTreatments(treatmentItems);
  };

  const loadMenusAndStaff = async () => {
    try {
      // BookingForm과 동일한 방식으로 로드
      const [menusResult, staffResult] = await Promise.all([
        treatmentMenuApiService.getAllWithDetails(),
        shopApiService.getCurrentShopUsers()
      ]);
      
      setTreatmentMenus(menusResult);
      setStaffUsers(staffResult);
    } catch (error) {
      console.error('메뉴/직원 정보 로드 실패:', error);
      Alert.alert('오류', '메뉴 및 직원 정보를 불러오는데 실패했습니다.');
    }
  };

  // 최근 등록된 고객들 로드
  const loadRecentCustomers = useCallback(async () => {
    try {
      const response = await phonebookApiService.list({ size: 10, page: 1 });
      const sortedCustomers = response.items.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRecentCustomers(sortedCustomers);
      
      console.log('🔍 최근 고객 목록 로드 완료:', {
        count: sortedCustomers.length,
        customers: sortedCustomers.map(c => `${c.name}(${c.id})`),
        showRecentCustomers,
        customerSearchLength: customerSearch.length,
        selectedCustomer: selectedCustomer?.name || 'none'
      });
    } catch (error) {
      console.error('최근 고객 로드 실패:', error);
      setRecentCustomers([]);
    }
  }, [showRecentCustomers, customerSearch.length, selectedCustomer?.name]);

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
        const results = await phonebookApiService.search(customerSearch.trim());
        setSearchResults(results || []);
        setShowRecentCustomers(false);
      } catch (error) {
        console.error('고객 검색 실패:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchCustomers, 300);
    return () => clearTimeout(timeoutId);
  }, [customerSearch]);

  // showRecentCustomers 상태 변경 추적
  useEffect(() => {
    console.log('🔍 최근 고객 목록 상태 변경됨:', {
      showRecentCustomers,
      count: recentCustomers.length,
      customers: recentCustomers.map(c => `${c.name}(${c.id})`),
      selectedCustomer: selectedCustomer?.name || 'none',
      customerSearchLength: customerSearch.length,
      isSearching,
      searchResultsLength: searchResults.length
    });
  }, [showRecentCustomers, recentCustomers, selectedCustomer?.name, customerSearch.length, isSearching, searchResults.length]);

  const openRegistrationModal = useCallback((searchText?: string) => {
    const input = searchText || customerSearch;
    const inputType = detectInputType(input);
    
    if (inputType === 'phone') {
      setCustomerSearch(input);
      setShowRegistrationModal(true);
    } else {
      setCustomerSearch(input);
      setShowRegistrationModal(true);
    }
  }, [customerSearch]);

  // 기본 고객(999-9999-9999) 생성 또는 조회
  const getOrCreateDefaultCustomer = useCallback(async (): Promise<Phonebook> => {
    const defaultPhoneNumber = '999-9999-9999';
    
    try {
      const duplicateCheck = await phonebookApiService.checkDuplicate(defaultPhoneNumber);
      
      if (duplicateCheck.exists) {
        const results = await phonebookApiService.search(defaultPhoneNumber);
        if (results.length > 0) {
          return results[0];
        }
      }
      
      const defaultCustomer = await phonebookApiService.create({
        name: '고객 미지정',
        phone_number: defaultPhoneNumber,
        memo: '고객 선택 없이 예약한 경우의 기본 고객'
      });
      
      return defaultCustomer;
    } catch (error) {
      console.error('기본 고객 생성/조회 실패:', error);
      throw error;
    }
  }, []);

  const handleAddTreatment = useCallback((menuDetail: TreatmentMenuDetail) => {
    const newTreatment: SelectedTreatmentItem = {
      menuDetail,
      sessionNo: 1,
      customPrice: menuDetail.base_price,
      customDuration: menuDetail.duration_min
    };
    
    setSelectedTreatments(prev => {
      const newArray = [...prev, newTreatment];
      return newArray;
    });
  }, []);

  const handleRemoveTreatment = useCallback((index: number) => {
    setSelectedTreatments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateSessionNo = useCallback((index: number, sessionNo: number) => {
    setSelectedTreatments(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], sessionNo: Math.max(1, sessionNo) };
      return updated;
    });
  }, []);

  const updateCustomPrice = useCallback((index: number, price: number) => {
    setSelectedTreatments(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], customPrice: Math.max(0, price) };
      return updated;
    });
  }, []);

  const updateCustomDuration = useCallback((index: number, duration: number) => {
    setSelectedTreatments(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], customDuration: Math.max(1, duration) };
      return updated;
    });
  }, []);

  const handlePriceTextChange = (index: number, text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    const price = numericText === '' ? 0 : parseInt(numericText);
    updateCustomPrice(index, price);
  };

  const handleDurationTextChange = (index: number, text: string) => {
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

  const handleSubmit = async () => {
    try {
      // 유효성 검사
      if (!selectedDate || !selectedTime) {
        Alert.alert('알림', '예약 날짜와 시간을 선택해주세요.');
        return;
      }

      if (selectedTreatments.length === 0) {
        Alert.alert('알림', '최소 하나의 시술을 선택해주세요.');
        return;
      }

      setLoading(true);

      // 고객이 선택되지 않은 경우 기본 고객 사용
      let customerToUse = selectedCustomer;
      if (!customerToUse) {
        const shouldContinue = await new Promise<boolean>((resolve) => {
          Alert.alert(
            '고객 미지정',
            '고객을 선택하지 않으셨습니다.\n"고객 미지정"으로 예약을 진행하시겠습니까?',
            [
              {
                text: '취소',
                style: 'cancel',
                onPress: () => resolve(false)
              },
              {
                text: '계속 진행',
                onPress: () => resolve(true)
              }
            ]
          );
        });
        
        if (!shouldContinue) {
          setLoading(false);
          return;
        }
        
        console.log('고객이 선택되지 않음. 기본 고객 생성/조회 중...');
        customerToUse = await getOrCreateDefaultCustomer();
        console.log('기본 고객 사용:', customerToUse.name, customerToUse.phone_number);
      }

      // 예약 시간 생성
      const reservedAt = new Date(`${selectedDate}T${selectedTime}:00`);

      // 시술 항목들 변환
      const treatmentItems: TreatmentItemCreate[] = selectedTreatments.map(item => ({
        menu_detail_id: item.menuDetail.id,
        session_no: item.sessionNo,
        custom_price: item.customPrice,
        base_price: item.customPrice,
        duration_min: item.customDuration
      }));

      // 업데이트 데이터 준비
      const updateData: TreatmentUpdate = {
        phonebook_id: customerToUse.id,
        reserved_at: reservedAt.toISOString(),
        staff_user_id: selectedStaff?.user_id || null,
        memo: memo.trim(),
        status,
        payment_method: paymentMethod,
        treatment_items: treatmentItems.map(item => ({
          menu_detail_id: item.menu_detail_id,
          custom_price: item.custom_price,
          base_price: item.base_price,
          duration_min: item.duration_min,
          session_no: item.session_no
        }))
      };

      // API 호출
      await treatmentApiService.update(treatment.id, updateData);

      Alert.alert('완료', '예약이 성공적으로 수정되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            triggerRefresh();
            onUpdateSuccess?.();
            onClose();
          }
        }
      ]);

    } catch (error) {
      console.error('예약 수정 실패:', error);
      Alert.alert('오류', '예약 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  if (!visible || !treatment) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>예약 수정</Text>
            <TouchableOpacity 
              onPress={handleSubmit} 
              style={[styles.headerButton, loading && styles.disabledButton]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.saveButtonText}>저장</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* 고객 선택 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👤 고객 선택 (선택사항)</Text>
              <Text style={[styles.sectionSubtitle, { marginBottom: 8 }]}>
                💡 고객을 선택하지 않으면 &apos;고객 미지정&apos;으로 수정됩니다
              </Text>
              <TextInput
                style={styles.input}
                placeholder="고객 이름 또는 전화번호 검색 (010-1234-5678)"
                value={customerSearch}
                onChangeText={(text) => {
                  if (/^\d/.test(text.trim())) {
                    setCustomerSearch(formatPhoneNumber(text));
                  } else {
                    setCustomerSearch(text);
                  }
                }}
                onFocus={() => {
                  console.log('Input 포커스, selectedCustomer:', selectedCustomer?.name);
                  if (!customerSearch.trim()) {
                    setShowRecentCustomers(true);
                    loadRecentCustomers().catch(error => {
                      console.error('포커스 시 최근 고객 로드 실패:', error);
                    });
                  }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    if (!customerSearch.trim()) {
                      setShowRecentCustomers(false);
                    }
                  }, 200);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                underlineColorAndroid="transparent"
                selectionColor="#667eea"
                placeholderTextColor="#999"
              />
              
              {selectedCustomer && (
                <View style={styles.selectedCustomer}>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{selectedCustomer.name}</Text>
                    <Text style={styles.customerPhone}>{formatPhoneNumber(selectedCustomer.phone_number)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity 
                      onPress={() => {
                        setSelectedCustomer(null); // 기존 고객 선택 해제
                        setCustomerSearch(''); // 검색어 초기화
                        setShowRecentCustomers(true);
                        loadRecentCustomers().catch(error => {
                          console.error('고객 변경 시 최근 고객 로드 실패:', error);
                        });
                      }}
                      style={styles.changeCustomerButton}
                    >
                      <Text style={styles.changeCustomerButtonText}>다른 고객 선택</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => {
                        setSelectedCustomer(null);
                        setShowRecentCustomers(false);
                      }}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* 고객 검색 결과 표시 */}
              {(
                <View>
                  {/* 검색 중 표시 */}
                  {isSearching && (
                    <View style={[styles.searchResults, { alignItems: 'center', padding: 20 }]}>
                      <ActivityIndicator size="small" color="#667eea" />
                      <Text style={{ marginTop: 8, color: '#666' }}>검색 중...</Text>
                    </View>
                  )}

                  {/* 검색 결과 (검색어가 있을 때) */}
                  {!isSearching && searchResults.length > 0 && customerSearch.trim().length > 0 && (
                    <View style={styles.searchResults}>
                      <Text style={styles.searchResultsTitle}>검색 결과 ({searchResults.length}명)</Text>
                      <ScrollView
                        style={{ maxHeight: 300 }}
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                      >
                        {searchResults.map((customer) => (
                          <TouchableOpacity
                            key={customer.id.toString()}
                            style={styles.customerItem}
                            onPress={() => {
                              setSelectedCustomer(customer);
                              setCustomerSearch('');
                              setSearchResults([]);
                              setShowRecentCustomers(false);
                              Keyboard.dismiss();
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.customerItemName}>{customer.name}</Text>
                            <Text style={styles.customerItemPhone}>{formatPhoneNumber(customer.phone_number)}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* 검색 결과가 없을 때 */}
                  {!isSearching && searchResults.length === 0 && customerSearch.trim().length > 0 && (
                    <View style={[styles.searchResults, { alignItems: 'center', padding: 20 }]}> 
                      <Text style={{ color: '#666', marginBottom: 12 }}>검색 결과가 없습니다.</Text>
                      
                      <TouchableOpacity
                        style={styles.addCustomerButton}
                        onPress={() => openRegistrationModal(customerSearch)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.addCustomerButtonText}>새 고객 등록하기</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.addCustomerButton, { backgroundColor: '#28a745', marginTop: 8 }]}
                        onPress={() => setShowContactSyncModal(true)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.addCustomerButtonText}>📱 연락처 동기화</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* 최근 등록된 고객들 (포커스 시 또는 검색어가 없을 때) */}
                  {!isSearching && showRecentCustomers && recentCustomers.length > 0 && customerSearch.trim().length === 0 && (
                    <View style={styles.searchResults}>
                      <Text style={styles.searchResultsTitle}>💚 최근 등록된 고객 ({recentCustomers.length}명)</Text>
                      <ScrollView
                        style={{ maxHeight: 300 }}
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                      >
                        {recentCustomers.map((customer, index) => (
                          <TouchableOpacity
                            key={`recent_customer_${customer.id}_${customer.created_at}_${index}`}
                            style={styles.customerItem}
                            onPress={() => {
                              console.log('최근 고객 선택:', customer.name, customer.phone_number);
                              setSelectedCustomer(customer);
                              setCustomerSearch('');
                              setShowRecentCustomers(false);
                              
                              setTimeout(() => {
                                Keyboard.dismiss();
                              }, 100);
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={styles.customerItemHeader}>
                              <Text style={styles.customerItemName}>{customer.name}</Text>
                              <Text style={styles.customerItemDate}>
                                {new Date(customer.created_at).toLocaleDateString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </Text>
                            </View>
                            <Text style={styles.customerItemPhone}>{formatPhoneNumber(customer.phone_number)}</Text>
                          </TouchableOpacity>
                        ))}
                        
                        <TouchableOpacity
                          style={[styles.addCustomerButton, { 
                            backgroundColor: '#28a745', 
                            marginTop: 12,
                            marginHorizontal: 8 
                          }]}
                          onPress={() => setShowContactSyncModal(true)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.addCustomerButtonText}>📱 연락처 동기화</Text>
                        </TouchableOpacity>
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* 날짜 선택 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>예약 날짜</Text>
              <TextInput
                style={styles.input}
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholder="YYYY-MM-DD"
              />
            </View>

            {/* 시간 선택 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>예약 시간</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.timeSlotContainer}>
                  {timeSlots.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeSlot,
                        selectedTime === time && styles.selectedTimeSlot
                      ]}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        selectedTime === time && styles.selectedTimeSlotText
                      ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* 담당 직원 선택 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👨‍💼 담당 직원</Text>
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
                    담당 직원 없음
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

            {/* 시술 메뉴 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💅 시술 선택</Text>
              <Text style={styles.sectionSubtitle}>
                💡 같은 시술을 여러 회차로 예약할 수 있습니다
              </Text>
              {treatmentMenus.map((menu) => (
                <View key={menu.id} style={styles.menuGroup}>
                  <Text style={styles.menuGroupTitle}>{menu.name}</Text>
                  {menu.details.map((detail) => (
                    <TouchableOpacity
                      key={detail.id}
                      style={styles.treatmentOption}
                      onPress={() => handleAddTreatment(detail)}
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
                <Text style={styles.sectionSubtitle}>
                  💡 각 회차별로 가격과 시간을 개별 조정할 수 있습니다
                </Text>
                {selectedTreatments.map((item, index) => (
                  <View key={index} style={styles.selectedTreatment}>
                    <View style={styles.selectedTreatmentHeader}>
                      <Text style={styles.selectedTreatmentName}>
                        {item.menuDetail.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveTreatment(index)}
                        style={styles.removeButton}
                      >
                        <Text style={styles.removeButtonText}>삭제</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.treatmentInputRow}>
                      <View style={styles.treatmentInputGroup}>
                        <Text style={styles.inputLabel}>회차</Text>
                        <TextInput
                          style={styles.smallInput}
                          value={String(item.sessionNo)}
                          onChangeText={(text) => {
                            const numericText = text.replace(/[^0-9]/g, '');
                            const sessionNo = numericText === '' ? 1 : parseInt(numericText);
                            updateSessionNo(index, sessionNo);
                          }}
                          keyboardType="numeric"
                        />
                      </View>
                      
                      <View style={styles.treatmentInputGroup}>
                        <Text style={styles.inputLabel}>가격</Text>
                        <TextInput
                          style={styles.smallInput}
                          value={String(item.customPrice)}
                          onChangeText={(text) => handlePriceTextChange(index, text)}
                          keyboardType="numeric"
                        />
                      </View>
                      
                      <View style={styles.treatmentInputGroup}>
                        <Text style={styles.inputLabel}>시간(분)</Text>
                        <TextInput
                          style={styles.smallInput}
                          value={String(item.customDuration)}
                          onChangeText={(text) => handleDurationTextChange(index, text)}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>
                ))}
                
                <View style={styles.totalSummary}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>총 금액</Text>
                    <Text style={styles.totalValue}>{getTotalPrice().toLocaleString()}원</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>총 소요시간</Text>
                    <Text style={styles.totalValue}>{getTotalDuration()}분</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 예약 상태 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 예약 상태</Text>
              <View style={styles.statusSelection}>
                {[
                  { key: 'RESERVED', label: '예약됨' },
                  { key: 'COMPLETED', label: '완료' },
                  { key: 'CANCELLED', label: '취소됨' },
                  { key: 'NO_SHOW', label: '노쇼' }
                ].map((statusOption) => (
                  <TouchableOpacity
                    key={statusOption.key}
                    style={[
                      styles.statusOption,
                      status === statusOption.key && styles.selectedStatusOption
                    ]}
                    onPress={() => setStatus(statusOption.key as Treatment['status'])}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      status === statusOption.key && styles.selectedStatusOptionText
                    ]}>
                      {statusOption.label}
                    </Text>
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
                    onPress={() => setPaymentMethod(method.key as Treatment['payment_method'])}
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
              <Text style={styles.sectionTitle}>메모</Text>
              <TextInput
                style={styles.memoInput}
                value={memo}
                onChangeText={setMemo}
                placeholder="메모를 입력하세요"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
      
      {/* 고객 등록 모달 */}
      <CustomerRegistrationModal
        visible={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        initialPhone={customerSearch}
        onCustomerRegistered={(customer) => {
          setSelectedCustomer(customer);
          setShowRegistrationModal(false);
          setCustomerSearch('');
          setSearchResults([]);
        }}
      />

      {/* 연락처 동기화 모달 */}
      <ContactSyncModal
        visible={showContactSyncModal}
        onClose={() => setShowContactSyncModal(false)}
        onSyncComplete={(result) => {
          console.log('연락처 동기화 완료:', result);
          setShowContactSyncModal(false);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
    lineHeight: 20,
  },
  customerInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 16,
    color: '#000',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#000',
  },
  timeSlotContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  selectedTimeSlot: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#000',
  },
  selectedTimeSlotText: {
    color: '#fff',
  },
  menuGroup: {
    marginBottom: 16,
  },
  menuGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
    paddingHorizontal: 4,
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
    marginBottom: 6,
  },
  treatmentInfo: {
    flex: 1,
  },
  treatmentName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#212529',
  },
  treatmentDetails: {
    fontSize: 13,
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
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#28a745',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedTreatmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedTreatmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  removeButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  treatmentInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  treatmentInputGroup: {
    flex: 1,
    marginRight: 8,
  },
  inputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  smallInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  totalSummary: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 16,
    color: '#28a745',
    fontWeight: '600',
  },
  memoInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bottomPadding: {
    height: 100,
  },
  // 직원 선택 관련 스타일 (BookingForm과 동일)
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
  // 상태 선택 관련 스타일
  statusSelection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    minWidth: '22%',
  },
  selectedStatusOption: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    textAlign: 'center',
  },
  selectedStatusOptionText: {
    color: '#ffffff',
  },
  // 결제방법 관련 스타일 (BookingForm과 동일)
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
  customerSection: {
    marginBottom: 20,
  },
  customerSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  selectedCustomer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changeCustomerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#6c757d',
    borderRadius: 6,
  },
  changeCustomerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  customerItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerItemDate: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 8,
  },
  customerSearchContainer: {
    marginBottom: 16,
  },
  customerSearch: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212529',
  },
  searchResults: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    maxHeight: 200,
    marginTop: 8,
  },
  customerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastCustomerItem: {
    borderBottomWidth: 0,
  },
  customerItemInfo: {
    flex: 1,
  },
  customerItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 4,
  },
  customerItemPhone: {
    fontSize: 14,
    color: '#6c757d',
  },
  selectCustomerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#667eea',
    borderRadius: 6,
  },
  selectCustomerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  addCustomerButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addCustomerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
