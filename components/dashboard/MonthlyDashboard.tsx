import { Card } from '@/src/ui/atoms';

import { MaterialIcons } from '@expo/vector-icons';
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

interface MonthlyDashboardProps {
  onClose?: () => void;
}

export default function MonthlyDashboard({ onClose }: MonthlyDashboardProps) {
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  // 모달에서 임시로 선택한 년/월 (확인 버튼 누르기 전까지는 실제 상태에 반영되지 않음)
  const [tempSelectedYear, setTempSelectedYear] = useState(new Date().getFullYear());
  const [tempSelectedMonth, setTempSelectedMonth] = useState(new Date().getMonth() + 1);
  const insets = useSafeAreaInsets();

  const loadMonthlyData = useCallback(async (year: number, month: number) => {
    try {
      setLoading(true);
      const data = await dashboardApiService.getMonthlyDetailedSummary(year, month);
      setDashboardData(data);
    } catch (error) {
      console.error('월별 대시보드 데이터 로딩 실패:', error);
      Alert.alert('오류', '월별 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMonthlyData(selectedYear, selectedMonth);
    setRefreshing(false);
  }, [loadMonthlyData, selectedYear, selectedMonth]);

  useEffect(() => {
    loadMonthlyData(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, loadMonthlyData]);

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear(prev => prev - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear(prev => prev + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const getMonthName = (month: number) => {
    const monthNames = [
      '1월', '2월', '3월', '4월', '5월', '6월',
      '7월', '8월', '9월', '10월', '11월', '12월'
    ];
    return monthNames[month - 1];
  };

  // 모달 열기 함수 - 현재 선택된 값으로 임시 상태 초기화
  const openDatePicker = () => {
    setTempSelectedYear(selectedYear);
    setTempSelectedMonth(selectedMonth);
    setShowDatePicker(true);
  };

  // 확인 버튼 누를 때 실제 상태 업데이트
  const confirmDateSelection = () => {
    setSelectedYear(tempSelectedYear);
    setSelectedMonth(tempSelectedMonth);
    setShowDatePicker(false);
  };

  // 취소 버튼 누를 때 임시 상태 초기화
  const cancelDateSelection = () => {
    setTempSelectedYear(selectedYear);
    setTempSelectedMonth(selectedMonth);
    setShowDatePicker(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>월별 데이터를 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  if (!dashboardData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
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
            paddingBottom: Platform.OS === 'ios' ? insets.bottom + 100 : 80
          }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {onClose && (
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>월별 현황</Text>
            <View style={styles.placeholder} />
          </View>
          
          {/* 월 선택 */}
          <View style={styles.monthSelector}>
            <TouchableOpacity style={styles.monthButton} onPress={handlePreviousMonth}>
              <MaterialIcons name="chevron-left" size={24} color="#007AFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.monthDisplay} 
              onPress={openDatePicker}
              activeOpacity={0.7}
            >
              <Text style={styles.monthDisplayText}>
                {selectedYear}년 {getMonthName(selectedMonth)}
              </Text>
              <MaterialIcons name="expand-more" size={20} color="#666" style={styles.dropdownIcon} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.monthButton} onPress={handleNextMonth}>
              <MaterialIcons name="chevron-right" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          {/* 빠른 이동 버튼들 */}
          <View style={styles.quickNavigation}>
            <TouchableOpacity 
              style={styles.quickButton}
              onPress={() => {
                const now = new Date();
                setSelectedYear(now.getFullYear());
                setSelectedMonth(now.getMonth() + 1);
              }}
            >
              <Text style={styles.quickButtonText}>이번 달</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickButton}
              onPress={() => {
                const lastMonth = new Date();
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                setSelectedYear(lastMonth.getFullYear());
                setSelectedMonth(lastMonth.getMonth() + 1);
              }}
            >
              <Text style={styles.quickButtonText}>지난 달</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickButton}
              onPress={() => {
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                setSelectedYear(threeMonthsAgo.getFullYear());
                setSelectedMonth(threeMonthsAgo.getMonth() + 1);
              }}
            >
              <Text style={styles.quickButtonText}>3개월 전</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickButton}
              onPress={() => {
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                setSelectedYear(sixMonthsAgo.getFullYear());
                setSelectedMonth(sixMonthsAgo.getMonth() + 1);
              }}
            >
              <Text style={styles.quickButtonText}>6개월 전</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 요약 통계 카드들 */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <MaterialIcons name="event" size={32} color="#007AFF" />
              <Text style={styles.statNumber}>{dashboardData.summary.target_date.total_reservations}</Text>
              <Text style={styles.statLabel}>총 예약</Text>
            </Card>
            
            <Card style={styles.statCard}>
              <MaterialIcons name="check-circle" size={32} color="#28a745" />
              <Text style={styles.statNumber}>{dashboardData.summary.target_date.completed}</Text>
              <Text style={styles.statLabel}>완료</Text>
            </Card>
          </View>

          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <MaterialIcons name="pending" size={32} color="#ff9500" />
              <Text style={styles.statNumber}>{dashboardData.summary.target_date.reserved}</Text>
              <Text style={styles.statLabel}>대기 중</Text>
            </Card>
            
            <Card style={styles.statCard}>
              <MaterialIcons name="cancel" size={32} color="#ff3b30" />
              <Text style={styles.statNumber}>{dashboardData.summary.target_date.canceled}</Text>
              <Text style={styles.statLabel}>취소</Text>
            </Card>
          </View>
        </View>

        {/* 매출 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 매출 현황</Text>
          <View style={styles.salesContainer}>
            <View style={styles.salesItem}>
              <Text style={styles.salesLabel}>예상 매출</Text>
              <Text style={styles.salesAmount}>
                {dashboardData.summary.target_date.expected_sales.toLocaleString()}원
              </Text>
            </View>
            <View style={styles.salesItem}>
              <Text style={styles.salesLabel}>실제 매출</Text>
              <Text style={[styles.salesAmount, styles.actualSales]}>
                {dashboardData.summary.target_date.actual_sales.toLocaleString()}원
              </Text>
            </View>
            {dashboardData.summary.target_date.unpaid_total > 0 && (
              <View style={styles.salesItem}>
                <Text style={styles.salesLabel}>외상 금액</Text>
                <Text style={[styles.salesAmount, styles.unpaidAmount]}>
                  {dashboardData.summary.target_date.unpaid_total.toLocaleString()}원
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 월별 비교 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 월간 총계</Text>
          <View style={styles.monthlyCompare}>
            <View style={styles.compareItem}>
              <Text style={styles.compareLabel}>월간 총 예약</Text>
              <Text style={styles.compareValue}>
                {dashboardData.summary.month.total_reservations}건
              </Text>
            </View>
            <View style={styles.compareItem}>
              <Text style={styles.compareLabel}>월간 총 매출</Text>
              <Text style={styles.compareValue}>
                {dashboardData.summary.month.actual_sales.toLocaleString()}원
              </Text>
            </View>
          </View>
        </View>

        {/* 시술별 매출 (월간) */}
        {dashboardData.sales.month.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 인기 시술 (월간)</Text>
            {dashboardData.sales.month.slice(0, 5).map((item: any, index: number) => (
              <View key={item.menu_detail_id} style={styles.treatmentItem}>
                <View style={styles.treatmentRank}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>
                <View style={styles.treatmentInfo}>
                  <Text style={styles.treatmentName}>{item.name}</Text>
                  <Text style={styles.treatmentStats}>
                    {item.count}건 • {item.actual_price.toLocaleString()}원
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      
      {/* 년/월 선택 모달 */}
      <Modal
        visible={showDatePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={cancelDateSelection}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={cancelDateSelection}
            >
              <Text style={styles.modalButtonText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>년/월 선택</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={confirmDateSelection}
            >
              <Text style={[styles.modalButtonText, styles.confirmButton]}>확인</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* 연도 선택 */}
            <View style={styles.pickerSection}>
              <Text style={styles.pickerTitle}>연도</Text>
              <View style={styles.yearGrid}>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - 5 + i;
                  return (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.yearItem,
                        tempSelectedYear === year && styles.selectedYearItem
                      ]}
                      onPress={() => setTempSelectedYear(year)}
                    >
                      <Text style={[
                        styles.yearText,
                        tempSelectedYear === year && styles.selectedYearText
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            
            {/* 월 선택 */}
            <View style={styles.pickerSection}>
              <Text style={styles.pickerTitle}>월</Text>
              <View style={styles.monthGrid}>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = i + 1;
                  return (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.monthItem,
                        tempSelectedMonth === month && styles.selectedMonthItem
                      ]}
                      onPress={() => setTempSelectedMonth(month)}
                    >
                      <Text style={[
                        styles.monthText,
                        tempSelectedMonth === month && styles.selectedMonthText
                      ]}>
                        {getMonthName(month)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#666',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButton: {
    padding: 8,
  },
  monthDisplay: {
    marginHorizontal: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  monthDisplayText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  successCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  warningCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff9500',
  },
  dangerCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff3b30',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  salesContainer: {
    gap: 12,
  },
  salesItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salesLabel: {
    fontSize: 16,
    color: '#666',
  },
  salesAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  actualSales: {
    color: '#28a745',
  },
  unpaidAmount: {
    color: '#ff9500',
  },
  monthlyCompare: {
    gap: 12,
  },
  compareItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compareLabel: {
    fontSize: 16,
    color: '#666',
  },
  compareValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  treatmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  treatmentRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  treatmentInfo: {
    flex: 1,
  },
  treatmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  treatmentStats: {
    fontSize: 14,
    color: '#666',
  },
  dropdownIcon: {
    marginLeft: 4,
  },
  quickNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  quickButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalButton: {
    padding: 8,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  confirmButton: {
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  pickerSection: {
    marginBottom: 30,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  yearItem: {
    width: '18%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedYearItem: {
    backgroundColor: '#007AFF',
  },
  yearText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  selectedYearText: {
    color: '#fff',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  monthItem: {
    width: '22%',
    aspectRatio: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedMonthItem: {
    backgroundColor: '#007AFF',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  selectedMonthText: {
    color: '#fff',
  },
});
