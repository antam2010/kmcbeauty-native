import type { Treatment } from '@/src/types/treatment';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TreatmentListModalProps {
  visible: boolean;
  treatments: Treatment[];
  date: string;
  onClose: () => void;
  onTreatmentSelect: (treatment: Treatment) => void;
  onNewBooking?: () => void;
}

export default function TreatmentListModal({
  visible,
  treatments,
  date,
  onClose,
  onTreatmentSelect,
  onNewBooking
}: TreatmentListModalProps) {
  const insets = useSafeAreaInsets();

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

  const formatCustomerName = (treatment: Treatment) => {
    return treatment.phonebook?.name || '고객명 없음';
  };

  const formatServiceName = (treatment: Treatment) => {
    const serviceNames = treatment.treatment_items?.map(item => item.menu_detail?.name).filter(Boolean) || [];
    return serviceNames.length > 0 ? serviceNames.join(', ') : '서비스명 없음';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
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
              onPress={() => onTreatmentSelect(treatment)}
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
          
          {/* 새 예약하기 버튼 */}
          {onNewBooking && (
            <TouchableOpacity
              style={styles.newBookingButton}
              onPress={onNewBooking}
              activeOpacity={0.8}
            >
              <Text style={styles.newBookingButtonText}>+ 새 예약 추가</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

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
});
