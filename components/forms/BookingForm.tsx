import ContactSyncModal from '@/components/modals/ContactSyncModal';
import CustomerRegistrationModal from '@/components/modals/CustomerRegistrationModal';
import { phonebookApiService, type Phonebook } from '@/src/api/services/phonebook';
import { shopApiService, type ShopUser } from '@/src/api/services/shop';
import { treatmentApiService } from '@/src/api/services/treatment';
import { treatmentMenuApiService, type TreatmentMenu, type TreatmentMenuDetail } from '@/src/api/services/treatmentMenu';
import { type ContactSyncResult } from '@/src/services/contactSync';
import type { TreatmentCreate, TreatmentItemCreate } from '@/src/types/treatment';
import { detectInputType, extractNameAndPhone, formatPhoneNumber } from '@/src/utils/phoneFormat';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  InteractionManager,
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
import SelectedTreatmentItemComponent, { type SelectedTreatmentItem } from './SelectedTreatmentItem';

interface BookingFormProps {
  selectedDate?: string;
  reservedTimes?: string[]; // 이미 예약된 시간들
  onClose: () => void;
  onBookingComplete: () => void;
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
  const [showRegistrationModal, setShowRegistrationModal] = useState(false); // 고객 등록 모달
  const [showContactSyncModal, setShowContactSyncModal] = useState(false); // 연락처 동기화 모달
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
  }, []); // 의존성 배열 비워두기

  // 최근 등록된 고객들 로드
  const loadRecentCustomers = useCallback(async () => {
    try {
      console.log('🔄 최근 고객 목록 로드 시작...');
      // 최근 등록 순서대로 10명 가져오기 (더 많이 가져와서 신규 고객 포함 확인)
      const response = await phonebookApiService.list({ size: 10, page: 1 });
      console.log('📋 API 응답:', response.items.length, '명');
      
      // created_at 기준으로 내림차순 정렬 (최신순)
      const sortedCustomers = response.items.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      console.log('📋 정렬된 최근 고객 목록:', sortedCustomers.map(c => `${c.name}(${c.id})`));
      
      // 상태 업데이트 전에 기존 목록과 비교
      setRecentCustomers(prev => {
        const isSame = prev.length === sortedCustomers.length && 
          prev.every((item, index) => item.id === sortedCustomers[index]?.id);
        
        if (!isSame) {
          console.log('✅ 최근 고객 목록 업데이트됨');
          return sortedCustomers;
        } else {
          console.log('🔄 최근 고객 목록 변경사항 없음');
          return prev;
        }
      });
    } catch (error) {
      console.error('❌ 최근 고객 로드 실패:', error);
      setRecentCustomers([]);
    }
  }, []);

  // 연락처 동기화 완료 핸들러
  const handleContactSyncComplete = useCallback(async (result: ContactSyncResult) => {
    console.log('🔄 연락처 동기화 완료:', result);
    try {
      // 동기화 완료 후 최근 고객 목록 새로고침
      await loadRecentCustomers();
      console.log('✅ 동기화 후 고객 목록 새로고침 완료');
    } catch (error) {
      console.error('❌ 동기화 후 고객 목록 새로고침 실패:', error);
    }
    setShowContactSyncModal(false);
  }, [loadRecentCustomers]);

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

  // 디버깅용 - 최근 고객 목록 상태 변화 추적
  useEffect(() => {
    console.log('🔍 최근 고객 목록 상태 변경됨:', {
      count: recentCustomers.length,
      customers: recentCustomers.map(c => `${c.name}(${c.id})`),
      showRecentCustomers,
      selectedCustomer: selectedCustomer?.name || 'none'
    });
  }, [recentCustomers, showRecentCustomers, selectedCustomer]);

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

  const addTreatment = useCallback((menuDetail: TreatmentMenuDetail) => {
    // 이미 선택된 시술인지 확인
    const isAlreadySelected = selectedTreatments.some(item => item.menuDetail.id === menuDetail.id);
    if (isAlreadySelected) {
      Alert.alert('알림', '이미 선택된 시술입니다.');
      return;
    }

    const newTreatment: SelectedTreatmentItem = {
      menuDetail,
      sessionNo: 1,
      customPrice: menuDetail.base_price,
      customDuration: menuDetail.duration_min
    };
    
    // 상호작용이 완료된 후 상태 업데이트를 수행하여 UI 블로킹 방지
    InteractionManager.runAfterInteractions(() => {
      setSelectedTreatments(prev => [...prev, newTreatment]);
    });
  }, [selectedTreatments]);

  const removeTreatment = useCallback((index: number) => {
    // 상호작용이 완료된 후 상태 업데이트를 수행하여 UI 블로킹 방지
    InteractionManager.runAfterInteractions(() => {
      setSelectedTreatments(prev => prev.filter((_, i) => i !== index));
    });
  }, []);

  const updateSessionNo = useCallback((index: number, sessionNo: number) => {
    console.log('회차 업데이트:', index, sessionNo);
    const newSessionNo = Math.max(1, sessionNo);
    console.log('새로운 회차:', newSessionNo);
    
    // 즉시 업데이트 (회차는 자주 바뀌므로 지연 없이)
    setSelectedTreatments(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], sessionNo: newSessionNo };
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

  const handlePriceTextChange = useCallback((index: number, text: string) => {
    // 숫자만 허용하고 빈 문자열도 허용 (임시로)
    const numericText = text.replace(/[^0-9]/g, '');
    const price = numericText === '' ? 0 : parseInt(numericText);
    updateCustomPrice(index, price);
  }, [updateCustomPrice]);

  const handleDurationTextChange = useCallback((index: number, text: string) => {
    // 숫자만 허용하고 빈 문자열도 허용 (임시로)
    const numericText = text.replace(/[^0-9]/g, '');
    const duration = numericText === '' ? 1 : parseInt(numericText);
    updateCustomDuration(index, duration);
  }, [updateCustomDuration]);

  const totalPrice = useMemo(() => {
    return selectedTreatments.reduce((total, item) => {
      return total + item.customPrice;
    }, 0);
  }, [selectedTreatments]);

  const totalDuration = useMemo(() => {
    return selectedTreatments.reduce((total, item) => {
      return total + item.customDuration;
    }, 0);
  }, [selectedTreatments]);

  // 고객 등록 모달 핸들러
  const handleCustomerRegistered = useCallback(async (customer: Phonebook) => {
    console.log('🎉 새 고객 등록됨:', customer.name, 'ID:', customer.id);
    
    setSelectedCustomer(customer);
    setCustomerSearch('');
    setShowRecentCustomers(false);
    setShowRegistrationModal(false);
    
    // 새 고객 등록 후 최근 고객 목록 다시 로드 (강제 새로고침)
    try {
      console.log('🔄 새 고객 등록 후 목록 새로고침 시작...');
      
      // 약간의 지연 후 새로고침 (서버 동기화 대기)
      setTimeout(async () => {
        try {
          await loadRecentCustomers();
          console.log('✅ 새 고객 등록 후 최근 고객 목록 업데이트 완료');
          
          // 추가로 상태 강제 업데이트
          setShowRecentCustomers(false);
          setCustomerSearch('');
        } catch (error) {
          console.error('❌ 최근 고객 목록 업데이트 실패:', error);
        }
      }, 500); // 500ms 지연으로 서버 동기화 대기
      
    } catch (error) {
      console.error('❌ 최근 고객 목록 새로고침 실패:', error);
    }
    
    Keyboard.dismiss();
  }, [loadRecentCustomers]);

  const openRegistrationModal = useCallback((searchText?: string) => {
    const input = searchText || customerSearch;
    const inputType = detectInputType(input);
    
    // 전화번호만 있는 경우 빠른 등록 모드로 열기
    if (inputType === 'phone') {
      setCustomerSearch(input);
      setShowRegistrationModal(true);
    } else {
      // 이름이 있거나 혼합된 경우 일반 등록 모드
      setCustomerSearch(input);
      setShowRegistrationModal(true);
    }
  }, [customerSearch]);

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

  // 컴포넌트 재마운트 추적을 위한 고유 ID
  const componentId = useMemo(() => Math.random().toString(36).substring(7), []);
  
  useEffect(() => {
    console.log('🔧 BookingForm 컴포넌트 마운트/재마운트됨. ID:', componentId);
    
    return () => {
      console.log('🔧 BookingForm 컴포넌트 언마운트됨. ID:', componentId);
    };
  }, [componentId]);

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
            removeClippedSubviews={false}
            scrollEventThrottle={1}
            decelerationRate="normal"
            disableIntervalMomentum={true}
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
              placeholder="고객 이름 또는 전화번호 검색 (010-1234-5678)"
              value={customerSearch}
              onChangeText={(text) => {
                // 숫자로만 이루어진 경우 전화번호로 간주하여 포맷팅
                if (/^\d/.test(text.trim())) {
                  setCustomerSearch(formatPhoneNumber(text));
                } else {
                  setCustomerSearch(text);
                }
              }}
              onFocus={() => {
                console.log('🎯 검색 입력 포커스 - 최근 고객 표시');
                // 포커스 시 최근 고객 표시 (검색어가 없고 고객이 선택되지 않은 경우)
                if (!customerSearch.trim() && !selectedCustomer) {
                  setShowRecentCustomers(true);
                  // 최근 고객 목록 새로고침
                  loadRecentCustomers().catch(error => {
                    console.error('포커스 시 최근 고객 로드 실패:', error);
                  });
                }
              }}
              onBlur={() => {
                console.log('🎯 검색 입력 블러');
                // 포커스 해제 시 최근 고객 목록 숨김 (지연 후 실행하여 터치 이벤트 처리 허용)
                setTimeout(() => {
                  if (!selectedCustomer && !customerSearch.trim()) {
                    setShowRecentCustomers(false);
                  }
                }, 200); // 200ms 지연으로 터치 이벤트가 먼저 처리되도록 함
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
                  <Text style={bookingFormStyles.customerPhone}>{formatPhoneNumber(selectedCustomer.phone_number)}</Text>
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
                          <Text style={bookingFormStyles.customerItemPhone}>{formatPhoneNumber(customer.phone_number)}</Text>
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
                    <Text style={{ color: '#666', marginBottom: 12 }}>검색 결과가 없습니다.</Text>
                    
                    <TouchableOpacity
                      style={bookingFormStyles.addCustomerButton}
                      onPress={() => openRegistrationModal(customerSearch)}
                      activeOpacity={0.7}
                    >
                      <Text style={bookingFormStyles.addCustomerButtonText}>새 고객 등록하기</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[bookingFormStyles.addCustomerButton, { backgroundColor: '#28a745', marginTop: 8 }]}
                      onPress={() => setShowContactSyncModal(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={bookingFormStyles.addCustomerButtonText}>📱 연락처 동기화</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* 최근 등록된 고객들 (포커스 시 또는 검색어가 없을 때) */}
                {!isSearching && showRecentCustomers && recentCustomers.length > 0 && customerSearch.trim().length === 0 && (
                  <View style={bookingFormStyles.searchResults}>
                    <Text style={bookingFormStyles.searchResultsTitle}>💚 최근 등록된 고객 ({recentCustomers.length}명)</Text>
                    {recentCustomers.slice(0, 8).map((customer, index) => (
                      <TouchableOpacity
                        key={`recent_customer_${customer.id}_${customer.created_at}_${index}`}
                        style={bookingFormStyles.customerItem}
                        onPress={() => {
                          console.log('🎯 최근 고객 선택 시도:', customer.name, 'ID:', customer.id);
                          console.log('🎯 현재 선택된 고객:', (selectedCustomer as Phonebook | null)?.name || 'none');
                          
                          // 중복 선택 방지
                          if ((selectedCustomer as Phonebook | null)?.id === customer.id) {
                            console.log('⚠️ 이미 선택된 고객입니다.');
                            return;
                          }
                          
                          // 상태 즉시 업데이트
                          console.log('✅ 고객 선택 처리 시작...');
                          setSelectedCustomer(customer);
                          setCustomerSearch('');
                          setShowRecentCustomers(false);
                          
                          console.log('✅ 고객 선택 완료:', customer.name);
                          
                          // 키보드 숨기기
                          setTimeout(() => {
                            Keyboard.dismiss();
                          }, 100);
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
                        <Text style={bookingFormStyles.customerItemPhone}>{formatPhoneNumber(customer.phone_number)}</Text>
                      </TouchableOpacity>
                    ))}
                    
                    {/* 연락처 동기화 버튼 추가 */}
                    <TouchableOpacity
                      style={[bookingFormStyles.addCustomerButton, { 
                        backgroundColor: '#28a745', 
                        marginTop: 12,
                        marginHorizontal: 8 
                      }]}
                      onPress={() => setShowContactSyncModal(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={bookingFormStyles.addCustomerButtonText}>📱 연락처 동기화</Text>
                    </TouchableOpacity>
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
              💡 각 시술은 한 번씩만 선택할 수 있습니다
            </Text>
            {treatmentMenus.map((menu) => (
              <View key={menu.id} style={bookingFormStyles.menuGroup}>
                <Text style={bookingFormStyles.menuGroupTitle}>{menu.name}</Text>
                {menu.details.map((detail) => {
                  const isSelected = selectedTreatments.some(item => item.menuDetail.id === detail.id);
                  return (
                    <TouchableOpacity
                      key={detail.id}
                      style={[
                        bookingFormStyles.treatmentOption,
                        isSelected && bookingFormStyles.treatmentOptionSelected
                      ]}
                      onPress={() => !isSelected && addTreatment(detail)}
                      disabled={isSelected}
                      activeOpacity={isSelected ? 1 : 0.6}
                      delayPressIn={0}
                    >
                      <View style={bookingFormStyles.treatmentInfo}>
                        <Text style={[
                          bookingFormStyles.treatmentName,
                          isSelected && bookingFormStyles.treatmentNameSelected
                        ]}>
                          {detail.name}
                        </Text>
                        <Text style={[
                          bookingFormStyles.treatmentDetails,
                          isSelected && bookingFormStyles.treatmentDetailsSelected
                        ]}>
                          {detail.base_price.toLocaleString()}원 • {detail.duration_min}분
                        </Text>
                      </View>
                      <Text style={[
                        bookingFormStyles.addButton,
                        isSelected && bookingFormStyles.addButtonSelected
                      ]}>
                        {isSelected ? '✓' : '+'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* 선택된 시술들 */}
          {selectedTreatments.length > 0 && (
            <View style={bookingFormStyles.section}>
              <Text style={bookingFormStyles.sectionTitle}>✅ 선택된 시술</Text>
              <Text style={bookingFormStyles.sectionSubtitle}>
                💡 회차와 가격, 시간을 조정할 수 있습니다
              </Text>
              <FlatList
                data={selectedTreatments}
                keyExtractor={(item, index) => `treatment-${item.menuDetail.id}-${index}`}
                renderItem={({ item, index }) => (
                  <SelectedTreatmentItemComponent
                    item={item}
                    index={index}
                    onRemove={removeTreatment}
                    onUpdateSessionNo={updateSessionNo}
                    onUpdatePrice={handlePriceTextChange}
                    onUpdateDuration={handleDurationTextChange}
                  />
                )}
                scrollEnabled={false}
                nestedScrollEnabled={true}
                removeClippedSubviews={true}
                initialNumToRender={5}
                maxToRenderPerBatch={5}
                windowSize={10}
                updateCellsBatchingPeriod={50}
                getItemLayout={(data, index) => ({ length: 200, offset: 200 * index, index })}
              />
              <View style={bookingFormStyles.totalSummary}>
                <Text style={bookingFormStyles.totalText}>
                  총 {totalDuration}분 • {totalPrice.toLocaleString()}원
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
    
    {/* 고객 등록 모달 */}
    <CustomerRegistrationModal
      visible={showRegistrationModal}
      onClose={() => setShowRegistrationModal(false)}
      onCustomerRegistered={handleCustomerRegistered}
      initialPhone={(() => {
        const { phone } = extractNameAndPhone(customerSearch);
        return phone || customerSearch;
      })()}
      initialName={(() => {
        const { name } = extractNameAndPhone(customerSearch);
        return name;
      })()}
      quickMode={detectInputType(customerSearch) === 'phone'}
    />

    {/* 연락처 동기화 모달 */}
    <ContactSyncModal
      visible={showContactSyncModal}
      onClose={() => setShowContactSyncModal(false)}
      onSyncComplete={handleContactSyncComplete}
    />
    </KeyboardAvoidingView>
  );
}
