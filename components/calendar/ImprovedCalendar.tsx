import { useMonthlyTreatmentsQuery } from '@/hooks/queries/useMonthlyTreatmentsQuery';
import { Treatment } from '@/src/types';
import { useShopStore } from '@/src/stores/shopStore';
import { BorderRadius, Colors, Shadow, Spacing, Typography } from '@/src/ui/theme';
import {
  buildBookingCountMap,
  generateCalendarDates,
  type CalendarDate,
} from '@/src/utils/calendarUtils';
import { formatKoreanMonthDayWeekday, formatKoreanYearMonth } from '@/src/utils/intlFormat';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// 최소 셀 크기 설정 - 터치하기 편하도록 더 크게
const MIN_CELL_SIZE = 68;

// SPEC-PERF-003 REQ-PERF-003-06: 메모화된 날짜 셀 컴포넌트.
// onPress 는 date 인자를 받는 안정적 콜백으로 유지되어, 상위 리렌더 시에도 셀 props 가 불변이면 재렌더되지 않는다.
interface CalendarCellProps {
  dateData: CalendarDate;
  index: number;
  onPress: (dateData: CalendarDate) => void;
}

const CalendarCell = memo(function CalendarCell({ dateData, index, onPress }: CalendarCellProps) {
  const cellStyle = [
    styles.dateCell,
    dateData.isToday && styles.todayCell,
    dateData.isSelected && styles.selectedCell,
    !dateData.isCurrentMonth && styles.inactiveCell,
    dateData.hasBookings && styles.hasBookingsCell,
  ];

  const textStyle = [
    styles.dateText,
    dateData.isToday && styles.todayText,
    dateData.isSelected && styles.selectedText,
    !dateData.isCurrentMonth && styles.inactiveText,
    dateData.hasBookings && styles.hasBookingsText,
  ];

  return (
    <TouchableOpacity
      key={`${dateData.date}-${index}`}
      style={cellStyle}
      onPress={() => onPress(dateData)}
      activeOpacity={0.7}
      disabled={!dateData.isCurrentMonth}
    >
      <Text style={textStyle}>{dateData.dayOfMonth}</Text>
      {dateData.hasBookings && (
        <View style={styles.bookingIndicator}>
          <Text style={styles.bookingCount}>{dateData.bookingCount}</Text>
        </View>
      )}
      {/* 예약이 있는 날짜에 리스트 아이콘 추가 */}
      {dateData.hasBookings && (
        <View style={styles.listIndicator}>
          <Text style={styles.listIcon}>📋</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

interface ImprovedCalendarProps {
  selectedDate?: string;
  onDateSelect: (date: string) => void;
  onTreatmentsLoad?: (treatments: Treatment[]) => void;
  onNewBookingRequest?: (date: string, reservedTimes: string[]) => void;
  onTreatmentPress?: (treatment: Treatment) => void;
  onShowTreatmentsList?: (treatments: Treatment[], date: string) => void;
  minDate?: string;
  maxDate?: string;
  refreshTrigger?: number;
}

export const ImprovedCalendar: React.FC<ImprovedCalendarProps> = ({
  selectedDate,
  onDateSelect,
  onTreatmentsLoad,
  onNewBookingRequest,
  onTreatmentPress,
  onShowTreatmentsList,
  minDate,
  maxDate,
  refreshTrigger,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // SPEC-DATA-001 REQ-DATA-001-03 (F-12b): 월별 시술 읽기 경로를 react-query 로 캐싱한다.
  // 동일 월 재방문 시 staleTime 내 재요청 0회(AC-06). onTreatmentsLoad 부모 콜백 계약을 보존한다(D9).
  const shopId = useShopStore((s) => s.selectedShop?.id);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;
  const monthlyQuery = useMonthlyTreatmentsQuery(shopId, year, month);
  const treatments = useMemo<Treatment[]>(() => monthlyQuery.data ?? [], [monthlyQuery.data]);

  // 부모 콜백 계약 보존: 로드 성공 시 결과를 부모로 전달(기존 loadMonthlyTreatments 동작과 동일).
  const { data: monthlyData } = monthlyQuery;
  useEffect(() => {
    if (monthlyData) {
      onTreatmentsLoad?.(monthlyData);
    }
  }, [monthlyData, onTreatmentsLoad]);

  // refreshTrigger 변경 시 현재 월 데이터를 다시 조회(예약 생성/수정 후 부모가 트리거).
  const { refetch: refetchMonthly } = monthlyQuery;
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      refetchMonthly();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // REQ-PERF-003-06: 날짜→예약 건수 Map 을 useMemo 로 1회 구성하여 O(1) 조회.
  const bookingCountMap = useMemo(() => buildBookingCountMap(treatments), [treatments]);

  // REQ-PERF-003-06: 42셀 배열을 매 렌더 재생성하지 않고 의존값 변경 시에만 재계산.
  const calendarDates = useMemo(
    () => generateCalendarDates(currentMonth, selectedDate, bookingCountMap),
    [currentMonth, selectedDate, bookingCountMap],
  );

  // 이전/다음 달로 이동
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  // 날짜 선택 핸들러
  // REQ-PERF-003-06: 셀에 전달할 안정적 참조 유지를 위해 useCallback 으로 메모화.
  const handleDateSelect = useCallback(
    (dateData: CalendarDate) => {
      if (!dateData.isCurrentMonth) return;

      // 예약이 있는 날짜인 경우 예약 리스트 표시
      if (dateData.hasBookings && dateData.bookingCount > 0) {
        const dateTreatments = treatments.filter(treatment => {
          const treatmentDate = treatment.reserved_at.split('T')[0];
          return treatmentDate === dateData.date;
        });

        if (dateTreatments.length > 0) {
          onShowTreatmentsList?.(dateTreatments, dateData.date);
          return;
        }
      }

      // 예약이 없는 날짜인 경우 새 예약 요청
      onDateSelect(dateData.date);
    },
    [treatments, onShowTreatmentsList, onDateSelect],
  );

  // REQ-PERF-003-06: 파생 문자열(월/년 표기)을 useMemo 로 메모화(렌더마다 toLocale 재실행 제거).
  const monthYearText = useMemo(() => formatKoreanYearMonth(currentMonth), [currentMonth]);

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <View style={styles.container}>
      {/* 캘린더 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="이전 달"
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.monthYear}>{monthYearText}</Text>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="다음 달"
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 요일 헤더 */}
      <View style={styles.weekDaysRow}>
        {weekDays.map((day) => (
          <View key={day} style={styles.weekDayCell}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* 캘린더 그리드 */}
      <View style={styles.calendarGrid}>
        {calendarDates.map((dateData, index) => (
          <CalendarCell
            key={`${dateData.date}-${index}`}
            dateData={dateData}
            index={index}
            onPress={handleDateSelect}
          />
        ))}
      </View>

      {/* 사용법 안내 */}
      <View style={styles.usageGuide}>
        <Text style={styles.usageText}>
          💡 <Text style={styles.usageHighlight}>예약이 있는 날짜</Text>를 터치하면 예약 목록을 확인할 수 있어요
        </Text>
        <Text style={styles.usageText}>
          📅 <Text style={styles.usageHighlight}>빈 날짜</Text>를 터치하면 새 예약을 등록할 수 있어요
        </Text>
      </View>

      {/* 선택된 날짜 정보 */}
      {selectedDate && (
        <View style={styles.selectedDateInfo}>
          <Text style={styles.selectedDateText}>
            {formatKoreanMonthDayWeekday(selectedDate)}
          </Text>
          {(bookingCountMap.get(selectedDate) ?? 0) > 0 && (
            <Text style={styles.bookingInfoText}>
              예약 {bookingCountMap.get(selectedDate) ?? 0}건
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    margin: Spacing.lg,
    ...Shadow.md,
  },

  // 헤더
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },

  navButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },

  navButtonText: {
    fontSize: 24,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },

  monthYear: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },

  // 요일 헤더
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },

  weekDayCell: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  weekDayText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },

  // 캘린더 그리드
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // 날짜 셀
  dateCell: {
    width: `${100/7}%`, // 7분의 1 너비 (약 14.3%)
    aspectRatio: 1, // 정사각형으로 만듦
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    marginBottom: 4,
    position: 'relative',
    minHeight: MIN_CELL_SIZE,
    // 터치 영역을 더 크게 만들기 위한 패딩
    paddingVertical: 6,
  },

  todayCell: {
    backgroundColor: Colors.primary + '20',
    borderWidth: 2,
    borderColor: Colors.primary,
  },

  selectedCell: {
    backgroundColor: Colors.primary,
    ...Shadow.sm,
  },

  hasBookingsCell: {
    backgroundColor: Colors.success + '10',
    borderWidth: 1,
    borderColor: Colors.success + '40',
  },

  inactiveCell: {
    opacity: 0.3,
  },

  // 날짜 텍스트
  dateText: {
    fontSize: Typography.fontSize.lg, // base에서 lg로 변경 (더 크게)
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },

  todayText: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },

  selectedText: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold,
  },

  hasBookingsText: {
    color: Colors.success,
    fontWeight: Typography.fontWeight.semibold,
  },

  inactiveText: {
    color: Colors.text.muted,
  },

  // 예약 인디케이터
  bookingIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bookingCount: {
    fontSize: 14,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },

  // 리스트 인디케이터 (예약이 있는 날짜에 표시)
  listIndicator: {
    position: 'absolute',
    bottom: 2,
    left: 2,
  },

  listIcon: {
    fontSize: 14,
    opacity: 0.7,
  },

  // 사용법 안내
  usageGuide: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },

  usageText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },

  usageHighlight: {
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
  },

  // 선택된 날짜 정보
  selectedDateInfo: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },

  selectedDateText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },

  bookingInfoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    marginTop: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
});
