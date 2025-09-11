import type { Treatment } from '@/src/types/treatment';
import React from 'react';
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

interface TreatmentDetailModalProps {
  visible: boolean;
  treatment: Treatment | null;
  onClose: () => void;
  onBack?: () => void; // 뒤로가기 버튼 (목록으로 돌아가기)
  showBackButton?: boolean; // 뒤로가기 버튼 표시 여부
}

const statusLabels: Record<string, string> = {
  'RESERVED': '예약됨',
  'VISITED': '방문함',
  'COMPLETED': '완료',
  'CANCELED': '취소됨',
  'NO_SHOW': '노쇼'
};

const statusColors: Record<string, string> = {
  'RESERVED': '#667eea',
  'VISITED': '#f093fb',
  'COMPLETED': '#4facfe',
  'CANCELED': '#ff6b6b',
  'NO_SHOW': '#feca57'
};

const paymentMethodLabels: Record<string, string> = {
  'CARD': '카드',
  'CASH': '현금',
  'UNPAID': '외상'
};

export default function TreatmentDetailModal({
  visible,
  treatment,
  onClose,
  onBack,
  showBackButton = false
}: TreatmentDetailModalProps) {
  const insets = useSafeAreaInsets();

  if (!treatment) return null;

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      }),
      time: date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    };
  };

  const { date, time } = formatDateTime(treatment.reserved_at);
  
  // 총 시간과 가격 계산
  const totalDuration = treatment.treatment_items?.reduce((sum, item) => sum + item.duration_min, 0) || 0;
  const totalPrice = treatment.treatment_items?.reduce((sum, item) => sum + item.base_price, 0) || 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      statusBarTranslucent={false}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* 헤더 */}
        <View style={styles.header}>
          {showBackButton && onBack ? (
            <TouchableOpacity 
              onPress={onBack} 
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Text style={styles.backButtonText}>← 목록</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeButton}
              activeOpacity={0.7}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
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
              styles.statusBadge,
              { backgroundColor: statusColors[treatment.status] || '#6c757d' }
            ]}>
              <Text style={styles.statusText}>
                {statusLabels[treatment.status] || treatment.status}
              </Text>
            </View>
          </View>

          {/* 기본 정보 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 예약 정보</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>날짜</Text>
                <Text style={styles.infoValue}>{date}</Text>
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
                  {treatment.phonebook?.name || '정보 없음'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>전화번호</Text>
                <Text style={styles.infoValue}>
                  {treatment.phonebook?.phone_number || '정보 없음'}
                </Text>
              </View>
            </View>
          </View>

          {/* 시술 내역 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💅 시술 내역</Text>
            {treatment.treatment_items?.map((item, index) => (
              <View key={index} style={styles.treatmentCard}>
                <View style={styles.treatmentHeader}>
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
                {treatment.staff_user?.name || '직접 시술'}
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
                  {paymentMethodLabels[treatment.payment_method] || treatment.payment_method}
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
          {treatment.memo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📝 메모</Text>
              <View style={styles.memoCard}>
                <Text style={styles.memoText}>{treatment.memo}</Text>
              </View>
            </View>
          )}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
  treatmentHeader: {
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
});
