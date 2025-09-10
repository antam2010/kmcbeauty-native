import Calendar from '@/components/calendar/Calendar';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { dashboardAPI } from '@/src/features/dashboard/api';
import { DashboardResponse } from '@/src/types/dashboard';
import { Treatment } from '@/src/types/treatment';
import { useAuth } from '@/stores/authContext';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function HomeScreen() {
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTreatments, setSelectedTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // 대시보드 데이터 로드
  const loadDashboardData = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await dashboardAPI.getTodaySummary();
      setDashboardData(data);
    } catch (error) {
      console.error('대시보드 데이터 로딩 중 오류:', error);
      Alert.alert('오류', '대시보드 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // 새로고침
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [loadDashboardData]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, loadDashboardData]);

  const quickStats = dashboardData?.summary ? [
    { 
      label: '오늘 예약', 
      value: dashboardData.summary.target_date.total_reservations.toString(), 
      color: '#007AFF' 
    },
    { 
      label: '완료된 시술', 
      value: dashboardData.summary.target_date.completed.toString(), 
      color: '#28a745' 
    },
    { 
      label: '오늘 매출', 
      value: `₩${(dashboardData.summary.target_date.actual_sales / 10000).toFixed(0)}만`, 
      color: '#ffc107' 
    },
    { 
      label: '이번 달 예약', 
      value: dashboardData.summary.month.total_reservations.toString(), 
      color: '#17a2b8' 
    },
  ] : [];

  const services = [
    { name: '화장', icon: '💄', bookings: 25 },
    { name: '눈썹', icon: '👁️', bookings: 18 },
    { name: '두피케어', icon: '💆', bookings: 12 },
    { name: '스킨케어', icon: '✨', bookings: 15 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#007AFF';
      case 'in-progress': return '#28a745';
      case 'completed': return '#6c757d';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'RESERVED': return '예약';
      case 'VISITED': return '방문';
      case 'COMPLETED': return '완료';
      case 'CANCELLED': return '취소';
      case 'NO_SHOW': return '노쇼';
      default: return status;
    }
  };

  // 달력에서 트리트먼트 데이터를 받아와서 선택된 날짜의 데이터 필터링
  const handleTreatmentsLoad = useCallback((treatments: Treatment[]) => {
    // 선택된 날짜의 트리트먼트만 필터링
    const selectedDateTreatments = treatments.filter(treatment => 
      treatment.reserved_at.split('T')[0] === selectedDate
    );
    setSelectedTreatments(selectedDateTreatments);
  }, [selectedDate]);

  const handleDateSelect = (dateString: string) => {
    setSelectedDate(dateString);
    
    // 이미 로드된 트리트먼트에서 해당 날짜의 데이터만 필터링
    // API 재호출 없이 기존 데이터 활용
    
    // 날짜 객체로 변환하여 표시
    const dateObj = new Date(dateString);
    Alert.alert(
      '날짜 선택됨',
      `${dateObj.toLocaleDateString('ko-KR')}을 선택하셨습니다.\n이 날짜의 예약을 관리하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { text: '예약 관리', onPress: () => {
          // 여기서 예약 관리 탭으로 이동할 수 있습니다
          console.log('Navigate to booking management for:', dateString);
        }}
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            KMC Beauty
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            뷰티 관리 시스템
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>데이터를 불러오는 중...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          안녕하세요, {user?.name || '관리자'}님!
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          KMC Beauty 뷰티 관리 시스템
        </ThemedText>
      </ThemedView>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
            colors={['#007AFF']}
          />
        }
      >
        {/* 빠른 통계 */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            오늘의 현황
          </ThemedText>
          <ThemedView style={styles.statsGrid}>
            {quickStats.map((stat, index) => (
              <ThemedView key={index} style={[styles.statCard, { borderLeftColor: stat.color }]}>
                <ThemedText type="defaultSemiBold" style={styles.statValue}>
                  {stat.value}
                </ThemedText>
                <ThemedText style={styles.statLabel}>{stat.label}</ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        </ThemedView>

        {/* 인기 서비스 */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            인기 서비스
          </ThemedText>
          <ThemedView style={styles.servicesGrid}>
            {services.map((service, index) => (
              <TouchableOpacity key={index} style={styles.serviceCard}>
                <ThemedText style={styles.serviceIcon}>{service.icon}</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.serviceName}>
                  {service.name}
                </ThemedText>
                <ThemedText style={styles.serviceBookings}>
                  {service.bookings}건 예약
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
        </ThemedView>

        {/* 최근 예약 */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            최근 고객 인사이트
          </ThemedText>
          <ThemedView style={styles.bookingsList}>
            {(dashboardData?.insights || []).slice(0, 3).map((insight) => (
              <ThemedView key={insight.id} style={styles.bookingItem}>
                <ThemedView style={styles.bookingInfo}>
                  <ThemedText type="defaultSemiBold">
                    {insight.customer_name || '고객'}
                  </ThemedText>
                  <ThemedText>
                    예약일: {new Date(insight.reserved_at).toLocaleDateString('ko-KR')}
                  </ThemedText>
                  <ThemedText style={styles.insightText}>
                    서비스: {insight.menu_detail_name || '미정'} • 담당: {insight.staff_user_name || '미정'}
                  </ThemedText>
                </ThemedView>
                <ThemedView 
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(insight.status) }
                  ]}
                >
                  <ThemedText style={styles.statusText}>
                    {getStatusText(insight.status)}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            ))}
            {!(dashboardData?.insights || []).length && (
              <ThemedView style={styles.emptyState}>
                <ThemedText>표시할 고객 정보가 없습니다.</ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>

        {/* 빠른 액션 */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            빠른 액션
          </ThemedText>
          <ThemedView style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <IconSymbol name="plus.circle" size={24} color="white" />
              <ThemedText style={styles.actionText}>새 예약</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#28a745' }]}>
              <IconSymbol name="person.badge.plus" size={24} color="white" />
              <ThemedText style={styles.actionText}>직원 추가</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>

        {/* 달력 섹션 */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            📅 빠른 날짜 선택
          </ThemedText>
          <Calendar 
            onDateSelect={handleDateSelect} 
            selectedDate={selectedDate}
            onTreatmentsLoad={handleTreatmentsLoad}
          />
          {selectedDate && (
            <ThemedView style={styles.selectedDateInfo}>
              <ThemedText style={styles.selectedDateText}>
                선택된 날짜: {new Date(selectedDate).toLocaleDateString('ko-KR')}
              </ThemedText>
              {selectedTreatments.length > 0 && (
                <ThemedText style={styles.treatmentCount}>
                  {selectedTreatments.length}개의 예약이 있습니다
                </ThemedText>
              )}
            </ThemedView>
          )}
        </ThemedView>

        {/* 선택된 날짜의 예약 목록 */}
        {selectedTreatments.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              📋 선택된 날짜의 예약
            </ThemedText>
            {selectedTreatments.slice(0, 5).map((treatment) => (
              <ThemedView key={treatment.id} style={styles.treatmentItem}>
                <ThemedView style={styles.treatmentHeader}>
                  <ThemedText style={styles.treatmentTime}>
                    {new Date(treatment.reserved_at).toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </ThemedText>
                  <ThemedText style={[
                    styles.treatmentStatus,
                    { color: getStatusColor(treatment.status) }
                  ]}>
                    {getStatusText(treatment.status)}
                  </ThemedText>
                </ThemedView>
                <ThemedText style={styles.treatmentCustomer}>
                  {treatment.phonebook.name} ({treatment.phonebook.phone_number})
                </ThemedText>
                {treatment.treatment_items.length > 0 && (
                  <ThemedText style={styles.treatmentService}>
                    {treatment.treatment_items.map(item => item.menu_detail.name).join(', ')}
                  </ThemedText>
                )}
              </ThemedView>
            ))}
            {selectedTreatments.length > 5 && (
              <ThemedText style={styles.moreText}>
                ... 외 {selectedTreatments.length - 5}개의 예약
              </ThemedText>
            )}
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#007AFF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    marginBottom: 15,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }),
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  serviceCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }),
    elevation: 3,
  },
  serviceIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  serviceName: {
    marginTop: 8,
    marginBottom: 4,
    color: '#333',
  },
  serviceBookings: {
    color: '#666',
    fontSize: 12,
  },
  bookingsList: {
    gap: 10,
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }),
    elevation: 3,
  },
  bookingInfo: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  selectedDateInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
    elevation: 2,
  },
  selectedDateText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  treatmentCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  treatmentItem: {
    backgroundColor: 'white',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
    elevation: 2,
  },
  treatmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  treatmentTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  treatmentStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  treatmentCustomer: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  treatmentService: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  moreText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  insightText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
  },
});
