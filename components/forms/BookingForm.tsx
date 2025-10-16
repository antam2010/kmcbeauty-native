import ContactSyncModal from '@/components/modals/ContactSyncModal';
import CustomerRegistrationModal from '@/components/modals/CustomerRegistrationModal';
import { phonebookApiService, type Phonebook } from '@/src/api/services/phonebook';
import { shopApiService, type ShopUser } from '@/src/api/services/shop';
import { treatmentApiService } from '@/src/api/services/treatment';
import { treatmentMenuApiService, type TreatmentMenu, type TreatmentMenuDetail } from '@/src/api/services/treatmentMenu';
import type { Treatment, TreatmentCreate, TreatmentItemCreate, TreatmentUpdate } from '@/src/types';
import { formatKoreanDate } from '@/src/utils/dateUtils';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
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

// 단계 정의 (시간 → 고객 → 시술 → 확인)
type WizardStep = 'time' | 'customer' | 'treatment' | 'confirm';

interface SelectedTreatmentData {
  menuDetail: TreatmentMenuDetail;
  sessionNo: number;
  customPrice: number;
  customDuration: number;
}

interface BookingFormProps {
  selectedDate?: string;
  onClose: () => void;
  onBookingComplete: () => void;
  onDateChange?: (date: string) => void;
  editMode?: boolean;
  treatment?: Treatment;
}

export default function BookingForm({ 
  selectedDate, 
  onClose, 
  onBookingComplete,
  onDateChange,
  editMode = false,
  treatment
}: BookingFormProps) {
  const insets = useSafeAreaInsets();
  
  // 현재 단계 (편집 모드면 확인 단계로 시작)
  const [currentStep, setCurrentStep] = useState<WizardStep>(editMode ? 'confirm' : 'time');
  
  // 예약 데이터 (날짜는 달력에서 선택되어 props로 전달됨)
  const currentDate = selectedDate || new Date().toISOString().split('T')[0];
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedTreatments, setSelectedTreatments] = useState<SelectedTreatmentData[]>([]);
  
  // 선택 사항 (기본값 포함)
  const [selectedStaff, setSelectedStaff] = useState<ShopUser | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH' | 'UNPAID'>('CASH'); // 기본값: 현금
  const [status, setStatus] = useState<Treatment['status']>('RESERVED'); // 기본값: 예약됨
  const [memo, setMemo] = useState('');
  
  // 고객 정보 (선택사항)
  const [selectedCustomer, setSelectedCustomer] = useState<Phonebook | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Phonebook[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // 데이터 로딩
  const [isLoading, setIsLoading] = useState(false);
  const [treatmentMenus, setTreatmentMenus] = useState<TreatmentMenu[]>([]);
  const [staffUsers, setStaffUsers] = useState<ShopUser[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set());

  // 고객 등록 모달
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showContactSyncModal, setShowContactSyncModal] = useState(false);

  // 시간 슬롯 (30분 간격)
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
  ];

  // 초기 데이터 로드 함수
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 병렬로 데이터 로드
      const [menus, users] = await Promise.all([
        treatmentMenuApiService.getAllWithDetails(),
        shopApiService.getCurrentShopUsers()
      ]);
      
      setTreatmentMenus(menus);
      setStaffUsers(users);
      
      // 기본 담당자 설정 (대표자 우선)
      if (!editMode) {
        const primary = users.find(u => u.is_primary_owner === 1);
        const defaultStaff = primary || users[0];
        if (defaultStaff) {
          setSelectedStaff(defaultStaff);
        }
      }
    } catch (error) {
      console.error('초기 데이터 로드 실패:', error);
      Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [editMode]);

  // 편집 모드 데이터 초기화 함수
  const initializeEditData = useCallback(() => {
    if (!treatment) return;

    // 날짜와 시간 설정
    const reservedDate = new Date(treatment.reserved_at);
    const timeStr = reservedDate.toTimeString().slice(0, 5);
    setSelectedTime(timeStr);

    // 고객 정보 설정
    if (treatment.phonebook) {
      setSelectedCustomer({
        id: treatment.phonebook.id,
        shop_id: treatment.shop_id,
        name: treatment.phonebook.name,
        phone_number: treatment.phonebook.phone_number,
        group_name: treatment.phonebook.group_name || null,
        memo: treatment.phonebook.memo || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } else if (treatment.customer_name || treatment.customer_phone) {
      // 전화번호부에 없는 고객
      setCustomerName(treatment.customer_name || '');
      setCustomerPhone(treatment.customer_phone || '');
    }

    // 시술 항목 설정
    if (treatment.treatment_items && treatment.treatment_items.length > 0 && treatmentMenus.length > 0) {
      const items: SelectedTreatmentData[] = [];
      
      for (const item of treatment.treatment_items) {
        // 메뉴 상세 정보를 treatmentMenus에서 찾기
        let menuDetail: TreatmentMenuDetail | null = null;
        
        for (const menu of treatmentMenus) {
          const detail = menu.details.find(d => d.id === item.menu_detail?.id);
          if (detail) {
            menuDetail = detail;
            break;
          }
        }
        
        if (menuDetail) {
          items.push({
            menuDetail,
            sessionNo: item.session_no,
            customPrice: item.base_price,
            customDuration: item.duration_min
          });
        }
      }
      
      setSelectedTreatments(items);
    }

    // 메모, 결제방법, 상태 설정
    setMemo(treatment.memo || '');
    setPaymentMethod((treatment.payment_method as 'CARD' | 'CASH' | 'UNPAID') || 'CASH');
    setStatus(treatment.status);

    // 담당자 설정
    if (treatment.staff_user && staffUsers.length > 0) {
      const staff = staffUsers.find(u => u.user_id === treatment.staff_user_id);
      if (staff) {
        setSelectedStaff(staff);
      }
    }
  }, [treatment, treatmentMenus, staffUsers]);

  // 초기 데이터 로드
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 편집 모드 데이터 초기화 (staffUsers와 treatmentMenus 로드 후)
  useEffect(() => {
    if (editMode && treatment && staffUsers.length > 0 && treatmentMenus.length > 0) {
      initializeEditData();
    }
  }, [editMode, treatment, staffUsers.length, treatmentMenus.length, initializeEditData]);

  // 고객 검색
  const searchCustomers = useCallback(async () => {
    try {
      setIsSearching(true);
      const response = await phonebookApiService.list({ 
        search: customerSearchQuery,
        size: 20 
      });
      setSearchResults(response.items);
    } catch (error) {
      console.error('고객 목록 로드 실패:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [customerSearchQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (customerSearchQuery.trim()) {
        searchCustomers();
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [customerSearchQuery, searchCustomers]);

  // 다음 단계로
  const goNext = useCallback(() => {
    const steps: WizardStep[] = ['time', 'customer', 'treatment', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  }, [currentStep]);

  // 이전 단계로
  const goBack = useCallback(() => {
    const steps: WizardStep[] = ['time', 'customer', 'treatment', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    } else {
      onClose();
    }
  }, [currentStep, onClose]);

  // 예약 완료 또는 수정
  const handleSubmit = async () => {
    // 필수 정보 검증: 시간, 시술
    if (!selectedTime || selectedTreatments.length === 0) {
      Alert.alert('알림', '시간과 시술을 선택해주세요.');
      return;
    }

    try {
      setIsLoading(true);

      const treatmentItems: TreatmentItemCreate[] = selectedTreatments.map(item => ({
        menu_detail_id: item.menuDetail.id,
        session_no: item.sessionNo,
        base_price: item.customPrice,
        duration_min: item.customDuration
      }));

      // reserved_at: date + time을 ISO 형식으로 조합
      const reservedAt = `${currentDate}T${selectedTime}:00`;

      if (editMode && treatment) {
        // 수정 모드
        const updateData: TreatmentUpdate = {
          phonebook_id: selectedCustomer?.id,
          customer_name: selectedCustomer ? undefined : (customerName.trim() || undefined),
          customer_phone: selectedCustomer ? undefined : (customerPhone.trim() || undefined),
          reserved_at: reservedAt,
          status: status as 'RESERVED' | 'VISITED' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED',
          payment_method: paymentMethod,
          staff_user_id: selectedStaff?.user_id,
          memo: memo.trim() || undefined,
          treatment_items: treatmentItems
        };

        await treatmentApiService.update(treatment.id, updateData);
        
        Alert.alert('성공', '예약이 수정되었습니다.', [
          { text: '확인', onPress: onBookingComplete }
        ]);
      } else {
        // 생성 모드
        const treatmentData: TreatmentCreate = {
          phonebook_id: selectedCustomer?.id,
          customer_name: selectedCustomer ? undefined : (customerName.trim() || undefined),
          customer_phone: selectedCustomer ? undefined : (customerPhone.trim() || undefined),
          reserved_at: reservedAt,
          status: 'RESERVED',
          payment_method: paymentMethod,
          staff_user_id: selectedStaff?.user_id,
          memo: memo.trim() || undefined,
          treatment_items: treatmentItems
        };

        await treatmentApiService.create(treatmentData);
        
        Alert.alert('성공', '예약이 완료되었습니다.', [
          { text: '확인', onPress: onBookingComplete }
        ]);
      }
    } catch (error) {
      console.error(editMode ? '예약 수정 실패:' : '예약 생성 실패:', error);
      Alert.alert('오류', editMode ? '예약 수정에 실패했습니다.' : '예약 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 시술 추가 (중복 체크)
  const handleAddTreatment = (menuDetail: TreatmentMenuDetail) => {
    // 이미 선택된 시술인지 확인
    const isAlreadySelected = selectedTreatments.some(
      item => item.menuDetail.id === menuDetail.id
    );
    
    if (isAlreadySelected) {
      Alert.alert('알림', '이미 선택된 시술입니다.');
      return;
    }
    
    const newItem: SelectedTreatmentData = {
      menuDetail,
      sessionNo: 1,
      customPrice: menuDetail.base_price,
      customDuration: menuDetail.duration_min
    };
    setSelectedTreatments(prev => [...prev, newItem]);
  };

  // 시술 제거
  const handleRemoveTreatment = (index: number) => {
    setSelectedTreatments(prev => prev.filter((_, i) => i !== index));
  };

  // 시술 업데이트
  const handleUpdateTreatment = (index: number, updates: Partial<SelectedTreatmentData>) => {
    setSelectedTreatments(prev => prev.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    ));
  };

  // 다음 버튼 활성화 체크
  const canGoNext = () => {
    switch (currentStep) {
      case 'time':
        return !!selectedTime;
      case 'customer':
        // 고객 정보가 있거나, 이름이나 전화번호가 입력되어 있으면 통과
        return !!selectedCustomer || !!customerName.trim() || !!customerPhone.trim();
      case 'treatment':
        return selectedTreatments.length > 0;
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  // 진행률 계산
  const getProgress = () => {
    const steps: WizardStep[] = ['time', 'customer', 'treatment', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  // 단계 제목
  const getStepTitle = () => {
    switch (currentStep) {
      case 'time':
        return '시간 선택';
      case 'customer':
        return '고객 선택';
      case 'treatment':
        return '시술 선택';
      case 'confirm':
        return '예약 확인';
      default:
        return '';
    }
  };

  // 시간 선택 단계
  const renderTimeStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepDescription}>
        예약하실 시간을 선택해주세요
      </Text>
      <View style={styles.timeSlotGrid}>
        {timeSlots.map((time) => (
          <TouchableOpacity
            key={time}
            style={[
              styles.timeSlot,
              selectedTime === time && styles.timeSlotSelected
            ]}
            onPress={() => setSelectedTime(time)}
          >
            <Text style={[
              styles.timeSlotText,
              selectedTime === time && styles.timeSlotTextSelected
            ]}>
              {time}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // 고객 선택 단계
  const renderCustomerStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepDescription}>
        예약하실 고객 정보를 입력해주세요
      </Text>

      {selectedCustomer ? (
        // 선택된 고객 표시
        <View style={styles.selectedCustomerContainer}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{selectedCustomer.name}</Text>
            <Text style={styles.customerPhone}>{selectedCustomer.phone_number}</Text>
          </View>
          <TouchableOpacity 
            style={styles.changeCustomerButton}
            onPress={() => {
              setSelectedCustomer(null);
              setShowCustomerSearch(true);
            }}
          >
            <Text style={styles.changeCustomerButtonText}>변경</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // 고객 검색 또는 직접 입력
        <View style={styles.customerInputContainer}>
          <View style={styles.customerInputRow}>
            <TextInput
              style={styles.customerInput}
              placeholder="이름 (선택사항)"
              value={customerName}
              onChangeText={setCustomerName}
            />
          </View>
          <View style={styles.customerInputRow}>
            <TextInput
              style={styles.customerInput}
              placeholder="전화번호 (선택사항)"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              keyboardType="phone-pad"
            />
          </View>
          <TouchableOpacity
            style={styles.searchCustomerButton}
            onPress={() => setShowCustomerSearch(true)}
          >
            <Text style={styles.searchCustomerButtonText}>전화번호부에서 찾기</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // 시술 선택 단계
  const renderTreatmentStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepDescription}>
        원하시는 시술을 선택해주세요
      </Text>
      
      {/* 선택된 시술 목록 - 컴팩트 & 편집 가능 */}
      {selectedTreatments.length > 0 && (
        <View style={styles.selectedTreatmentsContainer}>
          <View style={styles.selectedHeader}>
            <Text style={styles.selectedTitle}>선택된 시술</Text>
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>{selectedTreatments.length}</Text>
            </View>
          </View>
          {selectedTreatments.map((item, index) => (
            <View key={index} style={styles.selectedTreatmentCard}>
              <View style={styles.selectedTreatmentInfo}>
                <Text style={styles.selectedTreatmentName}>{item.menuDetail.name}</Text>
                
                {/* 편집 가능한 정보 */}
                <View style={styles.editableFieldsRow}>
                  {/* 회차 */}
                  <View style={styles.editableField}>
                    <Text style={styles.fieldLabel}>회차</Text>
                    <View style={styles.fieldInputContainer}>
                      <TextInput
                        style={styles.fieldInput}
                        value={String(item.sessionNo)}
                        onChangeText={(text) => {
                          // 빈 문자열이면 임시로 0으로 설정 (사용자가 입력 중)
                          if (text === '') {
                            handleUpdateTreatment(index, { sessionNo: 0 });
                            return;
                          }
                          const num = parseInt(text);
                          if (!isNaN(num) && num >= 0) {
                            handleUpdateTreatment(index, { sessionNo: num });
                          }
                        }}
                        onBlur={() => {
                          // 포커스를 잃을 때 0이면 1로 변경
                          if (item.sessionNo === 0) {
                            handleUpdateTreatment(index, { sessionNo: 1 });
                          }
                        }}
                        keyboardType="number-pad"
                        maxLength={3}
                      />
                    </View>
                  </View>
                  
                  {/* 가격 */}
                  <View style={styles.editableField}>
                    <Text style={styles.fieldLabel}>가격(원)</Text>
                    <View style={styles.fieldInputContainer}>
                      <TextInput
                        style={styles.fieldInput}
                        value={item.customPrice === 0 ? '' : String(item.customPrice)}
                        onChangeText={(text) => {
                          // 빈 문자열이면 0으로 설정
                          if (text === '') {
                            handleUpdateTreatment(index, { customPrice: 0 });
                            return;
                          }
                          const num = parseInt(text.replace(/[^0-9]/g, ''));
                          if (!isNaN(num) && num >= 0) {
                            handleUpdateTreatment(index, { customPrice: num });
                          }
                        }}
                        keyboardType="number-pad"
                        maxLength={7}
                        placeholder="0"
                      />
                    </View>
                  </View>
                  
                  {/* 시간 */}
                  <View style={styles.editableField}>
                    <Text style={styles.fieldLabel}>시간(분)</Text>
                    <View style={styles.fieldInputContainer}>
                      <TextInput
                        style={styles.fieldInput}
                        value={item.customDuration === 0 ? '' : String(item.customDuration)}
                        onChangeText={(text) => {
                          // 빈 문자열이면 0으로 설정
                          if (text === '') {
                            handleUpdateTreatment(index, { customDuration: 0 });
                            return;
                          }
                          const num = parseInt(text);
                          if (!isNaN(num) && num >= 0) {
                            handleUpdateTreatment(index, { customDuration: num });
                          }
                        }}
                        keyboardType="number-pad"
                        maxLength={3}
                        placeholder="0"
                      />
                    </View>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveTreatment(index)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* 시술 메뉴 목록 - 현대적 디자인 */}
      <Text style={styles.menuSectionTitle}>시술 메뉴</Text>
      <View style={styles.menuList}>
        {treatmentMenus.map(menu => (
          <View key={menu.id} style={styles.modernMenuContainer}>
            <TouchableOpacity
              style={styles.modernMenuHeader}
              onPress={() => {
                const isExpanded = expandedMenus.has(menu.id);
                setExpandedMenus(prev => {
                  const next = new Set(prev);
                  if (isExpanded) {
                    next.delete(menu.id);
                  } else {
                    next.add(menu.id);
                  }
                  return next;
                });
              }}
              activeOpacity={0.7}
            >
              <View style={styles.menuTitleContainer}>
                <View style={[
                  styles.menuIcon,
                  expandedMenus.has(menu.id) && styles.menuIconExpanded
                ]}>
                  <Text style={styles.menuIconText}>
                    {expandedMenus.has(menu.id) ? '−' : '+'}
                  </Text>
                </View>
                <Text style={styles.modernMenuTitle}>{menu.name}</Text>
              </View>
              <View style={styles.menuBadge}>
                <Text style={styles.menuBadgeText}>{menu.details.length}</Text>
              </View>
            </TouchableOpacity>
            
            {expandedMenus.has(menu.id) && (
              <View style={styles.modernMenuDetails}>
                {menu.details.map(detail => {
                  const isSelected = selectedTreatments.some(
                    item => item.menuDetail.id === detail.id
                  );
                  
                  return (
                    <TouchableOpacity
                      key={detail.id}
                      style={[
                        styles.modernMenuDetailItem,
                        isSelected && styles.modernMenuDetailItemSelected
                      ]}
                      onPress={() => handleAddTreatment(detail)}
                      activeOpacity={0.7}
                      disabled={isSelected}
                    >
                      <View style={styles.detailLeftSection}>
                        <Text style={[
                          styles.modernDetailName,
                          isSelected && styles.modernDetailNameSelected
                        ]}>
                          {detail.name}
                          {isSelected && ' ✓'}
                        </Text>
                        <View style={styles.detailMetaRow}>
                          <View style={styles.metaItem}>
                            <Text style={styles.metaIcon}>💰</Text>
                            <Text style={[
                              styles.metaText,
                              isSelected && styles.metaTextSelected
                            ]}>
                              {detail.base_price.toLocaleString()}원
                            </Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Text style={styles.metaIcon}>⏱</Text>
                            <Text style={[
                              styles.metaText,
                              isSelected && styles.metaTextSelected
                            ]}>
                              {detail.duration_min}분
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={[
                        styles.modernAddButton,
                        isSelected && styles.modernAddButtonSelected
                      ]}>
                        <Text style={styles.modernAddButtonText}>
                          {isSelected ? '✓' : '+'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  // 확인 단계
  const renderConfirmStep = () => {
    const totalPrice = selectedTreatments.reduce((sum, item) => sum + item.customPrice, 0);
    const totalDuration = selectedTreatments.reduce((sum, item) => sum + item.customDuration, 0);

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepDescription}>
          예약 정보를 확인하고 추가 정보를 입력해주세요
        </Text>

        {/* 예약 정보 요약 */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>예약 정보</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>날짜</Text>
            <Text style={styles.summaryValue}>{formatKoreanDate(currentDate)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>시간</Text>
            <Text style={styles.summaryValue}>{selectedTime}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>총 시간</Text>
            <Text style={styles.summaryValue}>{totalDuration}분</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>총 금액</Text>
            <Text style={styles.summaryValuePrice}>{totalPrice.toLocaleString()}원</Text>
          </View>
        </View>

        {/* 선택된 시술 목록 */}
        <View style={styles.treatmentSummaryContainer}>
          <Text style={styles.sectionTitle}>시술 목록</Text>
          {selectedTreatments.map((item, index) => (
            <View key={index} style={styles.treatmentSummaryItem}>
              <Text style={styles.treatmentSummaryName}>{item.menuDetail.name}</Text>
              <Text style={styles.treatmentSummaryDetails}>
                {item.sessionNo}회차 · {item.customPrice.toLocaleString()}원 · {item.customDuration}분
              </Text>
            </View>
          ))}
        </View>

        {/* 선택된 고객 정보 표시 (있는 경우) */}
        {(selectedCustomer || customerName || customerPhone) && (
          <View style={styles.customerContainer}>
            <Text style={styles.sectionTitle}>고객 정보</Text>
            <View style={styles.summaryContainer}>
              {selectedCustomer ? (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>이름</Text>
                    <Text style={styles.summaryValue}>{selectedCustomer.name}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>전화번호</Text>
                    <Text style={styles.summaryValue}>{selectedCustomer.phone_number}</Text>
                  </View>
                </>
              ) : (
                <>
                  {customerName && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>이름</Text>
                      <Text style={styles.summaryValue}>{customerName}</Text>
                    </View>
                  )}
                  {customerPhone && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>전화번호</Text>
                      <Text style={styles.summaryValue}>{customerPhone}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        )}

        {/* 담당자 선택 */}
        <View style={styles.staffContainer}>
          <Text style={styles.sectionTitle}>담당자 (선택사항)</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.staffScrollView}
            contentContainerStyle={styles.staffScrollContent}
          >
            {staffUsers.map(staff => (
              <TouchableOpacity
                key={staff.user_id}
                style={[
                  styles.staffOption,
                  selectedStaff?.user_id === staff.user_id && styles.staffOptionSelected
                ]}
                onPress={() => setSelectedStaff(staff)}
              >
                <Text style={[
                  styles.staffOptionText,
                  selectedStaff?.user_id === staff.user_id && styles.staffOptionTextSelected
                ]}>
                  {staff.user.name}
                  {staff.is_primary_owner === 1 && ' (대표)'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 결제 방법 */}
        <View style={styles.paymentContainer}>
          <Text style={styles.sectionTitle}>결제 방법</Text>
          <View style={styles.paymentOptions}>
            {(['CASH', 'CARD', 'UNPAID'] as const).map(method => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.paymentOption,
                  paymentMethod === method && styles.paymentOptionSelected
                ]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text style={[
                  styles.paymentOptionText,
                  paymentMethod === method && styles.paymentOptionTextSelected
                ]}>
                  {method === 'CASH' ? '현금' : method === 'CARD' ? '카드' : '미수금'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 메모 */}
        <View style={styles.memoContainer}>
          <Text style={styles.sectionTitle}>메모 (선택사항)</Text>
          <TextInput
            style={styles.memoInput}
            placeholder="메모를 입력하세요"
            value={memo}
            onChangeText={setMemo}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </View>
    );
  };

  // 단계별 렌더링
  const renderStepContent = () => {
    switch (currentStep) {
      case 'time':
        return renderTimeStep();
      case 'customer':
        return renderCustomerStep();
      case 'treatment':
        return renderTreatmentStep();
      case 'confirm':
        return renderConfirmStep();
      default:
        return null;
    }
  };

  if (isLoading && currentStep === 'time') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>데이터 로딩 중...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>
              {currentStep === 'time' ? '✕' : '←'}
            </Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{getStepTitle()}</Text>
            <Text style={styles.headerSubtitle}>
              {currentStep === 'time' && formatKoreanDate(currentDate)}
              {currentStep === 'customer' && '예약 고객 정보'}
              {currentStep === 'treatment' && '원하는 시술을 선택하세요'}
              {currentStep === 'confirm' && '예약 정보를 확인하세요'}
            </Text>
          </View>
          {currentStep !== 'time' && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
          {currentStep === 'time' && <View style={styles.headerRight} />}
        </View>

        {/* 진행률 바 */}
        {!editMode && (
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${getProgress()}%` }]} />
          </View>
        )}

        {/* 단계별 컨텐츠 */}
        {(currentStep === 'customer' || currentStep === 'confirm') ? (
          // 고객/확인 단계: KeyboardAvoidingView 사용 (입력 필드가 있음)
          <KeyboardAvoidingView 
            style={styles.content}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
          >
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 80 }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {renderStepContent()}
            </ScrollView>
          </KeyboardAvoidingView>
        ) : (
          // 시간/시술 선택 단계: 일반 ScrollView만 사용
          <ScrollView 
            style={styles.content}
            contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 80 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderStepContent()}
          </ScrollView>
        )}

        {/* 하단 버튼 */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          {currentStep !== 'confirm' ? (
            <TouchableOpacity
              style={[styles.nextButton, !canGoNext() && styles.nextButtonDisabled]}
              onPress={goNext}
              disabled={!canGoNext()}
            >
              <Text style={[styles.nextButtonText, !canGoNext() && styles.nextButtonTextDisabled]}>
                다음
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.nextButtonText}>예약 {editMode ? '수정' : '완료'}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* 고객 검색 모달 */}
        <CustomerSearchModal
          visible={showCustomerSearch}
          searchQuery={customerSearchQuery}
          searchResults={searchResults}
          isSearching={isSearching}
          onClose={() => setShowCustomerSearch(false)}
          onChangeQuery={setCustomerSearchQuery}
          onSelectCustomer={(customer) => {
            setSelectedCustomer(customer);
            setCustomerName('');
            setCustomerPhone('');
            setShowCustomerSearch(false);
            setCustomerSearchQuery('');
          }}
          onOpenRegistration={() => {
            setShowCustomerSearch(false);
            setShowRegistrationModal(true);
          }}
          onOpenContactSync={() => {
            setShowCustomerSearch(false);
            setShowContactSyncModal(true);
          }}
        />

        {/* 고객 등록 모달 */}
        <CustomerRegistrationModal
          visible={showRegistrationModal}
          onClose={() => setShowRegistrationModal(false)}
          onCustomerRegistered={(newCustomer) => {
            setSelectedCustomer(newCustomer);
            setCustomerName('');
            setCustomerPhone('');
            setShowRegistrationModal(false);
          }}
        />

        {/* 연락처 동기화 모달 */}
        <ContactSyncModal
          visible={showContactSyncModal}
          onClose={() => setShowContactSyncModal(false)}
          onSyncComplete={() => {
            setShowContactSyncModal(false);
          }}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

// 고객 검색 모달 컴포넌트
interface CustomerSearchModalProps {
  visible: boolean;
  searchQuery: string;
  searchResults: Phonebook[];
  isSearching: boolean;
  onClose: () => void;
  onChangeQuery: (query: string) => void;
  onSelectCustomer: (customer: Phonebook) => void;
  onOpenRegistration: () => void;
  onOpenContactSync: () => void;
}

function CustomerSearchModal({
  visible,
  searchQuery,
  searchResults,
  isSearching,
  onClose,
  onChangeQuery,
  onSelectCustomer,
  onOpenRegistration,
  onOpenContactSync
}: CustomerSearchModalProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <Modal visible={visible} animationType="slide" presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : 'pageSheet'}>
      <KeyboardAvoidingView 
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Text style={styles.modalCloseButtonText}>취소</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>고객 검색</Text>
          <View style={styles.modalHeaderRight} />
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="고객명 또는 전화번호로 검색"
            value={searchQuery}
            onChangeText={onChangeQuery}
            autoFocus
            returnKeyType="search"
          />
        </View>

        <ScrollView 
          style={styles.searchResults}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {isSearching ? (
            <View style={styles.searchLoadingContainer}>
              <ActivityIndicator color="#667eea" />
              <Text style={styles.searchLoadingText}>검색 중...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            searchResults.map(customer => (
              <TouchableOpacity
                key={customer.id}
                style={styles.customerSearchItem}
                onPress={() => onSelectCustomer(customer)}
              >
                <View style={styles.customerSearchInfo}>
                  <Text style={styles.customerSearchName}>{customer.name}</Text>
                  <Text style={styles.customerSearchPhone}>{customer.phone_number}</Text>
                </View>
                <Text style={styles.selectButton}>선택</Text>
              </TouchableOpacity>
            ))
          ) : searchQuery.trim() ? (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>검색 결과가 없습니다</Text>
              <TouchableOpacity style={styles.actionButton} onPress={onOpenRegistration}>
                <Text style={styles.actionButtonText}>새 고객 등록</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={onOpenContactSync}>
                <Text style={styles.actionButtonText}>연락처에서 가져오기</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.searchHelpContainer}>
              <Text style={styles.searchHelpText}>고객명 또는 전화번호로 검색하세요</Text>
              <TouchableOpacity style={styles.actionButton} onPress={onOpenRegistration}>
                <Text style={styles.actionButtonText}>새 고객 등록</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={onOpenContactSync}>
                <Text style={styles.actionButtonText}>연락처에서 가져오기</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    color: '#333333',
    fontWeight: '600',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  headerRight: {
    width: 44,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666666',
    fontWeight: '300',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#f0f0f0',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#667eea',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
  },
  // 시간 선택 스타일
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: '30%',
    paddingVertical: 16,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeSlotSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  timeSlotText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  timeSlotTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  // 시술 선택 스타일 - 현대적 & 컴팩트 디자인
  selectedTreatmentsContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d0e7ff',
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
  },
  selectedBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  selectedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  selectedTreatmentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedTreatmentInfo: {
    flex: 1,
  },
  selectedTreatmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  selectedTreatmentMeta: {
    fontSize: 12,
    color: '#666666',
  },
  editableFieldsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editableField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 4,
  },
  fieldInputContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  fieldInput: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  removeButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
  menuSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 10,
    marginTop: 4,
  },
  menuList: {
    gap: 6,
  },
  modernMenuContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    overflow: 'hidden',
    marginBottom: 6,
  },
  modernMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fafafa',
  },
  menuTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  menuIconExpanded: {
    backgroundColor: '#007AFF',
  },
  menuIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666666',
  },
  modernMenuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  menuBadge: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  menuBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  modernMenuDetails: {
    backgroundColor: '#ffffff',
  },
  modernMenuDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  modernMenuDetailItemSelected: {
    backgroundColor: '#f0f7ff',
    opacity: 0.6,
  },
  detailLeftSection: {
    flex: 1,
  },
  modernDetailName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  modernDetailNameSelected: {
    color: '#007AFF',
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIcon: {
    fontSize: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#666666',
  },
  metaTextSelected: {
    color: '#999999',
  },
  modernAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modernAddButtonSelected: {
    backgroundColor: '#34C759',
  },
  modernAddButtonText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
  },
  // 기존 스타일 (확인 단계 등에서 사용)
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginTop: 16,
  },
  menuContainer: {
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  expandIcon: {
    fontSize: 14,
    color: '#666666',
  },
  menuDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  menuDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuDetailInfo: {
    flex: 1,
  },
  menuDetailName: {
    fontSize: 15,
    color: '#333333',
    marginBottom: 4,
  },
  menuDetailMeta: {
    fontSize: 13,
    color: '#666666',
  },
  addButton: {
    fontSize: 20,
    color: '#667eea',
    fontWeight: '600',
    width: 32,
    textAlign: 'center',
  },
  // 확인 단계 스타일
  summaryContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
  },
  summaryValuePrice: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  treatmentSummaryContainer: {
    marginBottom: 24,
  },
  treatmentSummaryItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  treatmentSummaryName: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
    marginBottom: 4,
  },
  treatmentSummaryDetails: {
    fontSize: 13,
    color: '#666666',
  },
  customerContainer: {
    marginBottom: 24,
  },
  selectedCustomerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#666666',
  },
  changeCustomerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#667eea',
    borderRadius: 6,
  },
  changeCustomerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  customerInputContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  customerInputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  customerInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchCustomerButton: {
    paddingVertical: 12,
    backgroundColor: '#667eea',
    borderRadius: 8,
    alignItems: 'center',
  },
  searchCustomerButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  staffContainer: {
    marginBottom: 24,
  },
  staffScrollView: {
    flexGrow: 0,
  },
  staffScrollContent: {
    paddingRight: 16,
  },
  staffOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  staffOptionSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  staffOptionText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  staffOptionTextSelected: {
    color: '#ffffff',
  },
  paymentContainer: {
    marginBottom: 24,
  },
  paymentOptions: {
    flexDirection: 'row',
  },
  paymentOption: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentOptionSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  paymentOptionText: {
    fontSize: 15,
    color: '#666666',
    fontWeight: '500',
  },
  paymentOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  memoContainer: {
    marginBottom: 24,
  },
  memoInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    height: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  nextButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonTextDisabled: {
    color: '#888888',
  },
  // 모달 스타일
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalCloseButton: {
    paddingVertical: 8,
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: '#667eea',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  modalHeaderRight: {
    width: 60,
  },
  searchContainer: {
    padding: 20,
  },
  searchInput: {
    height: 48,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchResults: {
    flex: 1,
  },
  searchLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  searchLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
  },
  customerSearchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  customerSearchInfo: {
    flex: 1,
  },
  customerSearchName: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
    marginBottom: 4,
  },
  customerSearchPhone: {
    fontSize: 14,
    color: '#666666',
  },
  selectButton: {
    fontSize: 15,
    color: '#667eea',
    fontWeight: '500',
  },
  noResultsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
  },
  searchHelpContainer: {
    padding: 40,
    alignItems: 'center',
  },
  searchHelpText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
});
