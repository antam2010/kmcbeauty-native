import { treatmentApiService } from '@/src/api/services/treatment';
import { Treatment } from '@/src/types';
import { BorderRadius, Colors, Shadow, Spacing, Typography } from '@/src/ui/theme';
import React, { useCallback, useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// 최소 셀 크기 설정 - 터치하기 편하도록 더 크게
const MIN_CELL_SIZE = 68;

interface CalendarDate {
  date: string;
  isToday: boolean;
  isSelected: boolean;
  hasBookings: boolean;
  bookingCount: number;
  isCurrentMonth: boolean;
}

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
  const [treatments, setTreatments] = useState<Treatment[]>([]);

  // 월별 시술 예약 데이터 로드
  const loadMonthlyTreatments = useCallback(async (year: number, month: number) => {
    try {
      const monthlyTreatments = await treatmentApiService.getMonthlyTreatments(year, month);
      setTreatments(monthlyTreatments);
      onTreatmentsLoad?.(monthlyTreatments);
    } catch (error) {
      console.error('월별 시술 예약 로드 실패:', error);
      setTreatments([]);
    }
  }, [onTreatmentsLoad]);

  // 현재 월이 변경될 때마다 데이터 로드
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    loadMonthlyTreatments(year, month);
  }, [currentMonth, loadMonthlyTreatments]);

  // refreshTrigger가 변경될 때마다 데이터 다시 로드
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      loadMonthlyTreatments(year, month);
    }
  }, [refreshTrigger, currentMonth, loadMonthlyTreatments]);

  // 날짜별 예약 건수 계산
  const getBookingCountByDate = (date: string): number => {
    return treatments.filter(treatment => {
      const treatmentDate = treatment.reserved_at.split('T')[0];
      return treatmentDate === date;
    }).length;
  };

  // 달력 데이터 생성
  const generateCalendarDates = (): CalendarDate[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    
    const dates: CalendarDate[] = [];
    const today = new Date().toISOString().split('T')[0];
    
    // 이전 달 날짜들
    for (let i = startWeekday - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      const dateString = date.toISOString().split('T')[0];
      dates.push({
        date: dateString,
        isToday: false,
        isSelected: false,
        hasBookings: false,
        bookingCount: 0,
        isCurrentMonth: false,
      });
    }
    
    // 현재 달 날짜들
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const bookingCount = getBookingCountByDate(dateString);
      
      dates.push({
        date: dateString,
        isToday: dateString === today,
        isSelected: dateString === selectedDate,
        hasBookings: bookingCount > 0,
        bookingCount,
        isCurrentMonth: true,
      });
    }
    
    // 다음 달 날짜들
    const remainingCells = 42 - dates.length; // 6주 × 7일
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      const dateString = date.toISOString().split('T')[0];
      dates.push({
        date: dateString,
        isToday: false,
        isSelected: false,
        hasBookings: false,
        bookingCount: 0,
        isCurrentMonth: false,
      });
    }
    
    return dates;
  };

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
  const handleDateSelect = (dateData: CalendarDate) => {
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
  };

  // 날짜 셀 렌더링
  const renderDateCell = (dateData: CalendarDate, index: number) => {
    const dayOfMonth = new Date(dateData.date).getDate();
    
    const cellStyle = [
      styles.dateCell,
      dateData.isToday && styles.todayCell,
      dateData.isSelected && styles.selectedCell,
      !dateData.isCurrentMonth && styles.inactiveCell,
      dateData.hasBookings && styles.hasBookingsCell, // 예약이 있는 날짜 스타일 추가
    ];

    const textStyle = [
      styles.dateText,
      dateData.isToday && styles.todayText,
      dateData.isSelected && styles.selectedText,
      !dateData.isCurrentMonth && styles.inactiveText,
      dateData.hasBookings && styles.hasBookingsText, // 예약이 있는 날짜 텍스트 스타일
    ];

    return (
      <TouchableOpacity
        key={`${dateData.date}-${index}`}
        style={cellStyle}
        onPress={() => handleDateSelect(dateData)}
        activeOpacity={0.7}
        disabled={!dateData.isCurrentMonth}
      >
        <Text style={textStyle}>{dayOfMonth}</Text>
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
  };

  const calendarDates = generateCalendarDates();
  const monthYearText = currentMonth.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  });

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <View style={styles.container}>
      {/* 캘린더 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
          activeOpacity={0.7}
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        
        <Text style={styles.monthYear}>{monthYearText}</Text>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
          activeOpacity={0.7}
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
        {calendarDates.map((dateData, index) => renderDateCell(dateData, index))}
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
            {new Date(selectedDate).toLocaleDateString('ko-KR', {
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </Text>
          {getBookingCountByDate(selectedDate) > 0 && (
            <Text style={styles.bookingInfoText}>
              예약 {getBookingCountByDate(selectedDate)}건
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
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bookingCount: {
    fontSize: 10,
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
    fontSize: 12,
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
