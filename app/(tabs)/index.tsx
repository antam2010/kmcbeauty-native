import Calendar from '@/components/calendar/Calendar';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { dashboardService, DashboardSummaryResponse } from '@/services/api/dashboard';
import { useAuthStore } from '@/stores/authContext';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

interface DashboardStats {
  todayBookings: number;
  activeStaff: number;
  monthlyRevenue: number;
  newCustomers: number;
  completedBookings: number;
  cancelledBookings: number;
}

export default function HomeScreen() {
  const [dashboardData, setDashboardData] = useState<DashboardSummaryResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, accessToken } = useAuthStore();

  useEffect(() => {
    if (accessToken) {
      loadDashboardData();
    }
  }, [accessToken]);

  const loadDashboardData = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const data = await dashboardService.getDashboardSummary(accessToken, today);
      setDashboardData(data);
    } catch (error) {
      console.error('대시보드 데이터 로딩 중 오류:', error);
      Alert.alert('오류', '대시보드 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const quickStats = dashboardData ? [
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

  const handleDateSelect = (dateString: string) => {
    const date = new Date(dateString);
    setSelectedDate(date);
    Alert.alert(
      '날짜 선택됨',
      `${date.toLocaleDateString('ko-KR')}을 선택하셨습니다.\n이 날짜의 예약을 관리하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { text: '예약 관리', onPress: () => {
          // 여기서 예약 관리 탭으로 이동할 수 있습니다
          console.log('Navigate to booking management for:', date);
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
            {dashboardData?.customer_insights.slice(0, 3).map((insight) => (
              <ThemedView key={insight.id} style={styles.bookingItem}>
                <ThemedView style={styles.bookingInfo}>
                  <ThemedText type="defaultSemiBold">
                    {insight.customer_name || '고객'}
                  </ThemedText>
                  <ThemedText>
                    총 {insight.total_reservations}회 예약 • ₩{insight.total_spent.toLocaleString()}
                  </ThemedText>
                  <ThemedText style={styles.insightText}>
                    노쇼율: {insight.no_show_rate.toFixed(1)}%
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
            {!dashboardData?.customer_insights.length && (
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
            selectedDate={selectedDate?.toISOString().split('T')[0]}
          />
          {selectedDate && (
            <ThemedView style={styles.selectedDateInfo}>
              <ThemedText style={styles.selectedDateText}>
                선택된 날짜: {selectedDate.toLocaleDateString('ko-KR')}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
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
