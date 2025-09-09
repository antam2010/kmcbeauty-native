import Calendar from '@/components/calendar/Calendar';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { Booking, bookingService, dashboardService } from '@/services/mockServices';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

interface DashboardStats {
  todayBookings: number;
  activeStaff: number;
  monthlyRevenue: number;
  newCustomers: number;
  completedBookings: number;
  cancelledBookings: number;
}

export default function HomeScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, bookingsData] = await Promise.all([
        dashboardService.getDashboardStats(),
        bookingService.getBookingsByDate('2024-09-09')
      ]);
      setStats(statsData);
      setRecentBookings(bookingsData.slice(0, 3)); // 최근 3개만
    } catch (error) {
      console.error('데이터 로딩 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickStats = stats ? [
    { label: '오늘 예약', value: stats.todayBookings.toString(), color: '#007AFF' },
    { label: '활성 직원', value: stats.activeStaff.toString(), color: '#28a745' },
    { label: '이번 달 매출', value: `₩${(stats.monthlyRevenue / 1000000).toFixed(1)}M`, color: '#ffc107' },
    { label: '신규 고객', value: stats.newCustomers.toString(), color: '#17a2b8' },
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
      case 'scheduled': return '예정';
      case 'in-progress': return '진행중';
      case 'completed': return '완료';
      case 'cancelled': return '취소';
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
            최근 예약
          </ThemedText>
          <ThemedView style={styles.bookingsList}>
            {recentBookings.map((booking) => (
              <ThemedView key={booking.id} style={styles.bookingItem}>
                <ThemedView style={styles.bookingInfo}>
                  <ThemedText type="defaultSemiBold">{booking.customerName}</ThemedText>
                  <ThemedText>{booking.serviceName} • {booking.time}</ThemedText>
                </ThemedView>
                <ThemedView 
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(booking.status) }
                  ]}
                >
                  <ThemedText style={styles.statusText}>{getStatusText(booking.status)}</ThemedText>
                </ThemedView>
              </ThemedView>
            ))}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedDateText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'center',
  },
});
