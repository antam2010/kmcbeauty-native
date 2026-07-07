import MonthlyDashboard from '@/components/dashboard/MonthlyDashboard';
import UnifiedTreatmentModal from '@/components/modals/UnifiedTreatmentModal';
import ShopHeader from '@/components/navigation/ShopHeader';
import { useDashboardLoad } from '@/hooks/useDashboardLoad';
import type { Treatment } from '@/src/types';
import { Colors } from '@/src/ui/theme';
import { formatKoreanFullDate, formatKrwNumber, formatTimeHm } from '@/src/utils/intlFormat';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
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

// @MX:NOTE: [AUTO] 홈 primary surface(SPEC-HOME-001): "오늘 중심" 재구성 = 오늘 예약 리스트 + 새 예약 CTA + 요약 2카드.
//   비즈니스 규칙: 오늘 리스트는 useDashboardLoad.weeklyTreatments 를 오늘로 필터·정렬해 파생하며 신규 API 를 호출하지 않는다.
//   상세는 UnifiedTreatmentModal(항목 탭) / MonthlyDashboard(자세히 보기) 재사용. 상세 통계 3섹션·주간 위젯은 홈에서 제거됨.
export default function HomeScreen() {
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // REQ-PERF-003-01/08: 대시보드 로드 로직·스토어 셀렉터 구독을 훅으로 위임(중복 요청 제거·병렬화).
  const {
    dashboardData,
    loading,
    refreshing,
    weeklyTreatments,
    weeklyError,
    loadWeeklyTreatments,
    onRefresh,
    onHeaderRefresh,
    retryDashboard,
  } = useDashboardLoad();

  // REQ-PERF-003-07: 렌더마다 새 포맷터를 만들던 toLocaleString 을 모듈 캐시 포맷터로 대체.
  const formatCurrency = (amount: number) => `₩${formatKrwNumber(amount)}`;

  // REQ-PERF-003-07: 헤더 날짜(오늘)를 렌더마다 재포맷하지 않고 마운트 시 1회 메모화.
  const headerDateText = useMemo(() => formatKoreanFullDate(new Date()), []);

  // 오늘 날짜 문자열(마운트 시 1회 고정) — 주간 시술을 오늘로 필터하는 기준.
  const todayString = useMemo(() => new Date().toISOString().split('T')[0], []);

  // REQ-HOME-001-02: "오늘의 예약 리스트" = 기존 weeklyTreatments 를 오늘로 필터·시간(reserved_at) 오름차순 정렬.
  //   신규 API/추가 서비스 호출 없이 캐싱된 주간 데이터에서 파생한다(AC-03).
  const todayTreatments = useMemo(() => {
    return weeklyTreatments
      .filter((t) => t.reserved_at.split('T')[0] === todayString)
      .sort((a, b) => a.reserved_at.localeCompare(b.reserved_at));
  }, [weeklyTreatments, todayString]);

  const customerNameOf = (t: Treatment) => t.phonebook?.name || t.customer_name || '고객 미지정';
  const serviceNameOf = (t: Treatment) =>
    t.treatment_items?.[0]?.menu_detail?.name || '서비스';
  const statusLabelOf = (t: Treatment) => t.status_label || t.status;

  // REQ-HOME-001-02: 오늘 리스트 항목 탭 → UnifiedTreatmentModal(detail 뷰)로 상세 표시.
  //   booking.tsx:382 소비 패턴과 동일(selectedTreatment 전달, treatments=[], date=''). 편집(onEditRequest)은 배선하지 않음(예약 탭 소관).
  const handleTreatmentPress = useCallback((treatment: Treatment) => {
    setSelectedTreatment(treatment);
    setShowTreatmentModal(true);
  }, []);

  const handleCloseTreatmentModal = useCallback(() => {
    setShowTreatmentModal(false);
    setSelectedTreatment(null);
  }, []);

  // REQ-HOME-001-03: 새 예약 CTA → 기존 예약 탭 흐름 진입(최소 diff·롤백 용이).
  const handleNewBooking = useCallback(() => {
    router.push('/booking');
  }, [router]);

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
            onPress={retryDashboard}
            accessibilityRole="button"
            accessibilityLabel="다시 시도"
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const todaySummary = dashboardData.summary.target_date;

  return (
    <View style={[styles.container, { paddingTop: 0 }]}>
      <ShopHeader title="홈" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 100 : 80 }
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
            <Text style={styles.headerDate}>{headerDateText}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.monthlyButton}
              onPress={() => setShowMonthlyModal(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="달력 보기"
            >
              <MaterialIcons name="calendar-month" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={onHeaderRefresh}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="새로고침"
            >
              <MaterialIcons name="refresh" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SPEC-UX-001 REQ-UX-007: 주간 시술 로드 실패 인라인 안내 + 재시도(오늘 리스트가 주간 데이터에서 파생되므로 여기서 안내) */}
        {weeklyError && (
          <View style={styles.inlineNotice}>
            <Text style={styles.inlineNoticeText}>주간 예약 정보를 불러오지 못했습니다</Text>
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

        {/* REQ-HOME-001-01/02: 오늘의 예약 리스트(첫 화면) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>오늘의 예약</Text>
          {todayTreatments.length > 0 ? (
            <View testID="today-reservations-list" style={styles.todayList}>
              {todayTreatments.map((t) => {
                const time = formatTimeHm(t.reserved_at);
                const customer = customerNameOf(t);
                const service = serviceNameOf(t);
                const status = statusLabelOf(t);
                return (
                  <TouchableOpacity
                    key={t.id}
                    testID={`today-item-${t.id}`}
                    style={styles.todayItem}
                    onPress={() => handleTreatmentPress(t)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`${time} ${customer} ${service} ${status}`}
                  >
                    <Text style={styles.todayItemTime}>{time}</Text>
                    <View style={styles.todayItemMain}>
                      <Text style={styles.todayItemCustomer} numberOfLines={1}>{customer}</Text>
                      <Text style={styles.todayItemService} numberOfLines={1}>{service}</Text>
                    </View>
                    <Text style={styles.todayItemStatus}>{status}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View testID="today-empty-state" style={styles.emptyState}>
              <Text style={styles.emptyStateText}>오늘 예약이 없습니다</Text>
            </View>
          )}
        </View>

        {/* REQ-HOME-001-03: 큰 새 예약 CTA(minHeight 56, 화면 폭) */}
        <TouchableOpacity
          testID="new-booking-cta"
          style={styles.newBookingCta}
          onPress={handleNewBooking}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="새 예약"
        >
          <MaterialIcons name="add" size={24} color={Colors.text.inverse} />
          <Text style={styles.newBookingCtaText}>새 예약</Text>
        </TouchableOpacity>

        {/* REQ-HOME-001-04/05: 오늘 요약 핵심 숫자 2개 + 자세히 보기(월간 모달 경유) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>오늘 요약</Text>
          <View testID="today-summary" style={styles.summaryGrid}>
            <View testID="summary-card" style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{formatCurrency(todaySummary.actual_sales)}</Text>
              <Text style={styles.summaryLabel}>오늘 매출</Text>
            </View>
            <View testID="summary-card" style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{todaySummary.total_reservations}건</Text>
              <Text style={styles.summaryLabel}>오늘 예약</Text>
            </View>
          </View>
          <TouchableOpacity
            testID="view-details-button"
            style={styles.viewDetailsButton}
            onPress={() => setShowMonthlyModal(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="자세히 보기"
          >
            <Text style={styles.viewDetailsButtonText}>자세히 보기</Text>
            <MaterialIcons name="chevron-right" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 오늘 리스트 항목 상세 — 예약 탭이 실사용하는 통합 모달 재사용(편집 경로는 배선하지 않음) */}
      <UnifiedTreatmentModal
        visible={showTreatmentModal}
        treatments={[]}
        selectedTreatment={selectedTreatment}
        date=""
        onClose={handleCloseTreatmentModal}
      />

      {/* 월별 대시보드 모달 */}
      {/* REQ-PERF-003-02: 닫힌 동안 MonthlyDashboard 를 마운트하지 않아 월별 API 호출을 0회로 만든다. */}
      {showMonthlyModal && (
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
                <MaterialIcons name="close" size={24} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>월별 현황</Text>
              <View style={styles.modalPlaceholder} />
            </View>
            <MonthlyDashboard onClose={() => setShowMonthlyModal(false)} />
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
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
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: Colors.text.inverse,
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
    color: Colors.text.primary,
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  section: {
    marginBottom: 24,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
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
    color: Colors.text.inverse,
  },
  // REQ-HOME-001-02/08: 오늘의 예약 리스트 항목(터치 타깃 >= 44pt, 본문 >= 16pt, AA 색상 토큰)
  todayList: {
    gap: 8,
  },
  todayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  todayItemTime: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    width: 64,
  },
  todayItemMain: {
    flex: 1,
    paddingHorizontal: 8,
  },
  todayItemCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  todayItemService: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  todayItemStatus: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  // REQ-HOME-001-02: 빈 상태(오늘 예약 0건)
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  // REQ-HOME-001-03: 큰 새 예약 CTA
  newBookingCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    minHeight: 56,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  newBookingCtaText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  // REQ-HOME-001-04: 오늘 요약 카드(2개)
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  // REQ-HOME-001-05: 자세히 보기(월간 모달 경유)
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: 12,
  },
  viewDetailsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  modalPlaceholder: {
    width: 40,
  },
});
