import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dashboardApiService } from '../../src/api/services/dashboard';
import { DashboardSummaryResponse } from '../../src/types/dashboard';

export default function HomeScreen() {
  const [dashboardData, setDashboardData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const insets = useSafeAreaInsets();

  const loadDashboardData = async () => {
    try {
      const data = await dashboardApiService.getTodayDetailedSummary();
      setDashboardData(data);
    } catch (error) {
      console.error('대시보드 데이터 로딩 실패:', error);
      Alert.alert('오류', '대시보드 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString()}`;
  };

  // 간단한 달력 위젯 함수들
  const getCurrentWeek = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0(일) ~ 6(토)
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + 1); // 월요일부터 시작

    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      week.push(date);
    }
    return week;
  };

  const formatDateForDisplay = (date: Date) => {
    return {
      day: date.getDate(),
      dayName: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()],
      isToday: date.toDateString() === new Date().toDateString(),
      dateString: date.toISOString().split('T')[0]
    };
  };

  const handleDateSelect = (dateString: string) => {
    setSelectedDate(dateString);
    // 선택된 날짜의 대시보드 데이터를 불러올 수 있음
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  if (!dashboardData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>데이터를 불러올 수 없습니다</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { 
            paddingBottom: Platform.OS === 'ios' ? insets.bottom + 100 : 80 // 아이폰 탭바 여유공간 추가
          }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>오늘의 현황</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </Text>
        </View>

        {/* 간편 달력 위젯 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>이번 주 일정</Text>
          <View style={styles.weekCalendar}>
            {getCurrentWeek().map((date) => {
              const dateInfo = formatDateForDisplay(date);
              return (
                <TouchableOpacity 
                  key={dateInfo.dateString}
                  style={[
                    styles.weekDay,
                    dateInfo.isToday && styles.todayWeekDay,
                    selectedDate === dateInfo.dateString && styles.selectedWeekDay
                  ]}
                  onPress={() => handleDateSelect(dateInfo.dateString)}
                >
                  <Text style={[
                    styles.weekDayName,
                    dateInfo.isToday && styles.todayText,
                    selectedDate === dateInfo.dateString && styles.selectedText
                  ]}>
                    {dateInfo.dayName}
                  </Text>
                  <Text style={[
                    styles.weekDayNumber,
                    dateInfo.isToday && styles.todayText,
                    selectedDate === dateInfo.dateString && styles.selectedText
                  ]}>
                    {dateInfo.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity 
            style={styles.calendarButton}
            onPress={() => {
              // 예약 탭으로 이동하는 로직 (나중에 구현)
              Alert.alert('알림', '전체 달력은 예약 탭에서 확인하실 수 있습니다.');
            }}
          >
            <Text style={styles.calendarButtonText}>전체 달력 보기</Text>
          </TouchableOpacity>
        </View>

        {/* 매출 요약 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>매출 현황</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.primaryCard]}>
              <Text style={[styles.statValue, { color: '#ffffff' }]}>
                {formatCurrency(dashboardData.summary.target_date.actual_sales)}
              </Text>
              <Text style={[styles.statLabel, { color: '#ffffff' }]}>오늘 매출</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {dashboardData.summary.target_date.completed}
              </Text>
              <Text style={styles.statLabel}>완료된 예약</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {formatCurrency(dashboardData.summary.target_date.expected_sales)}
              </Text>
              <Text style={styles.statLabel}>예상 매출</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {formatCurrency(dashboardData.summary.month.actual_sales)}
              </Text>
              <Text style={styles.statLabel}>이번 달 매출</Text>
            </View>
          </View>
        </View>

        {/* 예약 현황 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>예약 현황</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {dashboardData.summary.target_date.total_reservations}
              </Text>
              <Text style={styles.statLabel}>총 예약</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {dashboardData.summary.target_date.completed}
              </Text>
              <Text style={styles.statLabel}>완료</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {dashboardData.summary.target_date.canceled}
              </Text>
              <Text style={styles.statLabel}>취소</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {dashboardData.summary.target_date.no_show}
              </Text>
              <Text style={styles.statLabel}>노쇼</Text>
            </View>
          </View>
        </View>

        {/* 서비스 현황 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>인기 서비스</Text>
          {dashboardData.sales.target_date.slice(0, 5).map((service, index) => (
            <View key={service.menu_detail_id} style={styles.serviceItem}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceStats}>
                  {service.count}회 예약 · {formatCurrency(service.actual_price)} 매출
                </Text>
              </View>
              <View style={styles.serviceRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 직원 현황 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>직원 현황</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {dashboardData.staff_summary.target_date.length}
              </Text>
              <Text style={styles.statLabel}>활동 직원</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {dashboardData.staff_summary.target_date.reduce((sum, staff) => sum + staff.count, 0)}
              </Text>
              <Text style={styles.statLabel}>총 서비스</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {dashboardData.staff_summary.month.length}
              </Text>
              <Text style={styles.statLabel}>월간 활동 직원</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {dashboardData.staff_summary.month.reduce((sum, staff) => sum + staff.count, 0)}
              </Text>
              <Text style={styles.statLabel}>월간 서비스</Text>
            </View>
          </View>
        </View>

        {/* 고객 인사이트 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>고객 인사이트</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {dashboardData.customer_insights.length}
              </Text>
              <Text style={styles.statLabel}>오늘 고객 수</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {dashboardData.customer_insights.filter(c => c.total_reservations === 1).length}
              </Text>
              <Text style={styles.statLabel}>신규 고객</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {dashboardData.customer_insights.filter(c => c.total_reservations > 1).length}
              </Text>
              <Text style={styles.statLabel}>재방문 고객</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {dashboardData.customer_insights.filter(c => c.no_show_count === 0).length}
              </Text>
              <Text style={styles.statLabel}>정상 방문</Text>
            </View>
          </View>
        </View>

        {/* VIP 고객 */}
        {dashboardData.customer_insights && dashboardData.customer_insights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>VIP 고객</Text>
            {dashboardData.customer_insights
              .sort((a, b) => b.total_spent - a.total_spent)
              .slice(0, 5)
              .map((customer) => (
              <View key={customer.id} style={styles.customerItem}>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{customer.customer_name}</Text>
                  <Text style={styles.customerStats}>
                    총 {formatCurrency(customer.total_spent)} · {customer.total_reservations}회 방문
                  </Text>
                </View>
                <View style={styles.customerBadge}>
                  <Text style={styles.badgeText}>VIP</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  primaryCard: {
    backgroundColor: '#007bff',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  serviceStats: {
    fontSize: 14,
    color: '#666',
  },
  serviceRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  customerStats: {
    fontSize: 14,
    color: '#666',
  },
  customerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ffc107',
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  // 달력 위젯 스타일
  weekCalendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekDay: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    minWidth: 40,
  },
  todayWeekDay: {
    backgroundColor: '#007bff',
  },
  selectedWeekDay: {
    backgroundColor: '#28a745',
  },
  weekDayName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  weekDayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  todayText: {
    color: '#ffffff',
  },
  selectedText: {
    color: '#ffffff',
  },
  calendarButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  calendarButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
