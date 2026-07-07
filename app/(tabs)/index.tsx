import MonthlyDashboard from '@/components/dashboard/MonthlyDashboard';
import ShopHeader from '@/components/navigation/ShopHeader';
import { useDashboard } from '@/contexts/DashboardContext';
import { useShopStore } from '@/src/stores/shopStore';
import type { Treatment } from '@/src/types';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
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
import { treatmentApiService } from '../../src/api/services/treatment';

// 임시 타입 정의
interface DashboardSummaryResponse {
  target_date: string;
  summary: any;
  sales: any;
  customer_insights: any[];
  staff_summary: any;
}

export default function HomeScreen() {
  const [dashboardData, setDashboardData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weeklyTreatments, setWeeklyTreatments] = useState<Treatment[]>([]);
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  // SPEC-UX-001 REQ-UX-007: 주간 시술 로드 실패를 무음 처리하지 않고 인라인으로 안내
  const [weeklyError, setWeeklyError] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refreshTrigger } = useDashboard();
  const { selectedShop, loading: shopLoading } = useShopStore();

  const loadWeeklyTreatments = useCallback(async () => {
    try {
      // 새로운 주간 API 사용
      const weeklyData = await treatmentApiService.getWeeklyTreatments();
      setWeeklyTreatments(weeklyData);
      setWeeklyError(false);
    } catch (error: any) {
      console.error('주간 시술 데이터 로딩 실패:', error);

      // 인증 관련 에러는 상위로 전파 (인터셉터가 처리하도록)
      if (error.message?.includes('인증이 만료') || error.message?.includes('권한이 없습니다')) {
        throw error; // 인터셉터가 처리하도록 재throw
      }

      // SPEC-UX-001 REQ-UX-007: 그 외 에러는 무음 처리하지 않고 인라인 안내 상태를 설정한다.
      setWeeklyError(true);
    }
  }, []);

  const loadDashboardData = useCallback(async (forceRefresh: boolean = false) => {
    // 상점이 선택되지 않았으면 로딩하지 않음
    if (!selectedShop) {
      console.log('🏪 상점이 선택되지 않아 대시보드 데이터를 로딩하지 않습니다.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const data = await dashboardApiService.getTodayDetailedSummary(forceRefresh);
      setDashboardData(data);
      await loadWeeklyTreatments();
    } catch (error: any) {
      console.error('대시보드 데이터 로딩 실패:', error);
      
      // 인증 관련 에러는 상위로 전파 (API 인터셉터가 자동으로 로그인 페이지 이동 처리)
      if (error.message?.includes('인증이 만료') || error.message?.includes('권한이 없습니다')) {
        console.log('🔐 인증 에러 감지 - 인터셉터가 로그인 페이지로 이동 처리');
        // 에러를 재throw하지 않고 단순히 로딩 상태만 정리
        // 인터셉터에서 이미 로그인 페이지로 이동 처리됨
      } else {
        // 일반 에러는 사용자에게 알림
        Alert.alert('오류', '대시보드 데이터를 불러올 수 없습니다.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadWeeklyTreatments, selectedShop]);

  useEffect(() => {
    // 상점 로딩이 완료되면 대시보드 데이터 로드
    if (!shopLoading) {
      loadDashboardData();
    }
  }, [loadDashboardData, shopLoading]);

  // Dashboard refresh trigger 감지
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadDashboardData();
    }
  }, [refreshTrigger, loadDashboardData]);

  // 상점 변경 감지 및 대시보드 데이터 로드
  useEffect(() => {
    if (!shopLoading) {
      console.log('🏪 상점 로딩 완료, 대시보드 데이터 로드');
      loadDashboardData();
    }
  }, [shopLoading, selectedShop, loadDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData(true); // 새로고침 시 force_refresh=true
  };

  const onHeaderRefresh = () => {
    loadDashboardData(true); // 헤더 새로고침 버튼 클릭 시 force_refresh=true
  };

  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString()}`;
  };

  // 주간 달력 위젯 함수들 (실제 예약 데이터 사용)
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
    const dateString = date.toISOString().split('T')[0];
    
    // 해당 날짜의 예약 수 계산
    const dayTreatments = weeklyTreatments.filter(treatment => {
      const treatmentDate = treatment.reserved_at.split('T')[0];
      return treatmentDate === dateString;
    });

    return {
      day: date.getDate(),
      dayName: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()],
      isToday: date.toDateString() === new Date().toDateString(),
      dateString: dateString,
      bookingCount: dayTreatments.length,
      hasBookings: dayTreatments.length > 0,
      treatments: dayTreatments
    };
  };

  const handleDateSelect = (dateString: string) => {
    setSelectedDate(dateString);
    
    // 선택된 날짜의 예약 정보 표시
    const dayTreatments = weeklyTreatments.filter(treatment => {
      const treatmentDate = treatment.reserved_at.split('T')[0];
      return treatmentDate === dateString;
    });

    if (dayTreatments.length > 0) {
      const treatmentNames = dayTreatments.map(t => {
        const customerName = t.phonebook?.name || '고객';
        const serviceName = t.treatment_items?.[0]?.menu_detail?.name || '서비스';
        const time = new Date(t.reserved_at).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit'
        });
        return `${time} - ${customerName}: ${serviceName}`;
      }).join('\n');
      
      Alert.alert(
        `${new Date(dateString).toLocaleDateString('ko-KR')} 예약 현황`,
        `총 ${dayTreatments.length}건의 예약\n\n${treatmentNames}`,
        [{ text: '확인' }]
      );
    }
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
          {/* SPEC-UX-001 REQ-UX-006: 막다른 오류 화면에 재시도 수단 제공 */}
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              onHeaderRefresh();
            }}
            accessibilityRole="button"
            accessibilityLabel="다시 시도"
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: 0 }]}>
      <ShopHeader title="홈" />
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
          <View style={styles.headerContent}>
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
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.monthlyButton}
              onPress={() => setShowMonthlyModal(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="달력 보기"
            >
              <MaterialIcons name="calendar-month" size={24} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={onHeaderRefresh}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="새로고침"
            >
              <MaterialIcons name="refresh" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 간편 달력 위젯 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>이번 주 예약 현황</Text>
          {/* SPEC-UX-001 REQ-UX-007: 주간 시술 로드 실패 인라인 안내 + 재시도 */}
          {weeklyError && (
            <View style={styles.inlineNotice}>
              <Text style={styles.inlineNoticeText}>
                주간 예약 정보를 불러오지 못했습니다
              </Text>
              <TouchableOpacity
                style={styles.inlineRetryButton}
                onPress={() => { loadWeeklyTreatments().catch(() => {}); }}
                accessibilityRole="button"
                accessibilityLabel="주간 예약 다시 시도"
              >
                <Text style={styles.inlineRetryText}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.weekCalendar}>
            {getCurrentWeek().map((date) => {
              const dateInfo = formatDateForDisplay(date);
              return (
                <TouchableOpacity 
                  key={dateInfo.dateString}
                  style={[
                    styles.weekDay,
                    dateInfo.isToday && styles.todayWeekDay,
                    selectedDate === dateInfo.dateString && styles.selectedWeekDay,
                    dateInfo.hasBookings && styles.hasBookingsWeekDay
                  ]}
                  onPress={() => handleDateSelect(dateInfo.dateString)}
                >
                  <Text style={[
                    styles.weekDayName,
                    dateInfo.isToday && styles.todayText,
                    selectedDate === dateInfo.dateString && styles.selectedText,
                    dateInfo.hasBookings && styles.hasBookingsText
                  ]}>
                    {dateInfo.dayName}
                  </Text>
                  <Text style={[
                    styles.weekDayNumber,
                    dateInfo.isToday && styles.todayText,
                    selectedDate === dateInfo.dateString && styles.selectedText,
                    dateInfo.hasBookings && styles.hasBookingsText
                  ]}>
                    {dateInfo.day}
                  </Text>
                  {dateInfo.hasBookings && (
                    <View style={styles.bookingBadge}>
                      <Text style={styles.bookingBadgeText}>{dateInfo.bookingCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity 
            style={styles.calendarButton}
            onPress={() => {
              // 예약 탭으로 이동
              router.push('/booking');
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
                {dashboardData.summary.target_date.cancelled}
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
          {dashboardData.sales.target_date.slice(0, 5).map((service: any, index: number) => (
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
      
      {/* 월별 대시보드 모달 */}
      <Modal
        visible={showMonthlyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMonthlyModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowMonthlyModal(false)}
              accessibilityRole="button"
              accessibilityLabel="닫기"
            >
              <MaterialIcons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>월별 현황</Text>
            <View style={styles.modalPlaceholder} />
          </View>
          <MonthlyDashboard onClose={() => setShowMonthlyModal(false)} />
        </View>
      </Modal>
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
  retryButton: {
    marginTop: 20,
    backgroundColor: '#007bff',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthlyButton: {
    padding: 8,
    marginRight: 8,
  },
  refreshButton: {
    padding: 8,
    marginLeft: 8,
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
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  // SPEC-UX-001 REQ-UX-007: 인라인 실패 안내 스타일
  inlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  inlineNoticeText: {
    flex: 1,
    fontSize: 14,
    color: '#b91c1c',
  },
  inlineRetryButton: {
    marginLeft: 12,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingHorizontal: 16,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineRetryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
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
    position: 'relative',
  },
  todayWeekDay: {
    backgroundColor: '#007bff',
  },
  selectedWeekDay: {
    backgroundColor: '#28a745',
  },
  hasBookingsWeekDay: {
    backgroundColor: '#ffc107',
  },
  weekDayName: {
    fontSize: 14,
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
  hasBookingsText: {
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  bookingBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#dc3545',
    borderRadius: 11,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modalPlaceholder: {
    width: 40,
  },
});
