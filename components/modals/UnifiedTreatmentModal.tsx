import BookingForm from '@/components/forms/BookingForm';
import type { Treatment } from '@/src/types';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TreatmentModalProps {
  visible: boolean;
  treatments: Treatment[];
  selectedTreatment?: Treatment | null;
  date: string;
  onClose: () => void;
  onNewBooking?: () => void;
  onTreatmentUpdated?: () => void; // 수정 완료 콜백 추가
}

type ModalView = 'list' | 'detail';

export default function TreatmentModal({
  visible,
  treatments,
  selectedTreatment,
  date,
  onClose,
  onNewBooking,
  onTreatmentUpdated
}: TreatmentModalProps) {
  const insets = useSafeAreaInsets();
  const [currentView, setCurrentView] = useState<ModalView>('list');
  const [currentTreatment, setCurrentTreatment] = useState<Treatment | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // selectedTreatment가 전달되면 자동으로 detail view로 전환
  React.useEffect(() => {
    if (selectedTreatment) {
      setCurrentTreatment(selectedTreatment);
      setCurrentView('detail');
    } else {
      setCurrentView('list');
      setCurrentTreatment(null);
    }
  }, [selectedTreatment]);

  // 모달이 닫힐 때 상태 리셋
  React.useEffect(() => {
    if (!visible) {
      setCurrentView('list');
      setCurrentTreatment(null);
      setShowEditForm(false);
    }
  }, [visible]);

  const handleTreatmentSelect = (treatment: Treatment) => {
    setCurrentTreatment(treatment);
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setCurrentTreatment(null);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const weekday = weekdays[date.getDay()];
    return `${year}년 ${month}월 ${day}일 ${weekday}`;
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const weekday = weekdays[date.getDay()];
    
    return {
      date: `${year}년 ${month}월 ${day}일 ${weekday}`,
      time: date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    };
  };

  const formatCustomerName = (treatment: Treatment) => {
    if (treatment.phonebook?.name) {
      return treatment.phonebook.name;
    }
    if (treatment.customer_name) {
      return treatment.customer_name;
    }
    return '고객명 없음';
  };

  const formatCustomerPhone = (treatment: Treatment) => {
    if (treatment.phonebook?.phone_number) {
      return treatment.phonebook.phone_number;
    }
    if (treatment.customer_phone) {
      return treatment.customer_phone;
    }
    return null;
  };

  const formatServiceName = (treatment: Treatment) => {
    const serviceNames = treatment.treatment_items?.map(item => item.menu_detail?.name).filter(Boolean) || [];
    return serviceNames.length > 0 ? serviceNames.join(', ') : '서비스명 없음';
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      'RESERVED': '예약됨',
      'VISITED': '방문함',
      'COMPLETED': '완료',
      'CANCELLED': '취소됨',
      'NO_SHOW': '노쇼'
    };
    return statusLabels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'RESERVED': '#667eea',
      'VISITED': '#f093fb',
      'COMPLETED': '#4facfe',
      'CANCELLED': '#ff6b6b',
      'NO_SHOW': '#feca57'
    };
    return statusColors[status] || '#6c757d';
  };

  const paymentMethodLabels: Record<string, string> = {
    'CARD': '카드',
    'CASH': '현금',
    'UNPAID': '외상'
  };

  const renderListView = () => (
    <>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>예약 목록</Text>
          <Text style={styles.headerSubtitle}>
            {date ? formatDate(date + 'T00:00:00') : ''}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {treatments.map((treatment, index) => (
          <TouchableOpacity
            key={treatment.id || index}
            style={styles.treatmentItem}
            onPress={() => handleTreatmentSelect(treatment)}
            activeOpacity={0.7}
          >
            <View style={styles.treatmentHeader}>
              <Text style={styles.treatmentTime}>
                {formatTime(treatment.reserved_at)}
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(treatment.status) }
              ]}>
                <Text style={styles.statusText}>
                  {getStatusLabel(treatment.status)}
                </Text>
              </View>
            </View>
            
            <Text style={styles.customerName}>
              {formatCustomerName(treatment)}
            </Text>
            
            <Text style={styles.serviceName}>
              {formatServiceName(treatment)}
            </Text>
            
            {treatment.memo && (
              <Text style={styles.treatmentNotes}>
                메모: {treatment.memo}
              </Text>
            )}
          </TouchableOpacity>
        ))}
        
        {treatments.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>예약이 없습니다.</Text>
          </View>
        )}
        
        {/* 새 예약하기 버튼 - 항상 표시 */}
        {onNewBooking && (
          <TouchableOpacity
            style={styles.newBookingButton}
            onPress={() => {
              console.log('UnifiedTreatmentModal: 새 예약 버튼 클릭');
              onNewBooking();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.newBookingButtonText}>+ 새 예약 추가</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );

  const renderDetailView = () => {
    if (!currentTreatment) return null;

    const { date: treatmentDate, time } = formatDateTime(currentTreatment.reserved_at);
    const totalDuration = currentTreatment.treatment_items?.reduce((sum, item) => sum + item.duration_min, 0) || 0;
    const totalPrice = currentTreatment.treatment_items?.reduce((sum, item) => sum + item.base_price, 0) || 0;

    return (
      <>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleBackToList} 
            style={styles.backButton}
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Text style={styles.backButtonText}>← 목록</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>예약 상세</Text>
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.closeButton}
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* 상태 배지 */}
          <View style={styles.section}>
            <View style={[
              styles.detailStatusBadge,
              { backgroundColor: getStatusColor(currentTreatment.status) }
            ]}>
              <Text style={styles.statusText}>
                {getStatusLabel(currentTreatment.status)}
              </Text>
            </View>
          </View>

          {/* 기본 정보 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 예약 정보</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>날짜</Text>
                <Text style={styles.infoValue}>{treatmentDate}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>시간</Text>
                <Text style={styles.infoValue}>{time}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>총 소요시간</Text>
                <Text style={styles.infoValue}>{totalDuration}분</Text>
              </View>
            </View>
          </View>

          {/* 고객 정보 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 고객 정보</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>이름</Text>
                <Text style={styles.infoValue}>
                  {formatCustomerName(currentTreatment)}
                </Text>
              </View>
              {formatCustomerPhone(currentTreatment) && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>전화번호</Text>
                  <Text style={styles.infoValue}>
                    {formatCustomerPhone(currentTreatment)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 시술 내역 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💅 시술 내역</Text>
            {currentTreatment.treatment_items?.map((item, index) => (
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

          {/* 담당 직원 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👨‍💼 담당 직원</Text>
            <View style={styles.infoCard}>
              <Text style={styles.staffName}>
                {currentTreatment.staff_user?.name || '담당 직원 없음'}
              </Text>
            </View>
          </View>

          {/* 결제 정보 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💳 결제 정보</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>결제 방법</Text>
                <Text style={styles.infoValue}>
                  {currentTreatment.payment_method ? paymentMethodLabels[currentTreatment.payment_method] || currentTreatment.payment_method : '미정'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>총 금액</Text>
                <Text style={[styles.infoValue, styles.priceText]}>
                  {totalPrice.toLocaleString()}원
                </Text>
              </View>
            </View>
          </View>

          {/* 메모 */}
          {currentTreatment.memo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📝 메모</Text>
              <View style={styles.memoCard}>
                <Text style={styles.memoText}>{currentTreatment.memo}</Text>
              </View>
            </View>
          )}

          {/* 수정 버튼 */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                if (currentTreatment) {
                  setShowEditForm(true);
                }
              }}
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.editButtonText}>✏️ 예약 수정</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </>
    );
  };

  return (
    <>
      <Modal
        visible={visible && !showEditForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={[styles.container, { paddingTop: insets.top }]}>
          {currentView === 'list' ? renderListView() : renderDetailView()}
        </View>
      </Modal>
      
      {/* BookingForm for editing */}
      {showEditForm && currentTreatment && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <BookingForm
            selectedDate={new Date(currentTreatment.reserved_at).toISOString().split('T')[0]}
            editMode={true}
            treatment={currentTreatment}
            onClose={() => {
              setShowEditForm(false);
            }}
            onBookingComplete={() => {
              setShowEditForm(false);
              onTreatmentUpdated?.();
              onClose();
            }}
          />
        </Modal>
      )}
    </>
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
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    color: '#495057',
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  // List View Styles
  treatmentItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  treatmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  treatmentTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  treatmentNotes: {
    fontSize: 12,
    color: '#28a745',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  newBookingButton: {
    backgroundColor: '#28a745',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  newBookingButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Detail View Styles
  detailStatusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  priceText: {
    color: '#28a745',
    fontWeight: '600',
    fontSize: 18,
  },
  treatmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
    backgroundColor: '#e8f5e8',
    color: '#28a745',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  treatmentDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  treatmentDetail: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  staffName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    textAlign: 'center',
  },
  memoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  memoText: {
    fontSize: 15,
    color: '#495057',
    lineHeight: 22,
  },
  editButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    minHeight: 52,
    marginHorizontal: 4,
  },
  editButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});
